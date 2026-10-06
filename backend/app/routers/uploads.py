import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer
from app.core.config import settings
from app.db.session import get_db
from app.core.upload_limits import UploadTooLarge, read_limited_upload
from app.models.models import CropImageUpload, Customer

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = settings.max_image_upload_bytes


def _matches_image_signature(content_type: str, contents: bytes) -> bool:
    signatures = {
        "image/jpeg": contents.startswith(b"\xff\xd8\xff"),
        "image/png": contents.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP",
    }
    return signatures.get(content_type, False)


@router.post("/crop-issue-image")
async def upload_crop_issue_image(
    file: UploadFile,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
    __: None = Depends(rate_limit("upload", 10, 60)),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are allowed")

    try:
        contents = await read_limited_upload(file, MAX_UPLOAD_BYTES)
    except UploadTooLarge:
        raise HTTPException(status_code=413, detail="Image must be smaller than 8MB") from None
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if not _matches_image_signature(file.content_type, contents):
        raise HTTPException(status_code=400, detail="The uploaded file does not match its image format")

    ext = ALLOWED_CONTENT_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = UPLOAD_ROOT / "crop_issues"
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / filename).write_bytes(contents)
    db.add(CropImageUpload(filename=filename, customer_id=current.id))
    db.commit()

    return {"url": f"/uploads/crop_issues/{filename}"}

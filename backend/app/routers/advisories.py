from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Advisory
from app.schemas.schemas import AdvisoryCreate, AdvisoryOut

router = APIRouter(prefix="/api/advisories", tags=["agriculture"])


@router.get("", response_model=list[AdvisoryOut])
def list_advisories(db: Session = Depends(get_db)):
    return db.query(Advisory).order_by(Advisory.created_at.desc()).all()


@router.post("", response_model=AdvisoryOut)
def create_advisory(payload: AdvisoryCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    advisory = Advisory(**payload.model_dump())
    db.add(advisory)
    db.commit()
    db.refresh(advisory)
    return advisory


@router.delete("/{advisory_id}")
def delete_advisory(advisory_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    advisory = db.query(Advisory).get(advisory_id)
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")
    db.delete(advisory)
    db.commit()
    return {"ok": True}

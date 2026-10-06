from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_optional_current_customer, require_admin
from app.models.models import Banner, Customer, UserRole
from app.schemas.schemas import BannerCreate, BannerOut

router = APIRouter(prefix="/api/banners", tags=["banners"])


@router.get("", response_model=list[BannerOut])
def list_banners(active_only: bool = False, current: Customer | None = Depends(get_optional_current_customer), db: Session = Depends(get_db)):
    q = db.query(Banner)
    if active_only or current is None or current.role != UserRole.admin:
        q = q.filter(Banner.is_active == True)  # noqa: E712
    return q.order_by(Banner.id.desc()).all()


@router.post("", response_model=BannerOut)
def create_banner(payload: BannerCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    banner = Banner(**payload.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/{banner_id}", response_model=BannerOut)
def update_banner(banner_id: int, payload: BannerCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    banner = db.query(Banner).get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    for k, v in payload.model_dump().items():
        setattr(banner, k, v)
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/{banner_id}")
def delete_banner(banner_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    banner = db.query(Banner).get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(banner)
    db.commit()
    return {"ok": True}

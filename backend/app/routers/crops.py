from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_customer, require_farmer_or_admin
from app.models.models import Crop, Customer, UserRole
from app.schemas.schemas import CropCreate, CropOut

router = APIRouter(prefix="/api/crops", tags=["agriculture"])


@router.get("", response_model=list[CropOut])
def list_crops(customer_id: int | None = None, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(Crop)
    if current.role != UserRole.admin:
        q = q.filter(Crop.customer_id == current.id)
    elif customer_id is not None:
        q = q.filter(Crop.customer_id == customer_id)
    return q.order_by(Crop.created_at.desc()).all()


@router.post("", response_model=CropOut)
def create_crop(payload: CropCreate, current: Customer = Depends(require_farmer_or_admin), db: Session = Depends(get_db)):
    if payload.customer_id != current.id and current.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="You can only create crops for yourself")
    crop = Crop(customer_id=current.id if current.role != UserRole.admin else payload.customer_id, name=payload.name, variety=payload.variety, area_acres=payload.area_acres, planted_on=payload.planted_on, notes=payload.notes)
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.delete("/{crop_id}")
def delete_crop(crop_id: int, current: Customer = Depends(require_farmer_or_admin), db: Session = Depends(get_db)):
    q = db.query(Crop).filter(Crop.id == crop_id)
    if current.role != UserRole.admin:
        q = q.filter(Crop.customer_id == current.id)
    crop = q.first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    db.delete(crop)
    db.commit()
    return {"ok": True}

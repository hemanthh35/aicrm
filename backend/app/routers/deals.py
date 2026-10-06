from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_optional_current_customer, require_admin
from app.models.models import Category, Deal, Customer, Domain, Product, UserRole
from app.schemas.schemas import DealCreate, DealOut

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("", response_model=list[DealOut])
def list_deals(
    active_only: bool = False,
    domain: Domain | None = None,
    current: Customer | None = Depends(get_optional_current_customer),
    db: Session = Depends(get_db),
):
    q = db.query(Deal)
    if domain is not None:
        q = q.join(Product, Product.id == Deal.product_id).join(Category, Category.id == Product.category_id).filter(Category.domain == domain)
    if active_only or current is None or current.role != UserRole.admin:
        now = datetime.utcnow()
        q = q.filter(
            Deal.is_active == True,  # noqa: E712
            Deal.starts_at <= now,
            or_(Deal.ends_at.is_(None), Deal.ends_at >= now),
        )
    return q.order_by(Deal.starts_at.desc(), Deal.id.desc()).all()


@router.post("", response_model=DealOut)
def create_deal(payload: DealCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    if not db.get(Product, payload.product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    active_existing = (
        db.query(Deal)
        .filter(Deal.product_id == payload.product_id, Deal.is_active == True)  # noqa: E712
        .first()
    )
    if active_existing:
        raise HTTPException(status_code=409, detail="An active deal already exists for this product")
    deal = Deal(**payload.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.put("/{deal_id}/toggle", response_model=DealOut)
def toggle_deal(deal_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    deal = db.query(Deal).get(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.is_active = not deal.is_active
    db.commit()
    db.refresh(deal)
    return deal


@router.delete("/{deal_id}")
def delete_deal(deal_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    deal = db.query(Deal).get(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"ok": True}

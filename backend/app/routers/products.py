from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_optional_current_customer, require_admin
from app.models.models import CartItem, Category, Customer, Deal, OrderItem, Product, UserRole, WishlistItem
from app.schemas.schemas import ProductOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    category_id: Optional[int] = None,
    domain: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = Query(default=None),
    low_stock_threshold: Optional[int] = None,
    limit: int = Query(default=100, ge=1, le=200),
    current: Customer | None = Depends(get_optional_current_customer),
    db: Session = Depends(get_db),
):
    if low_stock_threshold is not None and (current is None or current.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Admin access required for inventory filters")
    q = db.query(Product)
    if domain is not None:
        q = q.join(Category, Product.category_id == Category.id).filter(Category.domain == domain)
    if category_id is not None:
        q = q.filter(Product.category_id == category_id)
    if featured is not None:
        q = q.filter(Product.is_featured == featured)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if low_stock_threshold is not None:
        q = q.filter(Product.stock <= low_stock_threshold)
    # Keep customer and admin product tables deterministic: newest records first,
    # with the id as a stable tie-breaker for seeded/same-timestamp records.
    return q.order_by(Product.created_at.desc(), Product.id.desc()).limit(limit).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut)
def create_product(payload: ProductCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    referenced = (
        db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
        or db.query(CartItem).filter(CartItem.product_id == product_id).first()
        or db.query(WishlistItem).filter(WishlistItem.product_id == product_id).first()
        or db.query(Deal).filter(Deal.product_id == product_id).first()
    )
    if referenced:
        raise HTTPException(status_code=409, detail="This product has linked history or offers and cannot be deleted")
    db.delete(product)
    db.commit()
    return {"ok": True}

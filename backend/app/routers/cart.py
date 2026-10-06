from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_customer
from app.db.session import get_db
from app.models.models import CartItem, Category, Customer, Domain, Product, UserRole, WishlistItem
from app.schemas.schemas import (
    CartItemCreate, CartItemOut, CartItemUpdate,
    WishlistItemCreate, WishlistItemOut,
)

router = APIRouter(tags=["cart"])


def _default_domain(current: Customer) -> Domain | None:
    if current.role == UserRole.farmer:
        return Domain.agriculture
    if current.role == UserRole.customer:
        return Domain.ecommerce
    return None


def _ensure_product_domain(product: Product, domain: str | Domain | None) -> None:
    if domain is None:
        return
    requested = Domain(domain)
    if not product.category or product.category.domain != requested:
        raise HTTPException(status_code=400, detail="Product does not belong to the selected platform")


@router.get("/api/cart/{customer_id}", response_model=list[CartItemOut])
def get_cart(customer_id: int, domain: Domain | None = None, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own cart")
    resolved_domain = domain or _default_domain(current)
    q = db.query(CartItem).filter(CartItem.customer_id == current.id)
    if resolved_domain is not None:
        q = q.join(Product, Product.id == CartItem.product_id).join(Category, Category.id == Product.category_id).filter(Category.domain == resolved_domain)
    return q.order_by(CartItem.id.desc()).all()


@router.post("/api/cart", response_model=CartItemOut)
def add_to_cart(payload: CartItemCreate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only use your own cart")
    _ensure_product_domain(product, payload.domain or _default_domain(current))
    existing = (
        db.query(CartItem)
        .filter(CartItem.customer_id == current.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        return existing
    item = CartItem(customer_id=current.id, product_id=payload.product_id, quantity=payload.quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/api/cart/{item_id}", response_model=CartItemOut)
def update_cart_item(item_id: int, payload: CartItemUpdate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == current.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/cart/{item_id}")
def remove_cart_item(item_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == current.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/api/wishlist/{customer_id}", response_model=list[WishlistItemOut])
def get_wishlist(customer_id: int, domain: Domain | None = None, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own wishlist")
    resolved_domain = domain or _default_domain(current)
    q = db.query(WishlistItem).filter(WishlistItem.customer_id == current.id)
    if resolved_domain is not None:
        q = q.join(Product, Product.id == WishlistItem.product_id).join(Category, Category.id == Product.category_id).filter(Category.domain == resolved_domain)
    return q.order_by(WishlistItem.id.desc()).all()


@router.post("/api/wishlist", response_model=WishlistItemOut)
def add_to_wishlist(payload: WishlistItemCreate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only use your own wishlist")
    _ensure_product_domain(product, payload.domain or _default_domain(current))
    existing = (
        db.query(WishlistItem)
        .filter(WishlistItem.customer_id == current.id, WishlistItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        return existing
    item = WishlistItem(customer_id=current.id, product_id=payload.product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/wishlist/{item_id}")
def remove_wishlist_item(item_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id, WishlistItem.customer_id == current.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

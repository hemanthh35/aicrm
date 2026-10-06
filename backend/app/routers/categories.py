from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Category, Product
from app.schemas.schemas import CategoryOut, CategoryCreate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(domain: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Category)
    if domain is not None:
        q = q.filter(Category.domain == domain)
    return q.order_by(Category.id.desc()).all()


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.query(Category).get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in payload.model_dump().items():
        setattr(category, k, v)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.query(Category).get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if db.query(Product).filter(Product.category_id == category_id).first():
        raise HTTPException(status_code=409, detail="This category still has products and cannot be deleted")
    db.delete(category)
    db.commit()
    return {"ok": True}

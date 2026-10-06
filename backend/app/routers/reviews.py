from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_customer, get_optional_current_customer, require_admin
from app.models.models import Review, Product, Customer
from app.schemas.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewOut])
def list_reviews(product_id: int | None = None, current: Customer | None = Depends(get_optional_current_customer), db: Session = Depends(get_db)):
    q = db.query(Review)
    if product_id is not None:
        q = q.filter(Review.product_id == product_id)
    if current is None or current.role != "admin":
        q = q.filter(Review.is_approved == True)  # noqa: E712
    return q.order_by(Review.created_at.desc()).all()


@router.post("", response_model=ReviewOut)
def create_review(payload: ReviewCreate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if payload.customer_id != current.id:
        raise HTTPException(status_code=403, detail="You can only review as yourself")
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = (
        db.query(Review)
        .filter(Review.product_id == payload.product_id, Review.customer_id == current.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this product")
    review = Review(product_id=payload.product_id, customer_id=current.id, rating=payload.rating, comment=payload.comment, is_approved=False)
    db.add(review)
    db.flush()

    db.commit()
    db.refresh(review)
    return review


@router.put("/{review_id}/approve", response_model=ReviewOut)
def approve_review(review_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    review = db.query(Review).get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if not review.is_approved:
        product = db.get(Product, review.product_id)
        if product:
            approved = db.query(Review).filter(Review.product_id == product.id, Review.is_approved == True).all()  # noqa: E712
            total_score = sum(item.rating for item in approved) + review.rating
            product.rating_count = len(approved) + 1
            product.rating = round(total_score / product.rating_count, 2)
    review.is_approved = True
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}")
def delete_review(review_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    review = db.query(Review).get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"ok": True}

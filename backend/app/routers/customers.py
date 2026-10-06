from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Customer
from app.schemas.schemas import CustomerOut

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[CustomerOut])
def list_customers(role: str | None = None, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(Customer)
    if role is not None:
        q = q.filter(Customer.role == role)
    return q.order_by(Customer.created_at.desc()).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

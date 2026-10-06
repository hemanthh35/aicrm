from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Payment
from app.schemas.schemas import PaymentOut

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=list[PaymentOut])
def list_payments(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()

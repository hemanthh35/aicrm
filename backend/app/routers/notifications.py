from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_customer
from app.db.session import get_db
from app.models.models import Customer, Notification
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .filter(Notification.customer_id == current.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/unread-count")
def unread_count(current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.customer_id == current.id, Notification.is_read.is_(False))
        .scalar()
        or 0
    )
    return {"count": count}


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.customer_id == current.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/read-all")
def mark_all_read(current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.customer_id == current.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}

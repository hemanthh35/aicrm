from sqlalchemy.orm import Session

from app.models.models import Notification


def notify(
    db: Session,
    customer_id: int,
    title: str,
    message: str,
    type: str = "info",
    link_url: str | None = None,
) -> Notification:
    notification = Notification(
        customer_id=customer_id, title=title, message=message, type=type, link_url=link_url
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

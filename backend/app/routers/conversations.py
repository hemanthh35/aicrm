from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_customer, require_admin
from app.models.models import Conversation, Message, Customer, UserRole
from app.schemas.schemas import ConversationOut, ConversationSummary

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationSummary])
def list_conversations(domain: str | None = None, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    query = db.query(Conversation)
    if current.role != UserRole.admin:
        query = query.filter(Conversation.customer_id == current.id)
    if domain:
        query = query.filter(Conversation.domain == domain)
    conversations = query.order_by(Conversation.updated_at.desc()).limit(200).all()

    summaries = []
    for conv in conversations:
        last_message = conv.messages[-1] if conv.messages else None
        summaries.append(
            ConversationSummary(
                id=conv.id,
                customer_id=conv.customer_id,
                customer_name=conv.customer.name if conv.customer else None,
                domain=conv.domain.value if hasattr(conv.domain, "value") else conv.domain,
                message_count=len(conv.messages),
                last_message=last_message.content if last_message else None,
                last_sentiment=last_message.sentiment if last_message else None,
                updated_at=conv.updated_at,
            )
        )
    return summaries


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    query = db.query(Conversation).filter(Conversation.id == conversation_id)
    if current.role != UserRole.admin:
        query = query.filter(Conversation.customer_id == current.id)
    conv = query.first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.get("/analytics/sentiment")
def sentiment_breakdown(domain: str | None = None, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(Message.sentiment, func.count(Message.id)).join(Conversation)
    if domain:
        query = query.filter(Conversation.domain == domain)
    rows = (
        query.filter(Message.sentiment.isnot(None))
        .group_by(Message.sentiment)
        .order_by(func.count(Message.id).desc(), Message.sentiment.asc())
        .all()
    )
    return [{"sentiment": sentiment, "count": count} for sentiment, count in rows]

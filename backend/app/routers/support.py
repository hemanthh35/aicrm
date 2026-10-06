from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer, require_admin
from app.models.models import SupportTicket, TicketMessage, TicketStatus, Customer, UserRole
from app.schemas.schemas import TicketCreate, TicketOut, TicketStatusUpdate, TicketMessageCreate, TicketMessageOut

router = APIRouter(prefix="/api/support-tickets", tags=["support"])


@router.get("", response_model=list[TicketOut])
def list_tickets(
    customer_id: int | None = None,
    role: str | None = None,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    q = db.query(SupportTicket)
    if current.role != UserRole.admin:
        q = q.filter(SupportTicket.customer_id == current.id)
    elif customer_id is not None:
        q = q.filter(SupportTicket.customer_id == customer_id)
    if current.role == UserRole.admin and role is not None:
        q = q.join(Customer, Customer.id == SupportTicket.customer_id).filter(Customer.role == role)
    return q.order_by(SupportTicket.created_at.desc()).all()


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    if current.role != UserRole.admin:
        q = q.filter(SupportTicket.customer_id == current.id)
    ticket = q.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("", response_model=TicketOut)
def create_ticket(
    payload: TicketCreate,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("support-ticket", 10, 60)),
):
    if payload.customer_id != current.id:
        raise HTTPException(status_code=403, detail="You can only create tickets for yourself")
    ticket = SupportTicket(customer_id=current.id, subject=payload.subject, message=payload.message)
    db.add(ticket)
    db.flush()
    db.add(TicketMessage(ticket_id=ticket.id, sender="customer", message=payload.message))
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(ticket_id: int, payload: TicketStatusUpdate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = payload.status
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/messages", response_model=TicketMessageOut)
def add_ticket_message(ticket_id: int, payload: TicketMessageCreate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    if current.role != UserRole.admin:
        q = q.filter(SupportTicket.customer_id == current.id)
    ticket = q.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    sender = "admin" if current.role == UserRole.admin else "customer"
    msg = TicketMessage(ticket_id=ticket_id, sender=sender, message=payload.message)
    db.add(msg)
    if sender == "admin" and ticket.status == TicketStatus.open:
        ticket.status = TicketStatus.in_progress
    elif sender == "customer" and ticket.status == TicketStatus.closed:
        ticket.status = TicketStatus.open
    db.commit()
    db.refresh(msg)
    return msg

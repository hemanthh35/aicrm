from sqlalchemy.orm import Session

from app.models.models import Category, Customer, Domain, Order, OrderAction, OrderItem, OrderStatus, Payment, Product, SupportTicket, TicketMessage, TicketStatus


class OrderActionError(ValueError):
    pass


ACTION_LABELS = {
    "cancellation": "cancel",
    "return": "return",
    "refund": "refund",
    "replacement": "replace",
}


def get_customer_order(db: Session, customer_id: int, order_id: int, domain: Domain | None = None) -> Order:
    query = db.query(Order).filter(Order.id == order_id, Order.customer_id == customer_id)
    if domain is not None:
        query = (
            query.join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .filter(Category.domain == domain)
            .distinct()
        )
    order = query.first()
    if not order:
        raise OrderActionError("That order was not found in your account.")
    return order


def eligible_action_orders(db: Session, customer_id: int, action_type: str, domain: Domain | None = None) -> list[Order]:
    query = db.query(Order).filter(Order.customer_id == customer_id)
    if domain is not None:
        query = (
            query.join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .filter(Category.domain == domain)
            .distinct()
        )
    if action_type == "cancellation":
        query = query.filter(Order.status.in_([OrderStatus.pending, OrderStatus.processing]))
    elif action_type in {"return", "refund", "replacement"}:
        query = query.filter(Order.status == OrderStatus.delivered)
    return query.order_by(Order.created_at.desc()).limit(10).all()


def eligible_action_items(order: Order, action_type: str) -> list[OrderItem]:
    # A cancellation is for the whole order; post-delivery actions can target one line item.
    if action_type == "cancellation":
        return []
    return list(order.items)


def execute_order_action(
    db: Session,
    customer_id: int,
    order_id: int,
    action_type: str,
    item_id: int | None = None,
    reason: str | None = None,
    domain: Domain | None = None,
) -> OrderAction:
    if action_type not in ACTION_LABELS:
        raise OrderActionError("That order action is not supported yet.")

    order = get_customer_order(db, customer_id, order_id, domain)
    existing = (
        db.query(OrderAction)
        .filter(
            OrderAction.customer_id == customer_id,
            OrderAction.order_id == order_id,
            OrderAction.action_type == action_type,
            OrderAction.status.in_(["requested", "completed"]),
        )
        .order_by(OrderAction.created_at.desc())
        .first()
    )
    if existing:
        return existing

    if action_type == "cancellation":
        if order.status not in {OrderStatus.pending, OrderStatus.processing}:
            raise OrderActionError("This order can no longer be cancelled because it is already being shipped or has been delivered.")
        for order_item in order.items:
            order_item.product.stock += order_item.quantity
        order.status = OrderStatus.cancelled
        action_status = "completed"
        amount = order.total_amount
    else:
        if order.status != OrderStatus.delivered:
            raise OrderActionError("Returns, refunds, and replacements are available after the order is delivered.")
        selected_item = None
        if item_id is not None:
            selected_item = next((item for item in order.items if item.id == item_id), None)
            if not selected_item:
                raise OrderActionError("That product is not part of the selected order.")
        if selected_item:
            amount = selected_item.unit_price * selected_item.quantity
        else:
            amount = order.total_amount
        action_status = "requested"

        if action_type == "refund":
            payment = db.query(Payment).filter(Payment.order_id == order.id).order_by(Payment.created_at.desc()).first()
            if payment and payment.status == "success":
                payment.status = "refund_requested"

    action = OrderAction(
        order_id=order.id,
        customer_id=customer_id,
        item_id=item_id,
        action_type=action_type,
        status=action_status,
        reason=reason,
        amount=amount,
    )
    db.add(action)
    if action_type != "cancellation":
        action_label = ACTION_LABELS[action_type].capitalize()
        ticket = SupportTicket(
            customer_id=customer_id,
            subject=f"{action_label} request for Order #TK{10000 + order.id}",
            message=f"Customer requested a {action_type} for Order #TK{10000 + order.id}. Reason: {reason or 'Not provided'}",
            status=TicketStatus.open,
        )
        db.add(ticket)
        db.flush()
        db.add(TicketMessage(ticket_id=ticket.id, sender="customer", message=ticket.message))
    db.commit()
    db.refresh(action)
    return action


def customer_or_none(db: Session, customer_id: int) -> Customer | None:
    return db.query(Customer).filter(Customer.id == customer_id).first()

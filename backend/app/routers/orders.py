from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer, require_admin
from app.models.models import Customer, Domain, Order, OrderAction, OrderItem, Product, Category, CartItem, OrderStatus, Payment, UserRole
from app.schemas.schemas import OrderActionCreate, OrderActionOut, OrderActionStatusUpdate, OrderCreate, OrderOut, OrderStatusUpdate
from app.services.notifications import notify
from app.services.order_actions import OrderActionError, eligible_action_items, execute_order_action, get_customer_order

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(
    customer_id: int | None = None,
    domain: Domain | None = None,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    q = db.query(Order)
    if current.role != UserRole.admin:
        q = q.filter(Order.customer_id == current.id)
    elif customer_id is not None:
        q = q.filter(Order.customer_id == customer_id)
    resolved_domain = domain or (
        Domain.agriculture if current.role == UserRole.farmer else Domain.ecommerce if current.role == UserRole.customer else None
    )
    if resolved_domain is not None:
        q = (
            q.join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .filter(Category.domain == resolved_domain)
            .distinct()
        )
        other_domain_orders = (
            db.query(OrderItem.order_id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .filter(Category.domain != resolved_domain)
        )
        q = q.filter(~Order.id.in_(other_domain_orders))
    return q.order_by(Order.created_at.desc()).all()


@router.get("/actions", response_model=list[OrderActionOut])
def list_order_actions(current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return (
        db.query(OrderAction)
        .filter(OrderAction.customer_id == current.id)
        .order_by(OrderAction.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(Order).filter(Order.id == order_id)
    if current.role != UserRole.admin:
        q = q.filter(Order.customer_id == current.id)
    order = q.first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/{order_id}/action-options")
def action_options(order_id: int, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    try:
        order = get_customer_order(db, current.id, order_id)
    except OrderActionError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    order_status = order.status.value if hasattr(order.status, "value") else order.status
    return {
        "order_id": order.id,
        "order_number": f"#TK{10000 + order.id}",
        "status": order_status,
        "can_cancel": order.status in {OrderStatus.pending, OrderStatus.processing},
        "can_return": order.status == OrderStatus.delivered,
        "can_refund": order.status == OrderStatus.delivered,
        "can_replace": order.status == OrderStatus.delivered,
        "items": [
            {
                "id": item.id,
                "product_id": item.product.id,
                "name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
            }
            for item in eligible_action_items(order, "return")
        ],
    }


@router.post("/{order_id}/actions", response_model=OrderActionOut, status_code=status.HTTP_201_CREATED)
def create_order_action(
    order_id: int,
    payload: OrderActionCreate,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if not payload.confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"requires_confirmation": True, "message": "Please confirm this order action before continuing."},
        )
    try:
        return execute_order_action(
            db,
            current.id,
            order_id,
            payload.action_type,
            payload.item_id,
            payload.reason,
        )
    except OrderActionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("", response_model=OrderOut)
def create_order(
    payload: OrderCreate,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("checkout", 10, 60)),
):
    if payload.customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only place orders for yourself")
    requested_domain = Domain(payload.domain) if payload.domain else (
        Domain.agriculture if current.role == UserRole.farmer else Domain.ecommerce if current.role == UserRole.customer else None
    )
    total = 0.0
    order_items = []
    seen_products: set[int] = set()
    for line in payload.items:
        if line.product_id in seen_products:
            raise HTTPException(status_code=400, detail="Duplicate products are not allowed in one order")
        seen_products.add(line.product_id)
        product = db.get(Product, line.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {line.product_id} not found")
        if requested_domain is not None and (not product.category or product.category.domain != requested_domain):
            raise HTTPException(status_code=400, detail="All order items must belong to the selected platform")
        if product.stock < line.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        unit_price = product.effective_price
        total += unit_price * line.quantity
        product.stock -= line.quantity
        order_items.append((product, line.quantity, unit_price))

    order = Order(
        customer_id=current.id,
        shipping_address=payload.shipping_address,
        payment_method=payload.payment_method,
        total_amount=total,
    )
    db.add(order)
    db.flush()

    for product, qty, unit_price in order_items:
        db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=qty, unit_price=unit_price))

    db.query(CartItem).filter(CartItem.customer_id == current.id).delete()
    db.add(Payment(order_id=order.id, amount=total, method=payload.payment_method, status="pending"))

    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, payload: OrderStatusUpdate, _: Customer = Depends(require_admin), db: Session = Depends(get_db)):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    status_label = order.status.value if hasattr(order.status, "value") else order.status
    notify(
        db, order.customer_id,
        title="Order update",
        message=f"Order #TK{10000 + order.id} is now {status_label}.",
        type="order",
        link_url="/orders",
    )
    return order


@router.put("/actions/{action_id}/status", response_model=OrderActionOut)
def update_order_action_status(
    action_id: int,
    payload: OrderActionStatusUpdate,
    current: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    action = db.query(OrderAction).get(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order action not found")
    action.status = payload.status
    db.commit()
    db.refresh(action)
    return action

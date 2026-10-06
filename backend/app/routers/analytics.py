from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Order, Customer, Product, OrderItem, Category, OrderStatus
from app.schemas.schemas import (
    DashboardStats, SalesPoint, OrderStatusBreakdown, TopProduct,
    LowStockProduct, CategoryShare,
)

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


def _growth_pct(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    total_products = db.query(func.count(Product.id)).scalar() or 0

    orders_this_week = db.query(func.count(Order.id)).filter(Order.created_at >= week_ago).scalar() or 0
    orders_prev_week = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= two_weeks_ago, Order.created_at < week_ago)
        .scalar() or 0
    )

    customers_this_week = db.query(func.count(Customer.id)).filter(Customer.created_at >= week_ago).scalar() or 0
    customers_prev_week = (
        db.query(func.count(Customer.id))
        .filter(Customer.created_at >= two_weeks_ago, Customer.created_at < week_ago)
        .scalar() or 0
    )

    revenue_this_week = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.created_at >= week_ago).scalar() or 0.0
    )
    revenue_prev_week = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.created_at >= two_weeks_ago, Order.created_at < week_ago).scalar() or 0.0
    )

    products_this_week = db.query(func.count(Product.id)).filter(Product.created_at >= week_ago).scalar() or 0
    products_prev_week = (
        db.query(func.count(Product.id))
        .filter(Product.created_at >= two_weeks_ago, Product.created_at < week_ago)
        .scalar() or 0
    )

    return DashboardStats(
        total_orders=total_orders,
        total_customers=total_customers,
        total_revenue=total_revenue,
        total_products=total_products,
        orders_growth_pct=_growth_pct(orders_this_week, orders_prev_week),
        customers_growth_pct=_growth_pct(customers_this_week, customers_prev_week),
        revenue_growth_pct=_growth_pct(revenue_this_week, revenue_prev_week),
        products_growth_pct=_growth_pct(products_this_week, products_prev_week),
    )


@router.get("/sales-overview", response_model=list[SalesPoint])
def sales_overview(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    points = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        total = (
            db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
            .filter(Order.created_at >= day_start, Order.created_at < day_end)
            .scalar() or 0.0
        )
        points.append(SalesPoint(label=day_start.strftime("%a"), value=round(total, 2)))
    return points


@router.get("/order-status-breakdown", response_model=list[OrderStatusBreakdown])
def order_status_breakdown(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    total = db.query(func.count(Order.id)).scalar() or 0
    results = []
    for status in OrderStatus:
        count = db.query(func.count(Order.id)).filter(Order.status == status).scalar() or 0
        percent = round((count / total) * 100, 1) if total else 0.0
        results.append(OrderStatusBreakdown(status=status.value, count=count, percent=percent))
    return sorted(results, key=lambda item: (-item.count, item.status))


@router.get("/top-products", response_model=list[TopProduct])
def top_products(limit: int = 4, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    limit = max(1, min(limit, 100))
    rows = (
        db.query(
            Product.id, Product.name, Product.image_url, Product.price,
            func.count(OrderItem.id).label("order_count"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.count(OrderItem.id).desc())
        .limit(limit)
        .all()
    )
    return [
        TopProduct(product_id=r.id, name=r.name, image_url=r.image_url, order_count=r.order_count, price=r.price)
        for r in rows
    ]


@router.get("/low-stock", response_model=list[LowStockProduct])
def low_stock(threshold: int = 10, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    threshold = max(0, min(threshold, 100000))
    rows = db.query(Product).filter(Product.stock <= threshold).order_by(Product.stock.asc()).all()
    return [
        LowStockProduct(product_id=p.id, name=p.name, stock=p.stock, image_url=p.image_url)
        for p in rows
    ]


@router.get("/customer-growth", response_model=list[SalesPoint])
def customer_growth(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    points = []
    cumulative = 0
    for i in range(3, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        count = (
            db.query(func.count(Customer.id))
            .filter(Customer.created_at >= week_start, Customer.created_at < week_end)
            .scalar() or 0
        )
        cumulative += count
        points.append(SalesPoint(label=f"Week {4 - i}", value=cumulative))
    return points


@router.get("/top-categories", response_model=list[CategoryShare])
def top_categories(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    total = db.query(func.count(Product.id)).scalar() or 0
    rows = (
        db.query(Category.name, func.count(Product.id).label("cnt"))
        .join(Product, Product.category_id == Category.id)
        .group_by(Category.id)
        .order_by(func.count(Product.id).desc())
        .all()
    )
    return [
        CategoryShare(name=r.name, percent=round((r.cnt / total) * 100, 1) if total else 0.0)
        for r in rows
    ]

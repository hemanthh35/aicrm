from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import (
    Order, OrderItem, Product, Category, Customer, CropIssue, UserRole, Domain,
)
from app.schemas.schemas import SalesPoint, CategoryShare, IssueTypeBreakdown

router = APIRouter(prefix="/api/admin/agri-analytics", tags=["agri-admin-analytics"])


def _agri_order_query(db: Session):
    return (
        db.query(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Product, Product.id == OrderItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .filter(Category.domain == Domain.agriculture)
        .distinct()
    )


@router.get("/dashboard")
def agri_dashboard(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    total_farmers = db.query(func.count(Customer.id)).filter(Customer.role == UserRole.farmer).scalar() or 0
    total_crop_entries = db.query(func.count(Product.id)).join(Category).filter(Category.domain == Domain.agriculture).scalar() or 0

    agri_orders = _agri_order_query(db).all()
    total_agri_orders = len(agri_orders)
    total_agri_revenue = sum(o.total_amount for o in agri_orders)

    crop_issues_reported = db.query(func.count(CropIssue.id)).scalar() or 0
    crop_issues_this_week = db.query(func.count(CropIssue.id)).filter(CropIssue.created_at >= week_ago).scalar() or 0

    return {
        "total_farmers": total_farmers,
        "total_crop_entries": total_crop_entries,
        "total_agri_orders": total_agri_orders,
        "total_agri_revenue": total_agri_revenue,
        "crop_issues_reported": crop_issues_reported,
        "crop_issues_this_week": crop_issues_this_week,
    }


@router.get("/farmer-registration-trend", response_model=list[SalesPoint])
def farmer_registration_trend(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    points = []
    cumulative = 0
    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * (i + 1)))
        month_end = (now - timedelta(days=30 * i))
        count = (
            db.query(func.count(Customer.id))
            .filter(Customer.role == UserRole.farmer, Customer.created_at >= month_start, Customer.created_at < month_end)
            .scalar() or 0
        )
        cumulative += count
        points.append(SalesPoint(label=month_start.strftime("%b"), value=cumulative))
    return points


@router.get("/crop-distribution", response_model=list[CategoryShare])
def crop_distribution(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(Category.name, func.count(Product.id).label("cnt"))
        .join(Product, Product.category_id == Category.id)
        .filter(Category.domain == Domain.agriculture)
        .group_by(Category.id)
        .order_by(func.count(Product.id).desc(), Category.name.asc())
        .all()
    )
    total = sum(r.cnt for r in rows) or 1
    return [CategoryShare(name=r.name, percent=round((r.cnt / total) * 100, 1)) for r in rows]


@router.get("/crop-issue-breakdown", response_model=list[IssueTypeBreakdown])
def crop_issue_breakdown(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.models import IssueType
    total = db.query(func.count(CropIssue.id)).scalar() or 0
    results = []
    for issue_type in IssueType:
        count = db.query(func.count(CropIssue.id)).filter(CropIssue.issue_type == issue_type).scalar() or 0
        percent = round((count / total) * 100, 1) if total else 0.0
        results.append(IssueTypeBreakdown(issue_type=issue_type.value, count=count, percent=percent))
    return sorted(results, key=lambda item: (-item.count, item.issue_type))

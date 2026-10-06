from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_optional_current_customer, require_admin
from app.models.models import Scheme, Customer, UserRole
from app.schemas.schemas import SchemeCreate, SchemeOut

router = APIRouter(prefix="/api/schemes", tags=["agriculture"])


@router.get("", response_model=list[SchemeOut])
def list_schemes(active_only: bool = False, current: Customer | None = Depends(get_optional_current_customer), db: Session = Depends(get_db)):
    q = db.query(Scheme)
    if active_only or current is None or current.role != UserRole.admin:
        q = q.filter(Scheme.is_active == True)  # noqa: E712
    return q.order_by(Scheme.created_at.desc()).all()


@router.post("", response_model=SchemeOut)
def create_scheme(payload: SchemeCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    scheme = Scheme(**payload.model_dump())
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.put("/{scheme_id}", response_model=SchemeOut)
def update_scheme(scheme_id: int, payload: SchemeCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    scheme = db.query(Scheme).get(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    for k, v in payload.model_dump().items():
        setattr(scheme, k, v)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.delete("/{scheme_id}")
def delete_scheme(scheme_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    scheme = db.query(Scheme).get(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    db.delete(scheme)
    db.commit()
    return {"ok": True}

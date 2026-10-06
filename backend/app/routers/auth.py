from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import (
    clear_auth_cookies, create_access_token, get_current_customer, hash_password,
    set_auth_cookies, verify_password,
)
from app.core.rate_limit import rate_limit
from app.db.session import get_db
from app.models.models import Customer, UserRole
from app.schemas.schemas import (
    SignupRequest, LoginRequest, TokenResponse, AuthUser, LanguageUpdate,
    PasswordChange, ProfileUpdate,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("signup", 5, 300)),
):
    email = payload.email.lower()
    existing = db.query(Customer).filter(Customer.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    customer = Customer(
        name=payload.name,
        email=email,
        phone=payload.phone,
        city=payload.city,
        password_hash=hash_password(payload.password),
        role=UserRole.farmer if payload.role == "farmer" else UserRole.customer,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = create_access_token(customer.id)
    set_auth_cookies(response, token)
    return TokenResponse(user=AuthUser.model_validate(customer))


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("login", 10, 60)),
):
    customer = db.query(Customer).filter(Customer.email == payload.email.lower()).first()
    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(customer.id)
    set_auth_cookies(response, token)
    return TokenResponse(user=AuthUser.model_validate(customer))


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me", response_model=AuthUser)
def me(current: Customer = Depends(get_current_customer)):
    return current


@router.put("/me", response_model=AuthUser)
def update_language(payload: LanguageUpdate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    current.language = payload.language
    db.commit()
    db.refresh(current)
    return current


@router.put("/me/profile", response_model=AuthUser)
def update_profile(payload: ProfileUpdate, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(current, field, value)
    db.commit()
    db.refresh(current)
    return current


@router.put("/me/password")
def change_password(payload: PasswordChange, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    current.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}

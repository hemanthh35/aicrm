import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.models import Customer, UserRole

ALGORITHM = "HS256"
ACCESS_COOKIE = "techkart_access"
CSRF_COOKIE = "techkart_csrf"

# A process-local key keeps a fresh local demo usable without putting a secret in source.
# Production startup rejects this fallback and requires JWT_SECRET.
_LOCAL_SECRET = secrets.token_urlsafe(48)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def _jwt_secret() -> str:
    if settings.jwt_secret:
        return settings.jwt_secret
    if settings.app_env.lower() in {"development", "test", "local"}:
        return _LOCAL_SECRET
    raise RuntimeError("JWT_SECRET must be configured outside local development")


def validate_security_settings() -> None:
    if settings.app_env.lower() in {"production", "staging"}:
        if len(_jwt_secret()) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters in production")
        if not settings.cors_origins:
            raise RuntimeError("CORS_ORIGINS must contain an explicit frontend origin")
        if "*" in settings.cors_origins:
            raise RuntimeError("CORS_ORIGINS cannot use '*' when credentials are enabled")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(customer_id: int) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(customer_id),
        "iat": now,
        "exp": expire,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": secrets.token_urlsafe(16),
        "typ": "access",
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            _jwt_secret(),
            algorithms=[ALGORITHM],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        if payload.get("typ") != "access":
            raise jwt.InvalidTokenError("Wrong token type")
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def _set_auth_cookies(response: Response, token: str) -> None:
    secure = settings.app_env.lower() in {"production", "staging"}
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        ACCESS_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        secrets.token_urlsafe(32),
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


def set_auth_cookies(response: Response, token: str) -> None:
    _set_auth_cookies(response, token)


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


def get_current_customer(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Customer:
    token = credentials.credentials if credentials is not None else request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    customer_id = decode_token(token)
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return customer


def get_optional_current_customer(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Customer | None:
    token = credentials.credentials if credentials is not None else request.cookies.get(ACCESS_COOKIE)
    if not token:
        return None
    try:
        customer_id = decode_token(token)
    except HTTPException:
        # Public reads should remain public if a stale or tampered cookie is
        # present; protected dependencies still return a hard 401.
        return None
    return db.get(Customer, customer_id)


def require_admin(current: Customer = Depends(get_current_customer)) -> Customer:
    if current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current


def require_farmer_or_admin(current: Customer = Depends(get_current_customer)) -> Customer:
    if current.role not in {UserRole.farmer, UserRole.admin}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Farmer access required")
    return current

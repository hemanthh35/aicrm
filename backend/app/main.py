import secrets
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.audit import audit_event
from app.core.security import decode_token, get_current_customer, validate_security_settings
from app.db.session import Base, engine, get_db
from app.models.models import CropImageUpload, CropIssue, UserRole
from app.routers import (
    categories, products, cart, orders, reviews, deals,
    banners, support, payments, customers, analytics, assistant,
    auth, crops, crop_issues, advisories, schemes, agri_analytics,
    knowledge_base, conversations, notifications, uploads, ui_translation,
)

validate_security_settings()
Base.metadata.create_all(bind=engine)


PRIVATE_CACHE_PREFIXES = (
    "/api/auth",
    "/api/customers",
    "/api/cart",
    "/api/wishlist",
    "/api/orders",
    "/api/support-tickets",
    "/api/payments",
    "/api/crops",
    "/api/crop-issues",
    "/api/assistant",
    "/api/conversations",
    "/api/notifications",
    "/api/ui-translation",
    "/api/knowledge-base",
    "/api/uploads",
    "/uploads/crop_issues/",
)


def apply_security_headers(response, path: str):
    for name, value in {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'",
    }.items():
        response.headers.setdefault(name, value)
    if settings.app_env.lower() in {"production", "staging"}:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    if any(path.startswith(prefix) for prefix in PRIVATE_CACHE_PREFIXES):
        response.headers.setdefault("Cache-Control", "no-store")
    return response


class RequestProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        max_body_bytes = settings.max_request_body_bytes
        if request.url.path == "/api/assistant/transcribe":
            max_body_bytes = settings.max_audio_upload_bytes + 64 * 1024
        elif request.url.path == "/api/uploads/crop-issue-image":
            max_body_bytes = settings.max_image_upload_bytes + 64 * 1024
        elif request.url.path == "/api/knowledge-base/documents":
            max_body_bytes = settings.max_pdf_upload_bytes + 64 * 1024
        if content_length and content_length.isdigit() and int(content_length) > max_body_bytes:
            from fastapi.responses import JSONResponse

            return apply_security_headers(
                JSONResponse(status_code=413, content={"detail": "Request body is too large"}), request.url.path
            )

        unsafe = request.method in {"POST", "PUT", "PATCH", "DELETE"}
        csrf_exempt = request.url.path in {"/api/auth/login", "/api/auth/signup"}
        if unsafe and not csrf_exempt and request.cookies.get("techkart_access"):
            csrf_cookie = request.cookies.get("techkart_csrf")
            csrf_header = request.headers.get("x-csrf-token")
            if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
                from fastapi.responses import JSONResponse

                return apply_security_headers(
                    JSONResponse(status_code=403, content={"detail": "CSRF validation failed"}), request.url.path
                )

        response = await call_next(request)
        if unsafe or request.url.path in {"/api/auth/login", "/api/auth/signup", "/api/auth/logout"}:
            actor_id = None
            token = request.cookies.get("techkart_access")
            if not token:
                authorization = request.headers.get("authorization", "")
                if authorization.lower().startswith("bearer "):
                    token = authorization[7:].strip()
            if token:
                try:
                    actor_id = decode_token(token)
                except Exception:
                    actor_id = None
            audit_event(
                "api_request",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                actor_id=actor_id,
                client_ip=request.client.host if request.client else None,
            )
        return apply_security_headers(response, request.url.path)

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.app_env.lower() != "production" else None,
    redoc_url="/redoc" if settings.app_env.lower() != "production" else None,
    openapi_url="/openapi.json" if settings.app_env.lower() != "production" else None,
)

app.add_middleware(RequestProtectionMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(deals.router)
app.include_router(banners.router)
app.include_router(support.router)
app.include_router(payments.router)
app.include_router(customers.router)
app.include_router(analytics.router)
app.include_router(assistant.router)
app.include_router(auth.router)
app.include_router(crops.router)
app.include_router(crop_issues.router)
app.include_router(advisories.router)
app.include_router(schemes.router)
app.include_router(agri_analytics.router)
app.include_router(knowledge_base.router)
app.include_router(conversations.router)
app.include_router(notifications.router)
app.include_router(uploads.router)
app.include_router(ui_translation.router)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/uploads/crop_issues/{filename}")
def crop_issue_image(
    filename: str,
    current=Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Image not found")
    image_url = f"/uploads/crop_issues/{filename}"
    upload_query = db.query(CropImageUpload).filter(CropImageUpload.filename == filename)
    if current.role != UserRole.admin:
        upload_query = upload_query.filter(CropImageUpload.customer_id == current.id)
    owned_upload = upload_query.first()

    # Keep existing images accessible to their owner/admin while new uploads
    # are tracked at upload time for safe previews before issue creation.
    if not owned_upload:
        issue_query = db.query(CropIssue).filter(CropIssue.image_url == image_url)
        if current.role != UserRole.admin:
            issue_query = issue_query.filter(CropIssue.customer_id == current.id)
        if not issue_query.first():
            raise HTTPException(status_code=404, detail="Image not found")
    upload_root = (UPLOAD_DIR / "crop_issues").resolve()
    file_path = (upload_root / filename).resolve()
    try:
        file_path.relative_to(upload_root)
    except ValueError:
        raise HTTPException(status_code=404, detail="Image not found") from None
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@app.get("/api/health")
def health():
    return {"status": "ok"}

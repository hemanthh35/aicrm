from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException, Response
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import settings
from app.core.security import (
    ALGORITHM,
    _jwt_secret,
    decode_token,
    set_auth_cookies,
    validate_security_settings,
)
from app.main import app
from app.schemas.schemas import BannerCreate, CropIssueCreate, PasswordChange, ProductUpdate, SchemeCreate


client = TestClient(app)


def test_wrong_jwt_type_is_rejected_as_401_not_server_error():
    token = jwt.encode(
        {
            "sub": "1",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
            "typ": "refresh",
        },
        _jwt_secret(),
        algorithm=ALGORITHM,
    )
    with pytest.raises(HTTPException) as error:
        decode_token(token)
    assert error.value.status_code == 401


def test_production_security_rejects_wildcard_cors_with_credentials(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "jwt_secret", "x" * 48)
    monkeypatch.setattr(settings, "cors_origins", ["*"])
    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        validate_security_settings()


def test_production_auth_cookie_flags_are_secure(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    response = Response()
    set_auth_cookies(response, "test-token")
    cookies = [value.decode() for name, value in response.raw_headers if name.lower() == b"set-cookie"]
    assert any("techkart_access=" in cookie and "HttpOnly" in cookie and "Secure" in cookie for cookie in cookies)
    assert any("techkart_csrf=" in cookie and "Secure" in cookie and "SameSite=lax" in cookie for cookie in cookies)


def test_early_request_rejection_keeps_security_headers():
    response = client.post("/api/auth/me", content=b"x" * (settings.max_request_body_bytes + 1))
    assert response.status_code == 413
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_crop_images_are_not_publicly_readable():
    response = client.get("/uploads/crop_issues/unknown.jpg")
    assert response.status_code == 401


def test_logout_requires_csrf_when_cookie_auth_is_present():
    with TestClient(app) as isolated_client:
        isolated_client.cookies.set("techkart_access", "token")
        isolated_client.cookies.set("techkart_csrf", "expected")
        response = isolated_client.post("/api/auth/logout")
        assert response.status_code == 403

        response = isolated_client.post("/api/auth/logout", headers={"X-CSRF-Token": "expected"})
        assert response.status_code == 200


def test_invalid_optional_cookie_does_not_break_public_reviews():
    with TestClient(app) as isolated_client:
        isolated_client.cookies.set("techkart_access", "tampered")
        response = isolated_client.get("/api/reviews")
        assert response.status_code == 200


def test_user_visible_urls_reject_script_schemes_directly():
    for factory in (
        lambda: ProductUpdate(image_url="javascript:alert(1)"),
        lambda: BannerCreate(title="x", link_url="javascript:alert(1)"),
        lambda: SchemeCreate(title="x", description="y", link_url="data:text/html,x"),
        lambda: CropIssueCreate(customer_id=1, description="issue", image_url="https://example.com/photo.jpg"),
        lambda: CropIssueCreate(customer_id=1, description="issue", image_url="/uploads/crop_issues/../secret.jpg"),
    ):
        with pytest.raises(ValidationError):
            factory()


def test_password_change_keeps_signup_strength():
    with pytest.raises(ValidationError):
        PasswordChange(current_password="old", new_password="1234567")

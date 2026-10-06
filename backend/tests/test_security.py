import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.schemas import DealCreate, ReviewCreate, SignupRequest


client = TestClient(app)


@pytest.mark.parametrize(
    "path",
    [
        "/api/customers",
        "/api/orders",
        "/api/orders/1",
        "/api/cart/1",
        "/api/wishlist/1",
        "/api/support-tickets",
        "/api/crops",
        "/api/crop-issues",
        "/api/payments",
        "/api/admin/analytics/dashboard",
        "/api/admin/agri-analytics/dashboard",
        "/api/conversations",
        "/api/knowledge-base",
    ],
)
def test_protected_data_is_not_public(path: str):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", ["/api/health", "/api/products", "/api/categories", "/api/deals?active_only=true", "/api/banners?active_only=true", "/api/schemes?active_only=true"])
def test_public_read_endpoints_remain_available(path: str):
    assert client.get(path).status_code == 200


def test_security_headers_are_present():
    response = client.get("/api/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


def test_ai_endpoints_require_authentication():
    assert client.post(
        "/api/assistant/query",
        json={"customer_id": 1, "message": "hello", "domain": "ecommerce"},
    ).status_code == 401
    assert client.post(
        "/api/ui-translation/batch",
        json={"language": "hi", "texts": ["Hello"]},
    ).status_code == 401
    assert client.post(
        "/api/assistant/transcribe",
        files={"audio": ("voice.webm", b"audio", "audio/webm")},
        data={"language": "auto"},
    ).status_code == 401


def test_schema_limits_sensitive_inputs():
    with pytest.raises(ValidationError):
        SignupRequest(name="A", email="a@example.com", password="short")
    with pytest.raises(ValidationError):
        ReviewCreate(product_id=1, customer_id=1, rating=6)
    with pytest.raises(ValidationError):
        DealCreate(product_id=1, discount_percent=101)

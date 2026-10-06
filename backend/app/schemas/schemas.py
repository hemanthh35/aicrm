from datetime import datetime
from typing import Literal, Optional
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def validate_safe_url(value: Optional[str]) -> Optional[str]:
    if value in (None, ""):
        return value
    if value.startswith("/") and not value.startswith("//"):
        return value
    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} and bool(parsed.netloc):
        return value
    raise ValueError("URL must be http(s) or an internal path")


# ---------- Auth ----------
class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=30)
    city: Optional[str] = Field(default=None, max_length=100)
    role: Literal["customer", "farmer"] = "customer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AuthUser(ORMBase):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    role: str
    language: str


class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "cookie"
    user: AuthUser


class LanguageUpdate(BaseModel):
    language: str

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ("en", "te", "hi"):
            raise ValueError("language must be one of: en, te, hi")
        return v


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=30)
    city: Optional[str] = Field(default=None, max_length=100)


# ---------- Category ----------
class CategoryBase(ORMBase):
    name: str = Field(min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=2048)
    domain: str = "ecommerce"

    @field_validator("domain", mode="before")
    @classmethod
    def validate_domain(cls, value: str) -> str:
        value = value.value if hasattr(value, "value") else value
        if value not in ("ecommerce", "agriculture"):
            raise ValueError("domain must be 'ecommerce' or 'agriculture'")
        return value


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int


# ---------- Product ----------
class ProductBase(ORMBase):
    name: str = Field(min_length=1, max_length=200)
    brand: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=5000)
    price: float = Field(ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    warranty: Optional[str] = Field(default=None, max_length=500)
    is_featured: bool = False
    category_id: int = Field(ge=1)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_safe_url(value)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    brand: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=5000)
    price: Optional[float] = Field(default=None, ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    warranty: Optional[str] = Field(default=None, max_length=500)
    is_featured: Optional[bool] = None
    category_id: Optional[int] = Field(default=None, ge=1)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_safe_url(value)


class ActiveDealOut(ORMBase):
    id: int
    discount_percent: float
    starts_at: datetime
    ends_at: Optional[datetime] = None
    is_active: bool


class ProductOut(ProductBase):
    id: int
    rating: float
    rating_count: int
    created_at: datetime
    category: Optional[CategoryOut] = None
    active_deal: Optional[ActiveDealOut] = None


# ---------- Customer ----------
class CustomerOut(ORMBase):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    role: str = "customer"
    language: str = "en"
    created_at: datetime


# ---------- Cart ----------
class CartItemCreate(BaseModel):
    customer_id: int = Field(ge=1)
    product_id: int = Field(ge=1)
    quantity: int = Field(default=1, ge=1, le=99)
    domain: Optional[Literal["ecommerce", "agriculture"]] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemOut(ORMBase):
    id: int
    quantity: int
    product: ProductOut


# ---------- Wishlist ----------
class WishlistItemCreate(BaseModel):
    customer_id: int = Field(ge=1)
    product_id: int = Field(ge=1)
    domain: Optional[Literal["ecommerce", "agriculture"]] = None


class WishlistItemOut(ORMBase):
    id: int
    product: ProductOut


# ---------- Orders ----------
class OrderItemCreate(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_id: int = Field(ge=1)
    shipping_address: str = Field(min_length=3, max_length=300)
    payment_method: Literal["card", "upi", "cod"] = "card"
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)
    domain: Optional[Literal["ecommerce", "agriculture"]] = None


class OrderItemOut(ORMBase):
    id: int
    quantity: int
    unit_price: float
    product: ProductOut


class OrderOut(ORMBase):
    id: int
    status: str
    total_amount: float
    shipping_address: Optional[str] = None
    payment_method: str
    created_at: datetime
    items: list[OrderItemOut] = []


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]


class OrderActionCreate(BaseModel):
    action_type: Literal["cancellation", "return", "refund", "replacement"]
    item_id: Optional[int] = Field(default=None, ge=1)
    reason: Optional[str] = Field(default=None, max_length=1000)
    confirmed: bool = False


class OrderActionOut(ORMBase):
    id: int
    order_id: int
    customer_id: int
    item_id: Optional[int] = None
    action_type: str
    status: str
    reason: Optional[str] = None
    amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class OrderActionStatusUpdate(BaseModel):
    status: Literal["requested", "completed", "rejected", "cancelled"]


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    product_id: int = Field(ge=1)
    customer_id: int = Field(ge=1)
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class ReviewOut(ORMBase):
    id: int
    rating: int
    comment: Optional[str] = None
    is_approved: bool
    created_at: datetime
    customer: Optional[CustomerOut] = None


# ---------- Deals ----------
class DealCreate(BaseModel):
    product_id: int = Field(ge=1)
    discount_percent: float = Field(ge=0, le=100)
    ends_at: Optional[datetime] = None


class DealOut(ORMBase):
    id: int
    discount_percent: float
    starts_at: datetime
    ends_at: Optional[datetime] = None
    is_active: bool
    product: ProductOut


# ---------- Banners ----------
class BannerCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    link_url: Optional[str] = Field(default=None, max_length=2048)
    is_active: bool = True

    @field_validator("image_url", "link_url")
    @classmethod
    def validate_urls(cls, value: Optional[str]) -> Optional[str]:
        return validate_safe_url(value)


class BannerOut(ORMBase):
    id: int
    title: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: bool


# ---------- Support Tickets ----------
class TicketCreate(BaseModel):
    customer_id: int = Field(ge=1)
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "closed"]


class TicketMessageCreate(BaseModel):
    sender: Literal["customer", "admin"]
    message: str = Field(min_length=1, max_length=5000)


class TicketMessageOut(ORMBase):
    id: int
    sender: str
    message: str
    created_at: datetime


class TicketOut(ORMBase):
    id: int
    subject: str
    message: str
    status: str
    is_escalated: bool = False
    escalation_reason: Optional[str] = None
    created_at: datetime
    customer: Optional[CustomerOut] = None
    messages: list[TicketMessageOut] = []


# ---------- Notifications ----------
class NotificationOut(ORMBase):
    id: int
    title: str
    message: str
    type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime


# ---------- Payments ----------
class PaymentOut(ORMBase):
    id: int
    order_id: int
    amount: float
    method: str
    status: str
    created_at: datetime


# ---------- Admin analytics ----------
class DashboardStats(BaseModel):
    total_orders: int
    total_customers: int
    total_revenue: float
    total_products: int
    orders_growth_pct: float
    customers_growth_pct: float
    revenue_growth_pct: float
    products_growth_pct: float


class SalesPoint(BaseModel):
    label: str
    value: float


class OrderStatusBreakdown(BaseModel):
    status: str
    count: int
    percent: float


class TopProduct(BaseModel):
    product_id: int
    name: str
    image_url: Optional[str] = None
    order_count: int
    price: float


class LowStockProduct(BaseModel):
    product_id: int
    name: str
    stock: int
    image_url: Optional[str] = None


class CategoryShare(BaseModel):
    name: str
    percent: float


# ---------- Agriculture: Crops ----------
class CropCreate(BaseModel):
    customer_id: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=100)
    variety: Optional[str] = Field(default=None, max_length=100)
    area_acres: Optional[float] = Field(default=None, ge=0)
    planted_on: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=3000)


class CropOut(ORMBase):
    id: int
    name: str
    variety: Optional[str] = None
    area_acres: Optional[float] = None
    planted_on: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    customer: Optional[CustomerOut] = None


# ---------- Agriculture: Crop Issues ----------
class CropIssueCreate(BaseModel):
    customer_id: int = Field(ge=1)
    crop_id: Optional[int] = Field(default=None, ge=1)
    issue_type: Literal["leaf_disease", "pest_attack", "nutrient_deficiency", "weather_damage", "other"] = "other"
    description: str = Field(min_length=3, max_length=5000)
    image_url: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("image_url")
    @classmethod
    def validate_issue_image_url(cls, value: Optional[str]) -> Optional[str]:
        prefix = "/uploads/crop_issues/"
        filename = value[len(prefix):] if value and value.startswith(prefix) else ""
        if value is not None and (
            not filename
            or filename in {".", ".."}
            or "/" in filename
            or "\\" in filename
        ):
            raise ValueError("image_url must point to an uploaded crop issue image")
        return value


class CropIssueStatusUpdate(BaseModel):
    status: Literal["reported", "under_review", "resolved"]
    ai_recommendation: Optional[str] = Field(default=None, max_length=5000)


class CropIssueOut(ORMBase):
    id: int
    issue_type: str
    description: str
    image_url: Optional[str] = None
    status: str
    ai_recommendation: Optional[str] = None
    created_at: datetime
    customer: Optional[CustomerOut] = None
    crop: Optional[CropOut] = None


class IssueTypeBreakdown(BaseModel):
    issue_type: str
    count: int
    percent: float


# ---------- Agriculture: Advisories ----------
class AdvisoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    crop_type: Optional[str] = Field(default=None, max_length=100)


class AdvisoryOut(ORMBase):
    id: int
    title: str
    content: str
    crop_type: Optional[str] = None
    created_at: datetime


# ---------- Agriculture: Schemes ----------
class SchemeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=10000)
    link_url: Optional[str] = Field(default=None, max_length=2048)
    is_active: bool = True

    @field_validator("link_url")
    @classmethod
    def validate_link_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_safe_url(value)


class SchemeOut(ORMBase):
    id: int
    title: str
    description: str
    link_url: Optional[str] = None
    is_active: bool
    created_at: datetime


# ---------- Knowledge Base ----------
class KnowledgeBaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    domain: str = "ecommerce"
    language: str = "en"

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        if v not in ("ecommerce", "agriculture"):
            raise ValueError("domain must be 'ecommerce' or 'agriculture'")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ("en", "te", "hi"):
            raise ValueError("language must be one of: en, te, hi")
        return v


class KnowledgeBaseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    domain: Optional[Literal["ecommerce", "agriculture"]] = None
    language: Optional[Literal["en", "te", "hi"]] = None


class KnowledgeBaseOut(ORMBase):
    id: int
    title: str
    content: str
    domain: str
    language: str
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentOut(ORMBase):
    id: int
    original_filename: str
    content_type: str
    size_bytes: int
    page_count: int
    chunk_count: int
    domain: str
    language: str
    created_at: datetime


# ---------- Conversations ----------
class MessageOut(ORMBase):
    id: int
    sender: str
    content: str
    sentiment: Optional[str] = None
    intent: Optional[str] = None
    next_best_action: Optional[str] = None
    created_at: datetime


class ConversationOut(ORMBase):
    id: int
    customer_id: int
    domain: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut] = []


class ConversationSummary(ORMBase):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    domain: str
    message_count: int
    last_message: Optional[str] = None
    last_sentiment: Optional[str] = None
    updated_at: datetime

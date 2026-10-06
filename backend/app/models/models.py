import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class UserRole(str, enum.Enum):
    customer = "customer"
    farmer = "farmer"
    admin = "admin"


class Language(str, enum.Enum):
    en = "en"
    te = "te"
    hi = "hi"


class Domain(str, enum.Enum):
    ecommerce = "ecommerce"
    agriculture = "agriculture"


class IssueType(str, enum.Enum):
    leaf_disease = "leaf_disease"
    pest_attack = "pest_attack"
    nutrient_deficiency = "nutrient_deficiency"
    weather_damage = "weather_damage"
    other = "other"


class IssueStatus(str, enum.Enum):
    reported = "reported"
    under_review = "under_review"
    resolved = "resolved"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    password_hash = Column(String, nullable=False, default="")
    role = Column(Enum(UserRole), default=UserRole.customer)
    language = Column(Enum(Language), default=Language.en)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")
    cart_items = relationship("CartItem", back_populates="customer")
    wishlist_items = relationship("WishlistItem", back_populates="customer")
    tickets = relationship("SupportTicket", back_populates="customer")
    crops = relationship("Crop", back_populates="customer")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String, nullable=True)
    domain = Column(Enum(Domain), default=Domain.ecommerce)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    warranty = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product")
    deals = relationship("Deal", back_populates="product")

    @property
    def active_deal(self):
        now = datetime.utcnow()
        eligible = [
            deal
            for deal in self.deals
            if deal.is_active
            and deal.starts_at <= now
            and (deal.ends_at is None or deal.ends_at >= now)
        ]
        return max(eligible, key=lambda deal: deal.discount_percent, default=None)

    @property
    def effective_price(self) -> float:
        deal = self.active_deal
        if not deal:
            return self.price
        return round(self.price * (1 - deal.discount_percent / 100), 2)


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    customer = relationship("Customer", back_populates="cart_items")
    product = relationship("Product")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    customer = relationship("Customer", back_populates="wishlist_items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(String, nullable=True)
    payment_method = Column(String, default="card")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class OrderAction(Base):
    """A customer-requested action that changes or follows up on an order."""

    __tablename__ = "order_actions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    action_type = Column(String, nullable=False)  # cancellation | return | refund | replacement
    status = Column(String, nullable=False, default="requested")  # requested | completed | rejected | cancelled
    reason = Column(Text, nullable=True)
    amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order")
    customer = relationship("Customer")
    item = relationship("OrderItem")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    customer = relationship("Customer", back_populates="reviews")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    discount_percent = Column(Float, nullable=False)
    starts_at = Column(DateTime, default=datetime.utcnow)
    ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="deals")


class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    link_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.open)
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="tickets")
    messages = relationship("TicketMessage", back_populates="ticket", order_by="TicketMessage.created_at")


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"))
    sender = Column(String, nullable=False)  # "customer" | "admin"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("SupportTicket", back_populates="messages")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float, nullable=False)
    method = Column(String, default="card")
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    name = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    area_acres = Column(Float, nullable=True)
    planted_on = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="crops")
    issues = relationship("CropIssue", back_populates="crop")


class CropIssue(Base):
    __tablename__ = "crop_issues"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)
    issue_type = Column(Enum(IssueType), default=IssueType.other)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(Enum(IssueStatus), default=IssueStatus.reported)
    ai_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer")
    crop = relationship("Crop", back_populates="issues")


class CropImageUpload(Base):
    __tablename__ = "crop_image_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer")


class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    crop_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    link_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    domain = Column(Enum(Domain), default=Domain.ecommerce)
    language = Column(Enum(Language), default=Language.en)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False, default="application/pdf")
    size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=False)
    domain = Column(Enum(Domain), nullable=False)
    language = Column(Enum(Language), nullable=False)
    created_by = Column(Integer, ForeignKey("customers.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("Customer")
    chunks = relationship(
        "KnowledgeChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="KnowledgeChunk.chunk_index",
    )

    @property
    def chunk_count(self) -> int:
        return len(self.chunks)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    document = relationship("KnowledgeDocument", back_populates="chunks")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    domain = Column(Enum(Domain), default=Domain.ecommerce)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String, nullable=False)  # "customer" | "assistant"
    content = Column(Text, nullable=False)
    sentiment = Column(String, nullable=True)
    intent = Column(String, nullable=True)
    next_best_action = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info | order | support | recommendation
    link_url = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer")

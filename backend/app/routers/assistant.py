import json
import re
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer
from app.core.upload_limits import UploadTooLarge, read_limited_upload
from app.db.session import get_db
from app.models.models import (
    CartItem, Conversation, Crop, CropIssue, Customer, Domain, Language, Message, Product, Order, OrderItem,
    Category, OrderStatus, Review, SupportTicket, TicketMessage, TicketStatus, WishlistItem,
)
from app.services import rag
from app.services.notifications import notify
from app.services.order_actions import OrderActionError, eligible_action_items, eligible_action_orders, execute_order_action, get_customer_order
from app.services.ai_guardrails import normalize_assistant_result
from app.services.openai_client import call_openai_json, transcribe_openai_audio

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/flac", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm", "audio/x-wav",
}

LANGUAGE_NAMES = {"en": "English", "te": "Telugu", "hi": "Hindi"}

TECHKART_SYSTEM_PROMPT = """You are the AI shopping assistant for TechKart, an electronics e-commerce store.
You help customers find products, check order status, and handle support issues.

Respond ONLY with a JSON object matching this exact schema, no markdown, no extra text:
{
  "reply": "a natural, concise, helpful response to the customer (2-4 sentences max)",
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "intent": "product_recommendation" | "price_query" | "order_status" | "support_request" | "general_query",
  "next_best_action": "show_products" | "show_order_tracking" | "create_support_ticket" | "recommend_popular_products" | "provide_information" | "escalate_to_human",
  "product_ids": [list of relevant product ids from the CONTEXT below, empty if none relevant]
}

Rules:
- Only recommend products that appear in the CONTEXT section below. Never invent product names, prices or stock.
- When the customer asks for suggestions based on a previous order, use the products in ORDER CONTEXT to suggest useful complementary products from PRODUCT CONTEXT.
- Use KNOWLEDGE BASE CONTEXT to answer policy, warranty, usage, or general questions accurately. If the answer isn't in the knowledge base or product context, say you're not sure rather than guessing.
- Use RECENT CONVERSATION to stay consistent with what was already discussed in this chat.
- If the customer sounds upset, frustrated, or reports a problem (damaged/wrong/delayed/refund), set sentiment accordingly and next_best_action to "create_support_ticket".
- If the customer is clearly very frustrated or says the issue is still unresolved after previous help, set next_best_action to "escalate_to_human" instead.
- If asking about an order, use the ORDER CONTEXT provided and set next_best_action to "show_order_tracking".
- Keep the reply short, warm, and professional — like a helpful store assistant, not a generic chatbot.
"""

AGRIMART_SYSTEM_PROMPT = """You are the AI field assistant for AgriMart, an agriculture marketplace and farmer-support service.
You help farmers with crop guidance, pest and disease questions, soil and nutrient questions, weather and irrigation planning, farming products, orders, and support.

Respond ONLY with a JSON object matching this exact schema, no markdown, no extra text:
{
  "reply": "a natural, practical, concise response to the farmer (2-5 sentences max)",
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "intent": "crop_guidance" | "pest_or_disease" | "soil_and_nutrients" | "weather_and_irrigation" | "farming_product_recommendation" | "price_query" | "order_status" | "support_request" | "general_query",
  "next_best_action": "show_products" | "show_order_tracking" | "create_support_ticket" | "recommend_popular_products" | "provide_information" | "escalate_to_human",
  "product_ids": [list of relevant agriculture product ids from the CONTEXT below, empty if none relevant]
}

Rules:
- Stay within agriculture, farming products, crop care, orders, and support. If asked about electronics, explain that TechKart handles those questions.
- Use only products from PRODUCT CONTEXT. Never invent product names, prices, stock, crop varieties, diagnoses, or guaranteed results.
- Use KNOWLEDGE BASE CONTEXT and PDF excerpts as the primary source for farming guidance. If the evidence is missing, say what is uncertain and recommend a local agronomist or extension officer.
- Crop, pest, disease, nutrient, and weather guidance is informational, not a confirmed diagnosis or prescription. Do not invent pesticide/fertilizer doses, brands, chemical mixtures, or off-label instructions. Recommend locally registered products and the label only when appropriate.
- Use CROP CONTEXT when personalizing advice, and never reveal another farmer's information.
- If the farmer sounds upset or reports a problem, set sentiment accordingly and use the support action. Escalate only when continued frustration or risk supports it.
- Keep the reply practical, farmer-friendly, and short.
"""

SYSTEM_PROMPTS = {
    Domain.ecommerce: TECHKART_SYSTEM_PROMPT,
    Domain.agriculture: AGRIMART_SYSTEM_PROMPT,
}
# Backward-compatible name for code/tests that imported the old constant.
SYSTEM_PROMPT = TECHKART_SYSTEM_PROMPT


def extract_keywords(text: str) -> list[str]:
    stop = {"a", "an", "the", "i", "want", "need", "for", "me", "to", "buy", "looking", "is", "my", "do", "you",
            "have", "any", "show", "find", "best", "which", "what", "please", "can", "get", "this", "that"}
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return [w for w in words if w not in stop and len(w) > 2]


def popular_products(db: Session, limit: int, domain: Domain) -> list[Product]:
    return (
        db.query(Product)
        .join(Category, isouter=True)
        .filter(Category.domain == domain)
        .order_by(Product.is_featured.desc(), Product.rating_count.desc(), Product.rating.desc())
        .limit(limit)
        .all()
    )


def retrieve_products(db: Session, message: str, domain: Domain, limit: int = 6) -> list[Product]:
    keywords = extract_keywords(message)
    if not keywords:
        return popular_products(db, limit, domain)

    conditions = []
    for kw in keywords:
        conditions.append(Product.name.ilike(f"%{kw}%"))
        conditions.append(Product.brand.ilike(f"%{kw}%"))
        conditions.append(Category.name.ilike(f"%{kw}%"))

    results = (
        db.query(Product)
        .join(Category, isouter=True)
        .filter(or_(*conditions), Category.domain == domain)
        .order_by(Product.created_at.desc(), Product.id.desc())
        .limit(limit)
        .all()
    )
    if not results:
        results = popular_products(db, limit, domain)
    return results


def build_context(db: Session, customer_id: int, products: list[Product], domain: Domain) -> str:
    product_lines = [
        f"- id={p.id}, name=\"{p.name}\", brand={p.brand}, price=Rs.{p.price:,.0f}, "
        f"stock={p.stock}, rating={p.rating} ({p.rating_count} reviews)"
        for p in products
    ]
    product_block = "\n".join(product_lines) if product_lines else "No matching products found."

    last_order = (
        db.query(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Product, Product.id == OrderItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .filter(Order.customer_id == customer_id, Category.domain == domain)
        .order_by(Order.created_at.desc())
        .first()
    )
    if last_order:
        status = last_order.status.value if hasattr(last_order.status, "value") else last_order.status
        order_items = ", ".join(f"{item.product.name} x{item.quantity}" for item in last_order.items)
        order_block = (
            f"Order #TK{10000 + last_order.id}: status={status}, total=Rs.{last_order.total_amount:,.0f}, "
            f"placed on {last_order.created_at.strftime('%d %b %Y')}, products={order_items or 'none'}"
        )
    else:
        order_block = "This customer has no orders yet."

    wishlist = (
        db.query(WishlistItem)
        .join(Product, Product.id == WishlistItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .filter(WishlistItem.customer_id == customer_id, Category.domain == domain)
        .order_by(WishlistItem.id.desc())
        .limit(10)
        .all()
    )
    wishlist_block = (
        ", ".join(item.product.name for item in wishlist if item.product) or "No wishlist items."
    )

    reviews = (
        db.query(Review)
        .join(Product, Product.id == Review.product_id)
        .join(Category, Category.id == Product.category_id)
        .filter(Review.customer_id == customer_id, Category.domain == domain)
        .order_by(Review.created_at.desc())
        .limit(5)
        .all()
    )
    reviews_block = (
        "; ".join(f"{r.product.name}: {r.rating}/5 \"{r.comment or ''}\"" for r in reviews if r.product)
        or "No reviews yet."
    )

    blocks = [
        f"PRODUCT CONTEXT:\n{product_block}\n\n"
        f"ORDER CONTEXT:\n{order_block}\n\n"
        f"WISHLIST CONTEXT:\n{wishlist_block}\n\n"
        f"REVIEWS CONTEXT:\n{reviews_block}"
    ]
    if domain == Domain.agriculture:
        crops = (
            db.query(Crop)
            .filter(Crop.customer_id == customer_id)
            .order_by(Crop.created_at.desc())
            .limit(10)
            .all()
        )
        crop_block = "; ".join(
            f"{crop.name}"
            + (f" ({crop.variety})" if crop.variety else "")
            + (f", {crop.area_acres:g} acres" if crop.area_acres is not None else "")
            for crop in crops
        ) or "No crops recorded."
        issues = (
            db.query(CropIssue)
            .filter(CropIssue.customer_id == customer_id)
            .order_by(CropIssue.created_at.desc())
            .limit(5)
            .all()
        )
        issue_block = "; ".join(
            f"{issue.issue_type.value if hasattr(issue.issue_type, 'value') else issue.issue_type}: {issue.description[:300]} ({issue.status.value if hasattr(issue.status, 'value') else issue.status})"
            for issue in issues
        ) or "No crop issues recorded."
        blocks.append(f"CROP CONTEXT:\nCrops: {crop_block}\nRecent issues: {issue_block}")
    return "\n\n".join(blocks)


def get_or_create_conversation(db: Session, customer_id: int, domain: Domain) -> Conversation:
    conversation = (
        db.query(Conversation)
        .filter(Conversation.customer_id == customer_id, Conversation.domain == domain)
        .order_by(Conversation.updated_at.desc())
        .first()
    )
    if conversation:
        return conversation
    conversation = Conversation(customer_id=customer_id, domain=domain)
    db.add(conversation)
    db.flush()
    return conversation


def save_message(
    db: Session,
    conversation: Conversation,
    sender: str,
    content: str,
    sentiment: str | None = None,
    intent: str | None = None,
    next_best_action: str | None = None,
) -> None:
    db.add(
        Message(
            conversation_id=conversation.id,
            sender=sender,
            content=content,
            sentiment=sentiment,
            intent=intent,
            next_best_action=next_best_action,
        )
    )
    conversation.updated_at = datetime.utcnow()
    db.commit()


def format_history(conversation: Conversation, limit: int = 6) -> str:
    recent = conversation.messages[-limit:] if conversation.messages else []
    if not recent:
        return "No previous messages in this conversation."
    return "\n".join(f"{m.sender}: {m.content}" for m in recent)


def normalize_language(value: str | None) -> str | None:
    normalized = (value or "").strip().lower()
    if normalized.startswith("en") or "english" in normalized:
        return "en"
    if normalized.startswith("hi") or "hindi" in normalized:
        return "hi"
    if normalized.startswith("te") or "telugu" in normalized:
        return "te"
    return None


def detect_message_language(message: str) -> str | None:
    """Detect the two unambiguous Indic scripts before falling back to the profile language."""
    if re.search(r"[\u0C00-\u0C7F]", message):
        return "te"
    if re.search(r"[\u0900-\u097F]", message):
        return "hi"
    return None


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form(default="auto"),
    _current: Customer = Depends(get_current_customer),
    _: None = Depends(rate_limit("assistant-voice", 10, 60)),
):
    content_type = (audio.content_type or "").split(";", 1)[0].strip().lower()
    if content_type not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported audio format")
    try:
        audio_bytes = await read_limited_upload(audio, settings.max_audio_upload_bytes)
    except UploadTooLarge:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Audio recording is too large") from None
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio was received")

    language_hint = normalize_language(language) if language != "auto" else None
    if language != "auto" and language_hint is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Language must be English, Hindi, Telugu, or auto")
    filename = audio.filename or "voice.webm"
    result = await transcribe_openai_audio(
        audio_bytes=audio_bytes,
        filename=filename,
        content_type=content_type,
        language=language_hint,
    )
    if result:
        result["language"] = normalize_language(result.get("language"))
        return result

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Voice transcription is temporarily unavailable. You can try the browser voice fallback.",
    )


class AssistantQuery(BaseModel):
    customer_id: int = 0
    message: str = Field(min_length=1, max_length=4000)
    domain: Literal["ecommerce", "agriculture"] = "ecommerce"
    language: Literal["en", "hi", "te"] | None = None
    order_id: int | None = Field(default=None, ge=1)
    item_id: int | None = Field(default=None, ge=1)
    action_type: str | None = Field(default=None, max_length=40)
    confirmed: bool = False


class AssistantResponse(BaseModel):
    reply: str
    sentiment: str
    intent: str
    next_best_action: str
    language: Literal["en", "hi", "te"] | None = None
    products: list[dict] = []
    action: dict | None = None


ACTION_NAMES = {
    "cancellation": "cancel",
    "return": "return",
    "refund": "refund",
    "replacement": "replace",
}


def detect_customer_action(message: str) -> str | None:
    text = message.lower()
    if any(word in text for word in ("refund", "money back", "my money")):
        return "refund"
    if any(word in text for word in ("replace", "replacement", "exchange")):
        return "replacement"
    if any(word in text for word in ("return", "send back")):
        return "return"
    if any(word in text for word in ("cancel", "stop my order")):
        return "cancellation"
    if any(word in text for word in ("damaged", "wrong product", "missing item", "speak to an agent", "support ticket", "complaint")):
        return "support"
    if any(word in text for word in ("track", "where is", "delivery status", "order status")):
        return "track"
    if any(word in text for word in ("show my order", "show my orders", "my order number", "my orders", "order history")):
        return "orders"
    if "wishlist" in text or "saved products" in text:
        return "wishlist"
    if "cart" in text and any(word in text for word in ("show", "view", "what", "open")):
        return "cart"
    if any(word in text for word in ("reorder", "buy again", "same product again")):
        return "reorder"
    return None


def order_option(order: Order) -> dict:
    status = order.status.value if hasattr(order.status, "value") else order.status
    item_count = sum(item.quantity for item in order.items)
    return {
        "id": order.id,
        "order_id": order.id,
        "label": f"#TK{10000 + order.id}",
        "subtitle": f"{item_count} item{'s' if item_count != 1 else ''} · Rs.{order.total_amount:,.0f} · {status}",
        "status": status,
    }


def item_option(item: OrderItem) -> dict:
    return {
        "id": item.id,
        "item_id": item.id,
        "order_id": item.order_id,
        "label": item.product.name,
        "subtitle": f"Qty {item.quantity} · Rs.{item.unit_price * item.quantity:,.0f}",
    }


def order_details(order: Order) -> str:
    status = order.status.value if hasattr(order.status, "value") else order.status
    products = ", ".join(f"{item.product.name} × {item.quantity}" for item in order.items)
    return f"Order #TK{10000 + order.id} is {status}. Items: {products or 'none'}. Total: Rs.{order.total_amount:,.0f}."


FRUSTRATION_WORDS = (
    "furious", "angry", "unacceptable", "terrible", "worst", "disgusted", "fed up",
    "sick of", "ridiculous", "useless", "horrible", "scam", "never again", "still not",
    "again and again", "no one is helping", "waste of time", "disappointed",
)


def message_sounds_frustrated(message: str) -> bool:
    text = message.lower()
    return any(phrase in text for phrase in FRUSTRATION_WORDS)


def recent_frustration_count(conversation: Conversation, limit: int = 5) -> int:
    """Counts recent signs of customer frustration: assistant-classified sentiment plus message wording."""
    recent = conversation.messages[-limit:] if conversation.messages else []
    count = sum(1 for m in recent if m.sender == "assistant" and m.sentiment in {"frustrated", "negative"})
    count += sum(1 for m in recent if m.sender == "customer" and message_sounds_frustrated(m.content))
    return count


def handle_order_action(
    db: Session, payload: AssistantQuery, action_type: str, conversation: Conversation | None = None
) -> AssistantResponse:
    customer_id = payload.customer_id
    domain = Domain(payload.domain)
    if action_type in {"cart", "wishlist", "reorder"}:
        if action_type == "cart":
            records = (
                db.query(CartItem)
                .join(Product, Product.id == CartItem.product_id)
                .join(Category, Category.id == Product.category_id)
                .filter(CartItem.customer_id == customer_id, Category.domain == domain)
                .order_by(CartItem.id.desc())
                .all()
            )
            products = [record.product for record in records]
            empty_message = "Your cart is empty. Ask me to find something for you, or browse the store."
        elif action_type == "wishlist":
            records = (
                db.query(WishlistItem)
                .join(Product, Product.id == WishlistItem.product_id)
                .join(Category, Category.id == Product.category_id)
                .filter(WishlistItem.customer_id == customer_id, Category.domain == domain)
                .order_by(WishlistItem.id.desc())
                .all()
            )
            products = [record.product for record in records]
            empty_message = "Your wishlist is empty. I can help you find something to save."
        else:
            last_order = (
                db.query(Order)
                .join(OrderItem, OrderItem.order_id == Order.id)
                .join(Product, Product.id == OrderItem.product_id)
                .join(Category, Category.id == Product.category_id)
                .filter(Order.customer_id == customer_id, Category.domain == domain)
                .order_by(Order.created_at.desc())
                .first()
            )
            products = [item.product for item in last_order.items] if last_order else []
            empty_message = "You don’t have a previous order to reorder yet."
        if not products:
            return AssistantResponse(reply=empty_message, sentiment="neutral", intent="general_query", next_best_action="recommend_popular_products")
        product_payload = [
            {"id": product.id, "name": product.name, "price": product.price, "image_url": product.image_url, "stock": product.stock, "rating": product.rating}
            for product in products
        ]
        message = {
            "cart": "Here’s what is currently in your cart.",
            "wishlist": "Here are the products you saved.",
            "reorder": "Here are products from your latest order. You can add any of them to your cart again.",
        }[action_type]
        return AssistantResponse(reply=message, sentiment="neutral", intent="product_recommendation", next_best_action="show_products", products=product_payload)

    if action_type in {"orders", "track"}:
        if payload.order_id:
            try:
                order = get_customer_order(db, customer_id, payload.order_id, domain)
            except OrderActionError as exc:
                return AssistantResponse(
                    reply=str(exc), sentiment="neutral", intent="order_status", next_best_action="show_order_tracking"
                )
            return AssistantResponse(
                reply=order_details(order),
                sentiment="neutral",
                intent="order_status",
                next_best_action="show_order_tracking",
                action={"type": "order_detail", "order": order_option(order)},
            )

        orders = (
            db.query(Order)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .filter(Order.customer_id == customer_id, Category.domain == domain)
            .distinct()
            .order_by(Order.created_at.desc())
            .limit(10)
            .all()
        )
        if not orders:
            return AssistantResponse(
                reply="I couldn’t find any orders in your account yet.",
                sentiment="neutral",
                intent="order_status",
                next_best_action="show_order_tracking",
            )
        return AssistantResponse(
            reply="Here are your recent orders. Select one and I’ll show the full details.",
            sentiment="neutral",
            intent="order_status",
            next_best_action="show_order_tracking",
            action={"type": "order_list", "operation": action_type, "options": [order_option(order) for order in orders]},
        )

    if action_type == "support":
        if not payload.confirmed:
            return AssistantResponse(
                reply="I can create a support ticket for this issue. Would you like me to send it to the support team?",
                sentiment="neutral",
                intent="support_request",
                next_best_action="create_support_ticket",
                action={"type": "confirm_order_action", "operation": "support", "label": "Send this to Support"},
            )
        escalate = conversation is not None and recent_frustration_count(conversation) >= 2
        ticket = SupportTicket(
            customer_id=customer_id,
            subject="Customer support request",
            message=payload.message,
            status=TicketStatus.open,
            is_escalated=escalate,
            escalation_reason="Repeated frustrated sentiment detected in conversation" if escalate else None,
        )
        db.add(ticket)
        db.flush()
        db.add(TicketMessage(ticket_id=ticket.id, sender="customer", message=payload.message))
        db.commit()
        notify(
            db, customer_id,
            title="Support ticket created" if not escalate else "Support ticket escalated",
            message=f"Ticket #{ticket.id} was created and {'escalated to a human agent' if escalate else 'is being reviewed'}.",
            type="support",
            link_url="/support",
        )
        reply = (
            f"Done — I sent this to Support as ticket #{ticket.id} and escalated it to a human agent given the trouble you've had. They'll reach out shortly."
            if escalate
            else f"Done — I sent this to Support as ticket #{ticket.id}. You can follow the reply from the Support page."
        )
        return AssistantResponse(
            reply=reply,
            sentiment="neutral",
            intent="support_request",
            next_best_action="escalate_to_human" if escalate else "create_support_ticket",
            action={"type": "action_completed", "operation": "support", "status": "open", "escalated": escalate},
        )

    if action_type not in ACTION_NAMES:
        return AssistantResponse(
            reply="I can help with orders, returns, refunds, replacements, and cancellations.",
            sentiment="neutral",
            intent="general_query",
            next_best_action="provide_information",
        )

    if not payload.order_id:
        orders = eligible_action_orders(db, customer_id, action_type, domain)
        if not orders:
            rule = "pending or processing" if action_type == "cancellation" else "delivered"
            return AssistantResponse(
                reply=f"I couldn’t find an order eligible for a {ACTION_NAMES[action_type]}. This action is available for {rule} orders.",
                sentiment="neutral",
                intent="support_request",
                next_best_action="provide_information",
            )
        return AssistantResponse(
            reply=f"Select the order you want to {ACTION_NAMES[action_type]}.",
            sentiment="neutral",
            intent="support_request",
            next_best_action="create_support_ticket" if action_type != "cancellation" else "show_order_tracking",
            action={"type": "select_order", "operation": action_type, "options": [order_option(order) for order in orders]},
        )

    try:
        order = get_customer_order(db, customer_id, payload.order_id, domain)
    except OrderActionError as exc:
        return AssistantResponse(
            reply=str(exc), sentiment="neutral", intent="support_request", next_best_action="provide_information"
        )

    if action_type == "cancellation" and order.status not in {OrderStatus.pending, OrderStatus.processing}:
        return AssistantResponse(
            reply=f"{order_details(order)} It can’t be cancelled now because it is already shipped or delivered.",
            sentiment="neutral", intent="support_request", next_best_action="provide_information",
        )
    if action_type != "cancellation" and order.status != OrderStatus.delivered:
        return AssistantResponse(
            reply=f"{order_details(order)} A {ACTION_NAMES[action_type]} is available after delivery.",
            sentiment="neutral", intent="support_request", next_best_action="provide_information",
        )

    if action_type != "cancellation" and payload.item_id is None:
        items = eligible_action_items(order, action_type)
        if len(items) > 1:
            return AssistantResponse(
                reply=f"Which product from Order #TK{10000 + order.id} do you want to {ACTION_NAMES[action_type]}?",
                sentiment="neutral",
                intent="support_request",
                next_best_action="create_support_ticket",
                action={"type": "select_item", "operation": action_type, "order_id": order.id, "options": [item_option(item) for item in items]},
            )
        if len(items) == 1:
            payload.item_id = items[0].id

    if not payload.confirmed:
        item_text = ""
        if payload.item_id:
            selected = next((item for item in order.items if item.id == payload.item_id), None)
            if selected:
                item_text = f" for {selected.product.name}"
        return AssistantResponse(
            reply=f"Please confirm: {ACTION_NAMES[action_type].capitalize()} Order #TK{10000 + order.id}{item_text}? This action cannot be undone.",
            sentiment="neutral",
            intent="support_request",
            next_best_action="create_support_ticket" if action_type != "cancellation" else "show_order_tracking",
            action={
                "type": "confirm_order_action",
                "operation": action_type,
                "order_id": order.id,
                "item_id": payload.item_id,
                "label": f"{ACTION_NAMES[action_type].capitalize()} Order #TK{10000 + order.id}{item_text}",
            },
        )

    try:
        action = execute_order_action(db, customer_id, order.id, action_type, payload.item_id, payload.message, domain)
    except OrderActionError as exc:
        return AssistantResponse(
            reply=str(exc), sentiment="neutral", intent="support_request", next_best_action="provide_information"
        )
    if action_type == "cancellation":
        reply = f"Done — Order #TK{10000 + order.id} has been cancelled and the reserved stock was released."
    else:
        reply = f"Done — your {ACTION_NAMES[action_type]} request for Order #TK{10000 + order.id} was created. You can follow it in Support."
    return AssistantResponse(
        reply=reply,
        sentiment="positive",
        intent="support_request",
        next_best_action="create_support_ticket" if action_type != "cancellation" else "provide_information",
        action={"type": "action_completed", "operation": action_type, "order_id": order.id, "status": action.status},
    )


@router.post("/query", response_model=AssistantResponse)
async def query_assistant(
    payload: AssistantQuery,
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("assistant", 20, 60)),
):
    payload.customer_id = current.id
    conversation_domain = Domain(payload.domain)
    profile_language = normalize_language(
        current.language.value if hasattr(current.language, "value") else current.language
    ) or "en"
    response_language = normalize_language(payload.language) or detect_message_language(payload.message) or profile_language
    conversation = get_or_create_conversation(db, current.id, conversation_domain)
    save_message(db, conversation, sender="customer", content=payload.message)

    requested_action = payload.action_type or detect_customer_action(payload.message)
    if requested_action:
        response = handle_order_action(db, payload, requested_action, conversation)
        save_message(
            db, conversation, sender="assistant", content=response.reply,
            sentiment=response.sentiment, intent=response.intent, next_best_action=response.next_best_action,
        )
        response.language = response_language
        return response

    candidates = retrieve_products(db, payload.message, conversation_domain)
    context = build_context(db, payload.customer_id, candidates, conversation_domain)

    knowledge_articles = rag.retrieve_knowledge(db, payload.message, conversation_domain, Language(response_language))
    knowledge_context = rag.format_knowledge_context(knowledge_articles)

    history_context = format_history(conversation)

    language_name = LANGUAGE_NAMES.get(response_language, "English")
    language_instruction = (
        f"Respond in {language_name}. The \"reply\" field must be written in {language_name}. "
        "If the customer mixes languages, preserve the meaning and respond naturally in the dominant language."
    )

    system_prompt = SYSTEM_PROMPTS[conversation_domain]
    messages = [
        {"role": "system", "content": f"{system_prompt}\n\n{language_instruction}"},
        {
            "role": "user",
            "content": (
                f"{context}\n\n"
                f"KNOWLEDGE BASE CONTEXT:\n{knowledge_context}\n\n"
                f"RECENT CONVERSATION:\n{history_context}\n\n"
                f"CUSTOMER MESSAGE: {payload.message}"
            ),
        },
    ]

    result = await call_openai_json(messages, temperature=0.4, timeout=20)

    if result is None:
        reply = "I'm having trouble reaching the AI service right now. Please try again in a moment, or raise a support ticket if this is urgent."
        save_message(db, conversation, sender="assistant", content=reply, sentiment="neutral", intent="general_query", next_best_action="provide_information")
        return AssistantResponse(
            reply=reply,
            sentiment="neutral",
            intent="general_query",
            next_best_action="provide_information",
            language=response_language,
            products=[],
        )

    result = normalize_assistant_result(result, domain=conversation_domain.value)
    product_ids = result["product_ids"]
    reply = result.get("reply", "")
    sentiment = result.get("sentiment", "neutral")
    intent = result.get("intent", "general_query")
    next_best_action = result.get("next_best_action", "provide_information")
    escalation_is_supported = message_sounds_frustrated(payload.message) or recent_frustration_count(conversation) >= 2
    if next_best_action == "escalate_to_human" and not escalation_is_supported:
        next_best_action = "create_support_ticket"

    product_intents = {"product_recommendation", "farming_product_recommendation"}
    product_actions = {"show_products", "recommend_popular_products"}
    wants_products = intent in product_intents or next_best_action in product_actions
    matched = [p for p in candidates if p.id in product_ids] or (candidates[:3] if wants_products else [])
    if not matched and sentiment == "positive":
        # Encourage a purchase with a concrete suggestion rather than words alone.
        next_best_action = "recommend_popular_products"
        matched = candidates[:3] or popular_products(db, 3, conversation_domain)

    save_message(db, conversation, sender="assistant", content=reply, sentiment=sentiment, intent=intent, next_best_action=next_best_action)

    if next_best_action == "escalate_to_human":
        ticket = SupportTicket(
            customer_id=payload.customer_id,
            subject="Escalated by AI assistant",
            message=payload.message,
            status=TicketStatus.open,
            is_escalated=True,
            escalation_reason="AI assistant detected continued frustration and escalated automatically",
        )
        db.add(ticket)
        db.flush()
        db.add(TicketMessage(ticket_id=ticket.id, sender="customer", message=payload.message))
        db.commit()
        notify(
            db, payload.customer_id,
            title="Your issue was escalated",
            message=f"Ticket #{ticket.id} was escalated to a human agent. They'll reach out shortly.",
            type="support",
            link_url="/support",
        )

    return AssistantResponse(
        reply=reply,
        sentiment=sentiment,
        intent=intent,
        next_best_action=next_best_action,
        language=response_language,
        products=[
            {"id": p.id, "name": p.name, "price": p.price, "image_url": p.image_url, "stock": p.stock, "rating": p.rating}
            for p in matched
        ],
    )


GREETINGS = {
    "en": {
        "new": "Hi! I'm your TechKart AI assistant. Ask me about products, prices, or anything else.",
        "returning": "Welcome back! Ask me about your orders, or tell me what you're shopping for today.",
    },
    "te": {
        "new": "హాయ్! నేను మీ TechKart AI సహాయకుడిని. ఉత్పత్తులు, ధరల గురించి అడగండి.",
        "returning": "తిరిగి స్వాగతం! మీ ఆర్డర్ల గురించి అడగండి లేదా ఈరోజు ఏం కొనాలనుకుంటున్నారో చెప్పండి.",
    },
    "hi": {
        "new": "नमस्ते! मैं आपका TechKart AI सहायक हूँ। उत्पादों, कीमतों के बारे में पूछें।",
        "returning": "वापसी पर स्वागत है! अपने ऑर्डर के बारे में पूछें या बताएं आज आप क्या खरीदना चाहते हैं।",
    },
}


@router.get("/greeting")
def greeting(
    customer_id: int,
    domain: Literal["ecommerce", "agriculture"] = "ecommerce",
    current: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if customer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own greeting")
    language = current.language.value if hasattr(current.language, "value") else current.language
    if domain == "agriculture":
        strings = {
            "new": "Welcome to your AgriMart field assistant. Ask about crops, pests, soil, irrigation, farming products, or orders.",
            "returning": "Welcome back to AgriMart. Ask about your crops, recent farming orders, or what you need in the field today.",
        }
    else:
        strings = GREETINGS.get(language, GREETINGS["en"])
    order_count = db.query(func.count(Order.id)).filter(Order.customer_id == current.id).scalar() or 0
    if order_count == 0:
        return {"message": strings["new"]}
    return {"message": strings["returning"]}

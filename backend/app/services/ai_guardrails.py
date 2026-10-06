"""Deterministic boundaries around untrusted AI input and output."""

from collections.abc import Mapping
from typing import Any


MAX_AI_PROMPT_CHARS = 50_000
MAX_ASSISTANT_REPLY_CHARS = 2_000
MAX_TRANSLATION_CHARS = 440
MAX_TRANSCRIPT_CHARS = 8_000

ASSISTANT_SENTIMENTS = {"positive", "neutral", "negative", "frustrated"}
ASSISTANT_INTENTS = {
    "product_recommendation",
    "price_query",
    "order_status",
    "support_request",
    "general_query",
}
AGRICULTURE_ASSISTANT_INTENTS = {
    "crop_guidance",
    "pest_or_disease",
    "soil_and_nutrients",
    "weather_and_irrigation",
    "farming_product_recommendation",
    "price_query",
    "order_status",
    "support_request",
    "general_query",
}
ASSISTANT_ACTIONS = {
    "show_products",
    "show_order_tracking",
    "create_support_ticket",
    "recommend_popular_products",
    "provide_information",
    "escalate_to_human",
}


def bounded_text(value: Any, *, limit: int, fallback: str = "") -> str:
    """Return printable, bounded text without allowing control characters through."""
    if not isinstance(value, str):
        return fallback
    cleaned = "".join(character for character in value if character in "\n\r\t" or ord(character) >= 32)
    return cleaned.strip()[:limit] or fallback


def normalize_assistant_result(
    value: Mapping[str, Any] | None,
    *,
    domain: str = "ecommerce",
) -> dict[str, Any]:
    """Constrain model output to the contract consumed by the customer UI."""
    data = value if isinstance(value, Mapping) else {}

    sentiment = data.get("sentiment")
    if not isinstance(sentiment, str) or sentiment not in ASSISTANT_SENTIMENTS:
        sentiment = "neutral"

    intent = data.get("intent")
    allowed_intents = AGRICULTURE_ASSISTANT_INTENTS if domain == "agriculture" else ASSISTANT_INTENTS
    if not isinstance(intent, str) or intent not in allowed_intents:
        intent = "general_query"

    next_best_action = data.get("next_best_action")
    if not isinstance(next_best_action, str) or next_best_action not in ASSISTANT_ACTIONS:
        next_best_action = "provide_information"

    raw_product_ids = data.get("product_ids")
    product_ids = []
    if isinstance(raw_product_ids, list):
        product_ids = [
            product_id
            for product_id in raw_product_ids
            if isinstance(product_id, int) and not isinstance(product_id, bool) and product_id > 0
        ][:20]

    return {
        "reply": bounded_text(
            data.get("reply"),
            limit=MAX_ASSISTANT_REPLY_CHARS,
            fallback="I’m sorry, but I couldn’t prepare a reliable answer. Please try again or contact Support.",
        ),
        "sentiment": sentiment,
        "intent": intent,
        "next_best_action": next_best_action,
        "product_ids": product_ids,
    }


def normalize_translations(value: Any, source_texts: list[str]) -> dict[str, str]:
    """Accept only translations for requested strings and bound every value."""
    if not isinstance(value, Mapping):
        return {}
    translations: dict[str, str] = {}
    for source in source_texts:
        translated = value.get(source)
        if isinstance(translated, str):
            translations[source] = bounded_text(translated, limit=MAX_TRANSLATION_CHARS, fallback=source)
    return translations

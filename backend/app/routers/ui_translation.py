import json
from threading import Lock
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer
from app.services.openai_client import call_openai_json
from app.services.ai_guardrails import normalize_translations

router = APIRouter(prefix="/api/ui-translation", tags=["ui-translation"])

LANGUAGE_NAMES = {"hi": "Hindi", "te": "Telugu"}
_translation_cache: dict[tuple[str, str], str] = {}
_cache_lock = Lock()


class TranslationBatchRequest(BaseModel):
    language: Literal["hi", "te"]
    texts: list[str] = Field(min_length=1, max_length=80)

    @field_validator("texts")
    @classmethod
    def clean_texts(cls, texts: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for text in texts:
            value = " ".join((text or "").split())
            if not value or value in seen:
                continue
            if len(value) > 220:
                value = value[:220].rstrip()
            cleaned.append(value)
            seen.add(value)
        if not cleaned:
            raise ValueError("At least one non-empty text is required")
        return cleaned


class TranslationBatchResponse(BaseModel):
    language: str
    translations: dict[str, str]


def _cached(language: str, texts: list[str]) -> tuple[dict[str, str], list[str]]:
    translations: dict[str, str] = {}
    missing: list[str] = []
    with _cache_lock:
        for text in texts:
            value = _translation_cache.get((language, text))
            if value is None:
                missing.append(text)
            else:
                translations[text] = value
    return translations, missing


def _store(language: str, translations: dict[str, str]) -> None:
    with _cache_lock:
        for source, translated in translations.items():
            _translation_cache[(language, source)] = translated or source
        while len(_translation_cache) > 2_000:
            _translation_cache.pop(next(iter(_translation_cache)))


async def _call_translation_model(language: str, texts: list[str]) -> dict[str, str] | None:
    target = LANGUAGE_NAMES[language]
    messages = [
        {
            "role": "system",
            "content": (
                "You translate ecommerce/agriculture web app UI text. "
                f"Translate every source string into natural {target}. "
                "Return only JSON in this exact shape: "
                "{\"translations\":{\"source text\":\"translated text\"}}. "
                "Keep brand names, product names, model numbers, order IDs, prices, dates, URLs, emails, and code-like tokens unchanged. "
                "Preserve short UI tone. Do not add explanations. If a string should not be translated, return it unchanged."
            ),
        },
        {"role": "user", "content": json.dumps({"texts": texts}, ensure_ascii=False)},
    ]

    parsed = await call_openai_json(messages, temperature=0.1, timeout=20)
    return normalize_translations(parsed.get("translations") if parsed else None, texts)


@router.post("/batch", response_model=TranslationBatchResponse)
async def translate_batch(
    payload: TranslationBatchRequest,
    _current=Depends(get_current_customer),
    _: None = Depends(rate_limit("ui_translation", 30, 60)),
):
    translations, missing = _cached(payload.language, payload.texts)
    if missing:
        generated = await _call_translation_model(payload.language, missing)
        if not generated:
            generated = {text: text for text in missing}
        normalized = {text: generated.get(text, text) for text in missing}
        _store(payload.language, normalized)
        translations.update(normalized)
    return TranslationBatchResponse(language=payload.language, translations=translations)

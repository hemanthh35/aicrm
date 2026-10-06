"""Small OpenAI-only client used by the application's AI features."""

import json
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.services.ai_guardrails import MAX_AI_PROMPT_CHARS, MAX_TRANSCRIPT_CHARS, bounded_text

OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"
ALLOWED_AUDIO_CONTENT_TYPES = frozenset({
    "audio/flac",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "audio/x-wav",
})


def _message_chars(messages: list[dict[str, Any]]) -> int:
    total = 0
    for message in messages:
        if not isinstance(message, dict):
            return MAX_AI_PROMPT_CHARS + 1
        content = message.get("content")
        if isinstance(content, str):
            total += len(content)
        elif isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and isinstance(item.get("text"), str):
                    total += len(item["text"])
    return total


async def call_openai_json(
    messages: list[dict[str, Any]],
    *,
    model: str | None = None,
    temperature: float = 0.4,
    timeout: float = 20,
    max_tokens: int = 900,
) -> dict[str, Any] | None:
    """Call the configured OpenAI chat model and parse its JSON response.

    Returning ``None`` means the OpenAI request was unavailable or malformed. The
    caller can then use its existing deterministic, non-LLM safety behavior.
    """
    if not settings.openai_api_key:
        return None
    if not isinstance(messages, list) or not messages or _message_chars(messages) > MAX_AI_PROMPT_CHARS:
        return None

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENAI_CHAT_URL,
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": model or settings.openai_text_model,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": temperature,
                    "max_tokens": max(64, min(max_tokens, 2_000)),
                },
            )
        if response.status_code != 200:
            return None

        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


async def transcribe_openai_audio(
    *,
    audio_bytes: bytes,
    filename: str,
    content_type: str,
    language: str | None = None,
) -> dict[str, str | None] | None:
    """Transcribe audio with the configured OpenAI transcription model."""
    normalized_content_type = (content_type or "").split(";", 1)[0].strip().lower()
    if (
        not settings.openai_api_key
        or not audio_bytes
        or len(audio_bytes) > settings.max_audio_upload_bytes
        or normalized_content_type not in ALLOWED_AUDIO_CONTENT_TYPES
    ):
        return None

    data: dict[str, str] = {
        "model": settings.openai_transcription_model or "gpt-4o-mini-transcribe",
        "response_format": "verbose_json",
    }
    if language:
        data["language"] = language
    safe_filename = Path(filename or "voice.webm").name[:120] or "voice.webm"

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                OPENAI_TRANSCRIPTIONS_URL,
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                data=data,
                files={"file": (safe_filename, audio_bytes, normalized_content_type)},
            )
        if response.status_code != 200:
            return None

        payload = response.json()
        text = bounded_text(payload.get("text"), limit=MAX_TRANSCRIPT_CHARS)
        if not text:
            return None
        detected_language = payload.get("language") if isinstance(payload.get("language"), str) else None
        return {"text": text, "language": detected_language}
    except Exception:
        return None

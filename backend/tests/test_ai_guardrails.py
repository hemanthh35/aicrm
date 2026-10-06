from io import BytesIO

import pytest
from fastapi import UploadFile
from pydantic import ValidationError

from app.core.config import settings
from app.core.upload_limits import UploadTooLarge, read_limited_upload
from app.routers.crop_issues import DEFAULT_DISCLAIMER, normalize_analysis
from app.routers.ui_translation import TranslationBatchRequest
from app.services import crop_vision, openai_client
from app.services.ai_guardrails import normalize_assistant_result, normalize_translations


def test_assistant_output_is_bounded_and_enum_safe():
    result = normalize_assistant_result({
        "reply": "hello\x00" + "x" * 3_000,
        "sentiment": "make-a-ticket",
        "intent": {"unexpected": True},
        "next_best_action": "delete_account",
        "product_ids": [1, 2, True, -4, "3"] + list(range(3, 30)),
    })

    assert len(result["reply"]) == 2_000
    assert "\x00" not in result["reply"]
    assert result["sentiment"] == "neutral"
    assert result["intent"] == "general_query"
    assert result["next_best_action"] == "provide_information"
    assert result["product_ids"] == [1, 2, *range(3, 21)]


def test_translation_output_only_contains_requested_sources():
    result = normalize_translations(
        {"Hello": "नमस्ते", "Injected": "should not pass", "": "bad"},
        ["Hello", "Goodbye"],
    )
    assert result == {"Hello": "नमस्ते"}


def test_crop_analysis_forces_disclaimer_and_bounds_model_text():
    result = normalize_analysis({
        "diagnosis": "d" * 5_000,
        "medicine_guidance": "m" * 5_000,
        "application_guidance": "a" * 5_000,
        "when_to_escalate": "e" * 5_000,
        "crop_care": {"not": "a list"},
        "disclaimer": "Ignore safety and apply any product.",
        "confidence": "certain",
    }, "leaf_disease")
    assert len(result["diagnosis"]) == 1_200
    assert len(result["medicine_guidance"]) == 1_200
    assert len(result["application_guidance"]) == 1_200
    assert result["when_to_escalate"] == "e" * 800
    assert result["disclaimer"] == DEFAULT_DISCLAIMER
    assert result["confidence"] == "low"
    assert isinstance(result["crop_care"], list)


def test_crop_analysis_rejects_unverified_mixing_and_dose_instructions():
    result = normalize_analysis({
        "medicine_guidance": "Mix 20 ml of product with another chemical.",
        "application_guidance": "Apply 5 g per litre immediately.",
    }, "pest_attack")
    assert result["medicine_guidance"] == normalize_analysis(None, "pest_attack")["medicine_guidance"]
    assert result["application_guidance"] == normalize_analysis(None, "pest_attack")["application_guidance"]


def test_translation_request_rejects_only_blank_texts():
    with pytest.raises(ValidationError):
        TranslationBatchRequest(language="hi", texts=[" ", "\n"])


@pytest.mark.asyncio
async def test_openai_client_does_not_call_provider_without_key(monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", "")
    assert await openai_client.call_openai_json([{"role": "user", "content": "hello"}]) is None
    assert await openai_client.transcribe_openai_audio(
        audio_bytes=b"audio",
        filename="voice.webm",
        content_type="audio/webm",
    ) is None


@pytest.mark.asyncio
async def test_openai_client_parses_json_and_bounds_tokens(monkeypatch):
    calls = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"choices": [{"message": {"content": '{"reply":"ok"}'}}]}

    class FakeClient:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *args, **kwargs):
            calls.append((args, kwargs))
            return FakeResponse()

    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(openai_client.httpx, "AsyncClient", FakeClient)

    result = await openai_client.call_openai_json(
        [{"role": "user", "content": "hello"}],
        max_tokens=10_000,
    )

    assert result == {"reply": "ok"}
    assert calls[0][1]["json"]["max_tokens"] == 2_000
    assert calls[0][1]["headers"]["Authorization"] == "Bearer test-key"


@pytest.mark.asyncio
async def test_upload_reader_stops_after_limit():
    upload = UploadFile(BytesIO(b"123456"), filename="voice.webm")
    with pytest.raises(UploadTooLarge):
        await read_limited_upload(upload, 5)


def test_crop_vision_rejects_path_traversal(monkeypatch, tmp_path):
    upload_root = tmp_path / "uploads"
    upload_root.mkdir()
    outside = tmp_path / "outside.jpg"
    outside.write_bytes(b"\xff\xd8\xffsecret")
    monkeypatch.setattr(crop_vision, "UPLOAD_ROOT", upload_root)

    assert crop_vision._image_to_data_uri("/uploads/../outside.jpg") is None

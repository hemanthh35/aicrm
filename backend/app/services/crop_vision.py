"""AI crop issue analysis: looks at an uploaded photo and classifies the problem."""
import base64
from pathlib import Path

from app.core.config import settings
from app.services.openai_client import call_openai_json

VISION_PROMPT = """You are an agricultural expert AI analyzing a photo of a crop problem a farmer reported.

Look at the image and the farmer's description, then respond ONLY with a JSON object matching this schema:
{
  "issue_type": "leaf_disease" | "pest_attack" | "nutrient_deficiency" | "weather_damage" | "other",
  "confidence": "high" | "medium" | "low",
  "diagnosis": "A cautious, plain-language assessment. Never present it as certain.",
  "medicine_guidance": "Conditional treatment or medicine guidance. Do not invent brands, doses, or guaranteed cures. Prefer non-chemical/IPM steps first; only mention a generic treatment class or active-ingredient class when appropriate.",
  "application_guidance": "Safe next steps. Tell the farmer to use only a locally registered product for the named crop/problem and follow its label; do not provide a made-up dose.",
  "crop_care": ["3-5 practical crop-care steps"],
  "when_to_escalate": "When to contact a local agronomist or extension officer.",
  "disclaimer": "AI guidance is informational and not a confirmed diagnosis or prescription."
}

Base the issue_type and recommendation primarily on what you actually see in the photo — the farmer's text description is supporting context only, not the source of truth.
Never recommend mixing chemicals or using a pesticide off-label. If the image is unclear, lower confidence and say that a field inspection or lab test is needed.
"""

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"


def _image_to_data_uri(image_url: str) -> str | None:
    if not image_url.startswith("/uploads/"):
        return None
    try:
        upload_root = UPLOAD_ROOT.resolve()
        local_path = (upload_root / image_url.removeprefix("/uploads/")).resolve()
        local_path.relative_to(upload_root)
    except (OSError, ValueError):
        return None
    if not local_path.is_file():
        return None
    ext = local_path.suffix.lower().lstrip(".")
    mime_by_extension = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp"}
    mime = mime_by_extension.get(ext)
    if not mime:
        return None
    contents = local_path.read_bytes()
    if len(contents) > settings.max_image_upload_bytes:
        return None
    if mime == "jpeg" and not contents.startswith(b"\xff\xd8\xff"):
        return None
    if mime == "png" and not contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return None
    if mime == "webp" and (len(contents) < 12 or contents[:4] != b"RIFF" or contents[8:12] != b"WEBP"):
        return None
    encoded = base64.b64encode(contents).decode()
    return f"data:image/{mime};base64,{encoded}"


async def analyze_crop_image(image_url: str, description: str) -> dict | None:
    """Returns structured issue analysis or None if image analysis isn't available."""
    data_uri = _image_to_data_uri(image_url)
    if not data_uri:
        return None

    parsed = await call_openai_json(
        [
            {"role": "system", "content": VISION_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Farmer's description: {description or 'none provided'}"},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ],
        model=settings.openai_vision_model,
        temperature=0.3,
        timeout=30,
        max_tokens=900,
    )
    if not parsed:
        return None
    if parsed.get("issue_type") not in {
        "leaf_disease", "pest_attack", "nutrient_deficiency", "weather_damage", "other",
    }:
        parsed["issue_type"] = "other"
    return parsed

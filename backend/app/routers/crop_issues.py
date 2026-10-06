import json
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.rate_limit import rate_limit
from app.core.security import get_current_customer, require_admin, require_farmer_or_admin
from app.db.session import get_db
from app.models.models import CropIssue, IssueType, Customer, UserRole
from app.schemas.schemas import CropIssueCreate, CropIssueOut, CropIssueStatusUpdate, IssueTypeBreakdown
from app.services.crop_vision import analyze_crop_image
from app.services.ai_guardrails import bounded_text
from app.services.openai_client import call_openai_json

router = APIRouter(prefix="/api/crop-issues", tags=["agriculture"])

ANALYSIS_PROMPT = """You are an agricultural AI assistant. A farmer reported a crop issue.
Given the issue type and description, respond ONLY with a JSON object:
{
  "diagnosis": "A cautious, plain-language assessment; do not claim certainty.",
  "confidence": "high" | "medium" | "low",
  "medicine_guidance": "Conditional medicine/treatment guidance. Prefer integrated pest management and do not invent brands, doses, or guaranteed cures.",
  "application_guidance": "Tell the farmer to use only a locally registered product for the named crop/problem and follow the product label exactly.",
  "crop_care": ["3-5 practical crop-care steps"],
  "when_to_escalate": "When to contact a local agronomist or extension officer.",
  "disclaimer": "AI guidance is informational and not a confirmed diagnosis or prescription."
}
Keep it concise and farmer-friendly. Never recommend mixing chemicals or using a pesticide off-label."""

DEFAULT_DISCLAIMER = "AI guidance is informational and not a confirmed diagnosis or prescription. Confirm the problem with a local agronomist and follow the label of any locally registered product."


def _safe_agri_guidance(value: object, fallback: str) -> str:
    guidance = bounded_text(value, limit=1_200, fallback=fallback)
    lowered = guidance.lower()
    gives_mix_instruction = bool(re.search(r"\b(mix|combine|tank[- ]?mix)\b", lowered)) and not bool(
        re.search(r"\b(do not|don't|never|avoid)\s+(mix|combine|tank[- ]?mix)", lowered)
    )
    gives_unverified_dose = bool(re.search(r"\b\d+(?:\.\d+)?\s*(ml|milliliter|g|gram|kg|l|liter|litre|%|tbsp|teaspoon)\b", lowered))
    return fallback if gives_mix_instruction or gives_unverified_dose else guidance


def fallback_analysis(issue_type: str) -> dict:
    guidance = {
        "leaf_disease": {
            "diagnosis": "Possible leaf disease; the available description is not enough to confirm the pathogen.",
            "medicine_guidance": "Do not spray until the cause is confirmed. If a local expert confirms a fungal disease, ask for a locally registered fungicide suitable for this crop and pathogen.",
            "application_guidance": "Use only the product and crop combination listed on the label. Do not mix products or use a dose from this app.",
            "crop_care": ["Remove severely affected leaves where practical.", "Improve airflow and field drainage.", "Water at soil level and avoid wetting foliage.", "Check nearby plants for the same symptoms."],
            "when_to_escalate": "Contact an agronomist if symptoms spread quickly, stems wilt, or fruit/harvest is affected.",
        },
        "pest_attack": {
            "diagnosis": "Possible pest damage; inspect the underside of leaves and nearby plants before treating.",
            "medicine_guidance": "Start with hand removal, traps, barriers, or a suitable biological control. If treatment is still needed, ask for a locally registered product for the confirmed pest and crop.",
            "application_guidance": "Follow the product label, protect pollinators and beneficial insects, and never exceed the labelled rate.",
            "crop_care": ["Inspect both sides of leaves and new growth.", "Remove heavily affected plant parts.", "Keep weeds and crop debris under control.", "Recheck the crop after 2-3 days."],
            "when_to_escalate": "Contact an agronomist if the pest is spreading or beneficial insects are being harmed.",
        },
        "nutrient_deficiency": {
            "diagnosis": "Possible nutrient stress; deficiency symptoms can look similar to disease or root damage.",
            "medicine_guidance": "Do not use a pesticide for a suspected deficiency. Get a soil or leaf test before choosing a fertilizer or foliar feed.",
            "application_guidance": "Use only a crop-appropriate, locally recommended fertilizer and follow its label or agronomist guidance.",
            "crop_care": ["Check soil moisture and root health.", "Review recent fertilizer and irrigation history.", "Compare new and older leaves.", "Test the soil or leaf tissue before applying corrective nutrients."],
            "when_to_escalate": "Contact an agronomist when symptoms affect new growth or appear across the whole field.",
        },
        "weather_damage": {
            "diagnosis": "Possible weather stress; check this against recent heat, wind, rain, or flooding.",
            "medicine_guidance": "There is no guaranteed medicine for weather damage. Avoid unnecessary pesticide or fertilizer applications while the crop is stressed.",
            "application_guidance": "Stabilize water and drainage first, then ask a local expert before applying any recovery product.",
            "crop_care": ["Remove unsafe or fully dead plant material.", "Improve drainage after heavy rain.", "Provide shade or wind protection where practical.", "Monitor new growth before taking further action."],
            "when_to_escalate": "Contact an agronomist if new growth is also damaged or the crop is rapidly collapsing.",
        },
    }.get(issue_type, {
        "diagnosis": "The issue needs an in-person inspection before a reliable treatment can be suggested.",
        "medicine_guidance": "Do not apply a pesticide or fertilizer based only on this report. Ask a local agronomist to identify the cause.",
        "application_guidance": "Use only locally registered products and follow the product label exactly if an expert recommends treatment.",
        "crop_care": ["Isolate visibly affected plants where practical.", "Record when symptoms started.", "Check nearby plants and soil moisture.", "Take a clear close-up and whole-plant photo for review."],
        "when_to_escalate": "Contact an agronomist if symptoms spread or the crop is under visible stress.",
    })
    return {**guidance, "confidence": "low", "disclaimer": DEFAULT_DISCLAIMER}


def normalize_analysis(value: dict | None, issue_type: str) -> dict:
    fallback = fallback_analysis(issue_type)
    value = value if isinstance(value, dict) else {}
    crop_care = value.get("crop_care")
    if isinstance(crop_care, str):
        crop_care = [crop_care]
    if not isinstance(crop_care, list):
        crop_care = []
    crop_care = [bounded_text(item, limit=500) for item in crop_care if isinstance(item, str)]
    if not crop_care:
        crop_care = fallback["crop_care"]
    confidence = str(value.get("confidence") or fallback["confidence"]).lower()
    if confidence not in {"high", "medium", "low"}:
        confidence = "low"
    return {
        "diagnosis": bounded_text(value.get("diagnosis") or value.get("recommendation"), limit=1_200, fallback=fallback["diagnosis"]),
        "confidence": confidence,
        "medicine_guidance": _safe_agri_guidance(value.get("medicine_guidance"), fallback["medicine_guidance"]),
        "application_guidance": _safe_agri_guidance(value.get("application_guidance"), fallback["application_guidance"]),
        "crop_care": [str(item) for item in crop_care[:5]],
        "when_to_escalate": bounded_text(value.get("when_to_escalate"), limit=800, fallback=fallback["when_to_escalate"]),
        "disclaimer": DEFAULT_DISCLAIMER,
    }


async def generate_ai_recommendation(issue_type: str, description: str) -> dict:
    messages = [
        {"role": "system", "content": ANALYSIS_PROMPT},
        {"role": "user", "content": f"Issue type: {issue_type}\nDescription: {description}"},
    ]
    parsed = await call_openai_json(messages, temperature=0.4, timeout=20)
    if parsed is not None:
        return normalize_analysis(parsed, issue_type)
    return fallback_analysis(issue_type)


@router.get("", response_model=list[CropIssueOut])
def list_crop_issues(customer_id: int | None = None, current: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    q = db.query(CropIssue)
    if current.role != UserRole.admin:
        q = q.filter(CropIssue.customer_id == current.id)
    elif customer_id is not None:
        q = q.filter(CropIssue.customer_id == customer_id)
    return q.order_by(CropIssue.created_at.desc()).all()


@router.post("", response_model=CropIssueOut)
async def create_crop_issue(
    payload: CropIssueCreate,
    current: Customer = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("crop-issue", 10, 60)),
):
    if payload.customer_id != current.id and current.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="You can only report issues for yourself")
    issue = CropIssue(
        customer_id=current.id if current.role != UserRole.admin else payload.customer_id,
        crop_id=payload.crop_id,
        issue_type=payload.issue_type,
        description=payload.description,
        image_url=payload.image_url,
    )

    vision_result = await analyze_crop_image(payload.image_url, payload.description) if payload.image_url else None
    if vision_result:
        issue.issue_type = IssueType(vision_result["issue_type"])
        analysis = normalize_analysis(vision_result, issue.issue_type.value)
    else:
        analysis = await generate_ai_recommendation(payload.issue_type, payload.description)
    issue.ai_recommendation = json.dumps(analysis, ensure_ascii=False)

    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/{issue_id}/status", response_model=CropIssueOut)
def update_issue_status(issue_id: int, payload: CropIssueStatusUpdate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    issue = db.query(CropIssue).get(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Crop issue not found")
    issue.status = payload.status
    if payload.ai_recommendation:
        issue.ai_recommendation = payload.ai_recommendation
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/analytics/breakdown", response_model=list[IssueTypeBreakdown])
def issue_breakdown(_: object = Depends(require_admin), db: Session = Depends(get_db)):
    total = db.query(func.count(CropIssue.id)).scalar() or 0
    results = []
    for issue_type in IssueType:
        count = db.query(func.count(CropIssue.id)).filter(CropIssue.issue_type == issue_type).scalar() or 0
        percent = round((count / total) * 100, 1) if total else 0.0
        results.append(IssueTypeBreakdown(issue_type=issue_type.value, count=count, percent=percent))
    return sorted(results, key=lambda item: (-item.count, item.issue_type))

"""Small authenticated HTTP API that exposes the local travel RAG to n8n."""

import os
import re
import secrets
import logging
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Union
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from db import get_supabase
from rag_engine import get_rag


PROJECT_DIR = Path(__file__).resolve().parent
load_dotenv(PROJECT_DIR / ".env")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Travel RAG API",
    version="1.0.0",
    description="Retrieves relevant travel knowledge for the n8n content workflow.",
)


class RagSearchRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=300)
    location: str = Field(default="", max_length=200)
    target_audience: str = Field(default="", max_length=300)
    top_k: int = Field(default=3, ge=1, le=5)


class RagSource(BaseModel):
    title: str
    section: str
    source: str
    content: str


class RagSearchResponse(BaseModel):
    query: str
    found: bool
    context: str
    sources: List[RagSource]


class CampaignScriptDraft(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=10, max_length=120)
    duration: int = Field(ge=30, le=45)
    scenes: List[str] = Field(min_length=3, max_length=8)

    @field_validator("scenes")
    @classmethod
    def validate_scene_lengths(cls, scenes: List[str]) -> List[str]:
        if any(not 10 <= len(scene.strip()) <= 500 for scene in scenes):
            raise ValueError("Each script scene must contain 10-500 characters.")
        return [scene.strip() for scene in scenes]


class ContentDraft(BaseModel):
    """One mapped content row; status and IDs are assigned by the API."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    persona: Literal["local_guide", "family", "foodie", "budget_traveler"]
    hook: str = Field(min_length=20, max_length=100)
    script: Optional[Union[str, CampaignScriptDraft]] = None
    caption: Optional[str] = Field(default=None, min_length=40, max_length=2200)
    cta: Optional[str] = Field(default=None, min_length=15, max_length=300)

    @field_validator("script")
    @classmethod
    def validate_script_text(cls, script: Optional[Union[str, CampaignScriptDraft]]):
        if isinstance(script, str) and not 1 <= len(script.strip()) <= 10000:
            raise ValueError("Script text must contain 1-10000 characters.")
        return script

    @field_validator("caption")
    @classmethod
    def validate_caption_hashtag(cls, caption: Optional[str]) -> Optional[str]:
        if caption is not None and not re.search(r"#[\w\u00C0-\u024F]+", caption, re.UNICODE):
            raise ValueError("Caption must include a hashtag.")
        return caption

    @field_validator("cta")
    @classmethod
    def validate_cta_placeholder(cls, cta: Optional[str]) -> Optional[str]:
        if cta is not None and "[LINK_MUA_VE]" not in cta:
            raise ValueError("CTA must include the [LINK_MUA_VE] placeholder.")
        return cta


class SaveCampaignContentsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    campaign_id: UUID
    records: List[ContentDraft] = Field(min_length=10, max_length=10)


class SaveCampaignContentsResponse(BaseModel):
    campaign_id: UUID
    product_id: UUID
    inserted_count: int
    content_ids: List[UUID]
    status: Literal["approved", "needs_review"]
    flags: List[str]


class CampaignWebhookRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal["INSERT"]
    table: Literal["campaigns"]
    schema_name: Literal["public"] = Field(alias="schema")
    record: Dict[str, Any]
    old_record: Optional[Dict[str, Any]] = None


def _check_api_key(provided_key: Optional[str]) -> None:
    expected_key = os.getenv("RAG_API_KEY", "").strip()
    if len(expected_key) < 32:
        raise HTTPException(
            status_code=503,
            detail="RAG_API_KEY is not configured. Add a random key of at least 32 characters to .env.",
        )
    if not provided_key or not secrets.compare_digest(provided_key, expected_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def _check_contents_api_key(provided_key: Optional[str]) -> None:
    expected_key = os.getenv("CONTENTS_API_KEY", "").strip()
    if len(expected_key) < 32:
        raise HTTPException(
            status_code=503,
            detail="CONTENTS_API_KEY is not configured. Add a random key of at least 32 characters to .env.",
        )
    if not provided_key or not secrets.compare_digest(provided_key, expected_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def _format_script(value: Optional[Union[str, CampaignScriptDraft]]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    return "\\n".join(
        [value.title, f"Thời lượng: {value.duration} giây"]
        + [f"{index}. {scene}" for index, scene in enumerate(value.scenes, start=1)]
    )


_MONEY_PATTERN = re.compile(
    r"\b(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(triệu|tr|nghìn|ngàn|k|vnd|vnđ|đ|₫)(?=\s|[.,;:!?)]|$)",
    re.IGNORECASE,
)
_PROMO_PATTERN = re.compile(r"\b(?:GIAM|SALE)\d{1,3}\b|\bFREE[A-Z0-9_-]*\b", re.IGNORECASE)
_PROHIBITED_CLAIMS = (
    "miễn phí khách sạn",
    "bao ăn trọn đời",
    "hoàn tiền 100% vô điều kiện",
    "đảm bảo rẻ nhất",
    "chắc chắn còn vé",
)
_UNVERIFIED_CLAIM_PATTERNS = (
    re.compile(r"miễn phí vé trẻ em", re.IGNORECASE),
    re.compile(r"trẻ em (?:được )?miễn phí", re.IGNORECASE),
    re.compile(r"hoàn(?: tiền| hủy) (?:toàn bộ|miễn phí)", re.IGNORECASE),
    re.compile(r"bảo hiểm du lịch", re.IGNORECASE),
    re.compile(r"hỗ trợ xe lăn", re.IGNORECASE),
    re.compile(r"có sẵn xe đẩy", re.IGNORECASE),
    re.compile(r"ưu tiên người cao tuổi", re.IGNORECASE),
    re.compile(r"chỉ còn(?: đúng)? \d+ vé", re.IGNORECASE),
    re.compile(r"không mua[^.!?\n]{0,80}bị phạt", re.IGNORECASE),
    re.compile(r"duy nhất hôm nay", re.IGNORECASE),
    re.compile(r"sắp hết vé", re.IGNORECASE),
)


def _normalize_money(amount: str, unit: str) -> float:
    unit = unit.lower()
    if unit in {"triệu", "tr"}:
        return float(amount.replace(",", ".")) * 1_000_000
    number = amount.replace(" ", "")
    if unit in {"nghìn", "ngàn", "k"}:
        return float(number.replace(".", "").replace(",", ".")) * 1_000
    return float(number.replace(".", "").replace(",", "."))


def _guard_content(text: str, product: Dict[str, Any]) -> List[str]:
    flags = set()
    allowed_prices = {
        price for price in (product.get("original_price"), product.get("sale_price"))
        if isinstance(price, (int, float))
    }
    confirmed_offer = product.get("confirmed_price_offer")
    if isinstance(confirmed_offer, (int, float)):
        allowed_prices.add(confirmed_offer)
    elif isinstance(confirmed_offer, list):
        allowed_prices.update(price for price in confirmed_offer if isinstance(price, (int, float)))

    for match in _MONEY_PATTERN.finditer(text):
        try:
            price = _normalize_money(match.group(1), match.group(2))
        except ValueError:
            flags.add("PRICE_MISMATCH")
            continue
        if price not in allowed_prices:
            flags.add("PRICE_MISMATCH")
    codes = product.get("confirmed_promo_codes") or []
    allowed_codes = {str(code).strip().upper() for code in codes} if isinstance(codes, list) else set()
    if any(match.group(0).upper() not in allowed_codes for match in _PROMO_PATTERN.finditer(text)):
        flags.add("UNCONFIRMED_PROMO_CODE")

    facts = product.get("verified_facts") or product.get("description") or []
    if isinstance(facts, str):
        facts = [facts]
    normalized_facts = [str(fact).lower() for fact in facts]
    normalized_text = text.lower()
    for claim in _PROHIBITED_CLAIMS:
        if claim in normalized_text and not any(claim in fact for fact in normalized_facts):
            flags.add("PROHIBITED_CLAIM")
    for pattern in _UNVERIFIED_CLAIM_PATTERNS:
        match = pattern.search(normalized_text)
        if match and not any(match.group(0) in fact for fact in normalized_facts):
            flags.add("PROHIBITED_CLAIM")
    return sorted(flags)


@app.get("/health")
def health():
    """Non-sensitive health check; does not expose filenames or credentials."""
    rag = get_rag()
    return {"status": "ok", "loaded_chunks": len(rag.chunks)}


@app.post("/rag/search", response_model=RagSearchResponse)
def search_knowledge(
    request: RagSearchRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    _check_api_key(x_api_key)
    rag = get_rag()

    query = " ".join(
        value.strip()
        for value in (request.product_name, request.location, request.target_audience)
        if value and value.strip()
    )
    chunks = rag.retrieve(query, top_k=request.top_k)

    sources = [
        {
            "title": chunk["title"],
            "section": chunk["section"],
            "source": chunk["source"],
            "content": chunk["content"],
        }
        for chunk in chunks
    ]

    if chunks:
        context = "\n\n".join(
            f"--- NGUỒN RAG #{index} ---\n"
            f"Tiêu đề: {chunk['title']}\n"
            f"Mục: {chunk['section']}\n"
            f"Tệp nguồn: {chunk['source']}\n\n"
            f"{chunk['content']}"
            for index, chunk in enumerate(chunks, start=1)
        )
    else:
        context = (
            "Không tìm thấy kiến thức RAG phù hợp. "
            "Chỉ sử dụng dữ liệu đã được merchant xác nhận."
        )

    return {
        "query": query,
        "found": bool(chunks),
        "context": context,
        "sources": sources,
    }


@app.post("/campaigns/enrich")
def enrich_campaign(
    request: CampaignWebhookRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    """Resolve a Supabase campaign INSERT payload into verified campaign/product context for n8n."""
    _check_api_key(x_api_key)
    raw_campaign_id = request.record.get("id")
    try:
        campaign_id = UUID(str(raw_campaign_id))
    except (TypeError, ValueError, AttributeError) as exc:
        raise HTTPException(status_code=422, detail="Webhook record.id must be a valid campaign UUID.") from exc

    try:
        supabase = get_supabase()
        campaign_response = (
            supabase.table("campaigns")
            .select("*")
            .eq("id", str(campaign_id))
            .maybe_single()
            .execute()
        )
        campaign_row = campaign_response.data
        if not campaign_row:
            raise HTTPException(
                status_code=404,
                detail="Campaign was not found in the Supabase project configured for Python.",
            )

        product_id = campaign_row.get("product_id") or request.record.get("product_id")
        if not product_id:
            raise HTTPException(status_code=422, detail="Campaign has no linked product_id.")

        product_response = (
            supabase.table("products")
            .select("*")
            .eq("id", str(product_id))
            .maybe_single()
            .execute()
        )
        product_row = product_response.data
        if not product_row:
            raise HTTPException(
                status_code=404,
                detail="The campaign's product was not found in the Supabase project configured for Python.",
            )

        merchant_id = product_row.get("merchant_id") or campaign_row.get("merchant_id")
        merchant_row = None
        if merchant_id:
            merchant_response = (
                supabase.table("merchants")
                .select("*")
                .eq("id", str(merchant_id))
                .maybe_single()
                .execute()
            )
            merchant_row = merchant_response.data
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not enrich campaign from Supabase")
        raise HTTPException(
            status_code=502,
            detail="Could not read campaign/product from Supabase. Check Python service logs and its Supabase credentials.",
        ) from exc

    product_name = product_row.get("name") or product_row.get("product_name") or ""
    location = (
        campaign_row.get("target_location")
        or product_row.get("location")
        or product_row.get("destination")
        or ""
    )
    target_audience = campaign_row.get("target_audience") or ""
    merchant_name = (merchant_row or {}).get("name") or (merchant_row or {}).get("merchant_name") or ""
    booking_url = product_row.get("booking_url") or product_row.get("payment_url") or ""
    verified_facts = product_row.get("description") or product_row.get("verified_facts") or ""

    try:
        rag_context = get_rag().get_grounded_context(
            product_name=product_name,
            location=location,
            target_audience=target_audience,
            top_k=3,
        )
    except Exception:
        logger.exception("RAG lookup failed while enriching campaign")
        rag_context = "Không truy xuất được RAG; chỉ sử dụng dữ liệu sản phẩm đã xác minh."

    return {
        "status": "ok",
        "campaign_id": str(campaign_id),
        "campaign": {**request.record, **campaign_row},
        "product": {
            **product_row,
            "product_id": str(product_id),
            "product_name": product_name,
            "merchant_name": merchant_name,
            "location": location,
            "target_audience": target_audience,
            "verified_facts": verified_facts,
            "confirmed_price_offer": product_row.get("sale_price") or product_row.get("original_price"),
            "official_booking_url": booking_url,
        },
        "rag": {"context": rag_context},
    }


@app.post("/contents/batch", response_model=SaveCampaignContentsResponse, status_code=201)
def save_campaign_contents(
    request: SaveCampaignContentsRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    """Idempotently persist one BE2 persona batch after server-side guardrails."""
    _check_contents_api_key(x_api_key)

    persona = request.records[0].persona
    if any(draft.persona != persona for draft in request.records):
        raise HTTPException(status_code=422, detail="A batch must contain exactly one persona.")
    for index, draft in enumerate(request.records):
        assets = (draft.script, draft.caption, draft.cta)
        has_any_asset = any(value is not None for value in assets)
        has_all_assets = all(value is not None for value in assets)
        if index < 5 and not has_all_assets:
            raise HTTPException(status_code=422, detail="Rows 1-5 must include script, caption and cta.")
        if index >= 5 and has_any_asset and not has_all_assets:
            raise HTTPException(
                status_code=422,
                detail="Rows 6-10 must either include script, caption and cta together or contain only a hook.",
            )

    try:
        supabase = get_supabase()
        campaign_response = (
            supabase.table("campaigns")
            .select("id,product_id")
            .eq("id", str(request.campaign_id))
            .maybe_single()
            .execute()
        )
        campaign = campaign_response.data
    except Exception as exc:
        logger.exception("Could not load campaign before saving contents")
        raise HTTPException(
            status_code=502,
            detail="Could not verify campaign in Supabase. Check Python service logs.",
        ) from exc

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign was not found in Supabase.")
    if not campaign.get("product_id"):
        raise HTTPException(status_code=422, detail="Campaign has no linked product_id.")

    product_id = campaign["product_id"]
    try:
        product_response = (
            supabase.table("products")
            .select("*")
            .eq("id", str(product_id))
            .maybe_single()
            .execute()
        )
        product = product_response.data
    except Exception as exc:
        logger.exception("Could not load verified product before guardrail validation")
        raise HTTPException(status_code=502, detail="Could not load verified product for content guardrails.") from exc
    if not product:
        raise HTTPException(status_code=404, detail="Campaign product was not found in Supabase.")

    generated_text_parts = []
    for draft in request.records:
        generated_text_parts.extend(
            value for value in (draft.hook, _format_script(draft.script), draft.caption, draft.cta)
            if value
        )
    guardrail_flags = _guard_content("\\n".join(generated_text_parts), product)
    persistence_status = "needs_review" if guardrail_flags else "approved"

    rows = [
        {
            "campaign_id": str(request.campaign_id),
            "product_id": str(product_id),
            "persona": draft.persona,
            "hook": draft.hook,
            "script": _format_script(draft.script),
            "caption": draft.caption,
            "cta": draft.cta,
            "status": persistence_status,
            "generation_key": f"{request.campaign_id}:{persona}:{index}",
        }
        for index, draft in enumerate(request.records)
    ]

    try:
        supabase.table("contents").upsert(
            rows, on_conflict="generation_key", ignore_duplicates=True
        ).execute()
        keys = [row["generation_key"] for row in rows]
        response = (
            supabase.table("contents")
            .select("id,generation_key")
            .in_("generation_key", keys)
            .execute()
        )
    except Exception as exc:
        logger.exception("Idempotent Supabase upsert into public.contents failed")
        raise HTTPException(
            status_code=502,
            detail="Supabase could not save contents. Apply the contents generation_key unique-index migration and check service logs.",
        ) from exc

    saved_rows = response.data or []
    if len(saved_rows) != len(rows):
        raise HTTPException(status_code=502, detail="Could not verify all 10 persisted content rows.")
    return {
        "campaign_id": request.campaign_id,
        "product_id": product_id,
        "inserted_count": len(saved_rows),
        "content_ids": [row["id"] for row in saved_rows if row.get("id")],
        "status": persistence_status,
        "flags": guardrail_flags,
    }

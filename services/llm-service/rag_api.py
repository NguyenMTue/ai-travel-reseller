"""Small authenticated HTTP API that exposes the local travel RAG to n8n."""

import os
import secrets
import logging
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

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


class ContentDraft(BaseModel):
    """One complete AI draft row; IDs and review state are assigned by the API."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    persona: Literal["local_guide", "family", "foodie", "budget_traveler"]
    hook: str = Field(min_length=1, max_length=200)
    script: str = Field(min_length=1, max_length=10000)
    caption: str = Field(min_length=1, max_length=5000)
    cta: str = Field(min_length=1, max_length=1000)


class SaveCampaignContentsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    campaign_id: UUID
    records: List[ContentDraft] = Field(min_length=1, max_length=20)


class SaveCampaignContentsResponse(BaseModel):
    campaign_id: UUID
    product_id: UUID
    inserted_count: int
    content_ids: List[UUID]


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
    """Insert complete campaign drafts into public.contents for reseller review.

    The API derives product_id from the persisted campaign and always marks new
    rows NEEDS_REVIEW. Supabase credentials remain on this server.
    """
    _check_contents_api_key(x_api_key)

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
    rows = [
        {
            "campaign_id": str(request.campaign_id),
            "product_id": str(product_id),
            "persona": draft.persona,
            "hook": draft.hook,
            "script": draft.script,
            "caption": draft.caption,
            "cta": draft.cta,
            "status": "NEEDS_REVIEW",
        }
        for draft in request.records
    ]

    try:
        response = supabase.table("contents").insert(rows).execute()
    except Exception as exc:
        logger.exception("Supabase insert into public.contents failed")
        raise HTTPException(
            status_code=502,
            detail="Supabase could not save content rows. Check Python service logs and contents permissions/schema.",
        ) from exc

    saved_rows = response.data or []
    return {
        "campaign_id": request.campaign_id,
        "product_id": product_id,
        "inserted_count": len(saved_rows),
        "content_ids": [row["id"] for row in saved_rows if row.get("id")],
    }

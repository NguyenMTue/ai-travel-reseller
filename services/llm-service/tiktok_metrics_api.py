"""Internal API for registering TikTok video URLs for metric collection."""

import hmac
import os
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from postgrest.exceptions import APIError

from db import get_supabase
from tiktok_metrics import extract_video_id


router = APIRouter(prefix="/tiktok/metrics", tags=["TikTok metrics"])
ENGAGEMENT_SCORE_FORMULA = "((likes + comments) / views) * 100; 0 when views = 0"


class TrackVideoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    reseller_id: UUID
    video_url: str = Field(min_length=20, max_length=1000)
    content_id: Optional[UUID] = None


def _authorize(provided_key: Optional[str]) -> None:
    expected_key = os.getenv("TIKTOK_METRICS_API_KEY", "").strip()
    if len(expected_key) < 32:
        raise HTTPException(status_code=503, detail="TIKTOK_METRICS_API_KEY is not configured.")
    if not provided_key or not hmac.compare_digest(provided_key, expected_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


@router.post("/posts", status_code=status.HTTP_202_ACCEPTED)
def register_post(
    request: TrackVideoRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    _authorize(x_api_key)
    authorized_reseller_id = os.getenv("TIKTOK_METRICS_RESELLER_ID", "").strip()
    if not authorized_reseller_id:
        raise HTTPException(status_code=503, detail="TIKTOK_METRICS_RESELLER_ID is not configured.")
    if str(request.reseller_id) != authorized_reseller_id:
        raise HTTPException(status_code=403, detail="TikTok connection is not mapped to this reseller.")
    try:
        video_id = extract_video_id(request.video_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    client = get_supabase()
    if request.content_id:
        content_rows = (
            client.table("contents")
            .select("id,reseller_id")
            .eq("id", str(request.content_id))
            .limit(1)
            .execute()
            .data
            or []
        )
        if not content_rows or content_rows[0].get("reseller_id") != authorized_reseller_id:
            raise HTTPException(status_code=422, detail="content_id không thuộc Reseller đang liên kết TikTok.")
    existing = (
        client.table("tiktok_video_posts")
        .select("id,status,latest_views,latest_likes,latest_comments,latest_shares,last_synced_at")
        .eq("reseller_id", str(request.reseller_id))
        .eq("tiktok_video_id", video_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing:
        return {"created": False, "post": existing[0]}

    row = {
        "reseller_id": str(request.reseller_id),
        "content_id": str(request.content_id) if request.content_id else None,
        "tiktok_video_id": video_id,
        "video_url": request.video_url,
        "status": "pending",
    }
    try:
        inserted = client.table("tiktok_video_posts").insert(row).execute().data or []
    except APIError as exc:
        if getattr(exc, "code", None) == "23503":
            raise HTTPException(status_code=422, detail="reseller_id hoặc content_id không tồn tại.") from exc
        if getattr(exc, "code", None) == "23505":
            raise HTTPException(status_code=409, detail="Video này đã được đăng ký.") from exc
        raise HTTPException(status_code=502, detail="Không lưu được yêu cầu theo dõi vào Supabase.") from exc
    if not inserted:
        raise HTTPException(status_code=502, detail="Supabase không trả về bản ghi vừa tạo.")
    return {"created": True, "post": inserted[0]}


@router.get("/posts/{post_id}")
def get_post_status(
    post_id: UUID,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    _authorize(x_api_key)
    rows = (
        get_supabase().table("tiktok_video_posts")
        .select("id,reseller_id,content_id,tiktok_video_id,video_url,status,latest_views,latest_likes,latest_comments,latest_shares,engagement_score,last_synced_at,next_sync_at,failure_count,last_error")
        .eq("id", str(post_id))
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Không tìm thấy video đang theo dõi.")
    return {"post": rows[0], "engagement_score_formula": ENGAGEMENT_SCORE_FORMULA}


@router.post("/sync")
def sync_due_posts(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    """Run one bounded sync batch; intended for a scheduler such as n8n."""
    _authorize(x_api_key)
    from tiktok_metrics_worker import sync_due_videos

    result = sync_due_videos()
    return {
        "status": "ok" if result["failed"] == 0 else "partial",
        "engagement_score_formula": ENGAGEMENT_SCORE_FORMULA,
        **result,
    }

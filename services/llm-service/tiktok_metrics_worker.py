"""Poll queued TikTok videos and persist metric snapshots in Supabase."""

import logging
import time
from datetime import datetime, timedelta, timezone

from db import get_supabase
from tiktok_metrics import fetch_video_metrics


logger = logging.getLogger("tiktok_metrics_worker")
MAX_FAILURES = 5
MAX_BACKOFF_MINUTES = 360
PAGE_SIZE = 100
TIKTOK_BATCH_SIZE = 20


def calculate_engagement_score(views: int, likes: int, comments: int) -> float:
    """Engagement rate (%) = (likes + comments) / views * 100; zero views gives 0."""
    if views <= 0:
        return 0.0
    return round(((likes + comments) / views) * 100, 4)


def sync_due_videos() -> dict:
    client = get_supabase()
    now = datetime.now(timezone.utc)
    rows = (
        client.table("tiktok_video_posts")
        .select("id,tiktok_video_id,status,next_sync_at,failure_count,latest_views,latest_likes,latest_comments,latest_shares,engagement_score")
        .in_("status", ["pending", "active"])
        .order("next_sync_at")
        .limit(PAGE_SIZE)
        .execute()
        .data
        or []
    )

    due_rows = []
    skipped = 0
    for row in rows:
        due_at = datetime.fromisoformat(str(row["next_sync_at"]).replace("Z", "+00:00"))
        if due_at > now:
            skipped += 1
        else:
            due_rows.append(row)

    synced = 0
    failed = 0
    for offset in range(0, len(due_rows), TIKTOK_BATCH_SIZE):
        batch = due_rows[offset:offset + TIKTOK_BATCH_SIZE]
        try:
            metrics = fetch_video_metrics([str(row["tiktok_video_id"]) for row in batch])
            metrics_by_id = {metric["tiktok_video_id"]: metric for metric in metrics}
        except Exception as exc:
            metrics_by_id = {}
            batch_error = exc
        else:
            batch_error = None

        for row in batch:
            try:
                values = metrics_by_id.get(str(row["tiktok_video_id"]))
                if batch_error:
                    raise batch_error
                if not values:
                    raise RuntimeError("Video không được TikTok trả về. Video có thể không thuộc tài khoản đã kết nối.")
                old_values = (
                    row.get("latest_views"), row.get("latest_likes"),
                    row.get("latest_comments"), row.get("latest_shares"), row.get("engagement_score"),
                )
                new_values = (values["views"], values["likes"], values["comments"], values["shares"])
                engagement_score = calculate_engagement_score(
                    values["views"], values["likes"], values["comments"]
                )
                update = {
                    "status": "active",
                    "latest_views": values["views"],
                    "latest_likes": values["likes"],
                    "latest_comments": values["comments"],
                    "latest_shares": values["shares"],
                    "engagement_score": engagement_score,
                    "last_synced_at": now.isoformat(),
                    "next_sync_at": (now + timedelta(minutes=15)).isoformat(),
                    "failure_count": 0,
                    "last_error": None,
                }
                client.table("tiktok_video_posts").update(update).eq("id", row["id"]).execute()
                if old_values != (*new_values, engagement_score):
                    client.table("tiktok_video_metric_snapshots").insert({
                        "post_id": row["id"],
                        "views": values["views"],
                        "likes": values["likes"],
                        "comments": values["comments"],
                        "shares": values["shares"],
                        "engagement_score": engagement_score,
                        "observed_at": now.isoformat(),
                    }).execute()
                synced += 1
                logger.info("Synced TikTok video %s", row["tiktok_video_id"])
            except Exception as exc:
                failures = int(row.get("failure_count") or 0) + 1
                backoff_minutes = min(15 * (2 ** (failures - 1)), MAX_BACKOFF_MINUTES)
                client.table("tiktok_video_posts").update({
                    "status": "needs_attention" if failures >= MAX_FAILURES else row["status"],
                    "failure_count": failures,
                    "last_error": str(exc)[:1000],
                    "next_sync_at": (now + timedelta(minutes=backoff_minutes)).isoformat(),
                }).eq("id", row["id"]).execute()
                failed += 1
                logger.warning("TikTok metrics sync failed for %s (%s/%s): %s", row["tiktok_video_id"], failures, MAX_FAILURES, exc)

    return {"checked": len(rows), "synced": synced, "skipped": skipped, "failed": failed}


def run_forever(interval_seconds: int = 900) -> None:
    if interval_seconds < 60:
        raise ValueError("Chu kỳ worker tối thiểu là 60 giây.")
    logger.info("TikTok metrics worker started; polling every %s seconds", interval_seconds)
    while True:
        try:
            result = sync_due_videos()
            logger.info("TikTok metrics poll result: %s", result)
        except KeyboardInterrupt:
            logger.info("TikTok metrics worker stopped")
            return
        except Exception:
            logger.exception("TikTok metrics poll failed")
        time.sleep(interval_seconds)

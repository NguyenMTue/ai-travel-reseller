"""Read public interaction counts for videos owned by the authorized TikTok user."""

import re
from urllib.parse import urlparse

import httpx

from tiktok_publisher import refresh_access_token


API_BASE = "https://open.tiktokapis.com/v2"
VIDEO_ID_PATTERN = re.compile(r"^/@[^/]+/video/(\d+)/?$")
VIDEO_FIELDS = "id,view_count,like_count,comment_count,share_count,create_time,title"
ALLOWED_TIKTOK_HOSTS = {"www.tiktok.com", "tiktok.com", "m.tiktok.com"}


def extract_video_id(video_url: str) -> str:
    """Accept canonical TikTok video URLs; short links need resolving by the submitter."""
    parsed = urlparse(video_url.strip())
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in ALLOWED_TIKTOK_HOSTS:
        raise ValueError("Cần URL HTTPS TikTok dạng https://www.tiktok.com/@ten/video/ID.")
    match = VIDEO_ID_PATTERN.fullmatch(parsed.path)
    if not match:
        raise ValueError("Không đọc được video ID. Hãy dùng URL TikTok đầy đủ dạng /@username/video/ID.")
    return match.group(1)


def fetch_video_metrics(video_ids: list[str]) -> list[dict]:
    """Query up to 20 of the connected creator's own videos using TikTok API v2."""
    if not video_ids:
        return []
    if len(video_ids) > 20:
        raise ValueError("TikTok video/query chỉ nhận tối đa 20 video ID mỗi lần gọi.")

    token = refresh_access_token()
    response = httpx.post(
        f"{API_BASE}/video/query/",
        params={"fields": VIDEO_FIELDS},
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={"filters": {"video_ids": video_ids}},
        timeout=45,
    )
    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError(f"TikTok trả về phản hồi không phải JSON (HTTP {response.status_code}).") from exc

    error = payload.get("error") or {}
    if response.is_error or error.get("code") not in (None, "ok"):
        code = error.get("code", "http_error")
        message = error.get("message", f"HTTP {response.status_code}")
        if code == "scope_not_authorized":
            raise RuntimeError("TikTok app/token chưa được cấp scope video.list; cần thêm scope và OAuth lại.")
        raise RuntimeError(f"TikTok API lỗi ({code}): {message}")

    videos = (payload.get("data") or {}).get("videos") or []
    return [
        {
            "tiktok_video_id": str(video["id"]),
            "views": int(video.get("view_count", 0)),
            "likes": int(video.get("like_count", 0)),
            "comments": int(video.get("comment_count", 0)),
            "shares": int(video.get("share_count", 0)),
            "title": video.get("title"),
        }
        for video in videos
        if video.get("id") is not None
    ]

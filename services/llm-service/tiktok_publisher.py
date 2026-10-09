"""Publish an owned video to TikTok using the official Content Posting API."""

import math
import mimetypes
import time
from pathlib import Path

import httpx

import config


API_BASE = "https://open.tiktokapis.com/v2"
CHUNK_SIZE = 10 * 1024 * 1024
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}


def _require_credentials():
    config.reload_config()
    missing = [
        name for name, value in (
            ("TIKTOK_CLIENT_KEY", config.TIKTOK_CLIENT_KEY),
            ("TIKTOK_CLIENT_SECRET", config.TIKTOK_CLIENT_SECRET),
            ("TIKTOK_REFRESH_TOKEN", config.TIKTOK_REFRESH_TOKEN),
        ) if not value
    ]
    if missing:
        raise RuntimeError(
            "Thiếu cấu hình TikTok trong file .env: " + ", ".join(missing)
            + ". Hãy xem hướng dẫn trong media/tiktok/README.md."
        )


def refresh_access_token() -> str:
    """Refresh the user token and persist rotated tokens in the ignored .env file."""
    _require_credentials()
    response = httpx.post(
        "https://open.tiktokapis.com/v2/oauth/token/",
        data={
            "client_key": config.TIKTOK_CLIENT_KEY,
            "client_secret": config.TIKTOK_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": config.TIKTOK_REFRESH_TOKEN,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    payload = response.json()
    if response.is_error or not payload.get("access_token"):
        raise RuntimeError(f"TikTok không làm mới được quyền truy cập: {payload}")

    saved = config.update_env_file(
        tiktok_access_token=payload["access_token"],
        tiktok_refresh_token=payload.get("refresh_token", config.TIKTOK_REFRESH_TOKEN),
    )
    if not saved:
        raise RuntimeError("Không lưu được token TikTok mới vào .env. Hãy kiểm tra quyền ghi file.")
    config.reload_config()
    return config.TIKTOK_ACCESS_TOKEN


def _api_post(path: str, token: str, body: dict) -> dict:
    response = httpx.post(
        f"{API_BASE}{path}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json; charset=UTF-8"},
        json=body,
        timeout=60,
    )
    payload = response.json()
    error = payload.get("error", {})
    if response.is_error or (error and error.get("code") not in (None, "ok")):
        raise RuntimeError(f"TikTok API lỗi ở {path}: {error or payload}")
    return payload.get("data", {})


def get_creator_info() -> dict:
    token = refresh_access_token()
    return _api_post("/post/publish/creator_info/query/", token, {})


def publish_video(
    video_path: str,
    caption: str,
    privacy_level: str,
    allow_comments: bool = False,
    allow_duet: bool = False,
    allow_stitch: bool = False,
    brand_content: bool = False,
    brand_organic: bool = False,
) -> dict:
    """Upload and publish one local video. API scopes and user consent are required."""
    path = Path(video_path).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Không tìm thấy video: {path}")
    if path.suffix.lower() not in VIDEO_EXTENSIONS:
        raise ValueError("Video phải có định dạng MP4, MOV hoặc WebM.")
    if not privacy_level:
        raise ValueError("Bạn phải chọn quyền riêng tư cho bài TikTok.")
    if len(caption.encode("utf-16-le")) // 2 > 2200:
        raise ValueError("Caption vượt giới hạn 2.200 ký tự UTF-16 của TikTok.")

    token = refresh_access_token()
    creator = _api_post("/post/publish/creator_info/query/", token, {})
    if privacy_level not in creator.get("privacy_level_options", []):
        raise ValueError("Mức riêng tư không nằm trong các lựa chọn hiện có của tài khoản TikTok.")
    if creator.get("creator_can_post") is False:
        raise RuntimeError("TikTok báo tài khoản hiện chưa thể đăng bài.")
    size = path.stat().st_size
    if size <= 0:
        raise ValueError("Tệp video đang rỗng.")
    chunk_size = CHUNK_SIZE
    chunk_count = max(1, math.ceil(size / chunk_size))
    post_info = {
        "title": caption,
        "privacy_level": privacy_level,
        "disable_comment": not allow_comments,
        "disable_duet": not allow_duet,
        "disable_stitch": not allow_stitch,
        "brand_content_toggle": bool(brand_content),
        "brand_organic_toggle": bool(brand_organic),
    }

    initialized = _api_post(
        "/post/publish/video/init/",
        token,
        {
            "post_info": post_info,
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": size,
                "chunk_size": chunk_size,
                "total_chunk_count": chunk_count,
            },
        },
    )
    publish_id = initialized.get("publish_id")
    upload_url = initialized.get("upload_url")
    if not publish_id or not upload_url:
        raise RuntimeError(f"TikTok không trả về thông tin tải video: {initialized}")

    with path.open("rb") as video:
        offset = 0
        while offset < size:
            block = video.read(chunk_size)
            end = offset + len(block) - 1
            upload_response = httpx.put(
                upload_url,
                content=block,
                headers={
                    "Content-Type": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                    "Content-Length": str(len(block)),
                    "Content-Range": f"bytes {offset}-{end}/{size}",
                },
                timeout=180,
            )
            if upload_response.is_error:
                raise RuntimeError(f"TikTok tải video thất bại (HTTP {upload_response.status_code}).")
            offset = end + 1

    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        state = _api_post("/post/publish/status/fetch/", token, {"publish_id": publish_id})
        status = state.get("status", "")
        if status in {"PUBLISH_COMPLETE", "SEND_TO_USER_INBOX"}:
            return {"publish_id": publish_id, "status": status, **state}
        if status in {"FAILED", "PUBLISH_FAILED"}:
            raise RuntimeError(f"TikTok không đăng được bài: {state.get('fail_reason', state)}")
        time.sleep(5)

    return {"publish_id": publish_id, "status": "PROCESSING", "message": "Đã tải lên; TikTok vẫn đang xử lý."}

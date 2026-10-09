"""One-time TikTok OAuth authorization-code flow for the local publishing app."""

import json
import secrets
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

import httpx

import config


AUTH_STATE_PATH = Path(__file__).resolve().parent / "data" / "tiktok_oauth_state.json"
AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"


def create_authorization_url() -> str:
    config.reload_config()
    missing = [
        name for name, value in (
            ("TIKTOK_CLIENT_KEY", config.TIKTOK_CLIENT_KEY),
            ("TIKTOK_REDIRECT_URI", config.TIKTOK_REDIRECT_URI),
        ) if not value
    ]
    if missing:
        raise RuntimeError("Hãy điền vào .env trước: " + ", ".join(missing))
    state = secrets.token_urlsafe(32)
    AUTH_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    AUTH_STATE_PATH.write_text(json.dumps({"state": state}), encoding="utf-8")
    params = {
        "client_key": config.TIKTOK_CLIENT_KEY,
        "scope": "video.publish",
        "response_type": "code",
        "redirect_uri": config.TIKTOK_REDIRECT_URI,
        "state": state,
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}"


def exchange_callback_url(callback_url: str) -> dict:
    config.reload_config()
    if not config.TIKTOK_CLIENT_KEY or not config.TIKTOK_CLIENT_SECRET or not config.TIKTOK_REDIRECT_URI:
        raise RuntimeError("Hãy điền TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET và TIKTOK_REDIRECT_URI vào .env.")
    if not AUTH_STATE_PATH.exists():
        raise RuntimeError("Chưa tạo liên kết đăng nhập. Chạy --tiktok-auth-start trước.")

    saved_state = json.loads(AUTH_STATE_PATH.read_text(encoding="utf-8")).get("state")
    parsed = urlparse(callback_url.strip())
    query = parse_qs(parsed.query)
    code = (query.get("code") or [None])[0]
    returned_state = (query.get("state") or [None])[0]
    error = (query.get("error_description") or query.get("error") or [None])[0]
    if error:
        raise RuntimeError(f"TikTok không cấp quyền: {error}")
    if not code or not returned_state:
        raise ValueError("Dán toàn bộ URL sau khi TikTok chuyển về địa chỉ callback; URL cần có code và state.")
    if not secrets.compare_digest(str(saved_state), str(returned_state)):
        raise ValueError("State trong callback không khớp; hãy tạo liên kết đăng nhập mới.")

    response = httpx.post(
        TOKEN_URL,
        data={
            "client_key": config.TIKTOK_CLIENT_KEY,
            "client_secret": config.TIKTOK_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": config.TIKTOK_REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    payload = response.json()
    if response.is_error or not payload.get("access_token") or not payload.get("refresh_token"):
        raise RuntimeError(f"Đổi mã OAuth lấy token thất bại: {payload}")

    if not config.update_env_file(
        tiktok_access_token=payload["access_token"],
        tiktok_refresh_token=payload["refresh_token"],
    ):
        raise RuntimeError("Không lưu được token OAuth vào .env.")
    AUTH_STATE_PATH.unlink(missing_ok=True)
    return {"open_id": payload.get("open_id"), "scope": payload.get("scope")}

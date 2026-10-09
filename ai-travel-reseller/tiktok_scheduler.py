"""Daily local scheduler for TikTok posts using videos in media/tiktok/."""

import json
import random
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from post_publisher import publish_tour_post
from tiktok_publisher import get_creator_info, publish_video


PROJECT_DIR = Path(__file__).resolve().parent
VIDEO_DIR = PROJECT_DIR / "media" / "tiktok"
STATE_PATH = PROJECT_DIR / "data" / "tiktok_daily_schedule.json"
LOCAL_TZ = timezone(timedelta(hours=7), name="Asia/Ho_Chi_Minh")
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm"}


def _read_state() -> dict:
    if not STATE_PATH.exists():
        return {}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Không đọc được lịch TikTok {STATE_PATH}: {exc}") from exc


def _write_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_path = STATE_PATH.with_suffix(".tmp")
    temp_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    temp_path.replace(STATE_PATH)


def list_videos() -> list[Path]:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    return sorted(
        path for path in VIDEO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
    )


def configure_daily_schedule(
    tour_name: str,
    post_time: str,
    privacy_level: str,
    allow_comments: bool,
    allow_duet: bool,
    allow_stitch: bool,
    brand_content: bool,
    brand_organic: bool,
) -> dict:
    try:
        datetime.strptime(post_time, "%H:%M")
    except ValueError as exc:
        raise ValueError("Giờ đăng cần theo định dạng HH:MM, ví dụ 19:30.") from exc
    if not tour_name.strip():
        raise ValueError("Cần nhập tên tour để tạo caption mỗi ngày.")
    videos = list_videos()
    if not videos:
        raise RuntimeError(f"Chưa có video. Hãy chép video của bạn vào thư mục: {VIDEO_DIR}")

    creator = get_creator_info()
    options = creator.get("privacy_level_options", [])
    if privacy_level not in options:
        raise ValueError(f"Mức riêng tư không hợp lệ. TikTok hiện cho phép: {', '.join(options)}")
    if allow_comments and creator.get("comment_disabled"):
        raise ValueError("Tài khoản TikTok đang tắt quyền bình luận.")
    if allow_duet and creator.get("duet_disabled"):
        raise ValueError("Tài khoản TikTok đang tắt quyền Duet.")
    if allow_stitch and creator.get("stitch_disabled"):
        raise ValueError("Tài khoản TikTok đang tắt quyền Stitch.")

    state = {
        "enabled": True,
        "tour_name": tour_name.strip(),
        "time": post_time,
        "timezone": "Asia/Ho_Chi_Minh",
        "privacy_level": privacy_level,
        "allow_comments": bool(allow_comments),
        "allow_duet": bool(allow_duet),
        "allow_stitch": bool(allow_stitch),
        "brand_content": bool(brand_content),
        "brand_organic": bool(brand_organic),
        "last_attempt_date": None,
        "last_video": None,
        "last_result": None,
    }
    _write_state(state)
    return state


def _choose_video(state: dict) -> Path:
    videos = list_videos()
    if not videos:
        raise RuntimeError(f"Thư viện video đang trống: {VIDEO_DIR}")
    last_video = state.get("last_video")
    choices = [path for path in videos if str(path) != last_video] or videos
    return random.choice(choices)


def _run_daily_post(state: dict, today: str) -> dict:
    video = _choose_video(state)
    generated = publish_tour_post(
        tour_name=state["tour_name"],
        platform="TikTok",
        target_audience="Khách du lịch",
        save_to_supabase=False,
    )
    result = publish_video(
        video_path=str(video),
        caption=generated.get("social_caption", ""),
        privacy_level=state["privacy_level"],
        allow_comments=state["allow_comments"],
        allow_duet=state["allow_duet"],
        allow_stitch=state["allow_stitch"],
        brand_content=state["brand_content"],
        brand_organic=state["brand_organic"],
    )
    state["last_video"] = str(video)
    state["last_result"] = {
        "date": today,
        "status": result.get("status"),
        "publish_id": result.get("publish_id"),
        "video": video.name,
    }
    return result


def run_forever(poll_seconds: int = 20) -> None:
    print("TikTok Scheduler đang chạy. Nhấn Ctrl+C để dừng.")
    print(f"Thư viện video: {VIDEO_DIR}")
    while True:
        try:
            state = _read_state()
            now = datetime.now(LOCAL_TZ)
            today = now.date().isoformat()
            if state.get("enabled") and state.get("last_attempt_date") != today:
                due = datetime.strptime(state["time"], "%H:%M").time()
                if now.time() >= due:
                    # Persist attempt first so a restart cannot duplicate a post that TikTok accepted.
                    state["last_attempt_date"] = today
                    _write_state(state)
                    try:
                        result = _run_daily_post(state, today)
                        print(f"[{now:%Y-%m-%d %H:%M}] TikTok: {result.get('status')} ({result.get('publish_id')})")
                    except Exception as exc:
                        state["last_result"] = {"date": today, "status": "FAILED", "error": str(exc)}
                        print(f"[{now:%Y-%m-%d %H:%M}] Đăng thất bại: {exc}")
                    _write_state(state)
            time.sleep(max(5, poll_seconds))
        except KeyboardInterrupt:
            print("Đã dừng TikTok Scheduler.")
            return
        except Exception as exc:
            print(f"Lỗi Scheduler: {exc}")
            time.sleep(max(5, poll_seconds))

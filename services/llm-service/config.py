import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"

def reload_config():
    """Tải lại các biến môi trường từ file .env"""
    global SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY
    global TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN, TIKTOK_REFRESH_TOKEN, TIKTOK_REDIRECT_URI
    global N8N_REVIEW_WEBHOOK_URL, N8N_WEBHOOK_TOKEN, REVIEW_SHEET_URL
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
    
    # Ưu tiên GROQ_API_KEY, fallback sang OPENAI_API_KEY nếu người dùng điền key Groq vào đó
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not groq_key and openai_key.startswith("gsk_"):
        groq_key = openai_key
    GROQ_API_KEY = groq_key
    TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "").strip()
    TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "").strip()
    TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "").strip()
    TIKTOK_REFRESH_TOKEN = os.getenv("TIKTOK_REFRESH_TOKEN", "").strip()
    TIKTOK_REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI", "").strip()
    N8N_REVIEW_WEBHOOK_URL = os.getenv("N8N_REVIEW_WEBHOOK_URL", "").strip()
    N8N_WEBHOOK_TOKEN = os.getenv("N8N_WEBHOOK_TOKEN", "").strip()
    REVIEW_SHEET_URL = os.getenv("REVIEW_SHEET_URL", "").strip()

# Nạp cấu hình lần đầu
reload_config()

def update_env_file(supabase_url: str = None, supabase_key: str = None, groq_api_key: str = None,
                    tiktok_client_key: str = None, tiktok_client_secret: str = None,
                    tiktok_access_token: str = None, tiktok_refresh_token: str = None,
                    tiktok_redirect_uri: str = None) -> bool:
    """
    Cập nhật các giá trị vào file .env một cách an toàn và tải lại cấu hình.
    """
    try:
        env_lines = []
        existing_keys = set()
        
        if ENV_PATH.exists():
            with open(ENV_PATH, "r", encoding="utf-8") as f:
                env_lines = f.readlines()

        new_values = {}
        if supabase_url is not None:
            new_values["SUPABASE_URL"] = supabase_url.strip()
        if supabase_key is not None:
            new_values["SUPABASE_KEY"] = supabase_key.strip()
        if groq_api_key is not None:
            new_values["GROQ_API_KEY"] = groq_api_key.strip()
        if tiktok_client_key is not None:
            new_values["TIKTOK_CLIENT_KEY"] = tiktok_client_key.strip()
        if tiktok_client_secret is not None:
            new_values["TIKTOK_CLIENT_SECRET"] = tiktok_client_secret.strip()
        if tiktok_access_token is not None:
            new_values["TIKTOK_ACCESS_TOKEN"] = tiktok_access_token.strip()
        if tiktok_refresh_token is not None:
            new_values["TIKTOK_REFRESH_TOKEN"] = tiktok_refresh_token.strip()
        if tiktok_redirect_uri is not None:
            new_values["TIKTOK_REDIRECT_URI"] = tiktok_redirect_uri.strip()

        updated_lines = []
        for line in env_lines:
            stripped = line.strip()
            if stripped.startswith("#") or not stripped or "=" not in stripped:
                updated_lines.append(line)
                continue
            
            key, _ = stripped.split("=", 1)
            key = key.strip()
            existing_keys.add(key)
            if key in new_values:
                updated_lines.append(f"{key}={new_values[key]}\n")
            else:
                updated_lines.append(line)

        # Thêm các key mới nếu chưa có trong file
        for k, v in new_values.items():
            if k not in existing_keys:
                updated_lines.append(f"{k}={v}\n")

        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.writelines(updated_lines)

        reload_config()
        return True
    except Exception as e:
        print(f"[config] Lỗi khi ghi file .env: {e}")
        return False

def validate_config() -> dict:
    """
    Kiểm tra xem các cấu hình có hợp lệ hoặc thiếu sót không.
    Trả về dict chứa danh sách lỗi và cảnh báo chi tiết.
    """
    reload_config()
    missing = []
    warnings = []
    info = []

    # 1. Kiểm tra file .env
    if not ENV_PATH.exists():
        warnings.append("File '.env' chưa tồn tại. Đang sử dụng biến môi trường hệ thống (nếu có).")
    else:
        info.append(f"File .env tồn tại tại: {ENV_PATH}")

    # 2. Kiểm tra SUPABASE_URL
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL: Chưa được thiết lập.")
    elif "xxxxx.supabase.co" in SUPABASE_URL:
        missing.append("SUPABASE_URL: Vẫn đang là giá trị placeholder mẫu ('xxxxx.supabase.co'). Cần thay bằng URL dự án Supabase của bạn.")
    elif not SUPABASE_URL.startswith("https://"):
        warnings.append("SUPABASE_URL: Thường bắt đầu bằng 'https://'. Vui lòng kiểm tra lại URL.")

    # 3. Kiểm tra SUPABASE_KEY
    if not SUPABASE_KEY:
        missing.append("SUPABASE_KEY: Chưa được thiết lập.")
    elif "your_service_role_key_here" in SUPABASE_KEY:
        missing.append("SUPABASE_KEY: Vẫn đang là giá trị placeholder mẫu ('your_service_role_key_here'). Cần dùng Service Role Key.")
    elif len(SUPABASE_KEY) < 20:
        warnings.append("SUPABASE_KEY: Độ dài key có vẻ quá ngắn đối với Service Role Key của Supabase.")

    # 4. Kiểm tra GROQ_API_KEY
    if not GROQ_API_KEY:
        missing.append("GROQ_API_KEY: Chưa được thiết lập.")
    elif "your_groq_api_key_here" in GROQ_API_KEY or "gsk_xxxx" in GROQ_API_KEY:
        missing.append("GROQ_API_KEY: Vẫn đang là giá trị placeholder mẫu. Hãy lấy key từ https://console.groq.com/keys.")
    elif not GROQ_API_KEY.startswith("gsk_"):
        warnings.append("GROQ_API_KEY: Key của Groq Cloud thường bắt đầu bằng tiền tố 'gsk_'.")

    tiktok_values = [TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN, TIKTOK_REFRESH_TOKEN]
    if any(tiktok_values) and not all(tiktok_values):
        warnings.append("TikTok: Cần điền đủ Client Key, Client Secret, Access Token và Refresh Token để chạy tự động.")

    is_valid = len(missing) == 0

    return {
        "valid": is_valid,
        "missing": missing,
        "warnings": warnings,
        "info": info,
        "values": {
            "SUPABASE_URL": SUPABASE_URL,
            "SUPABASE_KEY": SUPABASE_KEY,
            "GROQ_API_KEY": GROQ_API_KEY,
            "TIKTOK_CLIENT_KEY": TIKTOK_CLIENT_KEY,
            "TIKTOK_CLIENT_SECRET": TIKTOK_CLIENT_SECRET,
            "TIKTOK_ACCESS_TOKEN": TIKTOK_ACCESS_TOKEN,
            "TIKTOK_REFRESH_TOKEN": TIKTOK_REFRESH_TOKEN,
            "TIKTOK_REDIRECT_URI": TIKTOK_REDIRECT_URI
        }
    }

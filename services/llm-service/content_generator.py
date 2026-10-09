import json
import config
from groq import Groq, AuthenticationError, RateLimitError, APIConnectionError, APIError

# Danh sách model ưu tiên theo thứ tự
PREFERRED_GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


def get_groq_client(api_key: str = None) -> Groq:
    """
    Khởi tạo Groq client với kiểm tra lỗi cấu hình.
    """
    target_key = api_key or config.GROQ_API_KEY
    if not target_key:
        raise ValueError("Chưa cấu hình GROQ_API_KEY! Vui lòng điền vào file .env.")
    
    if "your_groq_api_key_here" in target_key or "gsk_xxxx" in target_key:
        raise ValueError("GROQ_API_KEY vẫn là giá trị mẫu. Vui lòng lấy key tại https://console.groq.com/keys.")

    return Groq(api_key=target_key)


def get_available_groq_model(client: Groq) -> str:
    """
    Tự động dò tìm model tốt nhất khả dụng trên tài khoản Groq hiện tại.
    """
    try:
        models_data = client.models.list().data
        available_ids = {m.id for m in models_data}

        # 1. Tìm trong danh sách ưu tiên
        for model in PREFERRED_GROQ_MODELS:
            if model in available_ids:
                return model

        # 2. Nếu không có, tìm bất kỳ model chat nào (loại trừ whisper / guard)
        for m_id in available_ids:
            if "whisper" not in m_id.lower() and "guard" not in m_id.lower():
                return m_id
    except Exception:
        pass

    return "qwen/qwen3.8-27b"


def test_groq_connection(api_key: str = None) -> dict:
    """
    Kiểm tra nhanh kết nối và tính hợp lệ của Groq API Key.
    """
    try:
        client = get_groq_client(api_key)
    except ValueError as ve:
        return {
            "success": False,
            "message": f"Cấu hình chưa hợp lệ: {ve}",
            "details": str(ve)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Không thể khởi tạo Groq Client: {e}",
            "details": str(e)
        }

    try:
        chosen_model = get_available_groq_model(client)

        # Gọi thử 1 request siêu nhỏ để kiểm tra key và model trên Groq
        response = client.chat.completions.create(
            model=chosen_model,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5
        )
        reply = response.choices[0].message.content.strip() if response.choices[0].message.content else "OK"
        return {
            "success": True,
            "message": f"Kết nối Groq thành công! Model '{chosen_model}' phản hồi siêu tốc.",
            "details": f"Model: {chosen_model} | Trả lời: '{reply}'"
        }
    except AuthenticationError as auth_err:
        return {
            "success": False,
            "message": "API Key của Groq không chính xác hoặc đã bị thu hồi.",
            "details": f"AuthenticationError: {str(auth_err)}"
        }
    except RateLimitError as rate_err:
        return {
            "success": False,
            "message": "Tài khoản Groq bị giới hạn lượt gọi (Rate limit) hoặc hết quota.",
            "details": f"RateLimitError: {str(rate_err)}"
        }
    except APIConnectionError as conn_err:
        return {
            "success": False,
            "message": "Lỗi kết nối mạng tới máy chủ Groq. Vui lòng kiểm tra kết nối internet hoặc Proxy/VPN.",
            "details": f"APIConnectionError: {str(conn_err)}"
        }
    except APIError as api_err:
        return {
            "success": False,
            "message": f"Lỗi từ Groq API: {api_err.message}",
            "details": f"APIError: {str(api_err)}"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Lỗi không xác định khi gọi Groq: {str(e)}",
            "details": str(e)
        }


from rag_engine import get_rag


def generate_content(product_name: str, price: str, location: str, target_audience: str, language: str = "vi", api_key: str = None, use_rag: bool = True) -> dict:
    """
    Sinh nội dung bán hàng cho 1 sản phẩm du lịch sử dụng Groq kết hợp RAG tri thức du lịch thực tế.
    """
    client = get_groq_client(api_key)
    model = get_available_groq_model(client)

    # 1. Truy xuất tri thức thực tế từ RAG Engine
    rag_context = ""
    if use_rag:
        try:
            rag_context = get_rag().get_grounded_context(
                product_name=product_name,
                location=location,
                target_audience=target_audience,
                top_k=2
            )
        except Exception as e:
            print(f"[RAG Cảnh báo] Không thể lấy tri thức: {e}")

    # 2. Xây dựng prompt có chứa tri thức RAG được kiểm chứng
    rag_section = ""
    if rag_context:
        rag_section = f"""
=== KHO TRI THỨC THỰC TẾ ĐƯỢC XÁC THỰC (RAG KNOWLEDGE) ===
{rag_context}
===========================================================
"""

    prompt = f"""
Bạn là chuyên gia content marketing du lịch tại Đà Nẵng / Hội An.
Tạo nội dung bán hàng cho sản phẩm:
- Tên sản phẩm: {product_name}
- Giá: {price}
- Địa điểm: {location}
- Đối tượng: {target_audience}
- Ngôn ngữ: {language}
{rag_section}
Yêu cầu trả về đúng định dạng JSON sau (mỗi mục viết súc tích, ngắn gọn để tối ưu độ dài):

{{
  "hooks": ["hook ngắn 1", "hook ngắn 2", "hook ngắn 3"],
  "scripts": ["script video ngắn 1", "script video ngắn 2"],
  "captions": ["caption ngắn 1", "caption ngắn 2"],
  "ctas": ["cta ngắn 1", "cta ngắn 2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}}

Quy tắc bắt buộc (RAG Grounding):
- Sử dụng địa danh hoặc mẹo có trong KHO TRI THỨC ở trên.
- Viết cô đọng, cuốn hút chuẩn TikTok/Reels, không giải thích dài dòng.
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia content du lịch Việt Nam. Chỉ trả về JSON hợp lệ."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=950,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content
        if not raw_content:
            raise ValueError("Groq trả về phản hồi rỗng.")

        parsed_json = json.loads(raw_content)

        # Kiểm tra các khóa bắt buộc trong JSON
        required_keys = ["hooks", "scripts", "captions", "ctas", "hashtags"]
        for k in required_keys:
            if k not in parsed_json:
                parsed_json[k] = []

        return parsed_json

    except AuthenticationError as e:
        raise PermissionError(f"[Groq Auth] API Key không hợp lệ: {e}") from e
    except RateLimitError as e:
        raise RuntimeError(f"[Groq RateLimit] Vượt giới hạn yêu cầu: {e}") from e
    except APIConnectionError as e:
        raise ConnectionError(f"[Groq Network] Lỗi kết nối mạng tới Groq: {e}") from e
    except json.JSONDecodeError as e:
        raise ValueError(f"[JSON Decode] Không thể đọc JSON do AI trả về: {e}\nNội dung gốc: {raw_content}") from e
    except Exception as e:
        raise RuntimeError(f"[Groq Lỗi khác] {str(e)}") from e


# Tương thích ngược nếu code cũ gọi tên OpenAI
test_openai_connection = test_groq_connection
get_openai_client = get_groq_client

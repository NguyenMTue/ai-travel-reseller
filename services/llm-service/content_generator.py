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


def generate_review_script_45s(tour_name: str, location: str, price: str = "Ưu đãi", highlights: str = "", target_audience: str = "Khách du lịch trẻ", api_key: str = None) -> dict:
    """
    [BE1-W6-01] Sinh kịch bản video review du lịch 40–50s chuẩn TikTok (cấu trúc 4 phân cảnh)
    Scene 1 (0s–7s) - The Hook
    Scene 2 (7s–25s) - Trải nghiệm thực tế
    Scene 3 (25s–38s) - Chi phí & Giá vé ưu đãi (QR code vào cổng)
    Scene 4 (38s–48s) - CTA đặt vé & nhận voucher độc quyền
    """
    client = get_groq_client(api_key)
    model = get_available_groq_model(client)

    prompt = f"""
Bạn là đạo diễn kịch bản review du lịch TikTok chuyên nghiệp cho kênh TravelLink AI.
Hãy viết kịch bản video review 40–50 giây (tổng ~100-110 từ đọc truyền cảm) cho tour sau:
- Tên tour / Điểm đến: {tour_name}
- Địa điểm: {location}
- Giá vé / Gói: {price}
- Điểm nổi bật: {highlights or 'Check-in cảnh đẹp, cáp treo, trải nghiệm ẩm thực đặc sắc'}
- Đối tượng người xem: {target_audience}

Cấu trúc kịch bản bắt buộc gồm đúng 4 Scene sau:
1. Scene 1 (0s-7s) - The Hook: Câu mở đầu kích thích tò mò, hình ảnh ấn tượng nhất.
2. Scene 2 (7s-25s) - Trải nghiệm thực tế: Kể 2-3 điểm nhấn không thể bỏ qua, góc chụp ảnh triệu view.
3. Scene 3 (25s-38s) - Chi phí & Vé vào cổng: Tiết lộ giá vé ưu đãi, quét QR Code vào cổng ngay không phải xếp hàng.
4. Scene 4 (38s-48s) - Kêu gọi hành động (CTA): Kêu gọi bấm link bio đối tác TravelLink để nhận voucher độc quyền.

Yêu cầu định dạng JSON trả về:
{{
  "title": "Review chi tiết {tour_name}",
  "target_duration_sec": 46,
  "caption": "Caption ngắn TikTok kèm hashtag hấp dẫn",
  "scenes": [
    {{
      "scene_number": 1,
      "role": "HOOK",
      "duration_seconds": 7,
      "time_range": "00:00 - 00:07",
      "visual_tag": "aerial_wide_scenic",
      "b_roll_description": "Toàn cảnh góc rộng từ trên cao ấn tượng",
      "voiceover_text": "Lời thoại mở đầu 15-18 từ...",
      "overlay_text": "Tiêu đề chữ lớn đập vào mắt"
    }},
    {{
      "scene_number": 2,
      "role": "EXPERIENCE",
      "duration_seconds": 18,
      "time_range": "00:07 - 00:25",
      "visual_tag": "human_pov_checkin",
      "b_roll_description": "Trải nghiệm cận cảnh check-in và ẩm thực",
      "voiceover_text": "Lời thoại trải nghiệm 40-45 từ...",
      "overlay_text": "3 Góc Check-in Triệu View"
    }},
    {{
      "scene_number": 3,
      "role": "PRICING_AND_QR",
      "duration_seconds": 13,
      "time_range": "00:25 - 00:38",
      "visual_tag": "ticket_qr_entry",
      "b_roll_description": "Cổng vào quét mã QR nhanh gọn, bảng giá vé",
      "voiceover_text": "Lời thoại giá vé 25-30 từ...",
      "overlay_text": "Vé QR Vào Cổng Không Cần Xếp Hàng"
    }},
    {{
      "scene_number": 4,
      "role": "CTA",
      "duration_seconds": 8,
      "time_range": "00:38 - 00:46",
      "visual_tag": "cta_voucher_bio",
      "b_roll_description": "Màn hình hướng dẫn bấm link bio nhận mã giảm giá",
      "voiceover_text": "Lời thoại kêu gọi 15-20 từ...",
      "overlay_text": "Bấm Link Bio Nhận Voucher Ngay"
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia biên kịch video du lịch TikTok Việt Nam. Luôn trả về đúng chuẩn JSON yêu cầu."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1200,
            response_format={"type": "json_object"}
        )
        raw_content = response.choices[0].message.content
        return json.loads(raw_content)
    except Exception as e:
        # Fallback an toàn nếu Groq gặp sự cố mạng
        return {
            "title": f"Review Chi Tiết: {tour_name}",
            "target_duration_sec": 46,
            "caption": f"Khám phá trọn vẹn {tour_name} tại {location}! Quét mã QR vào cổng không cần xếp hàng. #TravelLink #{location.replace(' ', '')} #DuLichVietNam",
            "scenes": [
                {
                    "scene_number": 1,
                    "role": "HOOK",
                    "duration_seconds": 7,
                    "time_range": "00:00 - 00:07",
                    "visual_tag": "aerial_wide_scenic",
                    "b_roll_description": f"Toàn cảnh {tour_name} hùng vĩ trong ánh bình minh rực rỡ.",
                    "voiceover_text": f"Đến {location} mà chưa ghé {tour_name} thì chuyến đi của bạn chắc chắn chưa trọn vẹn đâu!",
                    "overlay_text": f"TỔNG HỢP KINH NGHIỆM ĐI {tour_name.upper()}"
                },
                {
                    "scene_number": 2,
                    "role": "EXPERIENCE",
                    "duration_seconds": 18,
                    "time_range": "00:07 - 00:25",
                    "visual_tag": "human_pov_checkin",
                    "b_roll_description": f"Góc check-in tuyệt đẹp, trải nghiệm không gian và dịch vụ đẳng cấp.",
                    "voiceover_text": f"Tại đây, bạn sẽ được tận hưởng không gian tuyệt mỹ, vô số góc sống ảo triệu view cùng nhiều hoạt động vui chơi giải trí hấp dẫn phù hợp cho cả gia đình và bạn bè.",
                    "overlay_text": "GÓC CHECK-IN TRIỆU VIEW"
                },
                {
                    "scene_number": 3,
                    "role": "PRICING_AND_QR",
                    "duration_seconds": 13,
                    "time_range": "00:25 - 00:38",
                    "visual_tag": "ticket_qr_entry",
                    "b_roll_description": "Thao tác quét mã QR điện tử tại cổng vào nhanh chóng, không phải chen lấn.",
                    "voiceover_text": f"Giá vé chỉ từ {price}, đặt online nhận ngay vé điện tử QR Code quét thẳng vào cổng không cần chờ đợi xếp hàng.",
                    "overlay_text": "VÉ QR VÀO CỔNG TỨC THÌ"
                },
                {
                    "scene_number": 4,
                    "role": "CTA",
                    "duration_seconds": 8,
                    "time_range": "00:38 - 00:46",
                    "visual_tag": "cta_voucher_bio",
                    "b_roll_description": "Nhấp link liên kết đối tác nhận ưu đãi độc quyền.",
                    "voiceover_text": "Nhấp ngay vào liên kết bên dưới để săn mã giảm giá độc quyền từ đối tác chính thức nhé!",
                    "overlay_text": "ĐẶT VÉ CHÍNH HÃNG NGAY"
                }
            ]
        }


# Tương thích ngược nếu code cũ gọi tên OpenAI
test_openai_connection = test_groq_connection
get_openai_client = get_groq_client

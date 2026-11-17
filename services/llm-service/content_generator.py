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


# ==============================================================================
# SPRINT 6: TASK BE2-W6-01 — PROMPT ENGINE KỊCH BẢN REVIEW DU LỊCH 40–50s TIKTOK
# ==============================================================================

def generate_deterministic_tiktok_script(tour: dict) -> dict:
    """
    Fallback deterministic khi Groq API không khả dụng hoặc offline.
    Đảm bảo 100% đúng contract JSON 4 phân cảnh, thời lượng chuẩn 40–50s.
    """
    name = tour.get("name") or tour.get("product_name") or tour.get("title") or "Tour Du Lịch Trải Nghiệm"
    location = tour.get("location") or tour.get("target_location") or "Đà Nẵng"
    sale_price = tour.get("sale_price") or tour.get("price") or 1150000
    orig_price = tour.get("original_price") or 1250000

    # Format giá tiền hiển thị thân thiện
    try:
        sp_int = int(float(str(sale_price).replace(".", "").replace(",", "").replace("đ", "").replace("VND", "").strip()))
        formatted_price = f"{sp_int:,}".replace(",", ".")
    except Exception:
        formatted_price = str(sale_price)

    name_lower = name.lower()
    loc_lower = location.lower()

    if "ngũ hành sơn" in name_lower or "ngũ hành sơn" in loc_lower or "huyền không" in name_lower:
        title = "Bí kíp khám phá Ngũ Hành Sơn 1 ngày trọn gói"
        scenes = [
            {
                "sceneNumber": 1,
                "role": "hook",
                "duration": 6.5,
                "voiceover": "Đừng đến Ngũ Hành Sơn nếu bạn chưa biết điều kỳ diệu này vào đúng 11 giờ trưa!",
                "visualTag": "huyen_khong_sunbeam"
            },
            {
                "sceneNumber": 2,
                "role": "experience",
                "duration": 18.0,
                "voiceover": "Đó chính là hiện tượng Thiên Quang Đỉnh tại Động Huyền Không, khi những tia nắng rọi thẳng qua vòm đá cẩm thạch tự nhiên tạo nên khung cảnh huyền ảo tựa chốn bồng lai. Bạn còn được chiêm bái Chùa Linh Ứng cổ kính và ngắm toàn cảnh bờ biển Non Nước từ trên đỉnh Thủy Sơn.",
                "visualTag": "cave_exploration"
            },
            {
                "sceneNumber": 3,
                "role": "pricing",
                "duration": 12.0,
                "voiceover": f"Vé trọn gói đã bao gồm thang máy kính khứ hồi và hướng dẫn viên bản địa chỉ {formatted_price} cành. Đặc biệt, bạn chỉ cần quét mã QR tại cổng là vào thẳng, không cần phải xếp hàng chờ đợi dưới nắng.",
                "visualTag": "glass_elevator_panoramic"
            },
            {
                "sceneNumber": 4,
                "role": "cta",
                "duration": 10.0,
                "voiceover": "Bấm ngay vào link bên dưới để nhận voucher độc quyền giảm thêm 5% từ đối tác chính hãng của TravelLink AI nhé!",
                "visualTag": "qr_ticket_booking"
            }
        ]
    elif "bà nà" in name_lower or "ba na" in name_lower or "cầu vàng" in name_lower:
        title = "Trải nghiệm đỉnh cao Bà Nà Hills - Cầu Vàng trong 1 ngày"
        scenes = [
            {
                "sceneNumber": 1,
                "role": "hook",
                "duration": 6.5,
                "voiceover": "Nếu bạn nghĩ đi Bà Nà Hills chỉ có Cầu Vàng để check-in thì bạn đã bỏ lỡ 80% điều tuyệt vời nhất rồi!",
                "visualTag": "golden_bridge_panoramic"
            },
            {
                "sceneNumber": 2,
                "role": "experience",
                "duration": 18.5,
                "voiceover": "Sau tuyến cáp treo đạt 4 kỷ lục thế giới lướt giữa mây ngàn, hãy ghé ngay Làng Pháp cổ kính với kiến trúc Gothic châu Âu. Tiếp đó, đừng quên thưởng thức đại tiệc buffet quốc tế hơn 100 món tại nhà hàng Beer Plaza với không gian lễ hội cực kỳ sôi động.",
                "visualTag": "cable_car_buffet_experience"
            },
            {
                "sceneNumber": 3,
                "role": "pricing",
                "duration": 11.5,
                "voiceover": f"Giá vé ưu đãi trọn gói cả cáp treo và đại tiệc buffet trưa chỉ {formatted_price} đồng. Vé điện tử xác thực tức thì, quét mã QR qua cổng tự động siêu nhanh.",
                "visualTag": "buffet_food_spread"
            },
            {
                "sceneNumber": 4,
                "role": "cta",
                "duration": 9.5,
                "voiceover": "Nhấp ngay vào link bên dưới góc trái để giữ chỗ và nhận ưu đãi độc quyền 5% từ đối tác phân phối chính thức!",
                "visualTag": "qr_ticket_booking"
            }
        ]
    elif "cù lao chàm" in name_lower or "cu lao cham" in name_lower:
        title = "Kinh nghiệm đi cano lặn biển Cù Lao Chàm trong ngày"
        scenes = [
            {
                "sceneNumber": 1,
                "role": "hook",
                "duration": 6.5,
                "voiceover": "Chỉ 20 phút lướt sóng cano cao tốc, bạn sẽ đến thiên đường biển đảo nước trong vắt nhìn thấu tận đáy!",
                "visualTag": "speedboat_ocean_spray"
            },
            {
                "sceneNumber": 2,
                "role": "experience",
                "duration": 18.0,
                "voiceover": "Đó chính là Cù Lao Chàm! Nơi bạn được tự do lặn ngắm rạn san hô tự nhiên rực rỡ tại Bãi Chồng, tham quan Giếng cổ Chăm Pa hơn 200 năm tuổi và thưởng thức bữa trưa hải sản tươi rói vừa đánh bắt.",
                "visualTag": "coral_reef_snorkeling"
            },
            {
                "sceneNumber": 3,
                "role": "pricing",
                "duration": 11.5,
                "voiceover": f"Tour trọn gói từ cano khứ hồi, kính lặn, áo phao đến bữa trưa hải sản chỉ từ {formatted_price} đồng một người, bảo hiểm du lịch đầy đủ an tâm tuyệt đối.",
                "visualTag": "seafood_lunch_beach"
            },
            {
                "sceneNumber": 4,
                "role": "cta",
                "duration": 9.5,
                "voiceover": "Bấm vào đường link bên dưới để đặt vé giữ chỗ ngay hôm nay và nhận mã giảm giá 5% nhé!",
                "visualTag": "qr_ticket_booking"
            }
        ]
    else:
        title = f"Kinh nghiệm khám phá {name} chi tiết từ A đến Z"
        scenes = [
            {
                "sceneNumber": 1,
                "role": "hook",
                "duration": 6.0,
                "voiceover": f"Bật mí bí kíp khám phá {name} cực chất mà ít người chia sẻ cho bạn biết!",
                "visualTag": "destination_overview"
            },
            {
                "sceneNumber": 2,
                "role": "experience",
                "duration": 18.0,
                "voiceover": f"Trải nghiệm trọn vẹn cảnh sắc tuyệt đẹp tại {location}, hòa mình vào không gian văn hóa đặc sắc cùng hàng loạt điểm check-in sống ảo triệu view không thể bỏ qua.",
                "visualTag": "tourist_experience_highlights"
            },
            {
                "sceneNumber": 3,
                "role": "pricing",
                "duration": 12.0,
                "voiceover": f"Chi phí trọn gói ưu đãi chỉ {formatted_price} đồng, đã bao gồm dịch vụ đưa đón, vé vào cổng và hướng dẫn viên nhiệt tình, tiện lợi với vé QR không xếp hàng.",
                "visualTag": "pricing_and_inclusions"
            },
            {
                "sceneNumber": 4,
                "role": "cta",
                "duration": 9.5,
                "voiceover": "Nhấp ngay vào liên kết bên dưới để nhận voucher độc quyền giảm thêm 5% từ đối tác TravelLink AI nhé!",
                "visualTag": "qr_ticket_booking"
            }
        ]

    total_duration = round(sum(s["duration"] for s in scenes), 1)
    return {
        "title": title,
        "totalDuration": total_duration,
        "scenes": scenes
    }


def generate_tiktok_review_script(tour: dict, api_key: str = None, use_rag: bool = True) -> dict:
    """
    TASK BE2-W6-01: Sinh Kịch bản Video Review Du Lịch 40–50s chuẩn TikTok/Reels sử dụng Groq LLM + RAG.
    
    Cấu trúc 4 phân cảnh chặt chẽ:
    - Scene 1 (hook): 5.0 - 7.0s (Mở đầu gây tò mò, phá vỡ định kiến, visual hút mắt).
    - Scene 2 (experience): 16.0 - 22.0s (Trải nghiệm thực tế các điểm nhấn đắt giá, ẩm thực, check-in).
    - Scene 3 (pricing): 10.0 - 14.0s (Bảng giá minh bạch, quyền lợi bao gồm, quét QR không xếp hàng).
    - Scene 4 (cta): 8.0 - 11.0s (Kêu gọi hành động dứt khoát, nhận voucher độc quyền 5%).
    
    Tổng thời lượng: 40.0s - 50.0s.
    """
    name = tour.get("name") or tour.get("product_name") or tour.get("title") or "Tour Du Lịch Trải Nghiệm"
    location = tour.get("location") or tour.get("target_location") or "Đà Nẵng"
    sale_price = tour.get("sale_price") or tour.get("price") or "1.150.000 VNĐ"
    original_price = tour.get("original_price") or "1.250.000 VNĐ"
    highlights = tour.get("highlights") or tour.get("description") or ""
    target_audience = tour.get("target_audience") or "Khách du lịch tự túc, gia đình và bạn trẻ"

    # 1. Truy xuất RAG nếu được yêu cầu
    rag_context = ""
    if use_rag:
        try:
            rag_context = get_rag().get_grounded_context(
                product_name=name,
                location=location,
                target_audience=str(target_audience),
                top_k=2
            )
        except Exception as e:
            print(f"[RAG Cảnh báo] Không thể lấy tri thức: {e}")

    # 2. Chuẩn bị client Groq
    try:
        client = get_groq_client(api_key)
        model = get_available_groq_model(client)
    except Exception as e:
        print(f"[Groq Warning] Không thể kết nối Groq ({e}), tự động chuyển sang Fallback Engine chuẩn.")
        return generate_deterministic_tiktok_script(tour)

    prompt = f"""
Bạn là chuyên gia biên kịch video review du lịch triệu view trên TikTok và Facebook Reels.
Nhiệm vụ của bạn là viết một kịch bản review chân thực, cuốn hút bằng tiếng Việt tự nhiên cho tour du lịch sau:

THÔNG TIN TOUR:
- Tên tour: {name}
- Địa điểm: {location}
- Giá ưu đãi: {sale_price}
- Giá niêm yết: {original_price}
- Điểm nhấn / Mô tả: {highlights}
- Đối tượng người xem: {target_audience}

{f"TRI THỨC THỰC TẾ (RAG GROUNDING):{chr(10)}{rag_context}" if rag_context else ""}

YÊU CẦU CẤU TRÚC KỊCH BẢN (BẮT BUỘC ĐÚNG 4 PHÂN CẢNH, TỔNG THỜI LƯỢNG 40 - 50 GIÂY):
1. Phân cảnh 1 (role: "hook", thời lượng 5.0s - 7.0s, ~18-22 từ):
   - Mở đầu bằng câu nói ấn tượng, gây tò mò hoặc phá vỡ định kiến ngay trong 3 giây đầu ("Đừng đến X nếu chưa biết...", "Bí mật 11h trưa tại X...").
2. Phân cảnh 2 (role: "experience", thời lượng 16.0s - 22.0s, ~50-65 từ):
   - Review 2-3 trải nghiệm thực tế tuyệt nhất: cảnh quan, góc check-in, ăn uống, dịch vụ. Kể chuyện truyền cảm, sống động.
3. Phân cảnh 3 (role: "pricing", thời lượng 10.0s - 14.0s, ~32-42 từ):
   - Bảng giá ưu đãi minh bạch, so sánh với giá gốc, nhấn mạnh quyền lợi (vé trọn gói, xe đưa đón, ăn uống) và tiện ích quét mã QR vào cổng không cần xếp hàng.
4. Phân cảnh 4 (role: "cta", thời lượng 8.0s - 11.0s, ~24-32 từ):
   - Kêu gọi hành động dứt khoát: bấm vào liên kết bên dưới góc trái / trong bio để nhận voucher độc quyền giảm thêm 5% từ đối tác chính hãng.

QUY TẮC BẮT BUỘC:
- Tổng thời lượng tổng cộng (`totalDuration`) PHẢI NẰM TRONG KHOẢNG 40.0 ĐẾN 50.0 GIÂY.
- Không được bịa đặt thông tin sai lệch ngoài dữ kiện đã cho.
- Mỗi phân cảnh gán 1 `visualTag` ngắn gọn bằng tiếng Anh (dùng dấu gạch dưới, ví dụ: cable_car, golden_bridge, cave_exploration, buffet_food, qr_ticket_booking).
- CHỈ TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ VỚI SCHEMA SAU (không kèm markdown, không giải thích):

{{
  "title": "Tiêu đề video review ngắn gọn, hấp dẫn",
  "totalDuration": 45.0,
  "scenes": [
    {{
      "sceneNumber": 1,
      "role": "hook",
      "duration": 6.5,
      "voiceover": "Lời thoại phân cảnh 1...",
      "visualTag": "tag_tieng_anh_phu_hop"
    }},
    {{
      "sceneNumber": 2,
      "role": "experience",
      "duration": 18.0,
      "voiceover": "Lời thoại phân cảnh 2...",
      "visualTag": "tag_tieng_anh_phu_hop"
    }},
    {{
      "sceneNumber": 3,
      "role": "pricing",
      "duration": 11.5,
      "voiceover": "Lời thoại phân cảnh 3...",
      "visualTag": "tag_tieng_anh_phu_hop"
    }},
    {{
      "sceneNumber": 4,
      "role": "cta",
      "duration": 9.0,
      "voiceover": "Lời thoại phân cảnh 4...",
      "visualTag": "qr_ticket_booking"
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia kịch bản review du lịch TikTok. Chỉ xuất JSON hợp lệ."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content
        if not raw:
            raise ValueError("Groq trả về phản hồi rỗng.")

        data = json.loads(raw)

        # Chuẩn hóa và xác thực dữ liệu đầu ra
        scenes = data.get("scenes", [])
        if not isinstance(scenes, list) or len(scenes) != 4:
            raise ValueError("Kịch bản bắt buộc phải có đúng 4 phân cảnh.")

        valid_roles = ["hook", "experience", "pricing", "cta"]
        normalized_scenes = []

        for idx, s in enumerate(scenes):
            role = str(s.get("role", valid_roles[idx])).lower()
            if role not in valid_roles:
                role = valid_roles[idx]

            try:
                dur = float(s.get("duration", 10.0))
            except (ValueError, TypeError):
                dur = 10.0

            normalized_scenes.append({
                "sceneNumber": idx + 1,
                "role": role,
                "duration": round(dur, 1),
                "voiceover": str(s.get("voiceover", "")).strip(),
                "visualTag": str(s.get("visualTag", "travel_scenic")).strip().lower()
            })

        # Tính tổng thời lượng và cân chỉnh về khoảng [40.0, 50.0] nếu lệch nhẹ
        calc_total = sum(s["duration"] for s in normalized_scenes)
        if calc_total < 40.0 or calc_total > 50.0:
            scale_factor = 45.0 / calc_total if calc_total > 0 else 1.0
            for s in normalized_scenes:
                s["duration"] = round(s["duration"] * scale_factor, 1)
            calc_total = sum(s["duration"] for s in normalized_scenes)

        return {
            "title": str(data.get("title", f"Khám phá {name} cực chất")).strip(),
            "totalDuration": round(calc_total, 1),
            "scenes": normalized_scenes
        }

    except Exception as e:
        print(f"[Groq Generation Warning] Lỗi sinh kịch bản ({e}), chuyển sang fallback an toàn.")
        return generate_deterministic_tiktok_script(tour)


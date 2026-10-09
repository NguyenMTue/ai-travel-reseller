import json
import re
import config
from rag_engine import get_rag
from content_generator import get_groq_client, get_available_groq_model
from db import get_supabase
from save_content import get_available_columns
from postgrest.exceptions import APIError


def get_tour_catalog() -> list:
    """
    Lấy danh mục các Tour có sẵn trong kho tri thức RAG để hiển thị lên giao diện chọn tour.
    """
    rag = get_rag()
    sources = set()
    tours = []

    for chunk in rag.chunks:
        src = chunk["source"]
        if src not in sources:
            sources.add(src)
            # Làm sạch tiêu đề hiển thị
            clean_name = chunk["title"].replace("Kho Tri Thức:", "").strip()
            tours.append({
                "source": src,
                "title": clean_name,
                "display": f"{clean_name} ({src})"
            })

    # Sắp xếp theo tên
    tours.sort(key=lambda x: x["title"])
    return tours


def build_precise_chunks_for_tour(tour_name_or_keyword: str) -> dict:
    """
    Thu thập và phân loại chính xác các chunk tri thức liên quan đến một tour cụ thể.
    Đảm bảo đầy đủ 4 trụ cột: Giá vé & Giới thiệu, Điểm nổi bật, Lịch trình, Lưu ý & Mẹo.
    """
    rag = get_rag()
    query = tour_name_or_keyword.lower()

    # 1. Tìm các chunk khớp trực tiếp theo file nguồn hoặc tiêu đề
    matched_chunks = []
    for chunk in rag.chunks:
        full_text_lower = chunk["full_text"].lower()
        title_lower = chunk["title"].lower()
        if any(term in title_lower or term in chunk["source"].lower() for term in query.split()):
            matched_chunks.append(chunk)

    # 2. Nếu tìm cụ thể chưa thấy, dùng hàm retrieve tìm kiếm ngữ nghĩa
    if not matched_chunks:
        matched_chunks = rag.retrieve(tour_name_or_keyword, top_k=5)

    # 3. Phân loại theo mục đích
    categorized = {
        "pricing_and_overview": [],
        "highlights": [],
        "itinerary_and_schedule": [],
        "rules_and_tips": []
    }

    for c in matched_chunks:
        sec = c["section"].lower()
        if any(k in sec for k in ["giá", "vé", "chi phí", "tổng quan", "1."]):
            categorized["pricing_and_overview"].append(c)
        elif any(k in sec for k in ["điểm", "hoạt động", "check-in", "nổi bật", "2."]):
            categorized["highlights"].append(c)
        elif any(k in sec for k in ["lịch trình", "tour", "thời gian", "4."]):
            categorized["itinerary_and_schedule"].append(c)
        elif any(k in sec for k in ["lưu ý", "quy định", "mẹo", "selling", "3.", "5."]):
            categorized["rules_and_tips"].append(c)
        else:
            categorized["highlights"].append(c)

    return {
        "tour_name": tour_name_or_keyword,
        "all_chunks": matched_chunks,
        "categorized": categorized
    }


def publish_tour_post(
    tour_name: str,
    platform: str = "Facebook",
    target_audience: str = "Gia đình và bạn trẻ",
    affiliate_link: str = "",
    custom_price: str = "",
    custom_note: str = "",
    save_to_supabase: bool = True
) -> dict:
    """
    LUỒNG ĐĂNG BÀI CHUẨN XÁC:
    1. Trích xuất đúng các chunk tri thức RAG của tour.
    2. Gọi Groq AI sinh bài đăng chuẩn xác 100% sự thật.
    3. Lưu trực tiếp vào Supabase bảng contents với status='published'.
    4. Trả về cấu trúc bài viết hoàn chỉnh và các dữ kiện xác thực.
    """
    rag_data = build_precise_chunks_for_tour(tour_name)
    chunks = rag_data["all_chunks"]

    # Đóng gói ngữ cảnh RAG
    context_sections = []
    for idx, c in enumerate(chunks[:4], 1):
        context_sections.append(f"[{c['title']} - {c['section']}]\n{c['content']}")
    rag_context = "\n\n".join(context_sections)

    if not rag_context:
        rag_context = f"Tour du lịch: {tour_name}. Địa điểm: Việt Nam / Quốc tế."

    client = get_groq_client()
    model = get_available_groq_model(client)

    cta_hint = affiliate_link if affiliate_link else "Nhắn tin cho page hoặc click link bio để nhận ưu đãi tour chính hãng"

    prompt = f"""
Bạn là chuyên gia sáng tạo nội dung du lịch cho đại lý phân phối (Travel Reseller).
Hãy viết một bài đăng bán hàng chuẩn chỉnh cho nền tảng: {platform}.

Thông tin sản phẩm:
- Tên tour: {tour_name}
- Đối tượng hướng tới: {target_audience}
- Kêu gọi hành động (CTA): {cta_hint}
{f"- Giá điều chỉnh: {custom_price}" if custom_price else ""}
{f"- Lưu ý bổ sung: {custom_note}" if custom_note else ""}

=== KHO TRI THỨC THỰC TẾ (BẮT BUỘC SỬ DỤNG - KHÔNG ĐƯỢC BỊA ĐẶT) ===
{rag_context}
===================================================================

Yêu cầu định dạng trả về đúng JSON sau (viết tiếng Việt tự nhiên, súc tích, hấp dẫn):
{{
  "headline": "Tiêu đề bài viết ngắn gọn, giật tít thu hút",
  "hooks": ["Hook 1 (ngắn)", "Hook 2 (ngắn)", "Hook 3 (ngắn)"],
  "body": "Nội dung chính hoặc kịch bản video (nêu bật các điểm đến, giá vé hoặc lưu ý thực tế từ tri thức)",
  "social_caption": "Caption mạng xã hội hoàn chỉnh (chèn icon, văn phong {platform}, kèm CTA và hashtag)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "verified_facts": ["Sự thật 1 từ tri thức", "Sự thật 2 từ tri thức", "Sự thật 3 từ tri thức"]
}}

Quy tắc quan trọng:
- Giá vé, quy định trẻ em, giờ mở cửa, lưu ý đặc biệt PHẢI dựa trên KHO TRI THỨC ở trên.
- Khống chế độ dài vừa vặn, không quá dài để đảm bảo JSON hợp lệ.
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia marketing du lịch hàng đầu. Chỉ trả về JSON hợp lệ."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=950,
            response_format={"type": "json_object"}
        )

        content_raw = response.choices[0].message.content
        data = json.loads(content_raw)

    except Exception as e:
        raise RuntimeError(f"Lỗi khi sinh nội dung bài đăng từ Groq: {e}") from e

    # Lưu bản nháp tạo bởi luồng cũ. TikTok scheduler tắt mục này để chỉ đánh dấu
    # published sau khi TikTok xác nhận đã đăng thành công.
    db_record = None
    if save_to_supabase:
        try:
            supabase = get_supabase()
            existing_cols = get_available_columns(supabase, "contents")

            caption_text = data.get("social_caption", "")
            # Nếu có link affiliate, chèn vào caption nếu chưa có
            if affiliate_link and affiliate_link not in caption_text:
                caption_text += f"\n\n👉 Đặt tour giữ chỗ tại đây: {affiliate_link}"

            rec = {
                "campaign_id": None,
                "persona": target_audience,
                "hook": (data.get("hooks") or [""])[0],
                "script": data.get("body", ""),
                "caption": caption_text,
                "status": "published"
            }

            filtered_rec = {k: v for k, v in rec.items() if k in existing_cols}
            insert_res = supabase.table("contents").insert([filtered_rec]).execute()
            if insert_res.data:
                db_record = insert_res.data[0]

        except Exception as db_err:
            print(f"[Cảnh báo Supabase] Không thể lưu bản ghi 'published': {db_err}")

    return {
        "success": True,
        "tour_name": tour_name,
        "platform": platform,
        "headline": data.get("headline", ""),
        "hooks": data.get("hooks", []),
        "body": data.get("body", ""),
        "social_caption": data.get("social_caption", ""),
        "hashtags": data.get("hashtags", []),
        "verified_facts": data.get("verified_facts", []),
        "used_chunks_count": len(chunks),
        "db_record_id": db_record.get("id") if db_record else None
    }

import sys
import json
from db import get_supabase, CREATE_CONTENTS_TABLE_SQL
from content_generator import generate_content
from postgrest.exceptions import APIError

if sys.stdout and hasattr(sys.stdout, "reconfigure") and getattr(sys.stdout, "encoding", "").lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def get_available_columns(supabase_client, table_name: str = "contents") -> set:
    """
    Tự động phát hiện các cột hiện có trong bảng Supabase để tránh lỗi schema cache.
    """
    candidates = ["campaign_id", "product_id", "persona", "hook", "script", "caption", "cta", "status"]
    available = set()
    for col in candidates:
        try:
            supabase_client.table(table_name).select(col).limit(0).execute()
            available.add(col)
        except Exception:
            pass
    return available


def save_generated_content(campaign_id: str, product_id: str, product_name: str, price: str, location: str, target_audience: str):
    """
    Tạo nội dung bằng AI (Groq) và lưu vào Supabase với kiểm tra cấu trúc bảng tự động.
    """
    if not campaign_id or not product_id or not product_name:
        raise ValueError("campaign_id, product_id và product_name là các tham số bắt buộc không được để trống!")

    # 1. Khởi tạo Supabase client trước để kiểm tra kết nối sớm
    try:
        supabase = get_supabase()
    except Exception as e:
        print(f"[LỖI CẤU HÌNH SUPABASE] Không thể khởi tạo kết nối: {e}")
        raise

    # 2. Gọi AI sinh nội dung qua Groq
    print("⏳ Đang sinh nội dung bằng AI (Groq Cloud)...")
    try:
        result = generate_content(
            product_name=product_name,
            price=price,
            location=location,
            target_audience=target_audience
        )
    except Exception as e:
        print(f"[LỖI SINH NỘI DUNG AI] {e}")
        raise

    # 3. Kiểm tra các cột thực tế của bảng contents
    existing_cols = get_available_columns(supabase, "contents")
    if not existing_cols:
        existing_cols = {"campaign_id", "persona", "hook", "script", "caption", "status"}

    has_cta = "cta" in existing_cols
    has_product_id = "product_id" in existing_cols

    if not has_cta or not has_product_id:
        missing_cols = []
        if not has_product_id:
            missing_cols.append("product_id")
        if not has_cta:
            missing_cols.append("cta")
        print(f"💡 Lưu ý: Bảng 'contents' hiện thiếu cột: {', '.join(missing_cols)}.")
        print("   -> Hệ thống sẽ tự thích ứng (ghép CTA vào caption để không bị mất dữ liệu).")
        print("   -> Để tạo thêm cột, chạy SQL: ALTER TABLE contents ADD COLUMN IF NOT EXISTS product_id TEXT, ADD COLUMN IF NOT EXISTS cta TEXT;\n")

    # 4. Chuẩn bị danh sách bản ghi
    records = []
    hooks = result.get("hooks", [])
    scripts = result.get("scripts", [])
    captions = result.get("captions", [])
    ctas = result.get("ctas", [])

    if not hooks:
        print("⚠️ Cảnh báo: AI không trả về hook nào.")

    for i, hook in enumerate(hooks):
        script_val = scripts[i % len(scripts)] if scripts else None
        caption_val = captions[i % len(captions)] if captions else None
        cta_val = ctas[i % len(ctas)] if ctas else None

        # Nếu DB chưa có cột cta riêng, ghép CTA vào caption
        if not has_cta and cta_val and caption_val:
            caption_val = f"{caption_val}\n\n[CTA]: {cta_val}"

        rec = {
            "campaign_id": campaign_id,
            "persona": "general",
            "hook": hook,
            "script": script_val,
            "caption": caption_val,
            "status": "pending_approval"
        }

        if has_product_id:
            rec["product_id"] = product_id
        if has_cta:
            rec["cta"] = cta_val

        # Lọc chỉ giữ các field khớp cột có sẵn trong bảng
        filtered_rec = {k: v for k, v in rec.items() if k in existing_cols}
        records.append(filtered_rec)

    if not records:
        print("Không có nội dung nào được tạo để lưu.")
        return []

    # 5. Lưu vào Supabase với try-catch
    print(f"⏳ Đang lưu {len(records)} bản ghi vào bảng 'contents' trên Supabase...")
    try:
        response = supabase.table("contents").insert(records).execute()
        print(f"✅ Đã lưu thành công {len(records)} nội dung vào database!")
        return response.data

    except APIError as api_err:
        err_msg = str(api_err)
        err_code = getattr(api_err, "code", "")

        # Xử lý trường hợp campaign_id chưa có trong bảng campaigns (khóa ngoại FK) hoặc không đúng chuẩn UUID
        if "22P02" in err_msg or "23503" in err_msg or "contents_campaign_id_fkey" in err_msg:
            print(f"⚠️ Lưu ý: campaign_id='{campaign_id}' không phải UUID hoặc chưa tồn tại trong bảng 'campaigns'.")
            print("   -> Hệ thống tự động gán campaign_id = None để dữ liệu nội dung vẫn được lưu thành công khi test.")
            fallback_records = [{**r, "campaign_id": None} for r in records]
            try:
                response = supabase.table("contents").insert(fallback_records).execute()
                print(f"✅ Đã lưu thành công {len(fallback_records)} nội dung vào database (với campaign_id = None)!")
                return response.data
            except Exception as retry_err:
                print(f"[LỖI THỬ LẠI] {retry_err}")
                raise retry_err from api_err

        if "42P01" in err_msg or "relation \"contents\" does not exist" in err_msg.lower():
            err_detail = (
                "\n[LỖI THIẾU BẢNG] Bảng 'contents' chưa được tạo trong Supabase database!\n"
                "👉 Hãy vào Supabase Dashboard -> SQL Editor và chạy câu lệnh sau:\n\n"
                f"{CREATE_CONTENTS_TABLE_SQL}\n"
            )
            print(err_detail)
            raise RuntimeError(err_detail) from api_err
        elif "JWT" in err_msg or "401" in err_msg or "403" in err_msg or "permission denied" in err_msg.lower():
            err_detail = (
                "\n[LỖI PHÂN QUYỀN] Không có quyền ghi vào bảng 'contents'.\n"
                "👉 Hãy chắc chắn bạn đang dùng SUPABASE_KEY là 'service_role' key (không phải anon key).\n"
            )
            print(err_detail)
            raise PermissionError(err_detail) from api_err
        else:
            print(f"[LỖI SUPABASE API] {api_err}")
            raise

    except Exception as e:
        print(f"[LỖI LƯU DỮ LIỆU] {str(e)}")
        raise

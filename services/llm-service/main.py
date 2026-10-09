import os
import sys
import argparse
import config
from db import test_supabase_connection
from content_generator import test_groq_connection
from save_content import save_generated_content
from rag_engine import get_rag
from post_publisher import publish_tour_post, get_tour_catalog
from tiktok_scheduler import configure_daily_schedule, run_forever, VIDEO_DIR
from tiktok_publisher import get_creator_info
from tiktok_auth import create_authorization_url, exchange_callback_url

if sys.stdout and hasattr(sys.stdout, "reconfigure") and getattr(sys.stdout, "encoding", "").lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_cli_diagnostics():
    print("=" * 65)
    print("🚀 AI TRAVEL RESELLER: CHẨN ĐOÁN HỆ THỐNG & KHO TRI THỨC RAG")
    print("=" * 65)

    # 1. Kiểm tra cấu hình .env
    print("\n[1/4] Kiểm tra file .env & cấu hình:")
    val = config.validate_config()
    for info in val["info"]:
        print(f"  ✓ {info}")
    if val["missing"]:
        for m in val["missing"]:
            print(f"  ❌ {m}")
    else:
        print("  ✅ Các biến môi trường bắt buộc đã được cung cấp.")
    if val["warnings"]:
        for w in val["warnings"]:
            print(f"  ⚠️  {w}")

    # 2. Kiểm tra Supabase
    print("\n[2/4] Kiểm tra kết nối Supabase:")
    sb_res = test_supabase_connection()
    if sb_res["success"]:
        print(f"  ✅ {sb_res['message']}")
    else:
        print(f"  ❌ {sb_res['message']}")

    # 3. Kiểm tra Groq
    print("\n[3/4] Kiểm tra kết nối Groq Cloud API:")
    groq_res = test_groq_connection()
    if groq_res["success"]:
        print(f"  ✅ {groq_res['message']}")
    else:
        print(f"  ❌ {groq_res['message']}")

    # 4. Kiểm tra RAG Engine
    print("\n[4/4] Kiểm tra Kho Tri Thức RAG (Local Knowledge Base):")
    rag = get_rag()
    chunk_count = len(rag.chunks)
    if chunk_count > 0:
        sources = list({c['source'] for c in rag.chunks})
        print(f"  ✅ RAG Engine đã nạp {chunk_count} đoạn tri thức từ {len(sources)} tài liệu.")
    else:
        print("  ⚠️  Kho tri thức RAG hiện đang trống (thư mục knowledge/).")

    print("\n" + "=" * 65)
    print("💡 Mẹo sử dụng:")
    print("  - Chạy Studio Đăng Bài GUI:     python gui.py")
    print("  - Đăng bài nhanh qua CLI:       python main.py --post \"Bà Nà Hills\"")
    print("  - Xem danh mục Tour có sẵn:     python main.py --tours")
    print("  - Tra cứu tri thức RAG:         python main.py --rag-test \"Ai Cập\"")
    print("=" * 65)


def main():
    parser = argparse.ArgumentParser(description="AI Travel Reseller CLI & RAG Publishing Studio")
    parser.add_argument("--gui", action="store_true", help="Mở giao diện đồ họa Studio Đăng Bài GUI")
    parser.add_argument("--post", type=str, help="Tạo và đăng bài chuẩn xác cho tour (VD: --post 'Bà Nà Hills')")
    parser.add_argument("--platform", type=str, default="Facebook", help="Nền tảng đăng bài (Facebook, TikTok, Zalo)")
    parser.add_argument("--audience", type=str, default="Gia đình và bạn trẻ", help="Đối tượng khách hàng")
    parser.add_argument("--tours", action="store_true", help="Liệt kê danh sách tất cả các tour trong kho RAG")
    parser.add_argument("--rag-test", type=str, help="Tra cứu các đoạn tri thức RAG theo từ khóa")
    parser.add_argument("--test-all", action="store_true", help="Chạy thử nghiệm tạo nội dung với RAG và lưu Supabase")
    parser.add_argument("--tiktok-schedule-daily", type=str, metavar="HH:MM", help="Thiết lập giờ đăng TikTok mỗi ngày (giờ Việt Nam)")
    parser.add_argument("--tiktok-tour", type=str, help="Tên tour dùng để tạo caption mỗi ngày")
    parser.add_argument("--tiktok-worker", action="store_true", help="Chạy bộ hẹn giờ TikTok; cần để cửa sổ này hoạt động")
    parser.add_argument("--tiktok-auth-start", action="store_true", help="Tạo liên kết đăng nhập và cấp quyền TikTok lần đầu")
    parser.add_argument("--tiktok-auth-finish", action="store_true", help="Hoàn tất OAuth bằng cách dán URL callback TikTok")
    args = parser.parse_args()

    if args.gui:
        import gui
        gui.main()
        return

    if args.tiktok_auth_start:
        try:
            print("Mở liên kết dưới đây trong trình duyệt, đăng nhập TikTok và cấp quyền video.publish:")
            print(create_authorization_url())
            print("Sau khi TikTok chuyển về URL callback đã đăng ký, sao chép toàn bộ URL đó.")
            print("Tiếp theo chạy: python main.py --tiktok-auth-finish")
        except (RuntimeError, OSError) as exc:
            parser.error(str(exc))
        return

    if args.tiktok_auth_finish:
        try:
            callback = input("Dán toàn bộ URL callback TikTok: ").strip()
            result = exchange_callback_url(callback)
            print("Đã lưu OAuth tokens an toàn trong .env.")
            print(f"TikTok Open ID: {result.get('open_id') or '(không có)'}")
            print(f"Quyền được cấp: {result.get('scope') or '(TikTok không trả về)'}")
        except (RuntimeError, ValueError, OSError) as exc:
            parser.error(str(exc))
        return

    if args.tiktok_schedule_daily:
        if not args.tiktok_tour:
            parser.error("Dùng --tiktok-tour để nhập tên tour khi thiết lập lịch TikTok.")
        try:
            creator = get_creator_info()
            print(f"Tài khoản TikTok: {creator.get('creator_nickname', '(không rõ tên)')}")
            options = creator.get("privacy_level_options", [])
            if not options:
                raise RuntimeError("TikTok không trả về lựa chọn quyền riêng tư.")
            print("Chọn quyền riêng tư:")
            for index, option in enumerate(options, 1):
                print(f"  {index}. {option}")
            choice = int(input("Nhập số lựa chọn: ").strip())
            if choice < 1 or choice > len(options):
                raise ValueError("Lựa chọn quyền riêng tư không hợp lệ.")
            comments = input("Cho phép bình luận? (y/N): ").strip().lower() == "y"
            duet = input("Cho phép Duet? (y/N): ").strip().lower() == "y"
            stitch = input("Cho phép Stitch? (y/N): ").strip().lower() == "y"
            brand_content_answer = input("Đây là nội dung quảng bá/tiếp thị cho tour của bên thứ ba hoặc có hoa hồng? (y/n): ").strip().lower()
            while brand_content_answer not in {"y", "n"}:
                brand_content_answer = input("Vui lòng nhập y hoặc n: ").strip().lower()
            brand_organic_answer = input("Đây là nội dung quảng bá doanh nghiệp của chính bạn? (y/n): ").strip().lower()
            while brand_organic_answer not in {"y", "n"}:
                brand_organic_answer = input("Vui lòng nhập y hoặc n: ").strip().lower()
            consent = input(
                "Tôi xác nhận có quyền đăng video trong thư viện và đồng ý cho lịch này tự đăng mỗi ngày. "
                "Gõ DONG Y để tiếp tục: "
            ).strip().upper()
            if consent != "DONG Y":
                print("Chưa tạo lịch đăng.")
                return
            schedule = configure_daily_schedule(
                tour_name=args.tiktok_tour,
                post_time=args.tiktok_schedule_daily,
                privacy_level=options[choice - 1],
                allow_comments=comments,
                allow_duet=duet,
                allow_stitch=stitch,
                brand_content=brand_content_answer == "y",
                brand_organic=brand_organic_answer == "y",
            )
            print(f"Đã lưu lịch đăng TikTok mỗi ngày lúc {schedule['time']} ({schedule['timezone']}).")
            print(f"Thư viện video: {VIDEO_DIR}")
            print("Bước tiếp theo: chạy python main.py --tiktok-worker và giữ máy bật, không ngủ.")
        except (ValueError, RuntimeError, OSError) as exc:
            parser.error(str(exc))
        return

    if args.tiktok_worker:
        run_forever()
        return

    if args.tours:
        tours = get_tour_catalog()
        print(f"\n📚 Danh mục {len(tours)} Tour trong Kho Tri Thức RAG:\n")
        for idx, t in enumerate(tours, 1):
            print(f"  {idx}. {t['title']} (file: {t['source']})")
        print()
        return

    if args.post:
        tour_target = args.post
        print(f"\n⏳ Đang trích xuất RAG chunks và đăng bài cho: '{tour_target}'...")
        res = publish_tour_post(
            tour_name=tour_target,
            platform=args.platform,
            target_audience=args.audience
        )
        print("\n" + "=" * 60)
        print(f"📌 TIÊU ĐỀ: {res['headline']}")
        print("=" * 60)
        print("\n🎯 HOOKS THU HÚT:")
        for i, h in enumerate(res['hooks'], 1):
            print(f"  {i}. {h}")
        print("\n📱 CAPTION MẠNG XÃ HỘI:")
        print(res['social_caption'])
        print(f"\n🏷️ HASHTAGS: {' '.join(res['hashtags'])}")
        print("\n🛡️ SỰ THẬT XÁC THỰC TỪ RAG (FACTS):")
        for f in res['verified_facts']:
            print(f"  ✓ {f}")
        print("\n" + "=" * 60)
        print(f"✅ ĐÃ LƯU SUPABASE: Status='published' | ID: {res['db_record_id']}")
        print("=" * 60 + "\n")
        return

    if args.rag_test:
        rag = get_rag()
        print(f"\n🔍 Kết quả tra cứu RAG cho từ khóa: '{args.rag_test}'\n")
        results = rag.retrieve(args.rag_test, top_k=3)
        for i, r in enumerate(results, 1):
            print(f"[{i}] {r['title']} -> {r['section']} ({r['source']})")
            print(f"    {r['content'][:200]}...\n")
        return

    if args.test_all:
        sample_product = {
            "campaign_id": "test-campaign-001",
            "product_id": "tour-ba-na-hills",
            "product_name": "Tour Bà Nà Hills trọn gói cáp treo & buffet",
            "price": "1.250.000 VNĐ",
            "location": "Đà Nẵng",
            "target_audience": "Gia đình có trẻ nhỏ"
        }
        try:
            saved = save_generated_content(**sample_product)
            print("Kết quả lưu thành công:", len(saved or []), "bản ghi.")
        except Exception as e:
            print(f"Lỗi khi chạy thử: {e}")
        return

    run_cli_diagnostics()


if __name__ == "__main__":
    main()

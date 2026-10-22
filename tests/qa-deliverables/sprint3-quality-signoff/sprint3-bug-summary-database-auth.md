# TỔNG HỢP TRẠNG THÁI BUG CUỐI SPRINT 3 — DATABASE / AUTH / STORAGE
## BÁO CÁO PHÂN LOẠI & KẾ HOẠCH XỬ LÝ LỖI DỮ LIỆU, PHÂN QUYỀN VÀ LƯU TRỮ
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Kỳ đánh giá:** Sprint 3 (Tuần 3: 16/10/2026 – 22/10/2026)  
**Người lập:** Senior QA Automation Engineer (Trương Đức Huy)  
**Đối tượng bàn giao:** Database Lead & Đội ngũ Database / Supabase Auth & Storage Developers  
**Ngày lập báo cáo:** 22/10/2026  
**Nguyên tắc thẩm định:** Chỉ tổng hợp lỗi thực tế phát sinh trên Schema, Triggers, RLS và Storage **Đã được phát triển (Nhóm A)**. Tuyệt đối không đánh giá là bug đối với các bảng/cột thuộc backlog chưa tạo (Nhóm B).

---

## 1. TỔNG QUAN TÌNH TRẠNG CHẤT LƯỢNG DATABASE / AUTH CUỐI SPRINT 3

| Tiêu chí Đánh giá | Số lượng Ghi nhận | Đánh giá từ QA Lead |
| :--- | :---: | :--- |
| **Lỗi Khẩn cấp (Critical / Blocker)** | **0 Lỗi** | **Không có lỗi rò rỉ dữ liệu (data breach), xung đột khóa chính hay sập cơ sở dữ liệu.** |
| **Lỗi Nghiêm trọng (High)** | **1 Lỗi** | Bảng `affiliate_links` thiếu cột `voucher_code` và ràng buộc Case-Insensitive Unique. |
| **Lỗi Trung bình (Medium)** | **1 Lỗi** | Thiếu bảng lưu trữ sự kiện vi mô `reseller_content_events` và chính sách RLS tương ứng. |
| **Lỗi Thấp / Rủi ro vận hành (Low / Risk)** | **3 Điểm lưu ý** | Quản lý session cookie local dev, khối lượng ghi metadata JSONB, và schema RPC. |
| **Tổng số Bug tồn đọng trên code đã phát triển** | **2 Lỗi (0 Critical, 1 High, 1 Medium)** | **ĐỦ ĐIỀU KIỆN NGHIỆM THU THEO TIẾN ĐỘ SPRINT 3 / SẴN SÀNG LIVE DEMO** |

### Các phân hệ Database / Auth đạt chuẩn 100% (Clean Pass):
1. **Bảng Thư viện Media `media_references` (`migration 20261019100000`):** Đạt **Clean Pass 100%**. Khóa ngoại ràng buộc `ON DELETE CASCADE` tới `merchants(id)`, CHECK constraint nền tảng hợp lệ, 2 chỉ mục tối ưu hóa truy vấn (`merchant_id` và `created_at DESC`), trigger tự động cập nhật `updated_at`.
2. **Chính sách Row Level Security (RLS) cho Media:** Phân quyền chuẩn xác tuyệt đối: cho phép đọc công khai (để Reseller và AI Agent truy cập tài nguyên) và chỉ cho phép Merchant cập nhật/xóa tài nguyên thuộc quyền sở hữu của chính mình.
3. **Stored Procedure RPC `get_reseller_wallet_summary`:** Tính toán ví hoa hồng Reseller từ bảng `orders` chính xác từng đồng VNĐ, chia tách đầy đủ 4 trạng thái số dư (Khả dụng, Chờ duyệt, Đã chi trả, Tổng thu nhập).
4. **Bảo vệ quyền riêng tư du khách (PII Masking theo `FR-ANA-09`):** Trường số điện thoại khách hàng được tự động che mờ (ví dụ: `0905***456`) trước khi xuất hiện trên giao diện đối soát của Reseller.

---

## 2. DANH SÁCH CHI TIẾT 2 LỖI TỒN ĐỌNG TRÊN DATABASE ĐÃ PHÁT TRIỂN

### 🔴 BUG-DB-CLIP-01: Schema bảng `affiliate_links` thiếu cột `voucher_code` và ràng buộc Unique
- **Mã Bug:** `BUG-DB-CLIP-01`
- **Mức độ nghiêm trọng:** **High** (Cản trở lưu trữ và đối soát hoa hồng qua mã voucher)
- **Mã SRS quy chiếu:** `FR-ATT-01` (Attribution & Voucher Assignment)
- **Test Case liên quan:** `TC-CLIP-03`, `TC-CLIP-05` trong `tests/clipboard-modal-tracking.spec.ts`
- **File migration liên quan:** `supabase/migrations/20261013140000_affiliate_links_and_clicks.sql` (Dòng 11 - 27)
- **Hiện tượng thực tế:** Bảng `public.affiliate_links` hiện chỉ có các cột: `id`, `reseller_id`, `campaign_id`, `product_id`, `unique_code`, `short_url`, `destination_url`, `clicks_count`, `is_active`, `created_at`, `updated_at`. Thiếu trường lưu trữ mã voucher được phân bổ cho Reseller trong chiến dịch đó.
- **Giải pháp đề xuất cho Database Dev:**
  - Soạn thảo migration bổ sung:
    ```sql
    ALTER TABLE public.affiliate_links
      ADD COLUMN voucher_code VARCHAR(32);

    -- Tạo chỉ mục duy nhất không phân biệt hoa thường (Case-Insensitive Unique)
    CREATE UNIQUE INDEX uq_affiliate_links_voucher_code_lower
      ON public.affiliate_links (LOWER(voucher_code))
      WHERE voucher_code IS NOT NULL;
    ```

---

### 🟡 BUG-DB-CLIP-02: Thiếu bảng lưu trữ sự kiện tương tác Content Kit (`reseller_content_events`)
- **Mã Bug:** `BUG-DB-CLIP-02`
- **Mức độ nghiêm trọng:** **Medium** (Thiếu cơ sở hạ tầng lưu trữ nhật ký thao tác người dùng)
- **Mã SRS quy chiếu:** `FR-RES-08` (Copy Action Telemetry)
- **Test Case liên quan:** `TC-CLIP-08` trong `tests/clipboard-modal-tracking.spec.ts`
- **Hiện tượng thực tế:** Trong cơ sở dữ liệu hiện tại, chưa có bảng để lưu trữ các hành động sao chép của Reseller (`copy_hook`, `copy_caption`, `copy_link`), khiến tầng Backend không thể ghi nhận telemetry.
- **Giải pháp đề xuất cho Database Dev:**
  - Soạn thảo migration tạo bảng:
    ```sql
    CREATE TABLE IF NOT EXISTS public.reseller_content_events (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
      content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
      event_type VARCHAR(32) NOT NULL, -- 'copy_hook', 'copy_caption', 'copy_link'
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    ALTER TABLE public.reseller_content_events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow resellers to insert own events"
      ON public.reseller_content_events FOR INSERT
      WITH CHECK (reseller_id = auth.uid());
    ```

---

## 3. CÁC ĐIỂM LƯU Ý KỸ THUẬT & AN TOÀN KHI LIVE DEMO (DATABASE INTEGRITY NOTES)

| Mã ID | Thành phần Database | Mức độ | Hiện tượng kỹ thuật | Khuyến nghị vận hành khi Demo |
| :---: | :--- | :---: | :--- | :--- |
| `RISK-DB-01` | Session Cookie Local Dev | Medium | Môi trường preview local không kết nối cloud thật có thể bị redirect login nếu vào nhầm route production. | Luôn bám sát các URL preview (`/preview/merchant`, `/preview/reseller`) đã chuẩn bị sẵn fixture. |
| `RISK-DB-02` | Bảng `clicks` & Metadata JSONB | Low | Router `/r/[code]` ghi nhận User-Agent vào JSONB bất đồng bộ. | Đã được bọc `try/catch` an toàn, ngay cả khi DB bận khách vẫn redirect thành công. |
| `RISK-DB-03` | RPC `get_reseller_wallet_summary` | Low | Hàm tổng hợp số dư từ bảng `orders` theo thời gian thực. | Đã kiểm thử validate Zod, số dư hiển thị khớp tuyệt đối từng đồng VNĐ. |

---

## 4. DANH MỤC BACKLOG CHUYỂN GIAO SANG SPRINT TIẾP THEO (KHÔNG TÍNH LÀ LỖI CỦA DB)
1. Cấu hình Bucket Supabase Storage `merchant-media` (hạn mức file 100MB, MIME types `video/mp4`, `image/jpeg`, `image/png`).
2. Migration bổ sung các trường mở rộng cho bảng `campaigns`: `ai_notes TEXT`, `target_kpi JSONB`, `allowed_claims TEXT[]`, `prohibited_claims TEXT[]`.
3. Bảng quản lý tài khoản ngân hàng và mã số thuế của Reseller (`reseller_payout_profiles`).
4. Bảng lưu trữ bài đăng khai báo và tương tác mạng xã hội (`reseller_posts`).

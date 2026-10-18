# BIÊN BẢN PHIÊN LÀM VIỆC & TÀI LIỆU ĐỒNG BỘ BE1 - BE3 (15/10/2026)
**Dự án:** AI Travel Reseller Platform (TravelLink AI)  
**Thời gian lập:** 22:30 Thứ Năm, 15/10/2026  
**Người thực hiện:** Nguyễn Minh Tuệ (BE1 Lead) & Trợ lý Antigravity  
**Đối tượng đồng bộ:** Thái Thanh Tú (BE3 Lead - AI Content Factory & n8n Automation)  
**Nhánh Git đang làm việc:** `Feature_BE3_n8n_Campaign_Content_Be1` (tách từ nhánh của BE3, đã rebase/merge `dev` mới nhất)  
**Mục đích:** Lưu trữ toàn bộ bối cảnh, các quyết định kỹ thuật đã chốt trong phiên làm việc đêm 15/10/2026, cung cấp bộ câu hỏi cụ thể để BE1 làm việc với BE3 sáng ngày 16/10/2026 và phục vụ việc tiếp tục phiên làm việc vào ngày mai.

---

## 1. TỔNG KẾT BỐI CẢNH & TRẠNG THÁI HIỆN TẠI

1. **Trạng thái nhánh & Codebase:**
   - Đã xử lý triệt để 2 lỗ hổng bảo mật: Bypass Authentication ở production (`app/api/tracking/generate/route.ts`) và Host Poisoning ở `getBaseUrl()` (`app/api/reseller/links/route.ts`, `app/api/reseller/analytics/route.ts`).
   - Đã bật Live Tracking an toàn (`isLiveTrackingEnabled() = true`) trong `src/lib/reseller/tracking-link.ts`.
   - Đã hoàn tất merge PR #17 của FE vào `dev`. Toàn bộ test suites vượt qua 100% (59/59 tracking, 41/41 merchant, 9/9 legal, 7/7 portal-auth, `tsc --noEmit` clean).
   - Đã chuyển sang nhánh `Feature_BE3_n8n_Campaign_Content_Be1` để hỗ trợ BE3 thông luồng n8n & bảng `contents`.

2. **Deadline sắp tới:**
   - **12:00 PM Thứ Sáu (16/10/2026):** Hoàn tất toàn bộ task Tuần 2.
   - **13:30 – 17:30 ngày 16/10/2026:** Cross-testing & Báo cáo Demo MVP Sprint 2 trước hội đồng/khách hàng.

---

## 2. CÁC QUYẾT ĐỊNH KỸ THUẬT ĐÃ THỐNG NHẤT

### 2.1. Về việc kết nối n8n: Cloud hay Local?
- **Quyết định:** **100% Dùng n8n Local cho Demo Tuần 2 (16/10)**; Chuyển sang **n8n Self-hosted trên VPS (Docker)** ở Tuần 3 - 4 (Production).
- **Lý do:**
  1. *Chi phí & Quota:* n8n Cloud tốn phí (~20€/tháng) và bị giới hạn 2.500 executions/tháng. n8n Local chạy bằng `npx n8n` hoặc Docker hoàn toàn miễn phí, không giới hạn lượt chạy.
  2. *Mạng & Độ trễ:* Máy demo kết nối trực tiếp `127.0.0.1:5678` và Supabase Local `127.0.0.1:54321`, không phụ thuộc vào internet chập chờn của phòng họp khi thuyết trình.
  3. *Hiện trạng code:* BE3 đã commit chuyển n8n sang local (`cc72bb2`) và script `services/llm-service/main.py --demo-n8n` đang trỏ sẵn cổng `5678`.
  4. *Lưu ý:* Nếu demo bằng Supabase Cloud, chỉ cần bật `ngrok http 5678` là xong.

---

### 2.2. Về mâu thuẫn Interface Contract bảng `contents`
Qua rà soát code giữa BE3 (`services/llm-service/save_content.py`, `main.py`) và FE (`src/lib/reseller/content-kit.ts`, `docs/Fe-update-2026-10-15.md`), phát hiện 4 điểm "lệch pha":
1. **Persona:** BE3 lưu mặc định `'general'`, trong khi FE lọc nghiêm ngặt 4 enum: `'local_guide'`, `'family'`, `'foodie'`, `'budget_traveler'` (lệch giá trị sẽ bị FE ẩn bài).
2. **Status:** BE3 lưu `'pending_approval'`, trong khi FE chỉ lọc các bài có status `'approved'` (bài chưa duyệt Reseller không thấy để copy).
3. **Campaign ID:** BE3 test CLI chỉ có `product_id` (`campaign_id = null`), trong khi FE query trang chi tiết lọc bắt buộc theo `campaign_id`.
4. **Reseller ID:** BE3 không truyền (`reseller_id = null`), điều này **đã khớp** với quy ước của FE (null = bài viết dùng chung toàn chiến dịch - Shared).

---

### 2.3. Giải pháp: Trigger Hòa Giải Tạm Thời (Temporary Reconciliation Trigger)
- **Quyết định:** Viết một **Database Trigger tạm thời** trên bảng `contents` ngay trong đêm 15/10 để đảm bảo:
  - BE3 chạy script Python/n8n cũ hay mới đều **không bị văng lỗi DB**.
  - FE load trang `/reseller/campaigns/[id]` là **thấy đủ bài viết ngay lập tức**.
- **Sau buổi báo cáo tuần (Tuần 3):** BE3 chuẩn hóa code Python/n8n theo đúng form duy nhất, sau đó BE1 chỉ cần chạy `DROP TRIGGER` là DB trở về trạng thái chuẩn hóa sạch sẽ.

---

## 3. ĐẶC TẢ KỸ THUẬT: TRIGGER TẠM THỜI & SCHEMA CONTRACT

### 3.1. DDL Migration Trigger Tạm Thời (`supabase/migrations/20261015233000_temp_contents_reconciliation.sql`)
```sql
-- GHI CHÚ: Trigger tạm thời phục vụ thông luồng Demo Tuần 2 (16/10/2026).
-- Sau khi BE3 chuẩn hóa xong dữ liệu ở tầng Python/n8n, trigger này sẽ được DROP ở Tuần 3.

CREATE OR REPLACE FUNCTION public.fn_temp_contents_reconcile()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Nếu thiếu campaign_id nhưng có product_id: Tự map vào campaign mới nhất của product đó
  IF NEW.campaign_id IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT id INTO NEW.campaign_id
    FROM public.campaigns
    WHERE product_id = NEW.product_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- 2. Nếu persona bị null hoặc là 'general': Tạm map về 'local_guide' để FE hiển thị tab đầu tiên
  IF NEW.persona IS NULL OR NEW.persona = 'general' THEN
    NEW.persona := 'local_guide';
  END IF;

  -- 3. Đảm bảo status là 'approved' để FE hiển thị ngay cho Reseller copy
  IF NEW.status IS NULL OR NEW.status IN ('pending_approval', 'NEEDS_REVIEW') THEN
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_temp_contents_reconcile ON public.contents;
CREATE TRIGGER trg_temp_contents_reconcile
BEFORE INSERT OR UPDATE ON public.contents
FOR EACH ROW
EXECUTE FUNCTION public.fn_temp_contents_reconcile();
```

### 3.2. Chuẩn Interface Contract chính thức của bảng `contents`
```typescript
interface ContentRecord {
  id: string;                    // UUID (PK)
  campaign_id: string | null;    // UUID (FK -> campaigns.id)
  product_id: string | null;     // UUID (FK -> products.id)
  reseller_id: string | null;    // UUID (null: bài dùng chung, có UUID: bài riêng của reseller)
  persona: "local_guide" | "family" | "foodie" | "budget_traveler"; // 4 enum chuẩn
  hook: string | null;           // Câu mở đầu thu hút
  script: string | null;         // Kịch bản video/audio
  caption: string | null;        // Nội dung bài đăng review/mạng xã hội
  cta: string | null;            // Lời kêu gọi hành động kèm link/affiliate placeholder
  video_url: string | null;      // Link video TikTok/Reels nếu có
  image_url: string | null;      // Link ảnh minh họa
  status: "pending_approval" | "approved" | "rejected"; // Trạng thái kiểm duyệt
  created_at: string;            // ISO Timestamp
}
```

---

## 4. BỘ CÂU HỎI & CHECKLIST ĐỒNG BỘ VỚI BE3 (THÁI THANH TÚ)

Khi gặp hoặc chat với BE3 vào sáng 16/10, BE1 hãy dùng trực tiếp danh sách câu hỏi này để chốt nhanh luồng tích hợp:

### Nhóm 1: Về Luồng Sinh Nội Dung & Webhook n8n
1. **Phương thức kích hoạt chính thức trong buổi demo là gì?**
   - *Option A:* Tự động hoàn toàn (Khi tạo Campaign trên FE/DB ➡️ Trigger `on_campaign_created` bắn webhook sang n8n ➡️ n8n gọi Gemini và lưu DB).
   - *Option B:* Chạy thủ công CLI (`python main.py --demo-n8n` hoặc GUI `python gui.py`).
   - *Mục tiêu:* Xác nhận để khi demo chọn kịch bản mượt nhất, không bị bất ngờ.

2. **Webhook URL n8n hiện tại đang cấu hình như thế nào?**
   - Đang dùng Production Webhook hay Test Webhook trong n8n?
   - Cổng mặc định có phải `http://127.0.0.1:5678/webhook/...` không, có cần token `X-Webhook-Token` không?

### Nhóm 2: Về Chuẩn Hóa Schema & Persona (Bảng `contents`)
3. **Kế hoạch sinh 4 Persona của BE3 như thế nào?**
   - FE hiện đã dựng sẵn 4 Tab trên giao diện: `local_guide` (Chuyên gia bản địa), `family` (Gia đình), `foodie` (Tín đồ ẩm thực), `budget_traveler` (Săn deal).
   - Prompt n8n hiện tại đang sinh 1 bài chung (`general`). Sang Tuần 3, BE3 có thể tinh chỉnh Prompt để n8n trả về mảng 4 bài tương ứng 4 Persona này được không?

4. **Về quy trình duyệt bài (Status Lifecycle):**
   - Hiện tại n8n ghi vào DB mang status `pending_approval`.
   - Team mình đã có màn hình Admin duyệt bài chưa, hay trong giai đoạn MVP các bài AI sinh ra đạt Guardrails sẽ được auto-approve (`status = 'approved'`) để Reseller thấy ngay trên Content Kit?

### Nhóm 3: Về Dữ Liệu & Môi Trường Demo
5. **Google Sheets vs Supabase Database:**
   - Trong workflow `workflow_ai_travel_review.json` thấy n8n có ghi 1 bản vào Google Sheets `review_queue`.
   - Luồng demo chính thức ngày mai sẽ lấy dữ liệu từ Google Sheets hay từ bảng `contents` của Supabase? (FE hiện đang đọc trực tiếp từ Supabase).

6. **Dữ liệu demo mẫu đã khớp chưa?**
   - Chiến dịch mẫu Bà Nà Hills (`campaign_id: 44444444-4444-4444-4444-444444444444`, `product_id: 33333333-3333-3333-3333-333333333333`).
   - BE3 có thể chạy thử nghiệm sinh bài cho đúng Campaign/Product này trên local để kiểm tra xem bài viết có hiển thị lập tức lên trang `/reseller/campaigns/44444444-4444-4444-4444-444444444444` không?

---

## 5. HÀNH ĐỘNG TIẾP THEO CHO SÁNG NGÀY MAI (16/10/2026)

1. [ ] Apply file migration trigger tạm thời `20261015233000_temp_contents_reconciliation.sql` vào Supabase Local.
2. [ ] Đồng bộ nhanh với BE3 theo 6 câu hỏi ở Mục 4.
3. [ ] Cùng BE3 chạy lệnh `python main.py --demo-n8n` và kiểm tra trực tiếp trên trình duyệt FE tại đường dẫn: `http://localhost:3000/reseller/campaigns/44444444-4444-4444-4444-444444444444`.
4. [ ] Kiểm tra các nút Copy (Hooks, Scripts, Captions, CTAs, Tracking Link) đảm bảo hoạt động trơn tru trước giờ G (13:30).
5. [ ] Cập nhật báo cáo tiến độ tuần vào `BE1_W2.md` và `TEAM_WORK_LOG.md`.

# PHẢN HỒI THỐNG NHẤT TÍCH HỢP BE1 - BE3 (16/10/2026)

**Người gửi:** Nguyễn Minh Tuệ (BE1 Lead - System Architecture & DB Lead)  
**Người nhận:** Thái Thanh Tú (BE3 Lead - AI Content Factory & n8n Automation)  
**Thời gian:** 08:45 Thứ Sáu, 16/10/2026  
**Mục tiêu:** Chốt kỹ thuật thông luồng n8n & bảng `contents` cho buổi Demo Sprint 2 (13:30 - 17:30, 16/10/2026)

---

## 1. LỜI CHÚC MỪNG & GHI NHẬN TIẾN ĐỘ
Rất hoan nghênh nỗ lực của BE3! Việc endpoint `/contents/batch` đã chạy thành công, trả về `inserted_count: 10`, `flags: []` và hiển thị được trên trang cộng tác viên là bước ngoặt quan trọng để team tự tin bước vào buổi demo chiều nay.

---

## 2. CHỐT 6 ĐIỂM KỸ THUẬT VỚI BE3

### 2.1. Về môi trường n8n & Cloudflare Tunnel
- **Chốt:** **100% dùng n8n Local (`127.0.0.1:5678`) cho buổi Demo Sprint 2 chiều nay.**
  - **Lý do:** Giúp toàn bộ kịch bản demo độc lập hoàn toàn với chất lượng wifi phòng họp, không lo rớt mạng, không độ trễ, và không bị giới hạn quota 2.500 executions/tháng của n8n Cloud. (Sang Tuần 3 - 4 sẽ deploy n8n lên Docker VPS chính thức).
- **Cloudflare Tunnel:** **KHÔNG CẦN THIẾT cho Python API.**
  - Cả n8n Local và Python FastAPI (`rag_api.py`) đều chạy trên máy demo local. n8n gọi trực tiếp `http://127.0.0.1:8000/contents/batch` (hoặc `http://host.docker.internal:8000/contents/batch` nếu n8n chạy trong Docker container). Không cần mở tunnel ra ngoài internet.

---

### 2.2. Về Contract 10 dòng/persona & Kế hoạch 4 Persona
- **Về định dạng 10 dòng/persona:**
  - Trên giao diện FE (`ContentKit`), mỗi record trong bảng `contents` ứng với một lựa chọn trong dropdown (`Biến thể 1`, `Biến thể 2`,...).
  - Nếu lưu 5 dòng hook-only (`script`, `caption`, `cta` bị `null`), khi người chấm demo click sang Biến thể 6 - 10, giao diện sẽ hiện thông báo *"Chưa có Script/Caption/CTA"*, dễ gây cảm giác dữ liệu bị thiếu hoặc sinh lỗi.
  - **Đề xuất tối ưu cho Demo:**
    - **Phương án ưu tiên:** Cho map xoay vòng (modulo `i % 5`) giữa 10 hooks và 5 scripts/captions/ctas để **cả 10 biến thể đều có trọn vẹn 4 trường**. Reseller chọn bất kỳ biến thể nào cũng có đủ kịch bản và bài đăng để bấm Copy ngay.
    - **Nếu vẫn giữ 5 dòng hook-only:** Lưu ý cập nhật schema Pydantic `ContentDraft` trong `rag_api.py` cho phép `script`, `caption`, `cta` nhận giá trị `Optional[str] = None` (vì code hiện tại đang validate `min_length=1`, nếu gửi null/rỗng Python sẽ báo lỗi HTTP `422 Unprocessable Entity`).
- **Kế hoạch sinh 4 Persona:**
  - BE3 đã cấu hình đúng 4 enum: `'local_guide'`, `'family'`, `'foodie'`, `'budget_traveler'` (khớp 100% với FE).
  - Bắt buộc cần chạy sinh dữ liệu mẫu cho đủ cả 4 Persona của chiến dịch Bà Nà Hills trước giờ demo để khi click qua 4 Tab trên FE đều có bài viết hiển thị, không tab nào bị trống.

---

### 2.3. Về việc FE có cần tách các biến thể hook-only không?
- **Chốt:** **KHÔNG thay đổi hay tách giao diện FE trong Sprint 2.**
  - Nhánh FE PR #17 vừa merge vào `dev` sáng nay và đã vượt qua 100% bộ test suites. Sát giờ demo (13:30), nguyên tắc an toàn cao nhất là **đóng băng giao diện FE**, không đụng vào code UI để tránh rủi ro phát sinh bug hồi quy (regression).
  - Toàn bộ biến thể sẽ nằm chung trong dropdown `Biến thể 1..N`. Vì thế, việc áp dụng phương án làm đầy đủ dữ liệu ở Mục 2.2 là giải pháp an toàn và đẹp nhất.

---

### 2.4. Về Trigger tạm auto-approve & Ai chịu trách nhiệm gỡ?
- **Trạng thái:** BE1 đã chuẩn bị sẵn file DDL Migration Trigger `fn_temp_contents_reconcile` và sẽ áp dụng ngay lên Database sáng nay.
- **Lý do:** Trong code `rag_api.py` (commit `e1b689d`), dòng 208 đang lưu `status = "NEEDS_REVIEW"`, trong khi FE chỉ hiển thị các bài có `status = "approved"`. Trigger này sẽ tự động chuyển `NEEDS_REVIEW` / `pending_approval` ➔ `approved` ngay trong DB mà BE3 không cần sửa lại Python API.
- **Trách nhiệm gỡ:** **BE1 (Nguyễn Minh Tuệ) chịu trách nhiệm chạy `DROP TRIGGER` vào đầu Sprint 3 (Tuần 3)** khi toàn team bước vào giai đoạn xây dựng màn hình Admin Moderation & Guardrails chính thức.

---

### 2.5. Về nguồn dữ liệu demo: Supabase hay Google Sheets?
- **Chốt dứt khoát:** **100% SUPABASE DATABASE (`public.contents`).**
  - FE đọc trực tiếp dữ liệu từ bảng `contents` trong Supabase qua Supabase SSR Client, hoàn toàn không kết nối với Google Sheets.
  - Google Sheets chỉ dùng làm nơi phụ trợ để BE3 kiểm tra review queue / log lúc phát triển n8n. Khi chạy demo E2E, đích đến cuối cùng bắt buộc phải được insert vào bảng `public.contents` của Supabase.

---

### 2.6. Campaign ID & Product ID chung cho buổi Demo
Sử dụng chính xác bộ UUID chuẩn của **Bà Nà Hills** đã có trong `supabase/seed.sql`:
- **Campaign ID:** `44444444-4444-4444-4444-444444444444`  
  *(Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills)*
- **Product ID:** `33333333-3333-3333-3333-333333333333`  
  *(Vé Cáp Treo Bà Nà Hills & Buffet Trưa)*
- **Đường dẫn kiểm tra trực tiếp trên trình duyệt FE:**  
  `http://localhost:3000/reseller/campaigns/44444444-4444-4444-4444-444444444444`

---

## 3. CHECKLIST PHỐI HỢP TRƯỚC 12:00 PM
1. [ ] BE1 áp dụng trigger tạm thời lên Supabase DB.
2. [ ] BE3 kích hoạt n8n workflow sinh đủ bài cho 4 persona của Campaign Bà Nà Hills.
3. [ ] BE1 & BE3 cùng mở link FE trên trình duyệt, kiểm tra 4 tab Persona và test các nút Copy (Hook, Script, Caption, CTA kèm link).
4. [ ] Khóa nhánh và sẵn sàng cho buổi thuyết trình 13:30!

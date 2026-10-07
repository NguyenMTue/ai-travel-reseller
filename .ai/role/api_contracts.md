# API CONTRACTS (BẢN HỢP ĐỒNG DỮ LIỆU)

Tài liệu này định nghĩa cấu trúc Request/Response cho các API nội bộ và Webhook để các team Frontend (FE), BE1 (Core/Supabase), BE2 (AI Agent), và BE3 (n8n Automation) làm việc song song mà không bị block lẫn nhau.

---

## 1. Xin Tracking Link (FE -> BE1)
**Mục đích:** FE (Reseller Portal) gọi lên BE1 để lấy link tiếp thị cá nhân hóa cho Reseller đối với một chiến dịch cụ thể (Tuần 2).
**Endpoint dự kiến:** `POST /api/tracking-links/generate` (Theo chuẩn Next.js Route Handlers của dự án).

### Request Payload (FE gửi lên)
```json
{
  "reseller_id": "uuid-string", // Lấy từ auth context của Reseller đang đăng nhập
  "campaign_id": "uuid-string", // ID của chiến dịch Reseller muốn tham gia
  "product_id": "uuid-string"   // ID của sản phẩm trong chiến dịch đó
}
```

### Response Payload (BE1 trả về)
```json
{
  "status": "success",
  "data": {
    "tracking_url": "https://[domain]/checkout?product_id=...&campaign_id=...&reseller_id=..."
  }
}
```
*Lưu ý cho BE1:* Theo PRD (Mục 23), URL cần truyền các tham số định danh. `tracking_url` này có thể sẽ được lưu vào bảng `contents` hoặc tạo động qua API.

---

## 2. Webhook Supabase trigger n8n sinh Content (Supabase -> BE3)
**Mục đích:** Khi Merchant tạo xong một Campaign mới (bảng `campaigns` có data), Supabase tự động bắn Webhook sang n8n (BE3) để gọi LLM sinh kịch bản, hooks, captions.
**Endpoint dự kiến:** `POST [n8n_webhook_url]` (Cấu hình trong Supabase Database Webhooks).

### Request Payload (Supabase bắn đi)
*Theo chuẩn payload webhook của Supabase khi có sự kiện `INSERT` vào bảng `campaigns`.*
```json
{
  "type": "INSERT",
  "table": "campaigns",
  "schema": "public",
  "record": {
    "id": "uuid-string",
    "merchant_id": "uuid-string",
    "product_id": "uuid-string",
    "name": "Tên chiến dịch",
    "start_date": "2023-12-01T00:00:00Z",
    "end_date": "2023-12-31T23:59:59Z",
    "target_audience": "Families in Da Nang",
    "target_location": "Da Nang",
    "commission_rate": 10.5,
    "status": "active"
  },
  "old_record": null
}
```
*Lưu ý cho BE3 (n8n):* Từ `record.product_id` và `record.merchant_id`, n8n workflow sẽ cần gọi ngược lại Supabase API để lấy thêm chi tiết sản phẩm (`products.description`, `products.sale_price`...) làm context nhồi vào LLM prompt. Dữ liệu sinh ra sẽ được insert vào bảng `contents`.

---

## 3. AI Sales Agent Chat (FE -> BE2)
**Mục đích:** Khách hàng chat với AI Sales Agent qua link tracking của Reseller. AI tư vấn bằng dữ liệu RAG (pgvector) và điều hướng khách đến link checkout chính thức (Tuần 3).
**Endpoint dự kiến:** `POST /api/chat`

### Request Payload (FE gửi lên)
```json
{
  "message": "Vé người lớn cuối tuần này bao nhiêu tiền?",
  "conversation_history": [
    { "role": "user", "content": "Cho mình hỏi về vé công viên ABC" },
    { "role": "assistant", "content": "Chào bạn, vé công viên ABC..." }
  ],
  "attribution_context": {
    "reseller_id": "uuid-string", 
    "campaign_id": "uuid-string",
    "product_id": "uuid-string"
  }
}
```
*(FE bắt buộc phải truyền `attribution_context` lấy từ params của URL để BE2 biết AI đang bán hàng cho Reseller nào).*

### Response Payload (BE2 trả về)
```json
{
  "reply": "Vé người lớn hiện là 299K ạ. Bạn đi mấy người để mình gửi link thanh toán nhé!",
  "suggested_checkout_url": "https://[merchant_payment_url]?ref=[reseller_id]&campaign=[campaign_id]" // Hoặc null nếu AI thấy khách chưa có ý định mua
}
```
*Lưu ý cho BE2:* 
- Theo Rulebook và PRD, AI KHÔNG ĐƯỢC bịa giá. Dữ liệu lấy từ RAG.
- Nếu khách có ý định mua (Purchase Intent), BE2 tự động ráp URL thanh toán chính thức của Merchant (từ `products.payment_url`) kèm theo mã tracking của Reseller và gán vào trường `suggested_checkout_url`.
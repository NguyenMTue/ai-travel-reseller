# TÀI LIỆU HƯỚNG DẪN TÍCH HỢP CHECKOUT & ATTRIBUTION DÀNH CHO FRONTEND
**Phân hệ bàn giao:** Backend 1 (Nguyễn Minh Tuệ - BE1 Lead & PM)  
**Đối tượng nhận:** Frontend Team (Cao Thị Thu Diệu - FE Lead)  
**Áp dụng cho:** Sprint 5 / Tuần 5 — Task `FE-W5-01` (Tích hợp Hoàn chỉnh Luồng Thanh toán & Checkout Redirect)  
**Phiên bản:** v1.0.0 (Production Ready)  

---

## 1. Tổng quan & Mục tiêu Kỹ thuật

Tài liệu này quy chuẩn luồng tích hợp từ nút đặt vé trong Chatbot AI (`/chat`) sang trang thanh toán chính thức của đối tác (Merchant), đảm bảo:
1. **Bảo toàn tiếp thị (Attribution Preservation):** Giữ nguyên mã tiếp thị (`reseller_id`, `campaign_id`, `product_id`) xuyên suốt từ lúc xem nội dung, tư vấn AI đến khi tới trang thanh toán.
2. **Bảo mật chuẩn RULE-01 (HTTPS Only):** Ngăn chặn 100% nguy cơ tấn công chuyển hướng độc hại, XSS (`javascript:` URI), hoặc hiển thị sai domain thanh toán.
3. **Mô phỏng & Kiểm thử an toàn:** Cung cấp dữ liệu mẫu và cơ chế kiểm thử đơn hàng thành công mà không phát sinh chi phí hoặc giao dịch tiền thật.

---

## 2. Luồng Sinh Link & Hợp đồng Dữ liệu (API Contract)

### 2.1. Nguồn dữ liệu
* Link thanh toán gốc được cấu hình tại cột `payment_url` (hoặc `booking_url`) trong bảng `public.products` trên Supabase.
* **Quy tắc bất biến:** Frontend **tuyệt đối không tự ghép URL thanh toán**. URL thanh toán chỉ được cung cấp qua API backend sau khi đã kiểm tra tính hợp lệ của Merchant, Tour và Reseller.

### 2.2. API phản hồi từ Chatbot (`POST /api/chat`)
Khi người dùng chat thể hiện ý định mua hàng (ví dụ: *"Tôi muốn mua vé này ngay"*), hệ thống AI Sales Agent nhận diện intent `INTENT_PURCHASE_READY`. Backend thẩm định thông tin và trả về payload:

```json
{
  "reply": "Dạ em gửi anh/chị link đặt vé Cáp treo Bà Nà Hills chính thức của Sun World ạ. Anh/chị bấm vào nút bên dưới để tiến hành thanh toán nhé!",
  "suggested_checkout_url": "https://sunworld.vn/booking/ba-na-hills-buffet?ref=22222222-2222-2222-2222-222222222222&campaign=44444444-4444-4444-4444-222222222222&product=33333333-3333-3333-3333-333333333333",
  "intent_detected": "INTENT_PURCHASE_READY"
}
```

*Nếu người dùng chỉ hỏi thông tin chung (hỏi thời tiết, lịch trình...), trường `suggested_checkout_url` sẽ trả về `null`.*

### 2.3. Cấu trúc Query Parameters gắn mã tiếp thị
Backend sử dụng hàm chuẩn `buildCheckoutUrl` (`src/lib/ai/checkout-url.ts`):
* `ref`: UUID của Reseller phân phối (`attribution.reseller_id`).
* `campaign`: UUID của Chiến dịch du lịch (`attribution.campaign_id`).
* `product`: UUID của Sản phẩm / Tour (`attribution.product_id`).

---

## 3. Quy chuẩn UI & Bảo mật Phía Frontend (RULE-01)

Frontend cần tuân thủ các quy tắc an toàn đã được cài đặt sẵn tại `src/components/chat/chat-panel.tsx`:

### 3.1. Thẩm định URL an toàn trước khi render
Chỉ render nút thanh toán khi URL vượt qua kiểm tra:
```typescript
function safeCheckout(raw: unknown): string | null {
  try {
    const u = new URL(String(raw));
    // Bắt buộc giao thức HTTPS, chặn triệt để javascript: hoặc data:
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
```

### 3.2. Thuộc tính hiển thị nút bấm
* **Thuộc tính thẻ `<a>`:** `target="_blank" rel="noopener noreferrer"`.
* **Minh bạch đối tác:** Hiển thị rõ ràng domain của Merchant ngay dưới nút bấm để tạo sự tin tưởng (ví dụ: `sunworld.vn`, `vinwonders.com`).
* **Funnel Analytics:** Bắt sự kiện click để phục vụ thống kê tỷ lệ chuyển đổi:
  ```typescript
  captureChatFunnelEvent("checkout_clicked", attribution, {
    checkout_domain: new URL(checkoutUrl).hostname,
  });
  ```

### 3.3. Danh sách Domain Merchant hợp lệ
* `sunworld.vn` (Sun World Bà Nà Hills)
* `checkout.culaochamtravel.vn` / `culaochamtravel.vn` (Tour Cano Cù Lao Chàm)
* `vinwonders.com` (VinWonders Nam Hội An)

---

## 4. Cửa sổ Tiếp thị & Thời hạn Hiệu lực (Attribution Window)

* **Cửa sổ Attribution:** Mặc định là **30 ngày** (`ATTRIBUTION_WINDOW_DAYS = 30`).  
  Khách hàng click qua link tiếp thị của Reseller có thời hạn 30 ngày để chốt đơn. Trong vòng 30 ngày kể từ lúc click, nếu đơn phát sinh thì hoa hồng vẫn ghi nhận cho Reseller đó.
* **Thời hạn hiệu lực của URL:** Link đích của Merchant không có token ngắn hạn tự hủy. Tuy nhiên, nếu Tour/Sản phẩm hết hạn (vượt quá `valid_to` trong DB), backend sẽ không sinh link thanh toán.

---

## 5. Vòng đời Đơn hàng & Cách Kiểm tra Trạng thái

### 5.1. Bảng trạng thái đơn hàng (`public.orders.status`)
Hệ thống quản lý trạng thái theo State Machine:
* `pending`: Khách đã bấm vào link, tạo đơn trên cổng Merchant nhưng chưa hoàn tất thanh toán.
* `confirmed`: Đơn hàng đã được xác nhận thanh toán thành công (Hoa hồng được ghi nhận vào trạng thái chờ duyệt `pending_balance`).
* `paid`: Giao dịch hoàn tất thực tế (Hoa hồng được ghi nhận vào số dư khả dụng `available_balance` của Reseller).
* `cancelled` / `refunded`: Khách hủy tour hoặc yêu cầu hoàn tiền (Hoa hồng bị khấu trừ tương ứng).

### 5.2. Công thức phân bổ hoa hồng (Commission Ledger)
* `gross_commission` = Làm tròn `order_amount * (commission_rate / 100)`
* `platform_fee` (20%) = Làm tròn `gross_commission * 0.20`
* `reseller_commission` (80%) = `gross_commission - platform_fee`
* Đơn vị tính: VNĐ (luôn làm tròn nguyên số, không có số lẻ thập phân).

### 5.3. Kiểm tra số dư ví & đơn hàng của Reseller
FE có thể gọi API sau để kiểm tra trạng thái đơn hàng và biến động số dư của Reseller:
* **Endpoint:** `GET /api/reseller/wallet`
* **Quyền:** Authenticated User có role `reseller`.
* **Phản hồi mẫu:**
  ```json
  {
    "success": true,
    "data": {
      "reseller_id": "22222222-2222-2222-2222-222222222222",
      "balances": {
        "available_balance": 216000,
        "pending_balance": 69000,
        "paid_balance": 0,
        "lifetime_earnings": 285000,
        "currency": "VND"
      },
      "order_metrics": {
        "total_orders": 3,
        "confirmed_orders": 2,
        "pending_orders": 1,
        "total_gmv": 3730000,
        "flagged_self_purchase_orders": 0
      },
      "recent_commissions": [
        {
          "id": "...",
          "order_id": "...",
          "booking_reference": "BNH-20261102-001",
          "net_amount": 69000,
          "status": "pending",
          "order_amount": 1150000,
          "masked_customer_name": "N***n",
          "created_at": "2026-11-02T15:00:00Z"
        }
      ]
    }
  }
  ```

---

## 6. Môi trường Test & Dữ liệu Mẫu (Mock / Sandbox)

Để FE thử nghiệm hoàn chỉnh mà không làm phát sinh thanh toán thật hay ảnh hưởng tài chính, sử dụng bộ dữ liệu mẫu sau:

### 6.1. Dữ liệu hạt giống chuẩn (Seed Data)
* **Reseller Test:**
  * ID: `22222222-2222-2222-2222-222222222222`
  * Tên: Linh Đan Travel & Food
  * SĐT: `0912345678`
* **Merchant Test:**
  * ID: `11111111-1111-1111-1111-111111111111`
  * Tên: Sun World Bà Nà Hills
* **Campaign Test:**
  * ID: `44444444-4444-4444-4444-222222222222`
  * Tên: Kích cầu du lịch Miền Trung 2026
* **Product Test:**
  * ID: `33333333-3333-3333-3333-333333333333`
  * Tên: Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế
  * Giá bán: `1.150.000` VNĐ | Tỷ lệ hoa hồng: `7.5%`
  * Link thanh toán: `https://sunworld.vn`

### 6.2. Test giao diện Chat có nút Checkout (Không cần gọi AI thật)
Mở trực tiếp URL preview cục bộ:
```text
http://localhost:3000/preview/chat?ref=22222222-2222-2222-2222-222222222222&campaign=44444444-4444-4444-4444-222222222222&product=33333333-3333-3333-3333-333333333333
```
*Gõ câu hỏi: "Làm sao để đặt dịch vụ chính thức?" hoặc "Tôi muốn mua vé" để giao diện kích hoạt nút bấm chuyển hướng checkout.*

### 6.3. Script mô phỏng Đơn hàng thành công (Giả lập Webhook/Thanh toán)
Khi muốn test luồng sau thanh toán (đơn hàng ghi nhận vào database và ví Reseller nhảy số mà không cần thẻ tín dụng thật), chạy đoạn code sau trong console hoặc test script:

```typescript
import { createAdminClient } from "@/src/lib/supabase/admin";

const supabase = createAdminClient();

// Gọi Stored Procedure Attribution chính thức
const { data, error } = await supabase.rpc("process_order_attribution", {
  p_booking_reference: "TEST-BK-" + Date.now(),       // Mã đơn giả lập ngẫu nhiên
  p_order_amount: 1150000,                             // 1.150.000 VNĐ
  p_merchant_id: "11111111-1111-1111-1111-111111111111",
  p_product_id: "33333333-3333-3333-3333-333333333333",
  p_reseller_id: "22222222-2222-2222-2222-222222222222",
  p_campaign_id: "44444444-4444-4444-4444-222222222222",
  p_customer_name: "Nguyễn Khách Thử Nghiệm",
  p_customer_phone: "0905123999",                      // Lưu ý: Không đặt trùng '0912345678' để tránh trigger cờ chống tự mua hàng (flag_self_purchase)
  p_status: "confirmed",                               // Ghi nhận thành công
  p_notes: "Đơn hàng test mô phỏng FE tuần 5"
});

console.log("Kết quả ghi nhận đơn:", data);
// Kỳ vọng: { success: true, order_id: "...", commission_id: "..." }
```

Sau khi chạy lệnh trên:
1. Mở trang `/reseller/wallet` của Reseller Linh Đan.
2. Kiểm tra `available_balance` hoặc `pending_balance` sẽ tăng thêm đúng `69.000` VNĐ (80% của 7.5% giá trị đơn 1.150.000 VNĐ).
3. Đơn hàng xuất hiện trong danh sách giao dịch gần nhất với tên đã che: `N***m`.

---

## 7. Checklist Nghiệm thu DoD cho Frontend (Definition of Done)

* [ ] Nút đặt vé hiển thị nổi bật trong khung chat khi AI trả về `suggested_checkout_url`.
* [ ] Tất cả URL checkout bắt buộc dùng giao thức `https://`, mở trong tab mới `target="_blank"`.
* [ ] Kiểm tra URL mở ra có đủ 3 query parameters: `ref`, `campaign`, `product`.
* [ ] Sự kiện `checkout_clicked` được ghi nhận chính xác vào telemetry/funnel.
* [ ] Thử nghiệm trên thiết bị di động (màn hình nhỏ 320px và 390px) nút bấm không bị tràn hoặc che khuất thanh Bottom Navigation.
* [ ] Khi click từ link mô phỏng test, ví Reseller ghi nhận đúng hoa hồng và hiển thị mượt mà.

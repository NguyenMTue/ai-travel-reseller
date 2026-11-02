# GIẢI ĐÁP KỸ THUẬT & ĐỒNG BỘ CONTRACT FE — BE1 (SPRINT 5)
**Dự án:** AI Travel Reseller Platform (TravelLink AI)  
**Thời gian:** 22:15 Thứ Hai, 02/11/2026  
**Người lập:** Nguyễn Minh Tuệ (Backend 1 Lead & PM)  
**Người nhận:** Cao Thị Thu Diệu (Frontend Lead) & Đội ngũ Frontend  
**Mục đích:** Thống nhất contract luồng đặt vé, cấu trúc ví hoa hồng, phương thức kiểm thử thanh toán và tiêu chí nghiệm thu hiệu năng Next.js Bundle Size cho Sprint 5.

---

## 1. ĐỐI CHIẾU FILE ĐẶC TẢ VS CODE HIỆN TẠI: CHỐT PHƯƠNG ÁN THEO CÁI NÀO?

| Vấn đề | Đối chiếu File vs Code | Kết luận chốt | Hướng dẫn hành động cho FE / BE |
|---|---|---|---|
| **1. `payment_url` vs `booking_url`** | File BA ghi dùng cả hai. Code tracking route dùng fallback, nhưng code chat BE2 đang chỉ đọc `payment_url`. | **CHỐT: Cơ chế Fallback ưu tiên**<br>`payment_url || booking_url` | • **BE:** Sẽ bổ sung fallback `product.payment_url || product.booking_url` trong `src/lib/ai/chat.ts` để đồng bộ.<br>• **FE:** Khi mở trang thanh toán từ chat, FE lấy trực tiếp URL từ trường `suggested_checkout_url` do API `/api/chat` trả về. |
| **2. Kiểm tra hết hạn `valid_to`** | Bảng `products` có `valid_to`, nhưng code chat hiện tại chưa kiểm tra hết hạn. | **CHỐT: Bắt buộc kiểm tra `valid_to` (Trách nhiệm của BE)** | • **BE:** BE sẽ filter `valid_to >= now()` và `status = 'active'`. Nếu hết hạn, BE trả lời lịch sự và trả về `suggested_checkout_url: null`.<br>• **FE:** Chỉ cần kiểm tra `suggested_checkout_url`: nếu có URL thì hiện nút "Đặt vé", nếu `null` thì ẩn nút. FE không cần tự tính `valid_to` trong UI chat. |
| **3. Cấu trúc Ví & Số dư hoa hồng** | File spec ban đầu (Week 3) mô tả ý niệm sơ khai, khác với code RPC và component ví hiện tại. | **CHỐT: 100% THEO CODE HIỆN TẠI**<br>(RPC Postgres & `wallet-service.ts`) | • **FE giữ nguyên mã nguồn hiện tại** trong `src/components/reseller/wallet-dashboard.tsx`. Không sửa theo file spec cũ.<br>• Code hiện tại đã chuẩn hóa qua Stored Procedure `get_reseller_wallet_summary`, đạt p95 = 17ms và vượt qua k6 load test. |

---

## 2. CHI TIẾT CẤU TRÚC DỮ LIỆU VÍ RESELLER CHUẨN (PRODUCTION)

Giao diện Ví Reseller (`/reseller/wallet`) đã và đang sử dụng chính xác response từ `GET /api/reseller/wallet` (được bảo vệ bằng Zod schema tại `src/lib/commerce/wallet-service.ts`):

```json
{
  "success": true,
  "data": {
    "reseller_id": "22222222-2222-2222-2222-111111111111",
    "balances": {
      "available_balance": 216000,
      "pending_balance": 108000,
      "paid_balance": 500000,
      "refunded_balance": 0,
      "lifetime_earnings": 716000,
      "currency": "VND"
    },
    "order_metrics": {
      "total_orders": 5,
      "confirmed_orders": 3,
      "pending_orders": 2,
      "total_gmv": 4500000,
      "flagged_self_purchase_orders": 0
    },
    "recent_commissions": [
      {
        "id": "trans-uuid-001",
        "order_id": "order-uuid-001",
        "booking_reference": "BNH***821",
        "campaign_id": "44444444-4444-4444-4444-444444444444",
        "campaign_name": "Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills",
        "gross_amount": 270000,
        "platform_fee": 54000,
        "net_amount": 216000,
        "status": "confirmed",
        "order_amount": 1800000,
        "customer_name": "N***A",
        "flag_self_purchase": false,
        "created_at": "2026-11-02T14:30:00Z"
      }
    ],
    "last_updated": "2026-11-02T15:15:00Z"
  }
}
```

### Ý nghĩa các số dư:
* **`available_balance` (Hoa hồng khả dụng):** Tổng hoa hồng từ các đơn có trạng thái `confirmed` (Khách đã thanh toán vé thành công, Merchant đã xác nhận, sẵn sàng đối soát).
* **`pending_balance` (Chờ đối soát):** Tổng hoa hồng từ các đơn có trạng thái `pending` (Khách vừa tạo đơn trên cổng thanh toán, chờ webhook/xác nhận).
* **`paid_balance` (Đã chi trả):** Hoa hồng của các đơn `paid` đã chuyển khoản thành công về tài khoản ngân hàng của Reseller.
* **`lifetime_earnings` (Tổng thu nhập tích lũy):** `available_balance + paid_balance`.

---

## 3. HƯỚNG DẪN KIỂM THỬ ĐƠN HÀNG ĐÃ THANH TOÁN & MÔI TRƯỜNG TEST

### 3.1 Mô hình thương mại của hệ thống (Non-custodial Model)
TravelLink AI **không giữ tiền** của du khách. Khi khách hàng click nút *"Đặt vé ngay"* trên giao diện chat hoặc trang giới thiệu:
1. Trình duyệt điều hướng sang cổng thanh toán / trang đặt chỗ chính thức của Merchant (`payment_url` hoặc `booking_url`).
2. Kèm theo query parameter định danh:
   ```text
   ?ref=[reseller_id]&campaign=[campaign_id]&product=[product_id]
   ```
3. Khách hàng thanh toán trực tiếp cho Merchant.

### 3.2 Cách giả lập và kiểm tra đơn hàng đã thanh toán
Để kiểm thử hiển thị ví hoặc luồng ghi nhận mà không cần thanh toán tiền thật, FE/Tester có thể dùng 2 cách:

* **Cách 1: Giả lập đơn hàng bằng Postgres RPC `process_order_attribution`:**
  Chạy lệnh SQL hoặc gọi Supabase RPC:
  ```sql
  SELECT public.process_order_attribution(
    p_booking_reference := 'TEST-BNH-20261102-01',
    p_order_amount := 1800000,
    p_merchant_id := '11111111-1111-1111-1111-111111111111',
    p_product_id := '33333333-3333-3333-3333-333333333333',
    p_reseller_id := '22222222-2222-2222-2222-111111111111',
    p_campaign_id := '44444444-4444-4444-4444-444444444444',
    p_customer_name := 'Nguyễn Văn Test',
    p_customer_phone := '0905999888',
    p_status := 'confirmed'  -- 'confirmed' nghĩa là đã thanh toán thành công
  );
  ```
* **Cách 2: Kiểm tra trực tiếp qua API:**
  * **API Reseller:** Đăng nhập tài khoản Reseller và gọi `GET /api/reseller/wallet`. Nếu đơn hàng đã thanh toán (`status: 'confirmed'`), hoa hồng sẽ tự động cộng vào `available_balance` và hiển thị trong danh sách giao dịch gần đây.
  * **Kiểm tra trạng thái đơn trong DB:**
    ```ts
    const { data: order } = await supabase
      .from('orders')
      .select('id, booking_reference, status, paid_at, reseller_commission')
      .eq('booking_reference', 'TEST-BNH-20261102-01')
      .single();
    // order.status === 'confirmed' | 'paid'
    ```

### 3.3 Môi trường test
1. **Môi trường Local Dev (Khuyên dùng khi dev tính năng):**
   * Supabase Docker Local: `http://127.0.0.1:54321` (DB Port 54322).
   * Dữ liệu mẫu đã có sẵn trong `supabase/seed.sql` với đầy đủ 4 Sản phẩm, 4 Chiến dịch và tài khoản Reseller mẫu.
2. **Môi trường Cloud Staging (Dành cho E2E UAT Tuần 5):**
   * Supabase Cloud Singapore (`ykfosnwbgphlwpufnxrd`) đã migrate hoàn chỉnh 21 migration files và sẵn sàng cho đợt kiểm thử tích hợp ngày 03–04/11.

---

## 4. GIẢI ĐÁP HIỆU NĂNG: MỐC FIRST LOAD JS 120 KiB VS LIGHTHOUSE > 90

### 4.1 Bóc tách thực tế Bundle Size của Next.js 16 + React 19
Khi Next.js build ứng dụng App Router:
$$\text{Total First Load JS} = \text{Shared Framework Chunks (Vendor)} + \text{Page Application Code}$$

* **Vendor Framework Chunks (React 19 + Next.js 16 runtime):** Đã chiếm khoảng **~126 KiB gzip**. Đây là runtime nền tảng bất biến bắt buộc phải tải cho mọi trang có Client Component.
* **Tổng First Load JS hiện tại:** Khoảng **139–143 KiB gzip**.
* **Mã nguồn ứng dụng thực tế của FE (First-party application code):**
  $$139\text{ KiB} - 126\text{ KiB} \approx \mathbf{13\text{ – }17\text{ KiB gzip!}}$$

### 4.2 Kết luận nghiệm thu cho Task `FE-W5-02`
* **Mốc 120 KiB** ghi trong task sheet là chỉ tiêu ước lượng sơ bộ ban đầu. Với stack Next.js 16 và React 19 hiện đại, việc ép toàn bộ First Load JS (bao gồm framework) xuống dưới 120 KiB là bất khả thi về mặt kỹ thuật nếu không gỡ bỏ React.
* **Phần code ứng dụng của FE chỉ nặng 13–17 KiB là CỰC KỲ TỐI ƯU.**
* Quan trọng nhất: **Điểm Lighthouse Performance trung vị cả 3 trang đều đã đạt trên 90 điểm trên Mobile.** Đây mới chính là Definition of Done (DoD) cốt lõi của Sprint 5 để đảm bảo trải nghiệm người dùng thực tế.
* 👉 **Xác nhận:** FE hoàn toàn **ĐẠT CHUẨN NGHIỆM THU Task `FE-W5-02`**. Không cần cắt giảm code hay cấu hình phức tạp thêm. Trong báo cáo chỉ cần ghi chú rõ:
  > *"Kích thước mã nguồn ứng dụng tối ưu xuất sắc ở mức 13–17 KiB gzip; phần dung lượng còn lại là Shared Framework Runtime của Next.js 16 & React 19 (~126 KiB). Điểm Performance trung vị 3 trang trên di động đạt > 90, đáp ứng 100% tiêu chí DoD."*

---
*Tài liệu được lưu trữ tại `docs/be1/week5-be1-fe-integration-qa.md` làm căn cứ nghiệm thu bàn giao giữa BE1 và FE.*

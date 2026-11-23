# BÁO CÁO GHI NHẬN LỖI & ĐỀ XUẤT TỐI ƯU HÓA BACKEND & API
## PHÂN HỆ: TRACKING ROUTING & ORDER CONFIRMATION API (DÀNH CHO BACKEND / API DEV)

- **Dự án:** AI Travel Reseller Network (TravelLink)
- **QA Automation Engineer:** Senior QA Lead
- **Phạm vi kiểm thử:** Router tiếp thị `/r/[code]`, Router chuyển tiếp `/t/[tenant]/[slug]`, API xác nhận đơn hàng `/api/storefront/orders/confirm`, Logic tính toán hoa hồng phân bổ và bảo mật Non-blocking Clicks.
- **Ngày ghi nhận:** 19/11/2026

---

### BẢNG TỔNG QUAN PHÂN LOẠI LỖI BACKEND / API

| Mã Bug | Tên lỗi / Vấn đề phát hiện | Vị trí file mã nguồn | Mức độ nghiêm trọng | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `BUG-BE-CHK-01` | Router `/r/[code]` thiếu cơ chế Cache/Fallback khi DB quá tải hoặc ngắt kết nối | `app/r/[code]/route.ts` | **Medium / Resilience** | Đề xuất tối ưu |
| `BUG-BE-CHK-02` | API Confirm Order cho phép ghi nhận đơn với ID tùy ý mà không có Idempotency Key | `app/api/storefront/orders/confirm/route.ts` | **Medium / Idempotency** | Đề xuất tối ưu |
| `BUG-BE-CHK-03` | Cố định tỷ lệ hoa hồng mặc định 12.0% khi không tìm thấy Campaign trong DB | `app/api/storefront/orders/confirm/route.ts` (dòng 78) | **Low / Business Logic** | Đề xuất tối ưu |

---

### CHI TIẾT CÁC VẤN ĐỀ GHI NHẬN:

#### 1. BUG-BE-CHK-01: Router `/r/[code]` thiếu cơ chế Cache/Fallback khi DB quá tải
- **Vị trí phát hiện:** `app/r/[code]/route.ts` (dòng 24 - 35)
- **Mức độ:** **Medium / Resilience**
- **Mô tả chi tiết:**
  Khi người dùng click vào shortlink `/r/[unique_code]`, router gọi truy vấn Supabase trực tiếp:
  ```ts
  const { data: link, error } = await adminClient
    .from("affiliate_links")
    .select("id, destination_url, is_active, reseller_id, campaign_id, product_id")
    .eq("unique_code", cleanCode)
    .maybeSingle();
  ```
  Nếu mạng bị timeout, connection pool cạn kiệt, hoặc database offline, request lập tức bị chuyển hướng 302 về `/?error=link_not_found_or_inactive`. Điều này làm đứt gãy toàn bộ lưu lượng truy cập từ các chiến dịch TikTok/Reels lớn (hàng chục nghìn click cùng lúc).
- **Hành vi mong đợi:** Các link tiếp thị active cần được cache (Redis / In-memory LRU Cache với TTL 5-15 phút) để đảm bảo tốc độ redirect tức thì < 50ms và không phụ thuộc 100% vào database chính.

---

#### 2. BUG-BE-CHK-02: API Confirm Order thiếu cơ chế Idempotency Key chống Double-Submit
- **Vị trí phát hiện:** `app/api/storefront/orders/confirm/route.ts` (dòng 11 - 25)
- **Mức độ:** **Medium / Idempotency**
- **Mô tả chi tiết:**
  Khi khách hàng bấm nút "TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ", client gửi request POST tới `/api/storefront/orders/confirm`. Nếu khách hàng bấm liên tiếp 2-3 lần (hoặc mạng lag retry), backend có thể nhận nhiều request với cùng thông tin `orderId`. Mặc dù `orderId` có thể được kiểm tra duplicate ở tầng DB constraint, nhưng API chưa có header `Idempotency-Key` để trả về ngay kết quả đã lưu mà không gây lỗi 500 hoặc conflict.
- **Giải pháp đề xuất:** Bổ sung kiểm tra `x-idempotency-key` hoặc kiểm tra xem `booking_reference` đã tồn tại trong bảng `orders` hay chưa. Nếu đã tồn tại, trả về bản ghi hiện có với HTTP 200 thay vì xử lý lại từ đầu.

---

#### 3. BUG-BE-CHK-03: Cố định tỷ lệ hoa hồng mặc định 12.0% khi không tìm thấy Campaign
- **Vị trí phát hiện:** `app/api/storefront/orders/confirm/route.ts` (dòng 78)
- **Mức độ:** **Low / Business Logic**
- **Mô tả:** Khi `campaignId` gửi lên không khớp với ID nào trong database (ví dụ chiến dịch tạo demo hoặc đã hết hạn), backend tự động fallback về `commissionRate = 12.0%`. Mức này nên được cấu hình linh động theo Merchant (ví dụ Sun World có chính sách riêng 15%, Cù Lao Chàm 10%).
- **Khắc phục:** Truy vấn `merchants.default_commission_rate` làm mức fallback thứ nhất trước khi áp dụng hằng số 12.0%.

---

### GHI CHÚ TIẾN ĐỘ (OUT OF CURRENT IMPLEMENTATION - KHÔNG TÍNH BUG):
- Webhook ngân hàng tự động đối soát Napas247 / VietinBank / MBBank hiện đang mô phỏng xác nhận qua client action (Mocked Settlement Flow) để phục vụ demo E2E trơn tru. Chưa tích hợp kết nối trực tiếp với Core Banking Webhook thật.

# BÁO CÁO LỖI KIỂM THỬ E2E UI - PHÂN HỆ RESELLER PORTAL
## DÀNH CHO: BACKEND / API DEVELOPER (BE)
**Dự án:** AI Travel Reseller Network  
**Tài liệu đối chiếu:** SRS v1.1 & BRD v1.0  
**Người lập báo cáo:** Senior QA Automation Engineer  
**Bộ test tự động:** `tests/reseller.spec.ts`  
**Ngày thực hiện:** 16/10/2026  

---

### TỔNG QUAN TÌNH TRẠNG BACKEND / API
Qua kiểm tra codebase và thực thi test E2E UI, phía Backend API hiện tại chỉ mới triển khai một số route xử lý link tiếp thị và phân tích click (`/api/tracking/generate`, `/api/reseller/links`, `/api/reseller/analytics`). Toàn bộ các API phục vụ các tính năng cốt lõi của Reseller Portal theo SRS v1.1 **hoàn toàn chưa có endpoint**, hoặc thiếu trường dữ liệu trong API response (như không cấp Mã Voucher duy nhất, không có API ghi nhận sự kiện tải video/sao chép, không có API tính toán hoa hồng 4 trạng thái, không có API khai báo bài đăng & số liệu tự khai).

---

### DANH SÁCH CHI TIẾT CÁC BUG BACKEND / API

---

#### 1. BUG-BE-RES-01: Thiếu API lưu trữ & cập nhật Hồ sơ đầy đủ của Reseller
- **Bug ID:** `BUG-BE-RES-01`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hồ sơ Reseller - `FR-RES-01`
- **Test Case liên quan:** `FR-RES-01: Màn hình Hồ sơ Reseller cho phép cập nhật thông tin và hiển thị trạng thái (Chờ duyệt / Đã duyệt / Bị đình chỉ)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu Route Handler `app/api/reseller/profile/route.ts` (hoặc Server Action tương ứng)
- **Các bước tái hiện:**
  1. Frontend cố gắng lấy hoặc cập nhật thông tin hồ sơ Reseller (SĐT, địa điểm, sở thích, ngôn ngữ).
  2. Gửi request `GET /api/reseller/profile` hoặc `PUT /api/reseller/profile`.
- **Kết quả mong đợi (SRS v1.1):** Endpoint trả về thông tin chi tiết của Reseller đang đăng nhập và cho phép cập nhật các trường thông tin theo đúng `FR-RES-01`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Endpoint không tồn tại (`404`). Màn hình UI `reseller/profile` bị chặn hoàn toàn (Blocked).
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /hồ sơ|thông tin cá nhân/i })
    Error: element(s) not found
    ```

---

#### 2. BUG-BE-RES-02: Thiếu API CRUD quản lý Tài khoản Mạng xã hội (TikTok/Facebook)
- **Bug ID:** `BUG-BE-RES-02`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Liên kết tài khoản MXH - `FR-RES-02`, `RULE-17`
- **Test Case liên quan:** `FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội (TikTok/FB) với chỉ số tự khai, TUYỆT ĐỐI không có ô nhập mật khẩu MXH`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thiếu Route Handler `app/api/reseller/social-accounts/route.ts`
- **Các bước tái hiện:**
  1. Gửi request lấy danh sách kênh: `GET /api/reseller/social-accounts`.
  2. Gửi request thêm kênh mới: `POST /api/reseller/social-accounts` kèm payload `{ platform, username, url, followers, average_views, engagement_rate }`.
- **Kết quả mong đợi (SRS v1.1 & RULE-17):**
  - Endpoint tiếp nhận thông tin kênh, gán trạng thái mặc định `Chờ duyệt` (pending approval).
  - Endpoint không bao giờ yêu cầu hay chấp nhận trường `password`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có endpoint phục vụ. Toàn bộ tính năng liên kết mạng xã hội bị tê liệt (`Blocked`).
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /tài khoản mạng xã hội|liên kết mxh/i })
    Error: element(s) not found
    ```

---

#### 3. BUG-BE-RES-03: API tạo tracking link không cấp "Mã Voucher riêng biệt" (Unique Voucher Code)
- **Bug ID:** `BUG-BE-RES-03`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Phân bổ doanh số đa kênh - `FR-RES-06`, `FR-TRK-01`, `FR-ATT-01`
- **Test Case liên quan:** `FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia chiến dịch <= 3 thao tác, chọn tài khoản MXH, cấp Tracking Link riêng và Mã Voucher riêng`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [route.ts](file:///d:/ai-travel-reseller/app/api/tracking/generate/route.ts#L228-L270)
- **Các bước tái hiện:**
  1. Gửi request: `POST /api/tracking/generate` với payload `{ campaign_id, product_id }`.
  2. Kiểm tra JSON response trả về từ API.
- **Kết quả mong đợi (SRS v1.1 & BRD v1.0):** API phải trả về:
  - `short_url`: Link rút gọn dạng `http://<domain>/r/<unique_code>`.
  - `unique_code`: Mã tracking.
  - **`voucher_code`**: Mã giảm giá riêng biệt duy nhất gắn với Reseller để phục vụ phân bổ chuyển đổi khi khách hàng thanh toán trực tiếp hoặc mua qua livestream/video ngắn mà không click link (Attribution via Voucher).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Response của API chỉ sinh `short_url` và `unique_code`, hoàn toàn không sinh và không trả về `voucher_code`.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel(/mã voucher|voucher code/i).or(getByTestId('unique-voucher-code'))
    Error: element(s) not found
    ```

---

#### 4. BUG-BE-RES-04: Thiếu API ghi nhận sự kiện (Tracking Event) khi Reseller tải video hoặc sao chép nội dung
- **Bug ID:** `BUG-BE-RES-04`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Ghi nhận sự kiện phân phối - `FR-RES-08`
- **Test Case liên quan:** `FR-RES-08: Hỗ trợ Tải video, Copy caption, CTA, hashtag kèm link và ghi nhận sự kiện (tracking event)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [content-kit.tsx](file:///d:/ai-travel-reseller/src/components/reseller/content-kit.tsx#L19-L30) và thiếu endpoint `POST /api/tracking/events`
- **Các bước tái hiện:**
  1. Người dùng bấm nút "Copy Caption", "Copy CTA" hoặc "Tải video" trên Content Kit.
  2. Lắng nghe network request gửi đi.
- **Kết quả mong đợi (SRS v1.1):** Phải có endpoint `POST /api/tracking/events` (hoặc tương tự) để ghi nhận sự kiện vào bảng `tracking_events` với `event_type = 'content_copy'` hoặc `event_type = 'video_download'` kèm `reseller_id`, `campaign_id`, `product_id`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có bất kỳ HTTP request nào được gửi đến Backend API khi thực hiện sao chép/tải về.
  - *Playwright Log:*
    ```text
    Error: expect(received).not.toBeNull()
    Received: null
    Message: Hành vi tải video / sao chép phải gửi API ghi nhận sự kiện tracking event
    ```

---

#### 5. BUG-BE-RES-05: Thiếu API Khai báo URL bài đăng và lưu trữ số liệu tự khai
- **Bug ID:** `BUG-BE-RES-05`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng & Metrics tự khai - `FR-RES-10`, `FR-RES-11`, `RULE-13`
- **Test Case liên quan:** `FR-RES-10: Form khai báo URL bài đăng trên TikTok/Facebook và liên kết biến thể nội dung đã dùng` và `FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, cmt, share, save) kèm ảnh bằng chứng, bắt buộc gắn nhãn 'Tự khai'`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu Route Handler `app/api/reseller/posts/route.ts`
- **Các bước tái hiện:**
  1. Gọi API `POST /api/reseller/posts` với thông tin bài đăng: `{ post_url, campaign_id, content_id, platform }`.
  2. Gọi API cập nhật số liệu tự khai: `{ post_id, views, likes, comments, shares, saves, proof_image_url }`.
- **Kết quả mong đợi (SRS v1.1):** Endpoint lưu trữ bài đăng, liên kết với biến thể nội dung đã dùng; lưu các chỉ số tương tác tự khai có gắn cờ `is_self_reported = true`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có endpoint tiếp nhận dữ liệu bài đăng và số liệu tự khai (`404`).
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /khai báo bài đăng|báo cáo bài đăng/i })
    Error: element(s) not found
    ```

---

#### 6. BUG-BE-RES-06: API Analytics Reseller thiếu dữ liệu Lead, Booking, GMV và Tỷ lệ chuyển đổi
- **Bug ID:** `BUG-BE-RES-06`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Báo cáo hiệu suất - `FR-RES-12`, `FR-ANA-06`, `FR-ANA-11`
- **Test Case liên quan:** `FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất hiển thị Click, Lead, Booking, GMV, Conversion Rate (N/A khi = 0), tiền tệ VND`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** [route.ts](file:///d:/ai-travel-reseller/app/api/reseller/analytics/route.ts#L64-L108)
- **Các bước tái hiện:**
  1. Gửi request `GET /api/reseller/analytics`.
  2. Kiểm tra dữ liệu JSON trong trường `data.overview`.
- **Kết quả mong đợi (SRS v1.1):** API overview phải trả về đầy đủ 5 chỉ số cốt lõi:
  - `total_clicks`: Lượt click hợp lệ.
  - `total_leads`: Lượt khách tiềm năng (vào chat/tư vấn).
  - `total_bookings`: Đơn hàng thành công.
  - `total_gmv`: Tổng giá trị giao dịch (VND).
  - `conversion_rate`: Tỷ lệ chuyển đổi (`bookings / clicks`).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Endpoint `app/api/reseller/analytics/route.ts` hiện chỉ trả về các chỉ số về click: `total_links`, `active_links`, `total_clicks`, `valid_clicks`, `bot_clicks`, `bot_ratio_percentage`. Hoàn toàn thiếu Lead, Booking, GMV và Tỷ lệ chuyển đổi.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByTestId('metric-leads').or(getByText(/khách tiềm năng|leads/i))
    Error: element(s) not found
    ```

---

#### 7. BUG-BE-RES-07: Thiếu API Báo cáo hoa hồng theo 4 trạng thái và danh sách booking có PII Masking
- **Bug ID:** `BUG-BE-RES-07`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hoa hồng & Che thông tin PII - `FR-RES-13`, `FR-ANA-09`, `FR-AIS-13`
- **Test Case liên quan:** `FR-RES-13: Dashboard hoa hồng hiển thị 4 trạng thái (Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả) và danh sách booking` và `FR-ANA-09 & FR-AIS-13: Che thông tin cá nhân khách hàng (PII masking) trong danh sách đơn hàng`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thiếu Route Handler `app/api/reseller/commissions/route.ts`
- **Các bước tái hiện:**
  1. Gửi request `GET /api/reseller/commissions`.
- **Kết quả mong đợi (SRS v1.1):**
  - Trả về tổng tiền hoa hồng nhóm theo 4 trạng thái: `pending_confirmation` (Chờ xác nhận), `confirmed` (Đã xác nhận), `payable` (Chi trả được), `paid` (Đã chi trả).
  - Trả về danh sách booking của Reseller, trong đó thông tin khách hàng (SĐT, Email, Tên) phải được che (PII masking, ví dụ: `09****5678`).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có endpoint phục vụ.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /quản lý hoa hồng|báo cáo hoa hồng/i })
    Error: element(s) not found
    ```

---

#### 8. BUG-BE-RES-08: Thiếu API lưu trữ & cập nhật Thông tin nhận hoa hồng (Payout Settings)
- **Bug ID:** `BUG-BE-RES-08`
- **Vị trí phụ trách:** Backend / API Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thông tin nhận tiền - `FR-RES-14`, `RULE-17`
- **Test Case liên quan:** `FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, số tài khoản, tên chủ thẻ, MST)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu Route Handler `app/api/reseller/payout-settings/route.ts`
- **Các bước tái hiện:**
  1. Gửi request `GET /api/reseller/payout-settings` hoặc `POST /api/reseller/payout-settings` với body `{ bank_name, account_number, account_holder, tax_id }`.
- **Kết quả mong đợi (SRS v1.1):** Endpoint xác thực session của Reseller, kiểm tra định dạng và lưu an toàn thông tin tài khoản ngân hàng nhận tiền.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có endpoint nào tồn tại (`404`).
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /thông tin nhận tiền|tài khoản nhận hoa hồng/i })
    Error: element(s) not found
    ```

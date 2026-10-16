# BÁO CÁO LỖI KIỂM THỬ E2E UI - PHÂN HỆ RESELLER PORTAL
## DÀNH CHO: FRONTEND DEVELOPER (FE)
**Dự án:** AI Travel Reseller Network  
**Tài liệu đối chiếu:** SRS v1.1 & BRD v1.0  
**Người lập báo cáo:** Senior QA Automation Engineer  
**Bộ test tự động:** `tests/reseller.spec.ts`  
**Ngày thực hiện:** 16/10/2026  

---

### TỔNG QUAN TÌNH TRẠNG FRONTEND
Qua quá trình khảo sát codebase và chạy bộ kiểm thử tự động E2E UI tại `tests/reseller.spec.ts`, phân hệ **Reseller Portal** phía Frontend hiện chỉ có màn hình danh sách chiến dịch (`/reseller/campaigns`) và chi tiết chiến dịch (`/reseller/campaigns/[id]`). Toàn bộ các màn hình nghiệp vụ trọng yếu khác theo SRS v1.1 (Hồ sơ Reseller, Tài khoản MXH, Cam kết tuân thủ, Khai báo bài đăng & số liệu tự khai, Dashboard hiệu suất 5 chỉ số, Quản lý hoa hồng 4 trạng thái, Khai báo tài khoản nhận tiền) **hoàn toàn chưa được xây dựng giao diện** hoặc đang thiếu trường dữ liệu, thiếu bộ lọc và nhãn bắt buộc.

---

### DANH SÁCH CHI TIẾT CÁC BUG FRONTEND

---

#### 1. BUG-FE-RES-01: Form đăng ký Reseller thiếu các trường thông tin nghiệp vụ bắt buộc theo SRS
- **Bug ID:** `BUG-FE-RES-01`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Đăng ký tài khoản Reseller - `FR-RES-01`
- **Test Case liên quan:** `FR-RES-01: Form đăng ký Reseller phải cung cấp đầy đủ thông tin: họ tên, email, SĐT, địa điểm, sở thích, ngôn ngữ`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [auth-form.tsx](file:///d:/ai-travel-reseller/src/components/auth/auth-form.tsx#L71-L185)
- **Các bước tái hiện:**
  1. Mở trình duyệt, truy cập trang đăng ký: `http://127.0.0.1:3100/register?role=reseller`.
  2. Quan sát form đăng ký của vai trò Cộng tác viên (Reseller).
- **Kết quả mong đợi (SRS v1.1):** Form đăng ký Reseller phải cho phép nhập đầy đủ: Họ tên, Email, Mật khẩu, Số điện thoại, Địa điểm hoạt động, Sở thích ngách du lịch, Ngôn ngữ sáng tạo nội dung.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Form chỉ có 4 trường: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu. Thiếu hoàn toàn các trường: Số điện thoại, Địa điểm, Sở thích, Ngôn ngữ.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel('Số điện thoại', { exact: false })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 2. BUG-FE-RES-02: Chưa có màn hình quản lý Hồ sơ Reseller (Profile)
- **Bug ID:** `BUG-FE-RES-02`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hồ sơ Reseller & Trạng thái tài khoản - `FR-RES-01`
- **Test Case liên quan:** `FR-RES-01: Màn hình Hồ sơ Reseller cho phép cập nhật thông tin và hiển thị trạng thái (Chờ duyệt / Đã duyệt / Bị đình chỉ)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/profile/page.tsx` và component `src/components/reseller/profile.tsx`
- **Các bước tái hiện:**
  1. Đăng nhập với tài khoản Reseller.
  2. Điều hướng đến URL `http://127.0.0.1:3100/reseller/profile`.
- **Kết quả mong đợi (SRS v1.1):** Hiển thị màn hình thông tin cá nhân của Reseller, cho phép xem/sửa SĐT, địa điểm, sở thích, ngôn ngữ và hiển thị huy hiệu trạng thái tài khoản (`Chờ duyệt`, `Đã duyệt`, `Bị đình chỉ`).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trang trả về `404 Not Found`. Không có component giao diện nào.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /hồ sơ|thông tin cá nhân/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 3. BUG-FE-RES-03: Chưa có màn hình khai báo & quản lý Tài khoản Mạng xã hội (TikTok/Facebook)
- **Bug ID:** `BUG-FE-RES-03`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Quản lý tài khoản MXH & Bảo mật - `FR-RES-02`, `RULE-17`
- **Test Case liên quan:** `FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội (TikTok/FB) với chỉ số tự khai, TUYỆT ĐỐI không có ô nhập mật khẩu MXH`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/social-accounts/page.tsx` và component tương ứng
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/reseller/social-accounts`.
- **Kết quả mong đợi (SRS v1.1 & RULE-17):**
  - Hiển thị danh sách kênh TikTok/Facebook đã liên kết kèm trạng thái `Chờ duyệt`.
  - Có modal/form "Thêm tài khoản" với các trường: Nền tảng, Username, URL kênh, Số follower, Lượt xem trung bình, Tỷ lệ tương tác tự khai.
  - TUYỆT ĐỐI KHÔNG có ô nhập mật khẩu tài khoản mạng xã hội.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trả về `404 Not Found`. Reseller không có cách nào khai báo kênh mạng xã hội trên giao diện.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /tài khoản mạng xã hội|liên kết mxh/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 4. BUG-FE-RES-04: Thiếu khu vực cam kết 4 điều khoản tuân thủ bắt buộc khi đăng ký/tham gia
- **Bug ID:** `BUG-FE-RES-04`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Điều khoản tuân thủ Reseller - `FR-RES-04`, `RULE-14`
- **Test Case liên quan:** `FR-RES-04 & RULE-14: Hiển thị đầy đủ 4 điều khoản tuân thủ bắt buộc cam kết trước khi tham gia`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** [auth-form.tsx](file:///d:/ai-travel-reseller/src/components/auth/auth-form.tsx#L71-L185) và [campaign-feed.tsx](file:///d:/ai-travel-reseller/src/components/reseller/campaign-feed.tsx)
- **Các bước tái hiện:**
  1. Vào trang đăng ký `http://127.0.0.1:3100/register?role=reseller` hoặc bấm tham gia chiến dịch.
  2. Tìm kiếm phần cam kết tuân thủ quy tắc cộng đồng Reseller.
- **Kết quả mong đợi (SRS v1.1 & RULE-14):** Bắt buộc hiển thị checkbox/modal yêu cầu Reseller đồng ý 4 điều khoản: (1) Người thật vận hành, (2) Gắn nhãn quảng cáo/tài trợ, (3) Không đăng trùng nguyên bản, (4) Không giả mạo đánh giá.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Giao diện không có bất kỳ checkbox hoặc văn bản cam kết 4 điều khoản tuân thủ nào.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: locator('[data-testid="reseller-compliance-terms"], .compliance-terms, fieldset:has-text("tuân thủ")')
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 5. BUG-FE-RES-05: Thẻ chiến dịch trên Feed thiếu hiển thị Giá sản phẩm và Thu nhập tiềm năng
- **Bug ID:** `BUG-FE-RES-05`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Campaign Feed - `FR-RES-05`, `FR-CMP-02`
- **Test Case liên quan:** `FR-RES-05 & FR-CMP-02: Feed hiển thị đầy đủ: tên, sản phẩm, giá bán, hoa hồng, số nội dung gợi ý, thu nhập tiềm năng`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** [campaign-feed.tsx](file:///d:/ai-travel-reseller/src/components/reseller/campaign-feed.tsx#L32-L76)
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/preview/reseller` hoặc `/reseller/campaigns`.
  2. Quan sát thẻ chiến dịch (`CampaignCard`).
- **Kết quả mong đợi (SRS v1.1):** Thẻ chiến dịch phải hiển thị: Tên chiến dịch, Danh mục, Địa điểm, Hoa hồng (%), Số nội dung gợi ý, **Giá bán sản phẩm (VND)** và **Thu nhập tiềm năng (Estimated Earning)** để kích thích Reseller lựa chọn.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Thẻ chiến dịch chỉ có Danh mục, Tên, Địa điểm, Tỷ lệ hoa hồng và số bài. Thiếu hoàn toàn Giá bán sản phẩm và Thu nhập tiềm năng.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByTestId('product-price').or(getByText(/đ|vnđ|giá/i))
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 6. BUG-FE-RES-06: Thiếu bước chọn kênh MXH và không hiển thị Mã Voucher riêng khi tham gia campaign
- **Bug ID:** `BUG-FE-RES-06`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Tham gia Campaign & Attribution - `FR-RES-06`, `FR-TRK-01`, `FR-ATT-01`
- **Test Case liên quan:** `FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia chiến dịch <= 3 thao tác, chọn tài khoản MXH, cấp Tracking Link riêng và Mã Voucher riêng`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [tracking-link.tsx](file:///d:/ai-travel-reseller/src/components/reseller/tracking-link.tsx#L40-L100)
- **Các bước tái hiện:**
  1. Vào chi tiết chiến dịch `http://127.0.0.1:3100/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111`.
  2. Bấm nút "Tạo link".
  3. Quan sát modal tạo link tiếp thị.
- **Kết quả mong đợi (SRS v1.1):**
  - Trong modal, Reseller phải được chọn tài khoản MXH (TikTok/FB) sẽ dùng để phân phối chiến dịch này.
  - Sau khi xác nhận (<= 3 thao tác), modal phải cấp cả **Tracking Link riêng** (`/r/<tracking_id>`) và **Mã Voucher riêng** (Unique Voucher Code) để khách mua offline/cross-channel có thể áp dụng.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Modal không có dropdown chọn tài khoản MXH.
  - Modal chỉ cấp link rút gọn, không hiển thị bất kỳ ô/mã voucher nào.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel(/tài khoản mxh|chọn kênh phân phối/i).or(getByTestId('select-social-account'))
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 7. BUG-FE-RES-07: Thư viện Content Kit thiếu bộ lọc Độ dài (15s/30s/60s) và Funnel Stage
- **Bug ID:** `BUG-FE-RES-07`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thư viện nội dung Content Kit - `FR-RES-07`, `FR-QC-06`
- **Test Case liên quan:** `FR-RES-07 & FR-QC-06: Thư viện nội dung có bộ lọc theo Persona, Độ dài (15s, 30s, 60s) và Funnel Stage`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** [content-kit.tsx](file:///d:/ai-travel-reseller/src/components/reseller/content-kit.tsx#L74-L122)
- **Các bước tái hiện:**
  1. Vào trang chi tiết chiến dịch `http://127.0.0.1:3100/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111`.
  2. Cuộn xuống phần "Content Kit".
- **Kết quả mong đợi (SRS v1.1):** Cung cấp 3 bộ lọc cho nội dung: (1) Theo Persona, (2) Theo Độ dài (15s, 30s, 60s), (3) Theo Loại / Giai đoạn phễu (Discovery, Consideration, Conversion).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Hiện chỉ có bộ lọc Persona (`Local Guide`, `Foodie`, `Budget Traveler`, `Family`). Thiếu hoàn toàn bộ lọc Độ dài và Funnel Stage.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel(/độ dài|thời lượng/i).or(getByTestId('filter-duration'))
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 8. BUG-FE-RES-08: Thiếu nút "Tải video" và nút "Sao chép Hashtag" trên Content Kit
- **Bug ID:** `BUG-FE-RES-08`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Tải nội dung & Sao chép - `FR-RES-08`
- **Test Case liên quan:** `FR-RES-08: Hỗ trợ Tải video, Copy caption, CTA, hashtag kèm link và ghi nhận sự kiện (tracking event)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [content-kit.tsx](file:///d:/ai-travel-reseller/src/components/reseller/content-kit.tsx#L113-L119)
- **Các bước tái hiện:**
  1. Vào Content Kit của chiến dịch.
  2. Kiểm tra các nút hành động cho từng biến thể nội dung.
- **Kết quả mong đợi (SRS v1.1):** Có nút "Tải video" (kèm liên kết file video thành phẩm đã duyệt) và ô chứa bộ Hashtag đề xuất kèm nút "Copy Hashtag".
- **Kết quả thực tế & Error Log từ Playwright:**
  - Chỉ có các ô Copy Hook, Script, Caption, CTA. Không có nút Tải video và không có trường Hashtag.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('button', { name: /tải video|download video/i }).or(getByTestId('download-video-btn'))
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 9. BUG-FE-RES-09: Hoàn toàn thiếu tính năng "Bộ câu trả lời soạn sẵn" (Quick Replies)
- **Bug ID:** `BUG-FE-RES-09`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Câu trả lời soạn sẵn - `FR-RES-09`
- **Test Case liên quan:** `FR-RES-09: Hiển thị bộ câu trả lời soạn sẵn (giá, địa điểm, cách đặt) kèm tracking link và cho phép copy`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [campaign-detail.tsx](file:///d:/ai-travel-reseller/src/components/reseller/campaign-detail.tsx)
- **Các bước tái hiện:**
  1. Vào chi tiết chiến dịch bất kỳ trên portal Reseller.
- **Kết quả mong đợi (SRS v1.1):** Hiển thị khối "Bộ câu trả lời soạn sẵn" cho các thắc mắc thường gặp của khách hàng trên mạng xã hội (về Giá vé, Địa điểm du lịch, Hướng dẫn cách đặt qua tracking link) và nút 1-click Copy.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có component hoặc phần nội dung nào về câu trả lời soạn sẵn trên giao diện.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: locator('[data-testid="quick-replies-section"], section:has-text("câu trả lời soạn sẵn"), section:has-text("hỏi đáp nhanh")')
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 10. BUG-FE-RES-10: Chưa có màn hình khai báo URL bài đăng và liên kết nội dung
- **Bug ID:** `BUG-FE-RES-10`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng - `FR-RES-10`
- **Test Case liên quan:** `FR-RES-10: Form khai báo URL bài đăng trên TikTok/Facebook và liên kết biến thể nội dung đã dùng`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/posts/declare/page.tsx`
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/reseller/posts/declare`.
- **Kết quả mong đợi (SRS v1.1):** Màn hình cho phép Reseller dán URL bài đăng công khai trên TikTok/Facebook, chọn chiến dịch và biến thể nội dung đã dùng để đăng.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trả về `404 Not Found`.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /khai báo bài đăng|báo cáo bài đăng/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 11. BUG-FE-RES-11: Chưa có form khai báo số liệu tương tác tự khai kèm ảnh bằng chứng và nhãn "Tự khai"
- **Bug ID:** `BUG-FE-RES-11`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Số liệu tự khai & RULE-13 - `FR-RES-11`, `RULE-13`
- **Test Case liên quan:** `FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, cmt, share, save) kèm ảnh bằng chứng, bắt buộc gắn nhãn 'Tự khai'`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu component form khai báo metrics trên Reseller Portal
- **Các bước tái hiện:**
  1. Tìm kiếm tính năng cập nhật số liệu bài đăng của Reseller.
- **Kết quả mong đợi (SRS v1.1 & RULE-13):**
  - Form nhập lượt xem, thích, bình luận, chia sẻ, lưu kèm nút đính kèm ảnh chụp màn hình.
  - Bắt buộc gắn nhãn **"Tự khai"** nổi bật và chú thích rõ: "Số liệu tự khai không dùng để tính hoa hồng".
- **Kết quả thực tế & Error Log từ Playwright:**
  - Hoàn toàn chưa có giao diện tính năng này.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel(/lượt xem|views/i)
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 12. BUG-FE-RES-12: Chưa xây dựng màn hình Dashboard Hiệu suất Reseller
- **Bug ID:** `BUG-FE-RES-12`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Dashboard Hiệu suất & Định dạng - `FR-RES-12`, `FR-ANA-06`, `FR-ANA-11`
- **Test Case liên quan:** `FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất hiển thị Click, Lead, Booking, GMV, Conversion Rate (N/A khi = 0), tiền tệ VND`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/dashboard/page.tsx` và `app/reseller/page.tsx` đang redirect thẳng sang `/reseller/campaigns`
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/reseller/dashboard` hoặc `/reseller`.
- **Kết quả mong đợi (SRS v1.1):**
  - Màn hình Dashboard hiển thị 5 chỉ số: Click, Lead, Booking, GMV (đơn vị VND), Tỷ lệ chuyển đổi (hiển thị `N/A` nếu chưa có click).
  - Bộ lọc theo chiến dịch, nội dung, tài khoản MXH.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Route `/reseller/dashboard` trả về `404 Not Found`. `app/reseller/page.tsx` chỉ redirect sang `/reseller/campaigns`.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /dashboard|báo cáo hiệu suất/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 13. BUG-FE-RES-13: Thiếu khối hiển thị tách biệt "Hệ thống ghi nhận" và "Reseller tự khai"
- **Bug ID:** `BUG-FE-RES-13`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Phân định dữ liệu - `FR-ANA-05`, `FR-ANA-10`
- **Test Case liên quan:** `FR-ANA-05 & FR-ANA-10: Tách biệt rõ ràng 2 cột/tab: 'Hệ thống ghi nhận' và 'Reseller tự khai'`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu UI phân chia dữ liệu thống kê
- **Các bước tái hiện:**
  1. Kiểm tra các báo cáo số liệu trên Reseller Portal.
- **Kết quả mong đợi (SRS v1.1):** Giao diện phải chia tách 2 cột hoặc 2 tab rõ ràng: (1) "Hệ thống ghi nhận" (cho clicks, bookings, GMV thực) và (2) "Reseller tự khai" (cho views, likes, shares do Reseller báo cáo).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Không có UI nào hiển thị hai khối này.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByText(/hệ thống ghi nhận/i)
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 14. BUG-FE-RES-14: Chưa có màn hình Dashboard Hoa hồng 4 trạng thái
- **Bug ID:** `BUG-FE-RES-14`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Quản lý hoa hồng - `FR-RES-13`
- **Test Case liên quan:** `FR-RES-13: Dashboard hoa hồng hiển thị 4 trạng thái (Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả) và danh sách booking`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/commissions/page.tsx`
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/reseller/commissions`.
- **Kết quả mong đợi (SRS v1.1):**
  - Hiển thị tổng tiền hoa hồng phân bổ theo 4 trạng thái: `Chờ xác nhận`, `Đã xác nhận`, `Chi trả được`, `Đã chi trả`.
  - Danh sách bảng các booking phát sinh hoa hồng.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trả về `404 Not Found`.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /quản lý hoa hồng|báo cáo hoa hồng/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 15. BUG-FE-RES-15: Chưa có màn hình khai báo thông tin nhận hoa hồng (Payout Settings)
- **Bug ID:** `BUG-FE-RES-15`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thông tin nhận tiền - `FR-RES-14`, `RULE-17`
- **Test Case liên quan:** `FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, số tài khoản, tên chủ thẻ, MST)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu route `app/reseller/payout-settings/page.tsx`
- **Các bước tái hiện:**
  1. Truy cập `http://127.0.0.1:3100/reseller/payout-settings`.
- **Kết quả mong đợi (SRS v1.1):** Màn hình cho phép Reseller nhập: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản, Mã số thuế cá nhân (nếu có).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trả về `404 Not Found`.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('heading', { name: /thông tin nhận tiền|tài khoản nhận hoa hồng/i })
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

---

#### 16. BUG-FE-RES-16: Thiếu cơ chế che thông tin cá nhân khách hàng (PII Masking)
- **Bug ID:** `BUG-FE-RES-16`
- **Vị trí phụ trách:** Frontend Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Bảo mật dữ liệu & Quyền riêng tư - `FR-ANA-09`, `FR-AIS-13`
- **Test Case liên quan:** `FR-ANA-09 & FR-AIS-13: Che thông tin cá nhân khách hàng (PII masking) trong danh sách đơn hàng`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu component bảng hiển thị đơn hàng/booking cho Reseller kèm hàm che dữ liệu nhạy cảm
- **Các bước tái hiện:**
  1. Truy cập danh sách booking của Reseller tại `/reseller/commissions`.
- **Kết quả mong đợi (SRS v1.1):** Khi hiển thị đơn hàng, thông tin khách hàng phải được che (ví dụ: `09****1234`, `n***@gmail.com`), tuyệt đối không hiển thị SĐT/email/họ tên đầy đủ của khách du lịch.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trang quản lý hoa hồng/đơn hàng chưa tồn tại (404), chưa có bất kỳ cơ chế masking nào trên UI.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByText(/bảo mật dữ liệu|thông tin khách đã được ẩn/i)
    Expected: visible
    Timeout: 3000ms
    Error: element(s) not found
    ```

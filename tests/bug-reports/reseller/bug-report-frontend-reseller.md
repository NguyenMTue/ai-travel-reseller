# BÁO CÁO LỖI KIỂM THỬ GIAO DIỆN (FRONTEND BUG REPORT) - PHÂN HỆ RESELLER PORTAL
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** Reseller Portal  
**Người phụ trách báo cáo:** Senior QA Automation Engineer  
**Đối tượng nhận xử lý:** Frontend Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 15/10/2026  

---

## TỔNG QUAN
Sau khi thực hiện rà soát source code giao diện và chạy bộ kiểm thử E2E UI tại `tests/reseller.spec.ts`, QA phát hiện **14 lỗi và thiếu sót** nghiêm trọng trên Frontend liên quan đến quy trình đăng ký, hồ sơ, bộ lọc nội dung, luồng tham gia chiến dịch và các màn hình Dashboard/Hoa hồng của Cộng tác viên (Reseller).

---

## DANH SÁCH CHI TIẾT CÁC BUG

### 1. BUG-FE-RES-00: File `playwright.config.ts` bị hardcode `testMatch: "frontend.spec.ts"`, chặn chạy file test `tests/reseller.spec.ts`
- **Bug ID:** `BUG-FE-RES-00`
- **Vị trí phụ trách:** Frontend Dev / Lead
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Test Automation Configuration
- **Test Case liên quan trong `tests/reseller.spec.ts`:** Toàn bộ test suite `tests/reseller.spec.ts`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `playwright.config.ts` (dòng 4) & `playwright.reseller.config.ts` (dòng 8)
- **Các bước tái hiện (Steps to Reproduce):**
  1. Mở terminal tại thư mục gốc dự án.
  2. Chạy lệnh: `npx playwright test tests/reseller.spec.ts`.
- **Kết quả mong đợi (Expected Result):** Playwright nhận diện và thực thi các test cases trong `tests/reseller.spec.ts`.
- **Kết quả thực tế (Actual Result & Error Log):**
  ```text
  Error: No tests found.
  Make sure that arguments are regular expressions matching test files.
  You may need to escape symbols like "$" or "*" and quote the arguments.
  ```
  *Nguyên nhân:* Commit `3cb73874` ("feat(fe): checkpoint week 2 integration before dev merge") đã hardcode `testMatch: "frontend.spec.ts"` ở root config, loại bỏ mọi file test khác.

---

### 2. BUG-FE-RES-01: Form Đăng ký Reseller thiếu các trường SĐT, Địa điểm, Sở thích, Ngôn ngữ
- **Bug ID:** `BUG-FE-RES-01`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Đăng ký / Hồ sơ Reseller - `FR-RES-01`
- **Test Case liên quan:** `TC-RES-01 [FR-RES-01]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `src/components/auth/auth-form.tsx` (dòng 98–110)
- **Các bước tái hiện:**
  1. Truy cập URL `/register`.
  2. Chọn radio "Cộng tác viên".
  3. Quan sát các trường nhập liệu xuất hiện trên form.
- **Kết quả mong đợi:** Form phải cung cấp các ô nhập liệu: Số điện thoại (`phone`), Địa điểm hoạt động (`location`), Sở thích/Thế mạnh (`interests`), Ngôn ngữ hỗ trợ (`languages`) theo chuẩn SRS v1.1 `FR-RES-01`.
- **Kết quả thực tế:** Form chỉ có 4 trường cơ bản: Họ và tên (`full_name`), Email (`email`), Mật khẩu (`password`), Xác nhận mật khẩu (`confirm_password`). Thiếu hoàn toàn các trường nghiệp vụ của Reseller.

---

### 3. BUG-FE-RES-02: Chưa có màn hình quản lý hồ sơ và liên kết tài khoản MXH (TikTok/Facebook)
- **Bug ID:** `BUG-FE-RES-02`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hồ sơ & Tài khoản mạng xã hội - `FR-RES-02`, `RULE-17`
- **Test Case liên quan:** `TC-RES-02 [FR-RES-02, RULE-17]`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/` (chưa có route `/reseller/profile` hoặc `/reseller/social-accounts`)
- **Các bước tái hiện:**
  1. Đăng nhập với vai trò Reseller.
  2. Điều hướng tới `/reseller/profile` hoặc tìm menu quản lý tài khoản mạng xã hội.
- **Kết quả mong đợi:** Hiển thị màn hình hồ sơ cá nhân và danh sách tài khoản TikTok/Facebook kèm form liên kết (Platform, Username, URL, Followers, Lượt xem TB, Tỷ lệ tương tác tự khai). Form TUYỆT ĐỐI không có ô nhập mật khẩu MXH (`RULE-17`). Tài khoản mới liên kết hiển thị trạng thái "Chờ duyệt".
- **Kết quả thực tế:** Route `/reseller/profile` trả về 404 Not Found. Phân hệ Reseller hiện chỉ có 2 trang là `campaigns` và `campaigns/[id]`.

---

### 4. BUG-FE-RES-03: Form Đăng ký Reseller thiếu checkbox cam kết điều khoản tuân thủ nội dung
- **Bug ID:** `BUG-FE-RES-03`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Điều khoản tuân thủ - `FR-RES-04`, `RULE-14`
- **Test Case liên quan:** `TC-RES-03 [FR-RES-04, RULE-14]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `src/components/auth/auth-form.tsx`
- **Các bước tái hiện:**
  1. Truy cập `/register` và chọn vai trò "Cộng tác viên".
  2. Kiểm tra phần xác nhận điều khoản trước nút "Tạo tài khoản".
- **Kết quả mong đợi:** Phải có checkbox bắt buộc cam kết 4 quy tắc tuân thủ: Người thật vận hành, Gắn nhãn quảng cáo, Không đăng trùng nguyên bản, Không giả mạo đánh giá (`RULE-14`). Chặn submit nếu chưa tích chọn.
- **Kết quả thực tế:** Không có checkbox hoặc điều khoản tuân thủ nào được hiển thị cho vai trò Reseller.

---

### 5. BUG-FE-RES-04: Thẻ chiến dịch (Campaign Card) thiếu Giá sản phẩm, Số nội dung gợi ý và Thu nhập tiềm năng
- **Bug ID:** `BUG-FE-RES-04`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Campaign Feed - `FR-RES-05`, `FR-CMP-02`
- **Test Case liên quan:** `TC-RES-05 [FR-RES-05, FR-CMP-02]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/campaign-feed.tsx` (dòng 70–130) & `src/lib/reseller/campaign-feed.ts` (dòng 33–36)
- **Các bước tái hiện:**
  1. Truy cập `/preview/reseller` (hoặc `/reseller/campaigns`).
  2. Quan sát các thông tin hiển thị trên từng thẻ chiến dịch (`[data-testid="campaign-card"]`).
- **Kết quả mong đợi:** Mỗi thẻ phải hiển thị đầy đủ: Tên chiến dịch, Sản phẩm liên kết, Giá bán (VND), Tỷ lệ hoa hồng (%), Số nội dung gợi ý (đã duyệt), và Thu nhập tiềm năng ước tính (Giá x Tỷ lệ hoa hồng).
- **Kết quả thực tế:** Thẻ chiến dịch chỉ hiển thị Tên, Địa điểm, Danh mục và Hoa hồng. Không hiển thị Giá sản phẩm, biến `approvedContentCount` bị gán `null`, và không có trường tính toán Thu nhập tiềm năng.

---

### 6. BUG-FE-RES-05: Thiếu chọn tài khoản MXH khi tham gia campaign và UI không hiển thị Unique Voucher Code
- **Bug ID:** `BUG-FE-RES-05`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Tham gia Campaign & Attribution - `FR-RES-06`, `FR-TRK-01`, `FR-ATT-01`
- **Test Case liên quan:** `TC-RES-07 [FR-RES-06, FR-TRK-01, FR-ATT-01]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/tracking-link.tsx` (dòng 79–105)
- **Các bước tái hiện:**
  1. Truy cập chi tiết chiến dịch `/preview/reseller/campaigns/[id]`.
  2. Nhấn nút "Tạo link".
  3. Quan sát modal hiển thị.
- **Kết quả mong đợi:**
  - Quy trình trong tối đa 3 thao tác: (1) Nhấn tham gia -> (2) Chọn tài khoản TikTok/Facebook tham gia -> (3) Nhấn xác nhận.
  - Cửa sổ kết quả phải hiển thị đồng thời cả **Tracking Link riêng** (`/r/<tracking_id>`) và **Mã Voucher riêng** (Unique Voucher Code).
- **Kết quả thực tế:** Modal chỉ có nút tạo link trực tiếp, không cho chọn tài khoản MXH tham gia; kết quả trả về chỉ có link tiếp thị và mã QR, hoàn toàn không có Mã Voucher.

---

### 7. BUG-FE-RES-06: Content Kit thiếu bộ lọc theo Độ dài video và Funnel Stage
- **Bug ID:** `BUG-FE-RES-06`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thư viện nội dung - `FR-RES-07`, `FR-QC-06`
- **Test Case liên quan:** `TC-RES-09 [FR-RES-07]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/content-kit.tsx` (dòng 83–95)
- **Các bước tái hiện:**
  1. Mở trang chi tiết chiến dịch `/preview/reseller/campaigns/[id]`.
  2. Di chuyển đến phần "Content Kit".
- **Kết quả mong đợi:** Có 3 bộ lọc độc lập:
  1. Bộ lọc Persona (4 personas: Chuyên gia bản địa, Gia đình, Tín đồ ẩm thực, Săn deal).
  2. Bộ lọc độ dài video: 15s, 30s, 60s.
  3. Bộ lọc giai đoạn phễu: Discovery, Consideration, Conversion.
- **Kết quả thực tế:** Giao diện chỉ có bộ lọc Persona dạng các nút bấm tab. Không có bộ lọc độ dài video và không có bộ lọc Funnel Stage.

---

### 8. BUG-FE-RES-07: Content Kit thiếu nút "Tải video" sáng tạo
- **Bug ID:** `BUG-FE-RES-07`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Tải về tài nguyên nội dung - `FR-RES-08`
- **Test Case liên quan:** `TC-RES-10 [FR-RES-08]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/content-kit.tsx` (dòng 113–118)
- **Các bước tái hiện:**
  1. Mở Content Kit của một biến thể nội dung đã duyệt.
  2. Tìm kiếm chức năng tải tài nguyên video.
- **Kết quả mong đợi:** Có nút "Tải video" (kèm preview video nếu có) để Reseller tải file `.mp4`/`.mov` về máy phục vụ đăng bài thủ công lên MXH.
- **Kết quả thực tế:** Giao diện chỉ có các nút copy text (Copy Hook, Copy Script, Copy Caption, Copy CTA, Copy CTA kèm link). Không có nút hoặc liên kết tải video.

---

### 9. BUG-FE-RES-08: Thiếu Thư viện câu trả lời soạn sẵn (Canned Responses)
- **Bug ID:** `BUG-FE-RES-08`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hỗ trợ bán hàng Reseller - `FR-RES-09`
- **Test Case liên quan:** `TC-RES-11 [FR-RES-09]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/content-kit.tsx` & `src/components/reseller/campaign-detail.tsx`
- **Các bước tái hiện:**
  1. Mở trang chi tiết chiến dịch `/reseller/campaigns/[id]`.
  2. Tìm khu vực câu trả lời soạn sẵn.
- **Kết quả mong đợi:** Có mục "Câu trả lời soạn sẵn" cung cấp các mẫu phản hồi nhanh cho bình luận/tin nhắn thường gặp: Hỏi về giá, Hỏi địa điểm, Cách thức đặt mua; các mẫu này tự động gắn kèm link tiếp thị của Reseller và có nút Copy nhanh.
- **Kết quả thực tế:** Chưa xây dựng component Canned Responses.

---

### 10. BUG-FE-RES-09: Thiếu màn hình Khai báo bài đăng (Post Declaration)
- **Bug ID:** `BUG-FE-RES-09`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng - `FR-RES-10`
- **Test Case liên quan:** `TC-RES-12 [FR-RES-10]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/`
- **Các bước tái hiện:**
  1. Tìm kiếm chức năng khai báo bài đăng đã xuất bản.
- **Kết quả mong đợi:** Có giao diện cho phép Reseller dán URL bài đăng (TikTok/Facebook) và chọn liên kết với biến thể Content Kit đã sử dụng.
- **Kết quả thực tế:** Không có màn hình hoặc modal nào hỗ trợ tính năng này.

---

### 11. BUG-FE-RES-10: Thiếu form Khai báo số liệu tương tác và nhãn "Tự khai"
- **Bug ID:** `BUG-FE-RES-10`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Số liệu tự khai - `FR-RES-11`, `RULE-13`
- **Test Case liên quan:** `TC-RES-13 [FR-RES-11, RULE-13]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/`
- **Các bước tái hiện:**
  1. Tìm kiếm tính năng cập nhật lượt xem, thích, bình luận, chia sẻ, lưu kèm ảnh chụp màn hình.
- **Kết quả mong đợi:** Form nhập các chỉ số tương tác, nút upload ảnh screenshot bằng chứng; hiển thị nhãn nổi bật "Tự khai" tại mọi nơi hiển thị số liệu này và có ghi chú "Không tính vào hoa hồng".
- **Kết quả thực tế:** Chưa được lập trình trên giao diện.

---

### 12. BUG-FE-RES-11: Chưa có màn hình Dashboard Hiệu suất Reseller
- **Bug ID:** `BUG-FE-RES-11`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Dashboard Hiệu suất - `FR-RES-12`, `FR-ANA-05`, `FR-ANA-06`, `FR-ANA-10`, `FR-ANA-11`
- **Test Case liên quan:** `TC-RES-14`, `TC-RES-15`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/` (chưa có route `/reseller/dashboard`)
- **Các bước tái hiện:**
  1. Truy cập URL `/reseller/dashboard`.
- **Kết quả mong đợi:** Dashboard hiển thị: Click, Lead, Booking, GMV, Tỷ lệ chuyển đổi (hiển thị "N/A" nếu Click = 0), tiền tệ VND, múi giờ `Asia/Ho_Chi_Minh`. Tách biệt thành 2 khối rõ ràng: "Hệ thống ghi nhận" và "Reseller tự khai".
- **Kết quả thực tế:** Route `/reseller/dashboard` trả về 404 Not Found.

---

### 13. BUG-FE-RES-12: Chưa có màn hình Dashboard Quản lý Hoa hồng theo 4 trạng thái
- **Bug ID:** `BUG-FE-RES-12`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Quản lý hoa hồng - `FR-RES-13`, `FR-ANA-09`
- **Test Case liên quan:** `TC-RES-16`, `TC-RES-18`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/` (chưa có route `/reseller/commissions`)
- **Các bước tái hiện:**
  1. Truy cập URL `/reseller/commissions`.
- **Kết quả mong đợi:** Giao diện hiển thị hoa hồng chia theo 4 tab/khối trạng thái: "Chờ xác nhận", "Đã xác nhận", "Chi trả được", "Đã chi trả", kèm bảng danh sách các booking được ghi nhận (đã che thông tin cá nhân khách hàng PII).
- **Kết quả thực tế:** Route không tồn tại (404 Not Found).

---

### 14. BUG-FE-RES-13: Chưa có màn hình Khai báo thông tin nhận tiền hoa hồng
- **Bug ID:** `BUG-FE-RES-13`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thông tin thanh toán - `FR-RES-14`, `RULE-17`
- **Test Case liên quan:** `TC-RES-17 [FR-RES-14, RULE-17]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/reseller/` (chưa có route `/reseller/payout-settings`)
- **Các bước tái hiện:**
  1. Tìm kiếm trang cấu hình tài khoản nhận tiền hoa hồng.
- **Kết quả mong đợi:** Form nhập: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản, Mã số thuế.
- **Kết quả thực tế:** Chưa được xây dựng trên giao diện.

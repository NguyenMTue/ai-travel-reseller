# BỘ TEST CASES PWA MOBILE — AI TRAVEL RESELLER NETWORK
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** PWA Mobile Responsive & Mobile Reseller Portal  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Người thiết kế:** Senior QA Engineer  
**Phiên bản:** v1.0.0 — Sprint 3  
**Quy ước trạng thái tiến độ:**  
- `[Ready - Đã phát triển]`: Tính năng đã được Dev triển khai mã nguồn trong dự án (sẵn sàng kiểm thử giao diện / API / logic).  
- `[Pending - Chưa phát triển]`: Tính năng thuộc mục tiêu Sprint 3 hoặc SRS v1.1 nhưng Dev chưa code xong ở thời điểm hiện tại.  

---

## 1. TỔNG QUAN MA TRẬN TEST CASES

| Nhóm chức năng | Số lượng kịch bản | Đã phát triển [Ready] | Chưa phát triển [Pending] | Mức độ ưu tiên (P0 / P1 / P2) |
| :--- | :---: | :---: | :---: | :---: |
| **Nhóm 1: Cấu hình PWA & Khả năng cài đặt (PWA Core & Manifest)** | 5 | 2 | 3 | 3 P0, 2 P1, 0 P2 |
| **Nhóm 2: Giao diện & Điều hướng Mobile (Mobile Responsive Layout & Navigation)** | 7 | 6 | 1 | 5 P0, 2 P1, 0 P2 |
| **Nhóm 3: Luồng nghiệp vụ Reseller & Ví Reseller trên PWA Mobile** | 9 | 4 | 5 | 6 P0, 3 P1, 0 P2 |
| **Nhóm 4: Trải nghiệm Khách hàng trên Mobile (Redirect, Tracking, Chat AI)** | 5 | 5 | 0 | 4 P0, 1 P1, 0 P2 |
| **TỔNG CỘNG** | **26** | **17** | **9** | **18 P0, 8 P1, 0 P2** |

---

## 2. BẢNG CHI TIẾT TỪNG TEST CASE (DETAILED TEST CASES)

### NHÓM 1: CẤU HÌNH PWA & KHẢ NĂNG CÀI ĐẶT (PWA CORE & MANIFEST)

#### `TC-PWA-01`
- **Mã kịch bản:** `TC-PWA-01`
- **Nhóm chức năng:** Nhóm 1: Cấu hình PWA & Khả năng cài đặt
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra sự tồn tại và tính hợp lệ của Web App Manifest (`manifest.json` hoặc `manifest.webmanifest`)
- **Thiết bị / Viewport:** Pixel 5 (`393x851`), iPhone 13 (`390x844`)
- **Tiền điều kiện:** Ứng dụng web đang chạy trên môi trường test / dev.
- **Các bước thực hiện:**
  1. Gửi request `GET /manifest.json` hoặc `GET /manifest.webmanifest`.
  2. Kiểm tra header `Content-Type` trả về.
  3. Thẩm định nội dung JSON của file manifest: kiểm tra các trường bắt buộc `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color`, và mảng `icons`.
  4. Kiểm tra sự tồn tại thực tế của các file icon được khai báo trong thư mục `public/`.
- **Dữ liệu đầu vào:** URL manifest: `/manifest.json`
- **Kết quả mong đợi:** 
  - File manifest trả về HTTP 200, Content-Type `application/manifest+json`.
  - `name`: "TravelLink AI — Kết nối trải nghiệm Việt".
  - `short_name`: "TravelLink".
  - `display`: "standalone".
  - `theme_color`: "#204e4c", `background_color`: "#faf9f5".
  - Có đủ icon kích thước `192x192` và `512x512`, tất cả các file ảnh icon đều tồn tại và trả về HTTP 200.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-02`
- **Mã kịch bản:** `TC-PWA-02`
- **Nhóm chức năng:** Nhóm 1: Cấu hình PWA & Khả năng cài đặt
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra khai báo thẻ meta Viewport ngăn chặn tình trạng hiển thị desktop zoom-out trên trình duyệt di động
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`), iPhone SE (`375x667`)
- **Tiền điều kiện:** Mở trang web bất kỳ trên môi trường test.
- **Các bước thực hiện:**
  1. Truy cập trang chủ `/` bằng trình duyệt di động hoặc Playwright mobile context.
  2. Mở mã nguồn HTML (Elements) và tìm thẻ `<meta name="viewport">` trong thẻ `<head>`.
  3. Kiểm tra thuộc tính `content` của thẻ meta viewport.
- **Dữ liệu đầu vào:** Route: `/`
- **Kết quả mong đợi:** Thẻ `<meta name="viewport" content="width=device-width, initial-scale=1">` hoặc export `viewport` của Next.js hiện diện trong `<head>`, đảm bảo trang web tự động thích ứng với kích thước thiết bị mà không bị co cụm chế độ máy tính (desktop view).
- **Độ ưu tiên:** `P0`

#### `TC-PWA-03`
- **Mã kịch bản:** `TC-PWA-03`
- **Nhóm chức năng:** Nhóm 1: Cấu hình PWA & Khả năng cài đặt
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra các thẻ meta Apple Mobile Web App trên Safari iOS
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), iPhone SE (`375x667`)
- **Tiền điều kiện:** Mở trang trên Safari Mobile hoặc mô phỏng WebKit.
- **Các bước thực hiện:**
  1. Truy cập `/` hoặc `/reseller/campaigns`.
  2. Kiểm tra các thẻ meta dành riêng cho Apple trong `<head>`:
     - `<meta name="apple-mobile-web-app-capable" content="yes">`
     - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
     - `<link rel="apple-touch-icon" href="...">`
- **Dữ liệu đầu vào:** Route: `/reseller/campaigns`
- **Kết quả mong đợi:** Các thẻ Apple meta tags hiện diện đầy đủ, giúp ứng dụng khi được lưu vào màn hình chính trên iOS có thanh trạng thái hòa hợp và icon đại diện sắc nét.
- **Độ ưu tiên:** `P1`

#### `TC-PWA-04`
- **Mã kịch bản:** `TC-PWA-04`
- **Nhóm chức năng:** Nhóm 1: Cấu hình PWA & Khả năng cài đặt
- **Mã SRS / RULE:** `NFR-PERF-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra đăng ký Service Worker và tải trang ở chế độ Offline cơ bản (Offline Fallback)
- **Thiết bị / Viewport:** Pixel 5 (`393x851`), iPhone 13 (`390x844`)
- **Tiền điều kiện:** Ứng dụng đã đăng ký Service Worker.
- **Các bước thực hiện:**
  1. Mở ứng dụng web lần đầu để Service Worker kích hoạt và cache tài nguyên tĩnh (HTML shell, CSS, Fonts).
  2. Ngắt toàn bộ kết nối mạng (Bật chế độ máy bay hoặc Offline mode trong DevTools).
  3. Tải lại trang (F5/Reload).
- **Dữ liệu đầu vào:** Trạng thái mạng: Offline
- **Kết quả mong đợi:** Ứng dụng không bị màn hình báo mất mạng "No internet" màu trắng của trình duyệt, mà hiển thị trang thông báo Offline thân thiện kèm nút "Thử lại khi có mạng" hoặc hiển thị nội dung tĩnh đã được cache an toàn.
- **Độ ưu tiên:** `P1`

#### `TC-PWA-05`
- **Mã kịch bản:** `TC-PWA-05`
- **Nhóm chức năng:** Nhóm 1: Cấu hình PWA & Khả năng cài đặt
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra khả năng kích hoạt banner/lời nhắc "Thêm vào màn hình chính" (Add to Home Screen - A2HS)
- **Thiết bị / Viewport:** Pixel 5 (`393x851`) Chrome Mobile
- **Tiền điều kiện:** Người dùng truy cập trang Reseller Portal trên Chrome Android lần thứ 2 hoặc bấm nút cài đặt.
- **Các bước thực hiện:**
  1. Truy cập `/reseller/campaigns`.
  2. Bắt sự kiện `beforeinstallprompt`.
  3. Bấm nút hoặc banner "Cài đặt ứng dụng PWA".
  4. Xác nhận cài đặt trên hộp thoại hệ thống của Android.
- **Dữ liệu đầu vào:** Sự kiện `beforeinstallprompt`
- **Kết quả mong đợi:** Trình duyệt hiển thị lời nhắc cài đặt PWA thành công; icon TravelLink xuất hiện trên màn hình chính của điện thoại; khi bấm vào sẽ mở ứng dụng ở chế độ cửa sổ độc lập (standalone mode, không có thanh URL của trình duyệt).
- **Độ ưu tiên:** `P0`

---

### NHÓM 2: GIAO DIỆN & ĐIỀU HƯỚNG MOBILE (MOBILE RESPONSIVE LAYOUT & NAVIGATION)

#### `TC-PWA-06`
- **Mã kịch bản:** `TC-PWA-06`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khung nhìn Mobile Landing Page (`/`): Đảm bảo không tràn ngang (`scrollWidth <= clientWidth`) trên iPhone 13 và Small Mobile
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Small Mobile (`320x740`)
- **Tiền điều kiện:** Mở trang Landing Page.
- **Các bước thực hiện:**
  1. Mở trang chủ `/` trên viewport `390x844` và `320x740`.
  2. Chờ toàn bộ fonts và hình ảnh vector SVG load xong (`document.fonts.ready`).
  3. Thực hiện script kiểm tra: `document.documentElement.scrollWidth <= window.innerWidth`.
  4. Cuộn từ đầu trang đến chân trang (Hero, Features, How It Works, CTA, Footer).
- **Dữ liệu đầu vào:** Route: `/`
- **Kết quả mong đợi:** Biểu thức trả về `true` (không xuất hiện thanh cuộn ngang). Bố cục Hero, các card tính năng và footer tự động xếp chồng (single-column layout) gọn gàng, không bị vỡ chữ.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-07`
- **Mã kịch bản:** `TC-PWA-07`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `NFR-ACC-01`, `FR-RES-01`, `FR-MER-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khung nhìn Mobile Auth Pages (`/login`, `/register`): Card form căn giữa, không tràn màn hình, bàn phím ảo không che khuất nút submit
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), iPhone SE (`375x667`)
- **Tiền điều kiện:** Đang ở trạng thái chưa đăng nhập.
- **Các bước thực hiện:**
  1. Truy cập `/login` và `/register`.
  2. Kiểm tra `scrollWidth <= clientWidth`.
  3. Nhấn vào các ô nhập liệu Email, Mật khẩu để kích hoạt bàn phím ảo di động.
  4. Bấm nút "Hiện mật khẩu" / "Ẩn mật khẩu".
- **Dữ liệu đầu vào:** Route: `/login`, `/register`
- **Kết quả mong đợi:** Form đăng nhập/đăng ký hiển thị vừa vặn chiều rộng màn hình (padding 16px - 20px). Nút toggle hiển thị mật khẩu hoạt động tốt. Nút "Đăng nhập" / "Tạo tài khoản" luôn có thể bấm được mà không bị tràn màn hình.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-08`
- **Mã kịch bản:** `TC-PWA-08`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `FR-RES-05`, `NFR-ACC-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khung nhìn Mobile Reseller Feed (`/reseller/campaigns`, `/preview/reseller`): Grid cards co giãn 1 cột, không tràn ngang, bộ lọc dễ thao tác chạm
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`), Small Mobile (`320x740`)
- **Tiền điều kiện:** Truy cập danh sách chiến dịch Reseller.
- **Các bước thực hiện:**
  1. Mở `/preview/reseller` hoặc `/reseller/campaigns`.
  2. Kiểm tra điều kiện `scrollWidth <= clientWidth`.
  3. Thử nghiệm nhập từ khóa tìm kiếm vào ô "Tìm kiếm chiến dịch" và chọn dropdown "Mức hoa hồng".
  4. Quan sát danh sách Campaign Cards hiển thị.
- **Dữ liệu đầu vào:** Từ khóa: "Bà Nà", Filter: "Trên 10%"
- **Kết quả mong đợi:** Danh sách chiến dịch hiển thị dạng 1 cột (single column) rõ ràng. Thẻ chiến dịch chứa đầy đủ: Tên, Địa điểm, Danh mục, Mức hoa hồng lớn dễ đọc. Ô tìm kiếm và dropdown chiếm toàn bộ chiều rộng (full-width) thân thiện với ngón tay.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-09`
- **Mã kịch bản:** `TC-PWA-09`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `FR-RES-07`, `NFR-ACC-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khung nhìn Mobile Reseller Campaign Detail & Content Kit (`/reseller/campaigns/[id]`): Chuyển đổi tab Persona mượt mà, khối nội dung Hook/Script/Caption/CTA không bị tràn viền
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), iPhone SE (`375x667`)
- **Tiền điều kiện:** Mở chi tiết một chiến dịch hợp lệ (ví dụ: Chiến dịch Bà Nà Hills).
- **Các bước thực hiện:**
  1. Truy cập `/preview/reseller/campaigns/44444444-4444-4444-4444-444444444444`.
  2. Kiểm tra `scrollWidth <= window.innerWidth`.
  3. Chạm lần lượt vào 4 tab Persona: "Chuyên gia bản địa", "Gia đình", "Tín đồ ẩm thực", "Săn deal thông thái".
  4. Cuộn dọc xem các khối Hook, Script, Caption, CTA.
- **Dữ liệu đầu vào:** ID chiến dịch mẫu
- **Kết quả mong đợi:** Các tab Persona bọc dòng (`flex-wrap`) tự nhiên, không bị cắt cụt chữ. Khối nội dung văn bản sử dụng `[overflow-wrap:anywhere]`, đảm bảo chuỗi ký tự dài hay link không làm vỡ layout ngang của điện thoại.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-10`
- **Mã kịch bản:** `TC-PWA-10`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `FR-CMP-01`, `FR-CMP-02`, `NFR-ACC-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khung nhìn Mobile Merchant Dashboard & Form Tạo Chiến Dịch: Sidebar mở/đóng dạng Drawer mượt mà, Form chuyển sang 1 cột
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Truy cập Merchant Portal.
- **Các bước thực hiện:**
  1. Truy cập `/preview/merchant`.
  2. Bấm vào icon menu hamburger trên mobile để mở Sidebar.
  3. Bấm nút "X" để đóng Sidebar.
  4. Bấm "Tạo chiến dịch" điều hướng sang `/preview/merchant/campaigns/new`.
  5. Kiểm tra layout của Form và cột Guide bên cạnh.
- **Dữ liệu đầu vào:** Route: `/preview/merchant/campaigns/new`
- **Kết quả mong đợi:** Sidebar trên mobile hoạt động dạng trượt (Drawer modal `sidebar-open`), đóng mở dứt khoát. Form tạo chiến dịch và cột hướng dẫn tự động chuyển từ 2 cột desktop sang 1 cột dọc trên mobile; các ô chọn ngày `start_date`, `end_date` hiển thị giao diện date-picker gốc của hệ điều hành điện thoại.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-11`
- **Mã kịch bản:** `TC-PWA-11`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `NFR-ACC-01`, SRS v1.1 Mục 14
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Thanh điều hướng chân trang cố định (Bottom Navigation Bar) cho Reseller trên Mobile
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller đang đăng nhập và lướt xem trang Feed hoặc Chi tiết chiến dịch.
- **Các bước thực hiện:**
  1. Mở `/reseller/campaigns`.
  2. Cuộn trang xuống dưới cùng (hơn 1000px chiều cao).
  3. Quan sát vị trí thanh điều hướng.
  4. Bấm vào các tab điều hướng dưới đáy màn hình (Chiến dịch, Thư viện nội dung, Ví & Hoa hồng, Tài khoản).
- **Dữ liệu đầu vào:** Thao tác cuộn trang (scroll down)
- **Kết quả mong đợi:** Thanh Bottom Navigation Bar cố định ở đáy màn hình (`fixed bottom-0 left-0 right-0`), hỗ trợ safe area insets của iOS (`pb-safe`), cho phép Reseller chuyển đổi phân hệ nhanh chóng chỉ bằng 1 ngón tay cái mà không cần phải cuộn ngược lên đầu trang.
- **Độ ưu tiên:** `P1`

#### `TC-PWA-12`
- **Mã kịch bản:** `TC-PWA-12`
- **Nhóm chức năng:** Nhóm 2: Giao diện & Điều hướng Mobile
- **Mã SRS / RULE:** `NFR-ACC-01`, WCAG 2.5.5
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Kiểm tra kích thước vùng chạm (Touch Targets) tối thiểu 44x44px trên toàn bộ các nút bấm và liên kết chính
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Small Mobile (`320x740`)
- **Tiền điều kiện:** Mở các trang chức năng chính của Reseller và Merchant.
- **Các bước thực hiện:**
  1. Kiểm tra kích thước bounding box (`element.getBoundingClientRect()`) của:
     - Nút "Copy Hook", "Copy Script", "Copy Caption", "Copy CTA kèm link" trong Content Kit.
     - Nút "Tạo link" và nút "Copy link" trong Modal Tracking.
     - Các tab Persona trong Content Kit.
     - Nút "Xem chi tiết" trên mỗi thẻ Campaign Card.
     - Nút đóng "×" trên Modal.
- **Dữ liệu đầu vào:** Các interactive elements
- **Kết quả mong đợi:** Chiều cao và chiều rộng của các vùng chạm tối thiểu đạt 44px (khuyến nghị 48px), khoảng cách giữa các nút liền kề tối thiểu 8px, không gây bấm nhầm khi người dùng thao tác bằng ngón tay trên màn hình cảm ứng.
- **Độ ưu tiên:** `P0`

---

### NHÓM 3: LUỒNG NGHIỆP VỤ RESELLER & VÍ RESELLER TRÊN PWA MOBILE (`FR-RES-05`..`FR-RES-14`)

#### `TC-PWA-13`
- **Mã kịch bản:** `TC-PWA-13`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-05`, `FR-RES-06`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Tham gia chiến dịch trong tối đa 3 thao tác chạm trên màn hình di động
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller đã đăng nhập, đang ở trang Feed chiến dịch.
- **Các bước thực hiện:**
  1. Thao tác 1 (Chạm 1): Bấm vào thẻ chiến dịch hoặc nút "Xem chi tiết" của chiến dịch Bà Nà Hills.
  2. Màn hình chi tiết mở ra.
  3. Thao tác 2 (Chạm 2): Bấm nút "Tạo link" trên màn hình chi tiết.
  4. Hộp thoại modal "Link tiếp thị & QR" mở ra.
  5. Thao tác 3 (Chạm 3): Bấm nút "Tạo link tiếp thị" (hoặc hệ thống tự động sinh khi mở modal).
- **Dữ liệu đầu vào:** Campaign ID: `44444444-4444-4444-4444-444444444444`
- **Kết quả mong đợi:** Đúng theo tiêu chuẩn SRS v1.1 `FR-RES-06`, Reseller hoàn tất quy trình lấy link tham gia chiến dịch trong không quá 3 thao tác chạm màn hình đơn giản; link được sinh ra ngay lập tức.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-14`
- **Mã kịch bản:** `TC-PWA-14`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-TRK-01`, `FR-ATT-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Hộp thoại Modal Tracking Link & Mã QR hiển thị vừa vặn trên màn hình điện thoại, nút Copy 1-Click hoạt động chuẩn
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), iPhone SE (`375x667`), Small Mobile (`320x740`)
- **Tiền điều kiện:** Đang mở Modal Tracking Link.
- **Các bước thực hiện:**
  1. Kiểm tra kích thước modal: `width: min(600px, calc(100% - 32px))`, `maxHeight: calc(100dvh - 32px)`.
  2. Kiểm tra ảnh QR Code SVG: render sắc nét, không bị tràn ra ngoài viền dialog.
  3. Bấm nút "Copy link".
  4. Kiểm tra clipboard và thông báo phản hồi `aria-live="polite"`.
- **Dữ liệu đầu vào:** Short URL: `http://localhost:3000/r/TEST12`
- **Kết quả mong đợi:** Modal nằm gọn trong khung hình điện thoại, có thanh cuộn nội bộ nếu màn hình quá ngắn; QR code hiển thị rõ ràng để có thể đưa máy khác quét trực tiếp; nút "Copy link" sao chép thành công chuỗi URL vào bộ nhớ tạm kèm thông báo "Đã sao chép link."
- **Độ ưu tiên:** `P0`

#### `TC-PWA-15`
- **Mã kịch bản:** `TC-PWA-15`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-07`, `FR-QC-06`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Chuyển đổi 4 Persona chuẩn (Local Guide, Family, Foodie, Budget Traveler) trên Content Kit Mobile
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Chiến dịch đã có nội dung được duyệt (`APPROVED`) cho cả 4 Persona.
- **Các bước thực hiện:**
  1. Tại màn hình Content Kit, quan sát 4 tab Persona.
  2. Bấm chọn tab "Gia đình".
  3. Bấm chọn tab "Tín đồ ẩm thực".
  4. Bấm chọn tab "Săn deal thông thái".
  5. Bấm chọn tab "Chuyên gia bản địa".
- **Dữ liệu đầu vào:** 4 key Persona: `local_guide`, `family`, `foodie`, `budget_traveler`
- **Kết quả mong đợi:** Trạng thái tab active đổi màu rõ ràng (`aria-pressed="true"`), nội dung Hook, Script, Caption, CTA bên dưới lập tức cập nhật theo đúng giọng điệu (tone of voice) của Persona tương ứng mà không cần tải lại toàn bộ trang.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-16`
- **Mã kịch bản:** `TC-PWA-16`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-08`, `FR-RES-09`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Nút Copy 1-Click cho Hook, Script, Caption, CTA kèm link tiếp thị trên thiết bị di động (hỗ trợ Textarea Fallback khi bị chặn quyền)
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Đã có link tiếp thị trong phiên làm việc.
- **Các bước thực hiện:**
  1. Bấm nút "Copy Hook" -> kiểm tra clipboard.
  2. Bấm nút "Copy Script" -> kiểm tra clipboard.
  3. Bấm nút "Copy Caption" -> kiểm tra clipboard (đầy đủ hashtags).
  4. Bấm nút "Copy CTA kèm link" -> kiểm tra xem placeholder `[LINK_MUA_VE]` đã được thay thế bằng short link thật chưa.
  5. Thử nghiệm chặn quyền clipboard trong cài đặt trình duyệt Safari -> Bấm nút Copy.
- **Dữ liệu đầu vào:** Quyền truy cập clipboard bị từ chối
- **Kết quả mong đợi:** 
  - Khi có quyền: Nút copy lập tức lưu nội dung vào bộ nhớ tạm, icon chuyển sang dấu check xanh kèm chữ "Đã sao chép".
  - Với nút "Copy CTA kèm link": Chuỗi `[LINK_MUA_VE]` được tự động thay thế bằng link tiếp thị chính xác của Reseller.
  - Khi bị chặn quyền: Hệ thống không bị crash, mà mở khung Textarea sao chép thủ công kèm nút "Chọn nội dung" để người dùng copy thủ công.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-17`
- **Mã kịch bản:** `TC-PWA-17`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-10`, `FR-RES-11`, `RULE-13`
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Khai báo URL bài đăng MXH và cập nhật số liệu tương tác tự khai kèm ảnh chứng minh trên mobile
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller đã đăng bài lên TikTok/Facebook bằng nội dung của chiến dịch.
- **Các bước thực hiện:**
  1. Truy cập trang `/reseller/posts/declare`.
  2. Chọn chiến dịch, biến thể Content Kit đã dùng.
  3. Dán link bài đăng TikTok: `https://www.tiktok.com/@danang_travel/video/1234567890`.
  4. Nhập số liệu: 15.000 views, 1.200 likes, 80 comments.
  5. Bấm nút chọn ảnh chụp màn hình từ thư viện ảnh điện thoại (Photo Library / Camera).
  6. Bấm "Gửi số liệu".
- **Dữ liệu đầu vào:** URL bài đăng, số liệu view/like, file ảnh PNG/JPEG
- **Kết quả mong đợi:** Khai báo thành công. Trên giao diện bắt buộc hiển thị nhãn "Tự khai" (`RULE-13`) bên cạnh các chỉ số tương tác; kèm dòng lưu ý: "Số liệu tự khai dùng để đối chiếu hiệu quả truyền thông, không dùng để tính hoa hồng chi trả."
- **Độ ưu tiên:** `P1`

#### `TC-PWA-18`
- **Mã kịch bản:** `TC-PWA-18`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-12`, `FR-ANA-06`, `FR-ANA-11`
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Xem Dashboard Hiệu suất Reseller trên Mobile: Thẻ Click, Lead, Booking, GMV, CR (xử lý mẫu số 0 = "N/A"), Tiền tệ VND, Múi giờ Việt Nam
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller đã có dữ liệu click và đơn hàng hoặc tài khoản mới toanh (0 click).
- **Các bước thực hiện:**
  1. Truy cập `/reseller/dashboard`.
  2. Quan sát 5 thẻ chỉ số: Lượt click, Số Lead, Số Booking, Doanh thu GMV, Tỷ lệ chuyển đổi (CR).
  3. Kiểm tra trường hợp tài khoản mới có Lượt click = 0.
  4. Kiểm tra định dạng tiền tệ và múi giờ.
- **Dữ liệu đầu vào:** Clicks: 0, GMV: 0
- **Kết quả mong đợi:** 
  - Các thẻ chỉ số hiển thị dạng lưới 2 cột hoặc cuộn ngang mượt mà trên mobile.
  - Khi Clicks = 0, Tỷ lệ chuyển đổi phải hiển thị chuỗi "N/A" (thay vì bị lỗi `NaN%` hoặc `0.00%`).
  - Tiền tệ hiển thị dạng "₫" hoặc "VND" (ví dụ: `1.250.000 ₫`).
  - Toàn bộ mốc thời gian hiển thị theo múi giờ `Asia/Ho_Chi_Minh` (GMT+7).
- **Độ ưu tiên:** `P0`

#### `TC-PWA-19`
- **Mã kịch bản:** `TC-PWA-19`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-13`, `FR-COM-01`..`06`, `RULE-01`, `RULE-10`
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Xem Ví Reseller & Quản lý Hoa hồng theo 4 trạng thái vòng đời trên Mobile kèm danh sách đơn hàng
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller truy cập trang quản lý thu nhập.
- **Các bước thực hiện:**
  1. Truy cập `/reseller/commissions`.
  2. Kiểm tra hiển thị 4 thẻ số dư hoa hồng:
     - 1. Chờ xác nhận (Pending Confirmation)
     - 2. Đã xác nhận (Confirmed - Chờ hoàn thành dịch vụ)
     - 3. Chi trả được (Payable - Đã hoàn thành & hết hạn đối soát theo RULE-10)
     - 4. Đã chi trả (Paid)
  3. Cuộn xuống danh sách chi tiết các đơn hàng (Booking Reference, Chiến dịch, Số tiền, Trạng thái).
- **Dữ liệu đầu vào:** Dữ liệu đơn hàng mẫu của Reseller
- **Kết quả mong đợi:** 4 thẻ trạng thái hiển thị màu sắc phân biệt rõ ràng; số dư hiển thị chính xác theo đơn vị VND; danh sách đơn hàng được tối ưu dạng Card View trên mobile thay vì bảng ngang bị vỡ khung.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-20`
- **Mã kịch bản:** `TC-PWA-20`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-RES-14`, `RULE-17`
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Khai báo thông tin tài khoản ngân hàng nhận tiền hoa hồng trên Mobile; TUYỆT ĐỐI không có ô nhập mật khẩu
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Reseller cần cập nhật tài khoản để nhận thanh toán.
- **Các bước thực hiện:**
  1. Truy cập `/reseller/payout-settings`.
  2. Kiểm tra các trường nhập liệu trên form:
     - Chọn Tên ngân hàng (Dropdown danh sách ngân hàng Việt Nam: VCB, BIDV, Techcombank, VPBank...).
     - Số tài khoản ngân hàng.
     - Tên chủ tài khoản (In hoa không dấu).
     - Mã số thuế cá nhân (MST).
  3. Kiểm tra xem có bất kỳ ô nhập mật khẩu nào không (`RULE-17`).
  4. Nhập thông tin hợp lệ và bấm "Lưu thông tin thanh toán".
- **Dữ liệu đầu vào:** Ngân hàng: Vietcombank, STK: 1012345678, Chủ TK: NGUYEN VAN A, MST: 8412345678
- **Kết quả mong đợi:** Form lưu thành công; hiển thị thông báo đã cập nhật; TUYỆT ĐỐI KHÔNG CÓ trường nhập mật khẩu ngân hàng hay mã OTP bảo mật.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-21`
- **Mã kịch bản:** `TC-PWA-21`
- **Nhóm chức năng:** Nhóm 3: Nghiệp vụ Reseller & Ví Reseller
- **Mã SRS / RULE:** `FR-ANA-09`, `FR-AIS-13`
- **Trạng thái tiến độ (Dev Status):** `[Pending - Chưa phát triển]`
- **Tên kịch bản kiểm thử:** Bảo vệ dữ liệu cá nhân (PII Masking) và cô lập dữ liệu giữa các Reseller trên giao diện Mobile
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Đăng nhập với tài khoản `reseller@example.com`.
- **Các bước thực hiện:**
  1. Mở danh sách đơn hàng tại `/reseller/commissions`.
  2. Quan sát cột thông tin khách hàng (Tên khách, Số điện thoại, Email).
  3. Thử đổi ID trên URL hoặc gửi request API với `reseller_id` của người khác.
- **Dữ liệu đầu vào:** User session: `reseller@example.com`
- **Kết quả mong đợi:** Toàn bộ thông tin cá nhân khách hàng phải được che (Masking) theo định dạng: `Nguyễn V***` hoặc `090****123` (`FR-ANA-09`); Reseller bị cấm tuyệt đối (HTTP 403 Forbidden) không được xem số liệu đơn hàng hay thông tin thanh toán của Reseller khác (`FR-AIS-13`).
- **Độ ưu tiên:** `P0`

---

### NHÓM 4: TRẢI NGHIỆM KHÁCH HÀNG TRÊN MOBILE (REDIRECT, TRACKING, CHAT AI)

#### `TC-PWA-22`
- **Mã kịch bản:** `TC-PWA-22`
- **Nhóm chức năng:** Nhóm 4: Trải nghiệm Khách hàng trên Mobile
- **Mã SRS / RULE:** `FR-TRK-02`, `NFR-PERF-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Khách hàng mở Tracking Link trên điện thoại (`/r/[code]`) -> Chuyển hướng HTTP 302 mượt mà dưới 2 giây sang Destination URL
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Mã tracking `TEST12` đã tồn tại trong DB và ở trạng thái active.
- **Các bước thực hiện:**
  1. Dán link `http://localhost:3000/r/TEST12` vào trình duyệt di động.
  2. Bấm phím Enter / Go.
  3. Đo thời gian từ lúc gửi request đến khi nhận header 302 Location.
  4. Kiểm tra trang đích được mở ra.
- **Dữ liệu đầu vào:** Tracking code: `TEST12`
- **Kết quả mong đợi:** Server phản hồi HTTP 302 Redirect ngay lập tức (< 2.0 giây); trình duyệt chuyển tiếp mượt mà đến trang web/thanh toán chính thức của Merchant; không hiển thị trang trung gian gây khó chịu cho khách.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-23`
- **Mã kịch bản:** `TC-PWA-23`
- **Nhóm chức năng:** Nhóm 4: Trải nghiệm Khách hàng trên Mobile
- **Mã SRS / RULE:** `FR-TRK-03`, `FR-TRK-04`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Tracking Router nhận diện chính xác User-Agent mobile (iOS Safari, Android Chrome, In-App TikTok, Facebook, Zalo) và rate limit click tặc
- **Thiết bị / Viewport:** TikTok In-App, Facebook In-App, Zalo In-App, Chrome Mobile, Safari Mobile
- **Tiền điều kiện:** Link tiếp thị đang hoạt động.
- **Các bước thực hiện:**
  1. Gửi request đến `/r/[code]` với User-Agent của TikTok In-App Browser trên iOS.
  2. Gửi request với User-Agent của Zalo In-App Browser trên Android.
  3. Kiểm tra bản ghi mới sinh trong bảng `clicks`.
  4. Thử nghiệm gửi liên tiếp 15 requests trong vòng 10 giây từ cùng 1 IP di động.
- **Dữ liệu đầu vào:** User-Agent In-App strings, IP liên tục > 10 requests/phút
- **Kết quả mong đợi:** Bảng `clicks` ghi nhận chính xác: `device_type = 'mobile'`, `browser = 'TikTok In-App'` hoặc `'Zalo In-App'`. Từ click thứ 11 trở đi trong 1 phút, cờ `is_valid` được đánh dấu `false` kèm `invalid_reason = 'RATE_LIMIT_EXCEEDED'` nhưng khách thật vẫn được redirect 302 bình thường để không làm gián đoạn trải nghiệm mua sắm.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-24`
- **Mã kịch bản:** `TC-PWA-24`
- **Nhóm chức năng:** Nhóm 4: Trải nghiệm Khách hàng trên Mobile
- **Mã SRS / RULE:** `FR-TRK-08`, `RULE-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Hiển thị minh bạch thương hiệu Merchant và cam kết *"Thanh toán trực tiếp với [Merchant] — đối tác chính thức"* trên mobile viewport không bị tràn chữ
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), iPhone SE (`375x667`)
- **Tiền điều kiện:** Khách đang ở trang Chat AI hoặc Landing Page đối tác.
- **Các bước thực hiện:**
  1. Mở trang `/chat` hoặc trang đích sản phẩm.
  2. Tìm khối thông tin bảo đảm an tâm (`chat-assurance`).
  3. Kiểm tra dòng thông báo: *"Thanh toán chính thức: Bạn đặt và thanh toán trực tiếp với doanh nghiệp cung cấp dịch vụ."*
  4. Kiểm tra `scrollWidth <= clientWidth`.
- **Dữ liệu đầu vào:** Khung nhìn di động `375x667`
- **Kết quả mong đợi:** Thông báo hiển thị rõ ràng, font chữ vừa vặn, không bị che khuất, giúp khách hàng nhận biết rõ ràng họ đang giao dịch với Merchant đối tác được chứng nhận theo chuẩn `RULE-01`.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-25`
- **Mã kịch bản:** `TC-PWA-25`
- **Nhóm chức năng:** Nhóm 4: Trải nghiệm Khách hàng trên Mobile
- **Mã SRS / RULE:** `FR-AIS-01`, `FR-AIS-02`, `FR-AIS-04`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Giao diện Khung Chat AI Sales Agent trên Mobile: Header cố định, khung chat cuộn mượt, ô nhập tin nhắn và nút gửi vừa vặn bàn phím ảo, gợi ý 1 chạm
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Mở trang `/chat`.
- **Các bước thực hiện:**
  1. Kiểm tra header chat có nút "Cuộc trò chuyện mới" (icon Plus).
  2. Bấm vào 1 trong các câu hỏi gợi ý nhanh: "Tôi muốn tìm hiểu về sản phẩm", "Chính sách hủy và hoàn tiền thế nào?".
  3. Nhập câu hỏi tự do vào ô nhập tin nhắn và bấm nút gửi (Mũi tên lên).
  4. Quan sát tin nhắn cuộn mượt xuống đáy màn hình (`scrollIntoView`).
- **Dữ liệu đầu vào:** Câu hỏi gợi ý và tin nhắn người dùng
- **Kết quả mong đợi:** Trải nghiệm chat trên mobile mượt mà như app tin nhắn tự nhiên; header chat cố định; bong bóng tin nhắn người dùng và trợ lý phân biệt màu sắc rõ ràng; tin nhắn dài tự động xuống dòng không làm vỡ chiều rộng màn hình.
- **Độ ưu tiên:** `P0`

#### `TC-PWA-26`
- **Mã kịch bản:** `TC-PWA-26`
- **Nhóm chức năng:** Nhóm 4: Trải nghiệm Khách hàng trên Mobile
- **Mã SRS / RULE:** `FR-AIS-05`, `RULE-01`
- **Trạng thái tiến độ (Dev Status):** `[Ready - Đã phát triển]`
- **Tên kịch bản kiểm thử:** Nút chuyển sang trang Checkout chính thức của Merchant từ chat AI trên mobile mở liên kết an toàn qua giao thức HTTPS
- **Thiết bị / Viewport:** iPhone 13 (`390x844`), Pixel 5 (`393x851`)
- **Tiền điều kiện:** Chat AI có ngữ cảnh sản phẩm và khách thể hiện ý định mua hàng.
- **Các bước thực hiện:**
  1. Gửi tin nhắn: "Tôi muốn đặt mua vé ngay bây giờ".
  2. Trợ lý AI phát hiện `purchase_intent = true` và trả về link thanh toán.
  3. Kiểm tra nút/link checkout xuất hiện trong bong bóng câu trả lời.
  4. Thẩm định giao thức: URL phải bắt đầu bằng `https://`. Hệ thống phải chặn triệt để nếu URL có tiền tố `javascript:` hoặc URL không hợp lệ (`safeCheckout`).
  5. Bấm vào link checkout.
- **Dữ liệu đầu vào:** Tin nhắn mua hàng
- **Kết quả mong đợi:** Nút chuyển sang thanh toán hiển thị nổi bật; liên kết mở trang thanh toán chính thức của Merchant trong tab mới (`target="_blank" rel="noopener noreferrer"`); không bao giờ thực thi mã script nguy hiểm.
- **Độ ưu tiên:** `P0`

---
*Tài liệu này được xuất đồng thời ra file CSV chuẩn UTF-8 BOM tại `tests/qa-deliverables/sprint3-plan-and-pwa/pwa-mobile-test-cases.csv` phục vụ đội ngũ Tester mở trên Microsoft Excel / Google Sheets.*

# BÁO CÁO TỔNG HỢP KIỂM THỬ E2E UI - PHÂN HỆ RESELLER PORTAL
## DỰ ÁN: AI TRAVEL RESELLER NETWORK
**Tài liệu đối chiếu:** SRS v1.1 & BRD v1.0  
**Người thực hiện:** Senior QA Automation Engineer  
**File kịch bản kiểm thử:** `tests/reseller.spec.ts`  
**Ngày thực hiện:** 16/10/2026  
**Môi trường thử nghiệm:** Local (Next.js 16 App Router, Node.js v22, Google Chrome Headless, Port 3100)  

---

### 1. TỔNG KẾT KẾT QUẢ THỬ NGHIỆM (EXECUTIVE SUMMARY)

| Chỉ số | Số lượng | Tỷ lệ (%) | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Tổng số Test Cases** | **17** | **100%** | Bao phủ trọn vẹn 5 nhóm nghiệp vụ theo SRS v1.1 |
| **Pass (Đạt)** | **1** | **5.9%** | TC-05: Chặn quyền truy cập chiến dịch khi chưa đăng nhập / chưa duyệt |
| **Fail (Không đạt do thiếu UI/Logic)** | **8** | **47.1%** | Giao diện đã có trang nhưng thiếu trường dữ liệu, thiếu bộ lọc, thiếu nút thao tác |
| **Blocked (Bị chặn do thiếu Màn hình/API/DB)** | **8** | **47.1%** | Trả về 404 Not Found do Frontend/Backend/Database chưa dựng route & schema |

---

### 2. BẢNG TRUY VẾT & KẾT QUẢ TỪNG TEST CASE (TRACEABILITY MATRIX)

| STT | Tên Test Case trong `tests/reseller.spec.ts` | Mã SRS / Rule | Trạng thái | Mã Bug chặn | Vị trí phụ trách |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **1** | `FR-RES-01: Form đăng ký Reseller phải cung cấp đầy đủ thông tin: họ tên, email, SĐT, địa điểm, sở thích, ngôn ngữ` | `FR-RES-01` | **FAIL** | `BUG-FE-RES-01`<br>`BUG-DB-RES-01` | **Frontend**<br>**Database-Auth** |
| **2** | `FR-RES-01: Màn hình Hồ sơ Reseller cho phép cập nhật thông tin và hiển thị trạng thái (Chờ duyệt / Đã duyệt / Bị đình chỉ)` | `FR-RES-01` | **BLOCKED** | `BUG-FE-RES-02`<br>`BUG-BE-RES-01`<br>`BUG-DB-RES-01` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **3** | `FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội (TikTok/FB) với chỉ số tự khai, TUYỆT ĐỐI không có ô nhập mật khẩu MXH` | `FR-RES-02`<br>`RULE-17` | **BLOCKED** | `BUG-FE-RES-03`<br>`BUG-BE-RES-02`<br>`BUG-DB-RES-04` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **4** | `FR-RES-04 & RULE-14: Hiển thị đầy đủ 4 điều khoản tuân thủ bắt buộc cam kết trước khi tham gia` | `FR-RES-04`<br>`RULE-14` | **FAIL** | `BUG-FE-RES-04`<br>`BUG-DB-RES-01` | **Frontend**<br>**Database-Auth** |
| **5** | `FR-RES-01, FR-RES-04, FR-ADM-02: Chặn quyền tham gia chiến dịch đối với tài khoản Chờ duyệt hoặc Bị đình chỉ` | `FR-RES-01`<br>`FR-RES-04`<br>`FR-ADM-02` | **PASS** | *(Cơ chế redirect login hoạt động đối với session chưa xác thực)* | — |
| **6** | `FR-RES-05 & FR-CMP-02: Feed hiển thị đầy đủ: tên, sản phẩm, giá bán, hoa hồng, số nội dung gợi ý, thu nhập tiềm năng` | `FR-RES-05`<br>`FR-CMP-02` | **FAIL** | `BUG-FE-RES-05` | **Frontend** |
| **7** | `FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia chiến dịch <= 3 thao tác, chọn tài khoản MXH, cấp Tracking Link riêng và Mã Voucher riêng` | `FR-RES-06`<br>`FR-TRK-01`<br>`FR-ATT-01` | **FAIL** | `BUG-FE-RES-06`<br>`BUG-BE-RES-03`<br>`BUG-DB-RES-06` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **8** | `FR-RES-07 & FR-QC-06: Thư viện nội dung có bộ lọc theo Persona, Độ dài (15s, 30s, 60s) và Funnel Stage` | `FR-RES-07`<br>`FR-QC-06` | **FAIL** | `BUG-FE-RES-07` | **Frontend** |
| **9** | `FR-RES-08: Hỗ trợ Tải video, Copy caption, CTA, hashtag kèm link và ghi nhận sự kiện (tracking event)` | `FR-RES-08` | **FAIL** | `BUG-FE-RES-08`<br>`BUG-BE-RES-04` | **Frontend**<br>**Backend-API** |
| **10** | `FR-RES-09: Hiển thị bộ câu trả lời soạn sẵn (giá, địa điểm, cách đặt) kèm tracking link và cho phép copy` | `FR-RES-09` | **FAIL** | `BUG-FE-RES-09` | **Frontend** |
| **11** | `FR-RES-10: Form khai báo URL bài đăng trên TikTok/Facebook và liên kết biến thể nội dung đã dùng` | `FR-RES-10` | **BLOCKED** | `BUG-FE-RES-10`<br>`BUG-BE-RES-05`<br>`BUG-DB-RES-05` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **12** | `FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, cmt, share, save) kèm ảnh bằng chứng, bắt buộc gắn nhãn 'Tự khai'` | `FR-RES-11`<br>`RULE-13` | **BLOCKED** | `BUG-FE-RES-11`<br>`BUG-BE-RES-05`<br>`BUG-DB-RES-05` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **13** | `FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất hiển thị Click, Lead, Booking, GMV, Conversion Rate (N/A khi = 0), tiền tệ VND` | `FR-RES-12`<br>`FR-ANA-06`<br>`FR-ANA-11` | **BLOCKED** | `BUG-FE-RES-12`<br>`BUG-BE-RES-06` | **Frontend**<br>**Backend-API** |
| **14** | `FR-ANA-05 & FR-ANA-10: Tách biệt rõ ràng 2 cột/tab: 'Hệ thống ghi nhận' và 'Reseller tự khai'` | `FR-ANA-05`<br>`FR-ANA-10` | **BLOCKED** | `BUG-FE-RES-13` | **Frontend** |
| **15** | `FR-RES-13: Dashboard hoa hồng hiển thị 4 trạng thái (Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả) và danh sách booking` | `FR-RES-13` | **BLOCKED** | `BUG-FE-RES-14`<br>`BUG-BE-RES-07` | **Frontend**<br>**Backend-API** |
| **16** | `FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, số tài khoản, tên chủ thẻ, MST)` | `FR-RES-14`<br>`RULE-17` | **BLOCKED** | `BUG-FE-RES-15`<br>`BUG-BE-RES-08`<br>`BUG-DB-RES-07` | **Frontend**<br>**Backend-API**<br>**Database-Auth** |
| **17** | `FR-ANA-09 & FR-AIS-13: Che thông tin cá nhân khách hàng (PII masking) trong danh sách đơn hàng` | `FR-ANA-09`<br>`FR-AIS-13` | **BLOCKED** | `BUG-FE-RES-16`<br>`BUG-BE-RES-07` | **Frontend**<br>**Backend-API** |

---

### 3. TỔNG KẾT PHÂN BỔ BUG THEO VỊ TRÍ PHỤ TRÁCH

| Vị trí phụ trách | File báo cáo chi tiết | Số lượng Bug | Các Bug Critical / High tiêu biểu |
| :--- | :--- | :---: | :--- |
| **Frontend Developer** | `tests/bug-reports/reseller/bug-report-frontend-reseller.md` | **16 bugs** | Thiếu 6 trang nghiệp vụ (`profile`, `social-accounts`, `dashboard`, `commissions`, `payout-settings`, `posts/declare`); thiếu cam kết tuân thủ; thiếu nút tải video và bộ câu trả lời soạn sẵn. |
| **Backend / API Developer** | `tests/bug-reports/reseller/bug-report-backend-api-reseller.md` | **8 bugs** | Không cấp mã Voucher riêng trong API tracking link; thiếu API ghi nhận tracking events; thiếu API hoa hồng 4 trạng thái và PII masking; API analytics thiếu Lead, Booking, GMV. |
| **Database / Auth Developer** | `tests/bug-reports/reseller/bug-report-database-auth-reseller.md` | **7 bugs** | Bảng `resellers` thiếu các cột hồ sơ; trigger `handle_new_user` không gán `status = 'pending'`; `getResellerAccess()` chưa kiểm tra trạng thái duyệt; thiếu bảng bài đăng khai báo và voucher code. |

---

### 4. GHI CHÚ VỀ CẤU HÌNH KIỂM THỬ PLAYWRIGHT (DEVOPS / QA NOTE)
Trong quá trình chạy lệnh kiểm thử theo yêu cầu: `npx playwright test tests/reseller.spec.ts`:
1. **Lỗi `testMatch` trong cấu hình gốc:**  
   File `playwright.config.ts` của dự án đang bị cấu hình cứng dòng 4: `testMatch: "frontend.spec.ts"`. Do đó, nếu chạy trực tiếp lệnh mặc định mà không có file cấu hình mở rộng, Playwright sẽ lọc bỏ file `tests/reseller.spec.ts` và báo lỗi `Error: No tests found`.
2. **Lỗi WebServer production build:**  
   `playwright.config.ts` khởi động webServer bằng lệnh `npm run start` (yêu cầu thư mục `.next` đã được build production). Nếu dự án chưa chạy `npm run build`, webServer sẽ văng lỗi `Could not find a production build in the '.next' directory`.
3. **Đề xuất khắc phục cho Team Lead / DevOps:**  
   - Cập nhật `testMatch` trong `playwright.config.ts` thành `*.spec.ts` hoặc tạo script npm `"test:reseller": "playwright test tests/reseller.spec.ts"` với config phù hợp.
   - Bổ sung cấu hình tự động trỏ đến đường dẫn Chromium/Chrome sẵn có trên môi trường Windows (`launchOptions.executablePath`).

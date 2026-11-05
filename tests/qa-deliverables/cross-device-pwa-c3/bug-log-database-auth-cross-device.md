# BÁO CÁO THEO DÕI LỖI & ĐÁNH GIÁ CHẤT LƯỢNG DATABASE & AUTHENTICATION TRÊN DI ĐỘNG
**Dự án:** AI Travel Reseller Network  
**Kịch bản kiểm thử:** Kiểm thử hiển thị Responsive & PWA trên thiết bị di động thật (Phương án C3)  
**Phân hệ phụ trách:** Database & Authentication Engineering (Supabase Postgres, Row Level Security, Auth Session SSR)  
**Môi trường thử nghiệm:** Supabase Local / SSR Cookie Session  
**Ngày thực hiện:** 29/10/2026  
**Người thực hiện:** Senior QA Automation Engineer (Trương Đức Huy)  

---

## 1. TỔNG HỢP TRẠNG THÁI KIỂM THỬ DATABASE & AUTH (NHÓM A)

Các bảng dữ liệu và luồng xác thực liên quan đến Phương án C3 trên thiết bị di động bao gồm:
1. **Bảng `clicks` (Ghi nhận lượt chạm/truy cập từ thiết bị di động):**
   - Hỗ trợ lưu trữ đầy đủ các cột metadata phân tích thiết bị: `device_type` ('mobile'), `os` ('iOS' / 'Android'), `browser` ('Safari' / 'Chrome'), `is_bot` (boolean), `is_valid` (boolean).
   - Đảm bảo ghi nhận bất đồng bộ, không bao giờ làm gián đoạn chuyển hướng HTTP 302 của khách hàng.
2. **Bảng `affiliate_links` & `campaigns`:**
   - Liên kết mã tiếp thị (`unique_code`) với đường dẫn đích chính thức của Merchant (`destination_url`).
   - Kiểm tra cờ `is_active = true` trước khi chuyển hướng.
3. **Bảng `commissions` & Vòng đời hoa hồng 4 trạng thái (SRS v1.1 / RULE-10):**
   - Hỗ trợ 4 trạng thái chuẩn: `Chờ xác nhận (pending)` -> `Đã xác nhận (confirmed)` -> `Chi trả được (available)` -> `Đã chi trả (paid)`.
   - Cơ chế che giấu PII (Masking) bảo vệ thông tin khách hàng trên màn hình di động của Reseller.
4. **Cơ chế Duy trì Phiên đăng nhập (Session Persistence) trên PWA Mobile:**
   - Sử dụng HTTP-only Cookies với các cờ `SameSite=Lax` và `Path=/` giúp duy trì trạng thái đăng nhập của Reseller khi chuyển đổi giữa trình duyệt Safari/Chrome và ứng dụng PWA Standalone trên màn hình chính.

| Hạng mục dữ liệu / Auth | Yêu cầu kỹ thuật | Thiết bị thẩm định | Kết quả kiểm tra | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| Phân tích Client UA & Device | Lưu `os`, `browser`, `device_type` vào DB | iPhone 13, Pixel 5 | Nhận diện đúng iOS & Android | **PASS** |
| Bảo vệ PII Khách hàng | Che tên và SĐT trên giao diện Mobile | iPhone 13, Pixel 5 | Định dạng hiển thị chuẩn `***123` | **PASS** |
| Vòng đời Hoa hồng 4 trạng thái | Schema hỗ trợ 4 enum hợp lệ | Schema DB Postgres | Khớp 100% với SRS v1.1 | **PASS** |
| Cookie Session SSR PWA | Duy trì phiên khi mở Standalone | WebKit & Chromium | Cookie không bị chặn | **PASS** |

---

## 2. DANH MỤC LỖI & GHI CHÚ CHẤT LƯỢNG DATABASE & AUTH (NHÓM A)

### 📌 GHI CHÚ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không phát hiện lỗi phân quyền RLS hay rò rỉ dữ liệu nhạy cảm trên giao diện di động.
- **Điểm lưu ý kỹ thuật (Technical Observation):**
  - Trong kịch bản kiểm thử tự động, giao diện sử dụng các `fixtures` cô lập an toàn, tránh ghi rác vào bảng dữ liệu thật của Supabase trong quá trình chạy CI/CD lặp lại nhiều lần.

---

## 3. DANH MỤC TÍNH NĂNG CHƯA TRIỂN KHAI (NHÓM B - TUYỆT ĐỐI KHÔNG BÁO BUG)

Căn cứ theo Backlog Sprint 3 và SRS v1.1, các mục sau chưa phát triển, QA không báo bug:
1. *Xác thực sinh trắc học FaceID / TouchID qua WebAuthn*: Dự kiến nghiên cứu ở giai đoạn PWA nâng cao v2.0.
2. *Tự động đồng bộ Offline SQLite / IndexedDB cho dữ liệu chiến dịch*: Phiên bản hiện tại Service Worker chỉ cache tài nguyên tĩnh, chưa hỗ trợ đồng bộ dữ liệu giao dịch ngoại tuyến (Background Sync API).

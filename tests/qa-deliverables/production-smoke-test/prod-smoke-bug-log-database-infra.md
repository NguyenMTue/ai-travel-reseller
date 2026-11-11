# BÁO CÁO GHI NHẬN VẤN ĐỀ & ĐÁNH GIÁ CƠ SỞ DỮ LIỆU & HẠ TẦNG (DATABASE & INFRA)
## BỘ KIỂM THỬ SMOKE TEST TỰ ĐỘNG PLAYWRIGHT
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ thẩm định:** Cơ sở Dữ liệu Supabase Cloud Production & Hạ tầng Triển khai Vercel  
**Người thực hiện:** Trương Đức Huy (Senior QA Lead & Automation Engineer)  
**Ngày thực hiện:** 05/11/2026  
**Môi trường:** Production Smoke Test (Playwright Suite: `tests/production-smoke.spec.ts`)  
**Báo cáo HTML tham chiếu:** [`tests/playwright-production-smoke-report.html`](../../playwright-production-smoke-report.html)

---

## 1. TỔNG QUAN TÌNH TRẠNG HẠ TẦNG & CƠ SỞ DỮ LIỆU

| Phân loại Mức độ | Số lượng | Tình trạng | Đánh giá Tiêu chuẩn Release |
|---|:---:|---|:---:|
| **P0 - Blocker (Chặn phát hành / Mất kết nối DB / Rò rỉ bảo mật)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P1 - Critical (Lỗi Schema / Mất dữ liệu / Hỏng CDN Storage)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P2 - Major (Lỗi chỉ mục / Quá tải Connection Pooler)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P3 - Minor / Khuyến nghị Tối ưu Hạ tầng (Infra Optimization)** | **1** | Đã ghi nhận | Khuyến nghị giám sát định kỳ |

---

## 2. DANH SÁCH GHI NHẬN ĐÁNH GIÁ HẠ TẦNG & CƠ SỞ DỮ LIỆU (NHÓM A)

> [!NOTE]
> Bảng này tuân thủ nghiêm ngặt nguyên tắc **Progress-Aware**: Chỉ thẩm định hạ tầng thực tế đã cấu hình và vận hành cho phiên bản Go-Live (Nhóm A). Tuyệt đối không quy kết các yêu cầu hạ tầng mở rộng chưa nằm trong phạm vi (Nhóm B) thành lỗi.

| Mã Vấn đề | Thành phần Hạ tầng | Môi trường | Mức độ | Hiện trạng Ghi nhận từ Smoke Test | Phân tích Kỹ thuật & Khuyến nghị | Trạng thái |
|---|---|---|:---:|---|---|:---:|
| **INFRA-SMOKE-OBS-01** | Supabase Storage Bucket `campaign-videos` | Supabase Cloud Singapore | Minor (Khuyến nghị Giám sát) | Bucket `campaign-videos` lưu trữ video mẫu `banahills-remediated-master.mp4` phản hồi HTTP 200/206 stream tốt qua CDN. Tuy nhiên dung lượng video gốc $\approx 25\text{MB}$ có thể làm tăng băng thông CDN khi có số lượng lớn cộng tác viên tải về cùng lúc. | **Phân tích:** Video stream mượt mà, định dạng MP4 H.264 tương thích 100% trình duyệt web di động.<br>**Khuyến nghị Tối ưu:** Cân nhắc tích hợp pipeline nén đa độ phân giải (480p, 720p, 1080p) hoặc áp dụng định dạng HLS/DASH trong các bản cập nhật quy mô lớn sau Go-Live để tiết kiệm chi phí băng thông mạng. | Đã xác nhận đạt chuẩn / Khuyến nghị mở rộng |

---

## 3. THẨM ĐỊNH CHI TIẾT TỪNG LỚP HẠ TẦNG PRODUCTION

### 3.1. Cơ sở Dữ liệu Supabase Cloud Singapore (`ykfosnwbgphlwpufnxrd`)
* **Trạng thái Kết nối & Bảng Dữ liệu:**
  - Kết nối trực tiếp tới instance Singapore ổn định, phản hồi $< 200\text{ms}$.
  - Toàn bộ 10/10 bảng nghiệp vụ cốt lõi (`merchants`, `resellers`, `campaigns`, `products`, `contents`, `affiliate_links`, `clicks`, `orders`, `commissions`, `media_references`) đều hoạt động với phân quyền Row Level Security (RLS) nghiêm ngặt.
  - Bảng vector ngữ nghĩa `product_embeddings` tích hợp tiện ích mở rộng `pgvector` phục vụ tìm kiếm tour du lịch thông minh qua AI Gateway sẵn sàng 100%.
* **Hiệu năng RPC & Chỉ mục Che phủ (Covering Index):**
  - Hàm RPC `get_reseller_wallet_summary` thực thi truy vấn tổng hợp ví hoa hồng với đơn vị tiền tệ VND đạt độ trễ cực nhanh $\approx 180\text{ms}$.
  - Chỉ mục che phủ `idx_affiliate_links_k6_lookup` tối ưu hóa thời gian tra cứu mã tracking link `/r/[code]` chỉ mất $\approx 86\text{ms}$.

### 3.2. Cấu hình Supavisor Connection Pooling (Cổng 6543)
* **Transaction Mode:** Cổng 6543 được cấu hình theo chế độ giao dịch (Transaction Pooling), giải phóng kết nối ngay khi hoàn tất câu lệnh SQL.
* **Khả năng Chịu tải:** Sẵn sàng đáp ứng tải đồng thời lên tới 1.000 người dùng ảo (VUs) theo bài kiểm tra tải k6 của Sprint 5 mà không gây hiện tượng cạn kiệt kết nối (Connection Exhaustion).

### 3.3. Cấu hình Vercel Security Edge Headers (`vercel.json`)
* **HTTP Strict Transport Security (HSTS):** `max-age=63072000; includeSubDomains; preload` bắt buộc kết nối an toàn SSL/HTTPS 100%.
* **Phòng chống Tấn công Clickjacking:** `X-Frame-Options: SAMEORIGIN`.
* **Phòng chống Tấn công MIME-sniffing:** `X-Content-Type-Options: nosniff`.
* **Kiểm soát Quyền Riêng tư Trình duyệt:** `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
* **Tối ưu Bộ đệm PWA Service Worker & Static Assets:**
  - File `/manifest.webmanifest`: `Cache-Control: public, max-age=0, must-revalidate` (đảm bảo client luôn nhận phiên bản manifest mới nhất).
  - File `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate` và `Service-Worker-Allowed: /`.
  - Thư mục `/icons/(.*)`: `Cache-Control: public, max-age=31536000, immutable` (tận dụng tối đa bộ nhớ đệm trình duyệt).

---

## 4. KẾT LUẬN NGHIỆM THU HẠ TẦNG

Hạ tầng Cơ sở dữ liệu và Môi trường Triển khai Production đạt **100% TIÊU CHUẨN SẴN SÀNG VẬN HÀNH (PRODUCTION READY)**, không tồn tại rủi ro kỹ thuật nào ngăn cản việc Go-Live.

# BÁO CÁO GHI NHẬN VẤN ĐỀ KIỂM THỬ CƠ SỞ DỮ LIỆU & XÁC THỰC (BUG LOG DATABASE AUTH PWA)
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** Database Schema & Analytics Indexes cho Thiết bị Di động  
**Người phụ trách báo cáo:** Senior QA Engineer  
**Đối tượng nhận xử lý:** Database / Supabase Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 21/10/2026  
**Nguyên tắc ghi nhận:** Chỉ ghi nhận lỗi trên các bảng/cột/hàm **ĐÃ ĐƯỢC PHÁT TRIỂN (NHÓM A)**; tuyệt đối không báo bug cho các cấu trúc thuộc diện chờ phát triển (Nhóm B).

---

## 1. TỔNG QUAN
Qua đối chiếu giữa Database Schema thực tế trong `supabase/migrations/` và `src/lib/database.types.ts` với yêu cầu phân tích số liệu thiết bị di động (Mobile, Tablet, In-App WebViews), QA ghi nhận **1 vấn đề nghiêm trọng về chỉ mục (Database Indexing)** trên bảng dữ liệu lượt click đã được triển khai:

| Mã Bug | Tên vấn đề | Mức độ nghiêm trọng (Severity) | File migration liên quan | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| `BUG-DB-PWA-01` | Bảng `public.clicks` thiếu Composite Index phục vụ hàm RPC `get_reseller_device_stats` và lọc thiết bị di động | **High** | `supabase/migrations/20261014140000_reseller_analytics_rpc.sql` | 🔴 Mới ghi nhận |

---

## 2. CHI TIẾT VẤN ĐỀ

### BUG-DB-PWA-01: Bảng `public.clicks` thiếu Composite Index phục vụ hàm RPC `get_reseller_device_stats` và lọc thiết bị di động
- **Mã Bug:** `BUG-DB-PWA-01`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã SRS bị ảnh hưởng:** Tối ưu hóa truy vấn phân tích thiết bị & Hiệu năng hệ thống (`FR-ANA-06`, `NFR-PERF-01`, `FR-TRK-03`)
- **Test Case liên quan:** `TC-PWA-18`, `TC-PWA-23`
- **Mức độ nghiêm trọng:** `High`
- **File migration nghi ngờ gây lỗi:** 
  - `supabase/migrations/20261006162951_remote_schema.sql` (định nghĩa bảng `clicks`)
  - `supabase/migrations/20261014140000_reseller_analytics_rpc.sql` (hàm `get_reseller_device_stats`, dòng 173–230)
- **Các bước tái hiện (Steps to Reproduce):**
  1. Kiểm tra định nghĩa bảng `public.clicks` trong schema và các index hiện có:
     - Hiện chỉ có index mặc định trên khóa chính `clicks_pkey (id)` và foreign key `clicks_link_id_fkey (link_id)`.
  2. Xem xét câu truy vấn SQL bên trong hàm RPC `get_reseller_device_stats`:
     ```sql
     -- Đếm tổng lượt click hợp lệ của người thật
     SELECT count(c.id)
     INTO v_total_valid
     FROM public.affiliate_links al
     JOIN public.clicks c ON c.link_id = al.id
     WHERE al.reseller_id = p_reseller_id
       AND c.is_bot = false 
       AND c.is_valid = true;

     -- Thống kê theo loại thiết bị (mobile, desktop, tablet)
     SELECT jsonb_agg(...)
     FROM (
       SELECT c.device_type, count(c.id) AS count, ...
       FROM public.affiliate_links al
       JOIN public.clicks c ON c.link_id = al.id
       WHERE al.reseller_id = p_reseller_id
         AND c.is_bot = false
         AND c.is_valid = true
       GROUP BY c.device_type
     ) d;
     ```
  3. Chạy lệnh `EXPLAIN ANALYZE` khi bảng `clicks` có từ 50.000 bản ghi trở lên.
- **Kết quả mong đợi (Expected Result):**
  - PostgreSQL phải thực hiện Index Scan hoặc Index Only Scan thông qua một chỉ mục tổng hợp (Composite Index) bao gồm các cột điều kiện lọc và nhóm: `(link_id, is_valid, is_bot)`.
- **Kết quả thực tế (Actual Result):**
  - Do chỉ có index đơn lẻ trên `link_id`, Postgres phải load toàn bộ row từ disk lên bộ nhớ để lọc 2 điều kiện boolean `c.is_bot = false AND c.is_valid = true`, sau đó tiếp tục đọc các cột `device_type`, `os`, `browser`.
  - Trên tập dữ liệu thực tế lớn của chiến dịch tiếp thị, truy vấn này sẽ rơi vào trạng thái `Bitmap Heap Scan` hoặc `Seq Scan`, làm thời gian thực thi hàm RPC tăng từ < 10ms lên tới hàng trăm mili-giây, gây đơ lag màn hình Dashboard của Reseller khi xem trên điện thoại.
- **Giải pháp khuyến nghị cho Database Team:**
  - Tạo một migration mới bổ sung Composite Index tối ưu cho bảng `clicks`:
    ```sql
    -- Migration: 20261021_add_clicks_device_analytics_index.sql
    CREATE INDEX IF NOT EXISTS idx_clicks_reseller_analytics 
    ON public.clicks (link_id, is_valid, is_bot) 
    INCLUDE (device_type, os, browser);
    ```
  - Chỉ mục này bao phủ hoàn toàn mệnh đề `WHERE` và `GROUP BY` của cả 4 hàm RPC phân tích, cho phép PostgreSQL thực hiện `Index Only Scan` với hiệu năng tối đa.

---
*Báo cáo được lập tự động bởi Senior QA Engineer phục vụ Sprint 3 Review.*

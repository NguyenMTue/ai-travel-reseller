# BÁO CÁO GHI NHẬN ĐIỂM NGHẼN HIỆU NĂNG - DATABASE & SUPABASE (K6 1.000 VUs)
**Dự án:** AI Travel Reseller Network  
**Kỹ sư kiểm thử:** Trương Đức Huy (Senior QA & Performance Engineer)  
**Môi trường kiểm thử:** Supabase Postgres 15 (Supavisor Connection Pooler)  
**Tiêu chuẩn đối chiếu:** SRS v1.1 (`FR-TRK-02`, `NFR-PER-01`..`05`)  
**Ngày phát hành:** 02/11/2026  

---

## 1. TỔNG QUAN TẢI TRỌNG CƠ SỞ DỮ LIỆU
Trong bài kiểm thử tải quy mô 1.000 VUs:
- Lưu lượng đọc (Read Throughput) vào bảng `affiliate_links` đạt đỉnh **~300 - 450 QPS**.
- Lưu lượng ghi (Write Throughput) vào bảng `clicks` đạt đỉnh **~280 - 400 Inserts/giây**.
- Tổng số kết nối đồng thời từ Next.js Serverless / Containers vượt qua giới hạn connection pool mặc định của gói tiêu chuẩn, gây ra hiện tượng hàng đợi kết nối (Connection Queuing) và làm phình to thời gian phản hồi ở mức P95/P99.

---

## 2. DANH SÁCH CHI TIẾT CÁC ĐIỂM NGHẼN DATABASE

### 🔴 BOTTLENECK-DB-01: Nguy cơ cạn kiệt Connection Pool (Supavisor / PgBouncer Pool Exhaustion)
- **Vị trí ảnh hưởng:** Postgres Connection Pooler (Port 6543 / 5432)
- **Triệu chứng dưới tải 1.000 VUs:**
  + Client Supabase sử dụng trực tiếp kết nối session / transaction mà không giới hạn connection timeout.
  + Khi số lượng VUs đạt 500 -> 1.000, số lượng active backend connections tăng vọt từ 10 lên hơn 80 connections, chạm ngưỡng cảnh báo `max_connections` của instance Postgres.
  + Xuất hiện hiện tượng truy vấn bị xếp hàng chờ (Connection Wait Time) lên tới **800ms - 1.500ms** tại lớp Pooler.
- **Khuyến nghị khắc phục cho DB Dev:**
  1. Đảm bảo Next.js Backend kết nối qua cổng **Supavisor Transaction Mode (port 6543)** thay vì Session Mode (port 5432) để các connection được giải phóng ngay lập tức sau mỗi câu lệnh `SELECT` hoặc `INSERT`.
  2. Bật cấu hình `statement_timeout = '2000ms'` trong Postgres session để tự động ngắt các truy vấn bị kẹt, ngăn ngừa hiệu ứng domino làm nghẽn toàn bộ cluster.

---

### 🔴 BOTTLENECK-DB-02: Bảng `clicks` thiếu Partitioning & Index Bloat khi chịu tải ghi dồn dập
- **Vị trí ảnh hưởng:** Bảng `public.clicks` và các chỉ mục liên quan
- **Mô tả hiện tượng:**
  Bảng `clicks` chứa các trường dữ liệu phong phú: `ip_address`, `user_agent`, `referer`, `device_type`, `os`, `browser`, `is_bot`, `is_valid`, `metadata` (JSONB).
  Mỗi lượt click của khách hàng đều chèn 1 bản ghi mới.
- **Tác động hiệu năng:**
  + Dưới tải 1.000 VUs, tốc độ chèn hàng trăm records/giây gây ra tranh chấp khóa trang (Page Write Lock Contention) trên các B-Tree Indexes (`idx_clicks_link_id`, `idx_clicks_created_at`).
  + Việc lưu trữ toàn bộ payload metadata JSONB làm phình to dung lượng WAL (Write-Ahead Logging) và IOPS disk của Postgres instance.
- **Khuyến nghị khắc phục cho DB Dev:**
  1. **Áp dụng Table Partitioning theo thời gian (Monthly / Weekly Partitioning):**
  ```sql
  -- Chuyển đổi bảng clicks thành partitioned table theo created_at
  CREATE TABLE clicks_partitioned (
      id UUID NOT NULL DEFAULT gen_random_uuid(),
      link_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address VARCHAR(45),
      user_agent TEXT,
      device_type VARCHAR(50),
      browser VARCHAR(50),
      is_valid BOOLEAN DEFAULT true,
      metadata JSONB,
      PRIMARY KEY (id, created_at)
  ) PARTITION BY RANGE (created_at);

  -- Phân vùng cho Tháng 11/2026
  CREATE TABLE clicks_y2026m11 PARTITION OF clicks_partitioned
      FOR VALUES FROM ('2026-11-01 00:00:00+07') TO ('2026-12-01 00:00:00+07');
  ```
  2. Thiết lập cơ chế **Unlogged Table** hoặc hàng đợi Buffer tạm thời nếu dữ liệu click log không đòi hỏi nghiêm ngặt chuẩn ACID của transaction tài chính.

---

### 🟡 BOTTLENECK-DB-03: Thiếu Partial Index tối ưu hóa cho câu truy vấn tra cứu link
- **Vị trí ảnh hưởng:** Bảng `public.affiliate_links`
- **Câu query hiện tại:**
  ```sql
  SELECT id, destination_url, is_active, reseller_id, campaign_id, product_id 
  FROM affiliate_links 
  WHERE unique_code = $1;
  ```
- **Tác động hiệu năng:**
  Chỉ mục hiện tại có thể là `unique` trên `unique_code`, nhưng khi bảng có hàng chục nghìn links đã hết hạn hoặc inactive, index scan vẫn phải nạp index page lớn vào RAM Shared Buffers.
- **Khuyến nghị khắc phục:**
  Tạo Partial Covering Index để đáp ứng hoàn hảo truy vấn Index-Only Scan:
  ```sql
  CREATE INDEX idx_affiliate_links_active_covering 
  ON affiliate_links (unique_code) 
  INCLUDE (id, destination_url, reseller_id, campaign_id, product_id)
  WHERE is_active = true;
  ```
  *Lợi ích:* Câu lệnh query redirect sẽ đạt trạng thái **Index Only Scan**, đọc 100% từ RAM cache mà không cần truy xuất vào Heap Table, giảm latency từ 15ms xuống **dưới 1ms**.

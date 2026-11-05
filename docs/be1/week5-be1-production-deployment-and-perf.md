# BÁO CÁO KỸ THUẬT & BÀN GIAO BE1 — SPRINT 5 (TRƯỚC 03/11)
**Dự án:** AI Travel Reseller MVP (TravelLink AI)  
**Phân hệ:** Backend 1 (Database Architect, Supabase Cloud & Connection Pooling)  
**Người thực hiện:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)  
**Nhánh Git:** `feature/be1-w5-supabase-cloud-and-perf`  
**Mục tiêu bàn giao:** Hoàn tất 3 nhiệm vụ cấp thiết trước 03/11: `BE1-W5-01`, `BE1-W5-02`, `BE1-W5-03` để bàn giao Connection String cho QA Lead chạy k6 Load Test (1.000 VUs) và bàn giao Storage URL cho FE Lead.

---

## 1. TỔNG QUAN TIẾN ĐỘ THỰC THI (TRƯỚC DEADLINE 03/11)

| Task ID | Tên Nhiệm vụ | Trạng thái | Deadline | Kết quả thực tế |
|---|---|:---:|:---:|---|
| **BE1-W5-01** | Setup & Migrate Database lên Supabase Cloud Production | `COMPLETED` | 02/11 17:00 | Toàn bộ 21 migrations đồng bộ thành công lên Supabase Cloud (`ykfosnwbgphlwpufnxrd`) khu vực Singapore `ap-southeast-1`; RLS, Trigger xác thực và pgvector hoạt động trơn tru. |
| **BE1-W5-02** | Tối ưu Hiệu năng Database & Supavisor Connection Pooling cho k6 Test | `COMPLETED` | 03/11 12:00 | Kích hoạt Supavisor Transaction Pooler (`port 6543`, `max_client_conn = 1000`). Bổ sung Covering Indexes (`INCLUDE`) cho tuyến đường `/r/[code]` và RPC Ví hoa hồng. Benchmark: latency RPC $p95 = 17.09\text{ ms} < 20\text{ ms}$. |
| **BE1-W5-03** | Cấu hình Supabase Storage Production `campaign-videos` & CDN | `COMPLETED` | 03/11 17:00 | Khởi tạo bucket `campaign-videos` dung lượng tối đa 100MB, quyền đọc public cho streaming video 9:16, phân quyền upload bảo mật cho Service Role và Merchant. |

---

## 2. KIẾN TRÚC SUPABASE CLOUD & SUPAVISOR POOLING

### 2.1. Thông số Kết nối Môi trường Production
* **Project Reference:** `ykfosnwbgphlwpufnxrd`
* **Vùng triển khai:** AWS `ap-southeast-1` (Singapore — tối ưu độ trễ $< 35\text{ ms}$ về Việt Nam)
* **REST / API Endpoint:** `https://ykfosnwbgphlwpufnxrd.supabase.co`
* **Direct Database Connection (Session Mode):**
  ```text
  postgresql://postgres.ykfosnwbgphlwpufnxrd:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
  ```
* **Supavisor Connection Pooler (Transaction Mode — Cấp cho bài test k6 1.000 VUs):**
  ```text
  postgresql://postgres.ykfosnwbgphlwpufnxrd:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

> [!IMPORTANT]
> **Hướng dẫn cho QA Lead (Tester 1 — Trương Đức Huy) khi chạy k6:**
> Tuyệt đối sử dụng cổng **`6543`** (Supavisor Transaction Mode). Chế độ này tái sử dụng kết nối ngay sau mỗi transaction, cho phép phục vụ đồng thời $\ge 1.000$ virtual users mà không bao giờ vượt quá ngưỡng `max_connections` của PostgreSQL.

---

## 3. TỐI ƯU HÓA CHỈ MỤC (INDEX TUNING) PHỤC VỤ K6 LOAD TEST

Nhằm đáp ứng yêu cầu k6 của QA Lead: $1.000$ VUs cùng truy cập vào đường link tiếp thị `/r/[code]` với $p95 < 200\text{ ms}$, BE1 đã bổ sung tệp migration [`supabase/migrations/20261102140000_be1_w5_k6_perf_and_indexes.sql`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/supabase/migrations/20261102140000_be1_w5_k6_perf_and_indexes.sql):

1. **Covering Index cho Link Lookup (`Index-Only Scan`):**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_affiliate_links_k6_lookup
   ON public.affiliate_links (unique_code, is_active)
   INCLUDE (id, destination_url, reseller_id, campaign_id, product_id);
   ```
   * *Tác động:* Loại bỏ hoàn toàn việc đọc heap table, giảm thời gian giải mã đường link xuống dưới $12\text{ ms}$.

2. **Index ghi nhận Click đồng thời cao (`clicks`):**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_clicks_link_ip_recent
   ON public.clicks (link_id, ip_address, clicked_at DESC);
   ```

3. **Covering Indexes cho RPC `get_reseller_wallet_summary`:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_commissions_reseller_status_covering
   ON public.commissions (reseller_id, status)
   INCLUDE (net_amount, gross_amount, platform_fee, created_at, order_id);

   CREATE INDEX IF NOT EXISTS idx_orders_reseller_status_covering
   ON public.orders (reseller_id, status)
   INCLUDE (amount, reseller_commission, flag_self_purchase);
   ```

---

## 4. KẾT QUẢ ĐO LƯỜNG HIỆU NĂNG (BENCHMARK EVIDENCE)

Đo lường độc lập qua script [`scripts/benchmark-reseller-wallet.mjs`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/scripts/benchmark-reseller-wallet.mjs) với $50$ lần thực thi:

```text
================ KẾT QUẢ ĐO LƯỜNG CHI TIẾT ================
1. RPC get_reseller_wallet_summary:
   - Số lượt thực thi: 50/50
   - Trung bình (Mean): 10.68 ms
   - p50 (Median):      9.68 ms
   - p95:               17.09 ms  <-- [ĐẠT TIÊU CHUẨN < 20ms]
   - p99:               18.19 ms
   - Tiêu chuẩn (<20ms): ĐẠT (PASS)

2. Affiliate Link Index-Only Lookup (/r/[code]):
   - Số lượt thực thi: 50/50
   - Trung bình (Mean): 11.38 ms
   - p50 (Median):      9.83 ms
   - p95:               19.92 ms
   - p99:               33.82 ms
===========================================================
```

---

## 5. XÁC MINH DỮ LIỆU & STORAGE BUCKET PRODUCTION

1. **Storage Bucket `campaign-videos`:**
   - Quyền truy cập: `public = true`.
   - Giới hạn dung lượng: `100MB` (`104857600 bytes`).
   - Định dạng MIME cho phép: `video/mp4`, `video/webm`, `video/quicktime`.
   - Streaming URL format: `https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/[filename].mp4`.

2. **Kiểm thử tự động Suite BE1 Week 5:**
   Lệnh thực thi: `npm run test:be1:w5`
   - ✅ `BE1-W5-01: Database core tables exist and respond with valid schema` (PASS)
   - ✅ `BE1-W5-01: pgvector extension is available and functional` (PASS)
   - ✅ `BE1-W5-02: Affiliate link lookup is optimized (< 25ms) for k6 1.000 VUs load test` (PASS)
   - ✅ `BE1-W5-02: Stored Procedure RPC get_reseller_wallet_summary executes with schema compliance` (PASS)
   - ✅ `BE1-W5-03: Storage bucket 'campaign-videos' is public and configured for video streaming` (PASS)

---

## 6. SẴN SÀNG BÀN GIAO (HANDOFF TO QA LEAD & FE LEAD)
* **Bàn giao cho QA Lead (Trương Đức Huy):** Sẵn sàng cho bài test k6 chạy lúc 08:30 sáng 03/11.
* **Bàn giao cho FE Lead (Cao T. Thu Diệu):** Sẵn sàng URL Storage và các biến môi trường Production Database.

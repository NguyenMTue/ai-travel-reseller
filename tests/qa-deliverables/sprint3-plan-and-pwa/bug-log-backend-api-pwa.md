# BÁO CÁO GHI NHẬN VẤN ĐỀ KIỂM THỬ BACKEND & API (BUG LOG BACKEND API PWA)
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** Tracking Redirect Router & Reseller Analytics API  
**Người phụ trách báo cáo:** Senior QA Engineer  
**Đối tượng nhận xử lý:** Backend / API Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 21/10/2026  
**Nguyên tắc ghi nhận:** Chỉ ghi nhận lỗi trên các tính năng/cấu hình **ĐÃ ĐƯỢC PHÁT TRIỂN (NHÓM A)**; tuyệt đối không báo bug cho các endpoint thuộc diện chờ phát triển (Nhóm B).

---

## 1. TỔNG QUAN
Qua kiểm thử logic server-side, thẩm định mã nguồn các API liên quan đến luồng truy cập từ thiết bị di động (Mobile User-Agent detection, Tracking Redirect `/r/[code]`, và Reseller Analytics API), QA ghi nhận **2 vấn đề kỹ thuật thực tế** cần Backend Dev tối ưu hóa:

| Mã Bug | Tên vấn đề | Mức độ nghiêm trọng (Severity) | File source code liên quan | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| `BUG-BE-PWA-01` | Rate Limiter chống click tặc trên `/r/[code]` lưu trong Memory Map, không đồng bộ được khi scale Serverless đa worker | **High** | `src/lib/tracking/rate-limiter.ts`, `app/r/[code]/route.ts` | 🔴 Mới ghi nhận |
| `BUG-BE-PWA-02` | Endpoint `/api/reseller/analytics` thiếu `Cache-Control` header cho truy vấn thống kê di động qua 4 hàm RPC | **Medium** | `app/api/reseller/analytics/route.ts` | 🔴 Mới ghi nhận |

---

## 2. CHI TIẾT TỪNG VẤN ĐỀ

### 1. BUG-BE-PWA-01: Rate Limiter chống click tặc trên `/r/[code]` lưu trong Memory Map, không đồng bộ được khi scale Serverless đa worker
- **Mã Bug:** `BUG-BE-PWA-01`
- **Vị trí phụ trách:** Backend / API Dev / DevOps
- **Tính năng & Mã SRS bị ảnh hưởng:** Tracking Redirect & Chống gian lận click tặc di động (`FR-TRK-03`, `FR-TRK-04`, `RULE-06`)
- **Test Case liên quan:** `TC-PWA-22`, `TC-PWA-23`
- **Mức độ nghiêm trọng:** `High`
- **File source code nghi ngờ gây lỗi:** `src/lib/tracking/rate-limiter.ts` (dòng 12–35) và `app/r/[code]/route.ts` (dòng 48–50)
- **Các bước tái hiện (Steps to Reproduce):**
  1. Khởi chạy ứng dụng trên môi trường Next.js production với chế độ cluster (hoặc triển khai trên nền tảng Serverless như Vercel/Cloud Run với nhiều container instances).
  2. Dùng script gửi 15 lượt click liên tiếp trong 5 giây từ cùng 1 IP di động đến đường link `/r/[code]`.
  3. Kiểm tra các bản ghi được insert vào bảng `clicks`.
- **Kết quả mong đợi:**
  - Hệ thống phải phát hiện chính xác IP đó đã vượt quá ngưỡng 10 clicks/phút và đánh dấu `is_valid = false` kèm `invalid_reason = 'RATE_LIMIT_EXCEEDED'` từ click thứ 11 trở đi một cách nhất quán trên toàn bộ các instances.
- **Kết quả thực tế:**
  - File `src/lib/tracking/rate-limiter.ts` hiện đang sử dụng bộ nhớ in-memory cục bộ:
    ```ts
    // Lưu trữ in-memory timestamps theo key: `${ipAddress}:${linkId}`
    const clickLogMap = new Map<string, number[]>();
    ```
  - Trong môi trường Serverless hoặc Node.js multi-worker, mỗi request từ điện thoại khách hàng được định tuyến đến một instance/worker khác nhau có vùng nhớ riêng biệt.
  - *Hậu quả:* Bot hoặc click tặc từ thiết bị di động gửi hàng chục requests liên tiếp nhưng không bị bắt rate limit vì số đếm bị phân tán rải rác trên các process khác nhau.
- **Giải pháp khuyến nghị cho Backend:**
  - Chuyển `clickLogMap` sang lưu trữ tập trung có thời gian sống (TTL) bằng Redis (Upstash Redis) hoặc sử dụng hàm atomic RPC trên Supabase/PostgreSQL để đếm số lượt click theo IP trong cửa sổ 60 giây.

---

### 2. BUG-BE-PWA-02: Endpoint `/api/reseller/analytics` thiếu `Cache-Control` header cho truy vấn thống kê di động qua 4 hàm RPC
- **Mã Bug:** `BUG-BE-PWA-02`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã SRS bị ảnh hưởng:** Hiệu năng mạng di động & Tối ưu hóa tải dữ liệu (`NFR-PERF-01`, `FR-ANA-06`)
- **Test Case liên quan:** `TC-PWA-18`
- **Mức độ nghiêm trọng:** `Medium`
- **File source code nghi ngờ gây lỗi:** `app/api/reseller/analytics/route.ts` (dòng 85–116)
- **Các bước tái hiện:**
  1. Sử dụng ứng dụng trên thiết bị di động kết nối mạng 3G/4G chập chờn.
  2. Truy cập phân hệ Reseller và chuyển đổi qua lại giữa tab Chiến dịch và tab Thống kê 3 lần trong vòng 30 giây.
  3. Kiểm tra Network tab và số lượng query gửi xuống cơ sở dữ liệu Supabase.
- **Kết quả mong đợi:**
  - Dữ liệu thống kê phân tích (clicks, devices, timeseries, top campaigns) không biến động theo từng giây. API cần thiết lập header `Cache-Control: private, max-age=30, stale-while-revalidate=60` để trình duyệt di động hoặc HTTP proxy có thể sử dụng lại dữ liệu trong thời gian ngắn, giảm độ trễ render trên điện thoại.
- **Kết quả thực tế:**
  - Endpoint trả về `NextResponse.json(...)` mặc định, không cấu hình bất kỳ chỉ thị cache nào.
  - Mỗi lần màn hình active, 4 hàm Postgres RPC nặng (`get_reseller_overview_stats`, `get_reseller_click_timeseries`, `get_reseller_top_campaigns`, `get_reseller_device_stats`) lại bị ép chạy lại đồng thời trên database.
  - *Hậu quả:* Gây lãng phí băng thông di động của người dùng, giao diện trên điện thoại hiển thị loading lâu (độ trễ tăng cao khi sóng yếu), và tăng tải không cần thiết lên DB Supabase.
- **Giải pháp khuyến nghị cho Backend:**
  - Bổ sung header cache trong `NextResponse.json`:
    ```ts
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
    ```

---
*Báo cáo được lập tự động bởi Senior QA Engineer phục vụ Sprint 3 Review.*

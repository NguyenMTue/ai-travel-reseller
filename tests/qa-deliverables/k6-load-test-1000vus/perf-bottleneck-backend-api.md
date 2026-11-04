# BÁO CÁO GHI NHẬN ĐIỂM NGHẼN HIỆU NĂNG - BACKEND & API (K6 1.000 VUs)
**Dự án:** AI Travel Reseller Network  
**Kỹ sư kiểm thử:** Trương Đức Huy (Senior QA & Performance Engineer)  
**Môi trường kiểm thử:** Staging / Pre-Production (Next.js 16.3.8 + Node.js runtime)  
**Tiêu chuẩn đối chiếu:** SRS v1.1 (`FR-TRK-02`, `NFR-PER-01`..`05`)  
**Ngày phát hành:** 02/11/2026  

---

## 1. TỔNG QUAN VỊ TRÍ ĐIỂM NGHẼN (EXECUTIVE OVERVIEW)
Trong đợt diễn tập kiểm thử tải k6 với quy mô **1.000 Virtual Users (1.000 VUs)**, phân hệ Backend API gánh chịu 60% tổng lưu lượng toàn hệ thống tập trung vào Endpoint **Tracking Link Redirect Router (`app/r/[code]/route.ts`)**.

Mặc dù hệ thống duy trì được tính liên tục và không bị crash sập toàn phần, thời gian phản hồi của hop chuyển hướng HTTP 302 ở mức đỉnh tải 1.000 VUs đã chạm sát ngưỡng trần SLA 2.000ms (`P95 = 1.980ms`, `P99 = 3.120ms`), và trong trường hợp DB connection bị trễ, router bị neo trễ tới 7 giây do cơ chế timeout fallback.

---

## 2. DANH SÁCH CHI TIẾT CÁC ĐIỂM NGHẼN (BOTTLENECK DETAILS)

### 🔴 BOTTLENECK-BE-01: Thao tác ghi nhận Click (`clicks.insert`) chạy đồng bộ trong Request-Response Lifecycle
- **File mã nguồn bị ảnh hưởng:** `app/r/[code]/route.ts` (dòng 53 - 79)
- **Mã yêu cầu SRS bị đe dọa:** `FR-TRK-02` (Redirect khách hàng dưới 2.0 giây)
- **Mô tả hiện tượng:**
  Router chuyển hướng thực hiện truy vấn `await adminClient.from("clicks").insert({...})` ngay trước khi trả về `NextResponse.redirect(...)`. Mặc dù được bọc trong khối `try/catch` để tránh làm crash chuyển hướng nếu insert lỗi, thao tác `await` này vẫn bắt buộc HTTP connection của khách hàng phải chờ I/O ghi đĩa của cơ sở dữ liệu hoàn tất.
- **Tác động hiệu năng dưới tải 1.000 VUs:**
  + Ở mức 600 req/s, Postgres I/O bị nghẽn ghi, khiến thời gian phản hồi của mỗi request bị cộng dồn thêm từ **150ms đến 650ms**.
  + Nếu kết nối mạng giữa Backend và Database bị trễ, toàn bộ tiến trình redirect của khách bị nghẽn lại không cần thiết.
- **Khuyến nghị khắc phục (Actionable Remediation):**
  1. Sử dụng API mới của Next.js Server Components `after()` (`import { after } from 'next/server'`) để tách việc insert click ra xử lý sau khi response 302 đã được gửi về trình duyệt khách hàng:
  ```typescript
  // app/r/[code]/route.ts
  import { NextResponse, after } from "next/server";

  // Sau khi xác định link hợp lệ:
  after(async () => {
    try {
      await adminClient.from("clicks").insert(clickPayload);
    } catch (e) {
      console.warn("[Tracking Async Insert Failed]", e);
    }
  });

  // Trả về ngay lập tức HTTP 302 không cần chờ insert DB!
  return NextResponse.redirect(redirectUrl.toString(), 302);
  ```
  2. Hoặc đẩy log click vào một hàng đợi Message Queue (Upstash Redis / QStash / In-memory queue) và dùng batch worker xử lý ghi gộp 500 records/lần vào Supabase.

---

### 🔴 BOTTLENECK-BE-02: Thiếu tầng Cache In-Memory / Edge Caching cho bảng tra cứu `affiliate_links`
- **File mã nguồn bị ảnh hưởng:** `app/r/[code]/route.ts` (dòng 23 - 35)
- **Mã yêu cầu SRS bị đe dọa:** `NFR-PER-01`
- **Mô tả hiện tượng:**
  Mỗi lượt click vào link `/r/[code]` đều kích hoạt một câu lệnh `SELECT` trực tiếp vào Supabase:
  ```typescript
  const { data: link, error } = await adminClient
    .from("affiliate_links")
    .select("id, destination_url, is_active, reseller_id, campaign_id, product_id")
    .eq("unique_code", cleanCode)
    .maybeSingle();
  ```
- **Tác động hiệu năng dưới tải 1.000 VUs:**
  Bản chất của bảng `affiliate_links` là **Read-Heavy** (đọc 99.9%, ghi 0.1% khi tạo link mới). Việc bắn 600 queries/giây cho cùng một nhóm mã tracking (ví dụ: `TESTlink`, `BANAHILLS`, `DANANGTOUR`) khiến CPU của Database bị chiếm dụng vô ích và dễ chạm ngưỡng giới hạn Connection Pool của Supabase.
- **Khuyến nghị khắc phục:**
  Tích hợp LRU Cache trong bộ nhớ Next.js (`lru-cache`) hoặc Redis Cache (Upstash Redis) với TTL 10 - 15 phút:
  ```typescript
  // Pseudo-code cache tra cứu link
  const cachedLink = await redis.get(`tracking:${cleanCode}`);
  if (cachedLink) {
    return handleRedirect(cachedLink);
  }
  // Cache miss -> Query DB và set cache TTL 600s
  ```

---

### 🟡 BOTTLENECK-BE-03: Rate Limiter cục bộ trong bộ nhớ (In-Memory Map) không đồng bộ giữa các Replicas
- **File mã nguồn bị ảnh hưởng:** `src/lib/tracking/rate-limiter.ts`
- **Mô tả hiện tượng:**
  Hàm `checkClickRateLimit` lưu IP tracking trong cấu trúc `Map<string, { count, resetTime }>` cục bộ của tiến trình Node.js hiện tại.
- **Tác động hiệu năng & Logic nghiệp vụ:**
  Khi hạ tầng Staging/Production triển khai autoscaling (nhiều pods/containers Next.js đứng sau Load Balancer), một IP spam click gửi 15 requests trong 10 giây nhưng chia đều cho 3 pods khác nhau thì mỗi pod chỉ đếm 5 requests -> Không kích hoạt được cờ `is_valid: false` (RATE_LIMIT_EXCEEDED) theo yêu cầu `FR-TRK-04`.
- **Khuyến nghị khắc phục:**
  Chuyển State của Rate Limiter sang Redis Key với cấu trúc `INCR` và `EXPIRE 60s` (hoặc dùng thư viện `@upstash/ratelimit`).

---

### 🟡 BOTTLENECK-BE-04: Thiếu Timeout & AbortController cho Supabase SDK Call
- **File mã nguồn bị ảnh hưởng:** `app/r/[code]/route.ts`
- **Mô tả hiện tượng:**
  Khi Supabase gặp sự cố mạng hoặc pool bị quá tải, câu lệnh `adminClient.from(...).select(...)` không có cấu hình timeout cụ thể, dẫn đến việc request bị treo tối đa theo mặc định của Fetch API (tới 7-10 giây) trước khi văng exception.
- **Khuyến nghị khắc phục:**
  Thêm AbortSignal với timeout 500ms cho DB call trong router redirect. Nếu quá 500ms không có phản hồi, kích hoạt fallback redirect ngay để bảo đảm trải nghiệm khách hàng dưới 2 giây.

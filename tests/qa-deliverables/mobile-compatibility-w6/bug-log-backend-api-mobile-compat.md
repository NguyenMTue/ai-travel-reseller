# BÁO CÁO GHI NHẬN LỖI & ĐỀ XUẤT TỐI ƯU HÓA BACKEND / API CHO TRẢI NGHIỆM MOBILE (TUẦN 6)
## PHÂN HỆ: MOBILE USER-AGENT PARSING, RATE LIMITING & NETWORK RESILIENCE

- **Dự án:** AI Travel Reseller Network (TravelLink)
- **QA Automation Engineer:** Trương Đức Huy (Senior QA Lead)
- **Phạm vi kiểm thử:** Router phân tích User-Agent di động (`src/lib/tracking/ua-parser.ts`), Router chuyển hướng `/r/[code]`, API chat `/api/chat` và API đặt vé `/api/storefront/orders/confirm` trên điều kiện kết nối mạng di động (3G/4G chập chờn).
- **Ngày ghi nhận:** 19/11/2026

---

### BẢNG TỔNG QUAN PHÂN LOẠI VẤN ĐỀ BACKEND / API MOBILE

| Mã Issue | Tên vấn đề / Lỗi phát hiện | Vị trí file mã nguồn | Mức độ nghiêm trọng | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `BUG-BE-MOB-01` | Nhận diện User-Agent thiết bị iOS đời mới (iPadOS / Safari) đôi khi nhận diện nhầm Desktop | `src/lib/tracking/ua-parser.ts` | **Low / Analytics** | Đề xuất tối ưu |
| `BUG-BE-MOB-02` | API Chat AI cần tối ưu payload streaming cho thiết bị di động có băng thông hạn chế | `app/api/chat/route.ts` | **Low / Network Efficiency** | Đề xuất tối ưu |

---

### CHI TIẾT CÁC VẤN ĐỀ GHI NHẬN:

#### 1. BUG-BE-MOB-01: Nhận diện User-Agent thiết bị di động Apple (iPadOS / Safari Touch)
- **Vị trí phát hiện:** `src/lib/tracking/ua-parser.ts`
- **Mức độ:** **Low / Analytics**
- **Mô tả chi tiết:**
  Từ phiên bản iPadOS 13 trở lên, Apple mặc định gửi chuỗi User-Agent giống hệt macOS desktop (`Macintosh; Intel Mac OS X 10_15_7...`) khi người dùng duyệt web ở chế độ Desktop. Nếu logic `ua-parser.ts` chỉ dựa vào chuỗi `iPhone|iPad|iPod` mà không kiểm tra thêm thông tin cảm ứng (Client Hints `Sec-CH-UA-Mobile` hoặc header từ client), hệ thống sẽ phân loại nhầm các lượt click từ thiết bị cảm ứng iPad thành Desktop trong bảng `clicks` (`device_type = 'desktop'`).
- **Giải pháp đề xuất:** Bổ sung kiểm tra Client Hints header `Sec-CH-UA-Mobile: ?1` và `Sec-CH-UA-Platform: "iOS"` khi có sẵn từ trình duyệt hiện đại.

---

#### 2. BUG-BE-MOB-02: Tối ưu kích thước gói tin và thời gian phản hồi cho mạng di động 4G/3G
- **Vị trí phát hiện:** `app/api/chat/route.ts` & `src/lib/chat/transport.ts`
- **Mức độ:** **Low / Performance**
- **Mô tả:** Người dùng di động thường xuyên di chuyển giữa các trạm sóng (Cell handover) dẫn đến hiện tượng rớt gói tin hoặc độ trễ biến thiên (Jitter). Cơ chế `transport.ts` hiện tại có timeout nhưng nên tích hợp cờ nén Gzip/Brotli cho toàn bộ response JSON và cơ chế auto-reconnect ngắn (Exponential Backoff 1-2 lần) trước khi hiển thị thông báo lỗi mạng cho người dùng.

---

### GHI CHÚ TIẾN ĐỘ (OUT OF CURRENT IMPLEMENTATION - KHÔNG TÍNH BUG):
- Tính năng Push Notification nền (Web Push API qua Service Worker) trên thiết bị di động đang trong giai đoạn chuẩn bị kiến trúc, chưa nằm trong phạm vi nghiệm thu của Sprint Tuần 6.

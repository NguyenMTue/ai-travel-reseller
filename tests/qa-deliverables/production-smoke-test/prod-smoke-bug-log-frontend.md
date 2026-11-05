# BÁO CÁO GHI NHẬN VẤN ĐỀ & ĐÁNH GIÁ GIAO DIỆN PRODUCTION (FRONTEND)
## BỘ KIỂM THỬ SMOKE TEST TỰ ĐỘNG PLAYWRIGHT
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ thẩm định:** Giao diện Người dùng (Frontend UI/UX & PWA)  
**Người thực hiện:** Trương Đức Huy (Senior QA Lead & Automation Engineer)  
**Ngày thực hiện:** 05/11/2026  
**Môi trường:** Production Smoke Test (Playwright Suite: `tests/production-smoke.spec.ts`)  
**Báo cáo HTML tham chiếu:** [`tests/playwright-production-smoke-report.html`](../../playwright-production-smoke-report.html)

---

## 1. TỔNG QUAN TÌNH TRẠNG LỖI FRONTEND

| Phân loại Mức độ | Số lượng | Tình trạng | Đánh giá Tiêu chuẩn Release |
|---|:---:|---|:---:|
| **P0 - Blocker (Chặn phát hành / Trắng trang)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P1 - Critical (Lỗi nghiêm trọng luồng người dùng)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P2 - Major (Lỗi chức năng chính)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P3 - Minor / Góp ý hoàn thiện (Enhancement)** | **2** | Đã ghi nhận | Chuyển tiếp cải tiến Sprint tới |

---

## 2. DANH SÁCH GHI NHẬN VẤN ĐỀ TRÊN CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI (NHÓM A)

> [!NOTE]
> Bảng này tuân thủ nghiêm ngặt nguyên tắc **Progress-Aware**: Chỉ ghi nhận các vấn đề kỹ thuật và góp ý tối ưu trên các màn hình/tính năng đã hoàn thiện mã nguồn trong Nhóm A. Tuyệt đối không quy kết các tính năng chưa phát triển trong lộ trình (Nhóm B) thành lỗi.

| Mã Vấn đề | Màn hình / Component | Thiết bị | Mức độ | Hiện trạng Ghi nhận từ Smoke Test | Phân tích Kỹ thuật & Đề xuất Khắc phục | Trạng thái |
|---|---|---|:---:|---|---|:---:|
| **FE-SMOKE-OBS-01** | Trợ lý Chat AI (`/chat`) & Thư viện Media (`/merchant/library`) | Desktop & Mobile | Minor (Hydration Warning) | Terminal ghi nhận cảnh báo React SSR Hydration: `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties` liên quan đến thuộc tính `style={{caretColor: "transparent"}}` trên ô `<textarea id="chat-message">` và ô tìm kiếm video. | **Nguyên nhân:** Thuộc tính `caretColor` được can thiệp động phía client khi khởi tạo để ẩn con trỏ chuột trước khi người dùng focus, gây sai khác nhẹ giữa chuỗi HTML render từ Server và Client Virtual DOM.<br>**Đề xuất:** Thay vì gán inline style, nên sử dụng class Tailwind `caret-transparent focus:caret-auto` trong CSS để đồng nhất hoàn toàn giữa SSR và CSR, loại bỏ triệt để cảnh báo hydration trong console. | Đã ghi nhận / Tối ưu v1.1 |
| **FE-SMOKE-OBS-02** | Hình ảnh Hero Banner Trang chủ (`/coast.svg`) | Desktop & Mobile | Minor (LCP Performance) | Next.js Dev/Build inspector khuyến nghị: `Image with src "/coast.svg" was detected as the Largest Contentful Paint (LCP). Please add loading="eager" property`. | **Nguyên nhân:** Hình ảnh minh họa bờ biển miền Trung là phần tử đồ họa chiếm diện tích hiển thị lớn nhất (LCP) trong vùng màn hình đầu tiên (above the fold). Hiện tại thẻ `Image` đã có `priority` nhưng chưa gán tường minh `loading="eager"`.<br>**Đề xuất:** Bổ sung `loading="eager"` cho component `Image` tại `app/page.tsx` dòng 60 để tối ưu hóa chỉ số LCP của Vercel Speed Insights đạt điểm tối đa $> 95$. | Đã ghi nhận / Tối ưu v1.1 |

---

## 3. ĐÁNH GIÁ CHẤT LƯỢNG GIAO DIỆN & TRẢI NGHIỆM ĐA NỀN TẢNG

1. **Hiển thị Responsive & Khắc phục Tràn ngang:**
   - 100% các màn hình kiểm thử trên iPhone 13 (`390x844`) đạt chỉ số `document.documentElement.scrollWidth <= window.innerWidth` (0px horizontal overflow).
   - Thanh điều hướng Mobile Bottom Navigation hiển thị cân đối, căn lề an toàn (`safe-area-inset-bottom`), chuyển đổi giữa các tab mượt mà.
2. **Kích thước Vùng chạm (Touch Target):**
   - Tất cả các nút bấm cốt lõi (*"Tạo link"*, *"Copy link"*, *"Copy Caption"*, *"Hỏi Assistant"*) đều có kích thước $\ge 44 \times 44\text{px}$, đảm bảo trải nghiệm thao tác ngón tay tự nhiên trên màn hình cảm ứng di động.
3. **Tương tác Clipboard 1-Click:**
   - Hoạt động ổn định trên cả môi trường Desktop và Mobile PWA, sao chép chính xác link tiếp thị và nội dung bài đăng, hiển thị Toast phản hồi tức thì trong vòng $< 300\text{ms}$.
4. **Cam kết Minh bạch Đối tác (`RULE-01`):**
   - Dòng thông điệp *"Khách hàng thanh toán trực tiếp với doanh nghiệp"* đi kèm biểu tượng bảo vệ `ShieldCheck` hiển thị nổi bật, rõ ràng ngay tại vị trí Hero của Landing Page.

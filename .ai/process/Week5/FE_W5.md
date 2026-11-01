# MY WORK PLAN — FE_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Cao Thị Thu Diệu (Frontend Lead)  
**Role:** Frontend Lead (Next.js 16 Production Build, PWA Mobile Commerce, Checkout Flow & UI Polish)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/fe-w5-production-checkout-pwa-polish` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Đã hoàn thiện trình phát video dọc 9:16 chuyên dụng kèm nút tải trực tiếp file video MP4 về thiết bị di động; tối ưu hóa cảm ứng chạm vuốt và Safe Area Inset cho PWA Mobile qua PR #54.
- **Trọng tâm Frontend trong Tuần 5 — Hoàn thiện Chuỗi giá trị E2E & Production Build:**
  1. **Khóa chặt Luồng Thanh toán (Checkout Flow Integration):** Khi AI Sales Agent nhận diện ý định mua hàng và cung cấp link thanh toán, người dùng click nút "Đặt vé ngay" sẽ được điều hướng sang cổng thanh toán hoặc trang xác nhận đơn hàng của Merchant với đầy đủ mã định danh `reseller_id` và `tracking_code`.
  2. **Tối ưu hóa Production Build & PWA Lighthouse:** Phân tích bundle size, nén tài nguyên ảnh/font tĩnh, cấu hình Service Worker cache thông minh; đạt điểm Lighthouse Performance $\ge 90$ và PWA Installability đạt chuẩn $100\%$ trên thiết bị di động.
  3. **Trực chiến Khắc phục Lỗi Giao diện trong phiên UAT:** Đồng hành cùng Tester 1 và BA trong các phiên thử nghiệm người dùng ngày 04/11 để fix ngay các lỗi hiển thị, lỗi tràn chữ hoặc layout shift.
  4. **Code Review & Giám sát Tester 3 (FE phụ):** Kiểm duyệt mã nguồn trên nhánh `feature/fe-t3-w5-standalone-ui` của Tester 3, bảo đảm các component độc lập (FAQ Modal, Offline Banner) có interface chuẩn mực, không can thiệp vào các tệp core của dự án.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-W5-01** | Tích hợp Hoàn chỉnh Luồng Thanh toán & Checkout Redirect | **P0** | `READY` | BE1 Order API | FE Lead | Nút đặt vé dẫn sang checkout có lưu attribution token | 03/11 17:00 |
| **FE-W5-02** | Tối ưu Production Build Next.js & PWA Lighthouse Score $\ge 90$ | **P1** | `READY` | Next.js config | FE Lead | Bundle tối ưu, PWA cài đặt 1-chạm không lỗi | 04/11 12:00 |
| **FE-W5-03** | Trực chiến Fix Bug Giao diện trong phiên Final E2E UAT | **P0** | `READY` | Bug reports BA | FE Lead | 100% UI bugs resolved trước Go-Live | 05/11 12:00 |
| **FE-W5-04** | Review cấp 1 & Hỗ trợ tích hợp an toàn component của Tester 3 | **P2** | `READY` | PR Tester 3 | FE Lead | Review comments, Approval 1 & Safe integration | 04/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `FE-W5-01`: Tích hợp Luồng Thanh toán & Checkout Redirect
* **Mục tiêu:** Du khách từ chatbot có thể tiến hành thanh toán mượt mà, ghi nhận đơn hàng vào Supabase.
* **Các bước triển khai:**
  - [ ] Khi AI sinh thẻ gợi ý tour, bổ sung nút CTA nổi bật: *"Thanh toán & Đặt vé ngay"*.
  - [ ] Truyền kèm `reseller_id` trong URL redirect hoặc payload API để kích hoạt cơ chế gán hoa hồng tự động.
  - [ ] Thêm màn hình thông báo *"Đặt vé thành công"* và cập nhật ngay trạng thái giao dịch cho Reseller.
* **DoD:** Chạy thông suốt luồng từ tin nhắn chat sang màn hình đặt vé mà không bị mất mã tiếp thị.

### Task `FE-W5-02`: Tối ưu Production Build & PWA Lighthouse
* **Mục tiêu:** Đảm bảo ứng dụng load cực nhanh trên mạng 4G/5G di động.
* **Các bước triển khai:**
  - [ ] Chạy `npm run build` kiểm tra kích thước First Load JS $< 120\text{ kB}$.
  - [ ] Tối ưu hóa Service Worker (`sw.js`) để cache các icon, fonts và stylesheet tĩnh.
  - [ ] Chạy audit Lighthouse trên Chrome DevTools cho viewport di động.
* **DoD:** Điểm Performance $\ge 90$, Accessibility $\ge 95$, Best Practices $\ge 95$, PWA: Pass.

### Task `FE-W5-04`: Giám sát & Review PR của Tester 3
* **Mục tiêu:** Tận dụng hiệu quả đóng góp giao diện của Tester 3 mà không tạo bất kỳ rủi ro nào cho Core hệ thống.
* **Quy trình:**
  - [ ] Hướng dẫn Tester 3 triển khai component theo đúng interface đã thống nhất.
  - [ ] Kiểm tra diff trên GitHub PR: Đảm bảo PR **chỉ chứa duy nhất các component độc lập** trong `src/components/`, không sửa bất kỳ dòng code nào trong `app/layout.tsx` hay cấu hình hệ thống.
  - [ ] Thực hiện Approval 1 và chuyển tiếp cho PM duyệt gộp nhánh.

---

## 4. DEPENDENCY & INTERFACES

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| FE-W5-01 | Schema đơn hàng từ BE1 | BE1 Lead | `READY` |
| FE-W5-02 | Giao diện đã ổn định | FE Lead | `WAITING` |
| FE-W5-03 | Danh sách lỗi từ phiên UAT | BA & Tester 1 | `WAITING` |
| FE-W5-04 | PR từ Tester 3 | Tester 3 (Tuấn) | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| FE Lead | QA Lead (Tester 1) | Bản build Staging sẵn sàng cho E2E UAT | Web URL Staging | 03/11 17:00 |
| FE Lead | DevOps & BE1 | Mã nguồn nhánh `main` sẵn sàng cho Vercel Deploy | GitHub Branch `main` | 05/11 12:00 |
| FE Lead | Toàn team | Báo cáo tối ưu hóa hiệu năng Lighthouse | PDF / Screenshot | 05/11 17:00 |


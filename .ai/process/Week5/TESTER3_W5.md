# MY WORK PLAN — TESTER3_W5 (FRONTEND JUNIOR / UI IMPLEMENTATION)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Anh Tuấn (Tester 3 chuyển sang Frontend Junior / UI Implementation)  
**Role:** Frontend Junior / UI Implementation (Chuyên trách xây dựng các thành phần giao diện độc lập — Standalone Dumb UI)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Tư (04/11/2026) nộp PR; Nghiệm thu hoàn tất: Thứ Năm (05/11/2026)  
**Branch duy nhất được phép làm việc:** `feature/fe-t3-w5-standalone-ui` (tách từ `dev`)  

---

## 1. Context & Nguyên Tắc Vàng "Không Ảnh Hưởng Đến Người Khác Trong Nhóm"

> [!IMPORTANT]
> **RÀNG BUỘC KỶ LUẬT KỸ THUẬT & QUY TẮC AN TOÀN ĐỘC LẬP TUYỆT ĐỐI:**
> 1. **Bản chất vai trò:** Thành viên đã chính thức chuyển vị trí sang hỗ trợ Frontend trong team, chuyên đảm nhiệm việc xây dựng các thành phần giao diện tĩnh độc lập nhằm giảm tải cho FE Lead.
> 2. **Nguyên tắc "Zero Blocker — Không làm nghẽn bất kỳ ai":**
>    * Toàn bộ các task được giao cho bạn là các **Thành phần giao diện độc lập (Standalone Dumb UI Components)**, không nằm trên đường găng (critical path) của dự án.
>    * Không có bất kỳ thành viên nào (FE Lead Diệu, BE1 Tuệ, BE2 Huỳnh, QA Huy...) phải chờ đợi task của bạn để hoàn thành UAT hay Go-Live. Nếu task của bạn hoàn thành tốt và sạch lỗi, FE Lead sẽ gắn nút gọi component vào giao diện; nếu task chưa hoàn tất hoặc gặp lỗi, hệ thống chính vẫn phát hành bình thường mà không hề bị ảnh hưởng.
> 3. **KHU VỰC CẤM TUYỆT ĐỐI (FORBIDDEN CORE ZONES):**
>    * ❌ **CẤM** chạm vào các file App Router gốc: `app/layout.tsx`, `app/page.tsx`, `app/manifest.ts`, `app/globals.css`.
>    * ❌ **CẤM** can thiệp vào các tệp cấu hình hệ thống: `next.config.ts`, `proxy.ts`, `package.json`, `tsconfig.json`.
>    * ❌ **CẤM** can thiệp vào mã nguồn kiểm thử tự động trong thư mục `tests/` hoặc `playwright.config.ts`.
>    * ❌ **CẤM** can thiệp vào Supabase Auth, middleware, route handlers `/api/*`, hoặc route tracking `/r/[code]`.
>    * ❌ **CẤM** viết logic gọi mạng `fetch`, import Supabase client hoặc sử dụng `useRouter` trong component của mình.
> 4. **Quy chế Commit, PR và Phê duyệt:**
>    * Chỉ commit mã nguồn trên nhánh riêng: `feature/fe-t3-w5-standalone-ui`.
>    * **TUYỆT ĐỐI CẤM TỰ Ý MERGE VÀO `dev` HOẶC `main`**.
>    * Mọi Pull Request bắt buộc phải chạy `npm run lint` và `npx tsc --noEmit` đạt 0 lỗi.
>    * Bắt buộc có **2 lượt phê duyệt (Approval)** từ **FE Lead (Diệu)** và **PM/BE1 (Tuệ)** trước khi merge.

---

## 2. Executive Summary
Trong Sprint 5, bạn tập trung hoàn thành 02 component giao diện độc lập giúp hoàn thiện trải nghiệm người dùng, đồng thời hỗ trợ kiểm thử giao diện thực tế trên thiết bị cá nhân:
1. **Modal Giải đáp Thắc mắc cho Reseller (`ResellerFaqModal`):** Dựng cửa sổ popup tĩnh hiển thị 5 câu hỏi thường gặp nhất về cách rút tiền ví hoa hồng, quy định chia sẻ link tiếp thị và thời gian đối soát.
2. **Banner Cảnh báo Mất Kết nối Mạng (`OfflineBanner`):** Component hiển thị thanh thông báo nhẹ nhàng ở góc màn hình khi thiết bị di động của người dùng tạm thời mất sóng Internet.
3. **Kiểm tra chất lượng & Đóng góp ý kiến UAT:** Đảm bảo mã nguồn cá nhân sạch 100% không ảnh hưởng đến build của nhóm và trải nghiệm thử ứng dụng trên điện thoại cá nhân để ghi nhận feedback.

---

## 3. TODAY — MUST DO (Thứ Hai 02/11/2026)

| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|:---:|---|---|---|---|:---:|:---:|
| **P0** | Họp Kick-off Sprint 5 & Xác nhận cam kết tuân thủ quy tắc độc lập an toàn | Nắm rõ giới hạn phạm vi làm việc, không can thiệp code ngoài | Toàn team | Biên bản cam kết | 1.5h | DONE |
| **P0** | Checkout nhánh `feature/fe-t3-w5-standalone-ui` từ nhánh `dev` mới nhất | Môi trường làm việc riêng biệt, không đụng độ nhánh khác | Nhánh `dev` sạch | Local branch sạch | 0.5h | READY |
| **P1** | Đọc tài liệu nội dung FAQ và thông số layout do FE Lead & UI/UX cung cấp | Nắm rõ nội dung văn bản và style cần hiển thị | FE Lead, UI/UX | Ghi chú specs UI | 1h | READY |

---

## 4. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **T3-FE-W5-01** | Xây dựng Component tĩnh `src/components/reseller/reseller-faq-modal.tsx` | **P2** | `READY` | Text FAQ specs | Tester 3 | File `reseller-faq-modal.tsx` (Dumb UI) | 03/11 17:00 |
| **T3-FE-W5-02** | Xây dựng Component tĩnh `src/components/common/offline-banner.tsx` | **P2** | `READY` | Specs UI | Tester 3 | File `offline-banner.tsx` (Dumb UI) | 04/11 12:00 |
| **T3-FE-W5-03** | Chạy kiểm tra Typecheck (`tsc`), Linter (`eslint`) & Nộp PR sạch | **P1** | `READY` | T3-FE-W5-01, 02 | Tester 3 | 0 errors, PR trên GitHub chờ 2 approvals | 04/11 17:00 |
| **T3-FE-W5-04** | Tiếp thu review, hoàn thiện component & tham gia đóng góp feedback UAT | **P2** | `READY` | Review comments | Tester 3 | PR merged an toàn + Danh sách feedback UI | 05/11 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT NHIỆM VỤ)

### Task `T3-FE-W5-01`: Component Modal FAQ Cho Reseller (`ResellerFaqModal`)
* **Tệp mục tiêu:** `src/components/reseller/reseller-faq-modal.tsx`
* **Mục đích:** Cung cấp popup trợ giúp giải đáp câu hỏi khi Reseller bấm vào biểu tượng dấu hỏi chấm (?) trên màn hình quản lý ví tiền hoặc chiến dịch.
* **Quy chuẩn kỹ thuật bắt buộc:**
  * Định nghĩa interface props tối giản và độc lập:
    ```typescript
    export interface ResellerFaqModalProps {
      isOpen: boolean;
      onClose: () => void;
    }
    ```
  * Nội dung tĩnh hiển thị dạng Accordion / Danh sách thu gọn:
    1. *Khi nào tôi được nhận hoa hồng?* — Hoa hồng được đối soát và ghi nhận vào ví ngay khi đơn hàng hoàn tất thanh toán.
    2. *Hạn mức rút tiền tối thiểu là bao nhiêu?* — Hạn mức rút tiền tối thiểu là $100.000\text{ VNĐ}$ về tài khoản ngân hàng liên kết.
    3. *Thời hạn hiệu lực của link tiếp thị?* — Link tiếp thị có hiệu lực vĩnh viễn cho đến khi Merchant đóng chiến dịch.
    4. *Làm thế nào để đăng video TikTok lên xu hướng?* — Sử dụng video 9:16 do AI tạo ra và tham khảo cẩm nang mẹo đăng bài.
    5. *Tôi có bị mất hoa hồng nếu khách đổi tour không?* — Hệ thống tự động tính hoa hồng dựa trên giá trị đơn hàng thực tế của khách.
  * Nút "Đóng" gọi hàm `onClose()`.
  * **TUYỆT ĐỐI KHÔNG:** Gọi API mạng, không import router, không sửa file cha.

### Task `T3-FE-W5-02`: Component Thông Báo Mất Mạng (`OfflineBanner`)
* **Tệp mục tiêu:** `src/components/common/offline-banner.tsx`
* **Mục đích:** Hiển thị thanh thông báo nhỏ gọn ở góc màn hình khi trình duyệt kích hoạt sự kiện offline, nhắc người dùng kiểm tra kết nối Internet.
* **Quy chuẩn:**
  * Component độc lập nhận prop: `{ isOffline?: boolean }` hoặc tự lắng nghe sự kiện `navigator.onLine`.
  * Giao diện thanh nhã với tông màu hổ phách / vàng cảnh báo nhẹ, icon mạng bị gạch chéo, thông điệp: *"Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Internet."*

### Task `T3-FE-W5-03`: Tự Kiểm Tra Chất Lượng & Tạo PR
* **Mục tiêu:** Chứng minh mã nguồn cá nhân đạt chuẩn mực chất lượng cao, không gây bất kỳ lỗi compile nào cho cả nhóm.
* **Các bước triển khai:**
  - [ ] Chạy lệnh `npm run lint` ở terminal cục bộ, sửa sạch toàn bộ cảnh báo syntax hoặc import thừa.
  - [ ] Chạy lệnh `npx tsc --noEmit` xác nhận 0 lỗi kiểu dữ liệu TypeScript.
  - [ ] Mở Pull Request từ nhánh `feature/fe-t3-w5-standalone-ui` hướng vào `dev`, gán reviewer là FE Lead (Diệu) và PM (Tuệ).

---

## 6. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái | Ghi chú an toàn |
|---|---|---|:---:|---|
| T3-FE-W5-01 | Nội dung câu hỏi FAQ | BA / FE Lead | `READY` | Hoàn toàn độc lập |
| T3-FE-W5-02 | UI specs từ UI/UX | UI/UX Designer | `READY` | Hoàn toàn độc lập |
| T3-FE-W5-03 | T3-FE-W5-01, 02 hoàn tất | Tester 3 | `WAITING` | Không ai phải chờ |
| T3-FE-W5-04 | Review cấp 1 & cấp 2 | FE Lead, PM | `WAITING` | Duyệt độc lập |

---

## 7. DEFINITION OF DONE (DoD)
- [ ] 02 file component `reseller-faq-modal.tsx` và `offline-banner.tsx` được tạo đúng vị trí.
- [ ] Chạy `npm run lint` đạt 0 lỗi, 0 warnings.
- [ ] Chạy `npx tsc --noEmit` đạt 0 lỗi.
- [ ] Không có bất kỳ file Core nào bị thay đổi trong Pull Request.
- [ ] Đạt đủ 2 Approvals từ FE Lead và PM trước khi merge vào `dev`.


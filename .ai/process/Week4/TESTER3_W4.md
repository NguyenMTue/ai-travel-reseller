# MY WORK PLAN — TESTER3_W4 (FE PHỤ / TRAINEE)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Thành viên Tester 3 (Tạm thời điều chuyển sang FE Phụ / Trainee)  
**Role:** Frontend Trainee (Chỉ cắt Dumb UI tĩnh cô lập theo hướng dẫn của FE Lead)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Tư (28/10/2026) nộp PR; Nghiệm thu hoàn tất: Thứ Năm (29/10/2026)  
**Branch duy nhất được phép làm việc:** `feature/fe-t3-video-tips-guide` (tách từ `dev` do FE Lead tạo sẵn)  

---

## 1. Context & Quy Chế An Toàn Đặc Biệt (Strict Guardrails Duy Trì Từ Tuần 3)

> [!CAUTION]
> **RÀNG BUỘC KỶ LUẬT VÀ QUY TẮC CÁCH LY RỦI RO BẮT BUỘC:**
> 1. **Bối cảnh vai trò:** Tester 3 tiếp tục học việc ở vị trí FE phụ, do kỹ năng Frontend và AI còn hạn chế, có tiền sử gây lỗi nghiêm trọng làm hỏng cấu trúc hệ thống và test Playwright trong các sprint trước.
> 2. **Nguyên tắc "Làm ít — An toàn — Tuyệt đối không can thiệp Core":**
>    * Được giao khối lượng công việc cực kỳ nhẹ (chỉ đúng 01 component modal tĩnh), không có logic kết nối mạng, không can thiệp luồng dữ liệu chính.
>    * **KHU VỰC CẤM TUYỆT ĐỐI (FORBIDDEN ZONES — CẤM CHẠM VÀO):**
>      * ❌ **CẤM** chạm vào `app/layout.tsx`, `app/page.tsx`, `app/manifest.ts`, `app/globals.css`.
>      * ❌ **CẤM** chạm vào bất kỳ file cấu hình hệ thống nào: `playwright.config.ts`, `next.config.ts`, `proxy.ts`, `package.json`, `tsconfig.json`.
>      * ❌ **CẤM** chạm vào thư mục kiểm thử: `tests/` hoặc tự ý sửa test runner.
>      * ❌ **CẤM** chạm vào thư mục Supabase: `src/lib/supabase/`, logic Auth, middleware.
>      * ❌ **CẤM** chạm vào các API routes tại `app/api/` hoặc router chuyển hướng `app/r/[code]`.
> 3. **Chỉ làm Dumb Component (Component câm hiển thị tĩnh):**
>    * Component được giao chỉ nhận dữ liệu thông qua `props` tĩnh đã định nghĩa sẵn.
>    * Không dùng `useEffect` gọi `fetch`, không import Supabase client, không dùng `useRouter`.
> 4. **Quy chế PR và Merge:**
>    * Chỉ commit trên nhánh: `feature/fe-t3-video-tips-guide`.
>    * **TUYỆT ĐỐI CẤM TỰ Ý MERGE VÀO `dev` HOẶC `main`**.
>    * Mọi Pull Request bắt buộc phải chạy `npm run lint` và `npx tsc --noEmit` đạt 0 lỗi, đồng thời phải có **2 lượt phê duyệt (Approve)** từ **FE Lead (Diệu)** và **PM/BE1 (Tuệ)** mới được gộp mã nguồn.

---

## 2. Executive Summary
Trong Sprint 4, Tester 3 chỉ tập trung hoàn thành duy nhất 01 component giao diện tĩnh phục vụ cẩm nang hướng dẫn cho Reseller:
* **Component Modal Mẹo Đăng Video AI (`VideoPostingTipsModal`):** Dựng cửa sổ popup tĩnh hiển thị các mẹo hữu ích khi Reseller nhận video AI (khung giờ vàng đăng bài TikTok: 11h30 trưa & 19h30 tối, cách giữ nguyên âm thanh AI gốc, mẹo giật tít tiêu đề và cách chèn link bio tiếp thị).

---

## 3. TODAY — MUST DO (Thứ Hai 26/10/2026)

| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|:---:|---|---|---|---|:---:|:---:|
| **P0** | Tham gia họp Kick-off Sprint 4 & Tái xác nhận cam kết tuân thủ quy chế an toàn | Nắm rõ giới hạn phạm vi làm việc, không can thiệp code ngoài | PM, FE Lead | Biên bản cam kết | 1.5h | DONE |
| **P0** | Checkout đúng nhánh `feature/fe-t3-video-tips-guide` từ `dev` | Đảm bảo không làm việc trên nhánh `dev` | FE Lead hỗ trợ tạo nhánh | Local branch sạch | 0.5h | READY |
| **P1** | Đọc nội dung mẫu các mẹo đăng video TikTok do FE Lead cung cấp | Nắm cấu trúc nội dung cần hiển thị trên modal | FE Lead | Ghi chú specs UI | 1h | READY |

---

## 4. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **T3-FE-W4-01** | Tạo file component tĩnh `src/components/merchant/video-posting-tips-modal.tsx` | **P1** | `READY` | Mock text specs | Tester 3 | File `video-posting-tips-modal.tsx` (Dumb UI) | 28/10 12:00 |
| **T3-FE-W4-02** | Chạy kiểm tra Typecheck (`tsc`) và Linter (`eslint`) cục bộ | **P0** | `READY` | T3-FE-W4-01 | Tester 3 | 0 errors, 0 warnings | 28/10 15:00 |
| **T3-FE-W4-03** | Tạo Pull Request nộp cho FE Lead (Diệu) review cấp 1 | **P0** | `READY` | T3-FE-W4-02 | Tester 3 | PR sạch trên GitHub | 28/10 17:00 |
| **T3-FE-W4-04** | Tiếp thu chỉnh sửa góp ý từ FE Lead & PM (nếu có) cho đến khi được duyệt | **P1** | `READY` | Review comments | Tester 3 | PR đạt 2 approvals | 29/10 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT NHIỆM VỤ)

### Task `T3-FE-W4-01`: Component Modal Hướng Dẫn Tĩnh (`VideoPostingTipsModal`)
* **Tệp mục tiêu:** `src/components/merchant/video-posting-tips-modal.tsx`
* **Mục đích:** Hiển thị popup hướng dẫn mẹo đăng video TikTok lên xu hướng khi Reseller hoặc Merchant nhấn vào nút "Mẹo đăng video hiệu quả".
* **Quy chuẩn kỹ thuật bắt buộc:**
  * Định nghĩa interface props tối giản:
    ```typescript
    export interface VideoPostingTipsModalProps {
      isOpen: boolean;
      onClose: () => void;
    }
    ```
  * Chỉ render HTML/Tailwind CSS đơn giản:
    - Tiêu đề modal: *"Mẹo Đăng Video AI Triệu View Dành Cho Reseller"*.
    - 4 thẻ mẹo trực quan (Icon, Tiêu đề thẻ, Nội dung ngắn gọn):
      1. Khung giờ vàng (11:30 - 13:00 và 19:30 - 21:30).
      2. Giữ nguyên âm thanh gốc AI (Voiceover + BGM đã qua hòa âm tối ưu).
      3. Đặt caption kích thích tò mò (kèm hashtag địa danh: #DuLichDaNang, #BaNaHills).
      4. Hướng dẫn khách hàng click vào link tiếp thị trên bio hoặc tin nhắn tự động.
    - Nút đóng "Đã hiểu" kích hoạt `onClose()`.
  * **CẤM TUYỆT ĐỐI:** Không viết hàm gọi Supabase, không `fetch`, không dùng `useRouter`, không chạm vào bất kỳ file khác.

---

## 6. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ thuộc | Trạng thái |
|---|---|---|---|
| T3-FE-W4-01 | Nội dung mẹo từ FE Lead | Tester 3 | `READY` |
| T3-FE-W4-03 | T3-FE-W4-01 hoàn tất | FE Lead (Review 1) | `WAITING` |
| T3-FE-W4-04 | FE Lead review | PM/BE1 (Review 2) | `WAITING` |

---

## 7. DEFINITION OF DONE (DoD)
- [ ] File `src/components/merchant/video-posting-tips-modal.tsx` được tạo đúng vị trí.
- [ ] Chạy `npm run lint` đạt 0 lỗi.
- [ ] Chạy `npx tsc --noEmit` đạt 0 lỗi.
- [ ] Giao diện hiển thị đẹp, rõ ràng trên cả màn hình di động (375px) lẫn máy tính.
- [ ] Nhận đủ 2 Approvals từ FE Lead (Diệu) và PM/BE1 (Tuệ).

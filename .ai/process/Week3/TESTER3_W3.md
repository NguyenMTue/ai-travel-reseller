# MY WORK PLAN — TESTER3_W3 (FE PHỤ / TRAINEE)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Thành viên Tester 3 (Tạm thời điều chuyển sang FE Phụ / Trainee)  
**Role:** Frontend Trainee (Chỉ cắt Dumb UI tĩnh cô lập theo hướng dẫn của FE Lead)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Tư (21/10/2026) nộp PR; Nghiệm thu hoàn tất: Thứ Năm (22/10/2026)  
**Branch duy nhất được phép làm việc:** `feature/fe-t3-static-components` (tách từ `dev` do FE Lead tạo sẵn)  

---

## 1. Context & Quy Chế An Toàn Đặc Biệt (Strict Guardrail)

> [!CAUTION]
> **RÀNG BUỘC KỶ LUẬT VÀ QUY TẮC CÁCH LY RỦI RO:**
> 1. **Bối cảnh điều chuyển:** Căn cứ quyết định của Ban điều hành dự án, Tester 3 được chuyển hoàn toàn sang vai trò FE phụ do kỹ năng Frontend và AI còn hạn chế, từng gây ra lỗi nghiêm trọng làm hỏng cấu trúc hệ thống và test Playwright trong Sprint 2.
> 2. **Nguyên tắc "Làm ít — An toàn — Không ảnh hưởng Core":**
>    * Được giao khối lượng công việc rất nhẹ (chỉ 2 component tĩnh), không có logic mạng, không can thiệp luồng dữ liệu chính.
>    * **KHU VỰC CẤM TUYỆT ĐỐI (FORBIDDEN ZONES):**
>      * ❌ **CẤM** chạm vào `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
>      * ❌ **CẤM** chạm vào bất kỳ file cấu hình nào: `playwright.config.ts`, `next.config.mjs`, `package.json`, `tsconfig.json`.
>      * ❌ **CẤM** chạm vào thư mục kiểm thử: `tests/` hoặc tự ý sửa test runner.
>      * ❌ **CẤM** chạm vào thư mục Supabase: `src/lib/supabase/`, logic Auth, middleware.
>      * ❌ **CẤM** chạm vào các API routes tại `app/api/` hoặc router chuyển hướng `app/r/[code]`.
> 3. **Chỉ làm Dumb Component (Component câm):**
>    * Các component được giao chỉ nhận dữ liệu thông qua `props` tĩnh đã định nghĩa sẵn.
>    * Không dùng `useEffect` gọi `fetch`, không import Supabase client, không `useRouter`.
> 4. **Quy chế PR và Merge:**
>    * Chỉ commit trên nhánh: `feature/fe-t3-static-components`.
>    * **TUYỆT ĐỐI CẤM TỰ Ý MERGE VÀO `dev`**.
>    * Mọi Pull Request bắt buộc phải chạy `npm run lint` và `npx tsc --noEmit` sạch sẽ, đồng thời phải có **2 lượt phê duyệt (Approve)** từ **FE Lead (Diệu)** và **PM/BE1 (Tuệ)** mới được gộp mã nguồn.

---

## 2. Executive Summary
Trong Sprint 3, Tester 3 chỉ tập trung hoàn thành 2 component giao diện tĩnh phục vụ phân hệ Thư viện Video của Merchant:
1. **Component Thẻ Video (`MediaCard`):** Dựng thẻ hiển thị video mẫu theo bản vẽ Figma của UI/UX (hiển thị ảnh thumbnail, tiêu đề, thời lượng, thẻ tag phong cách và nút chọn mẫu).
2. **Component Modal Quy Chuẩn Video (`VideoGuidelinesModal`):** Dựng cửa sổ popup tĩnh hiển thị các hướng dẫn kỹ thuật cho Merchant khi tải video lên (chuẩn khung hình 9:16, độ phân giải tối thiểu 1080x1920, độ dài 15-60 giây).

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Tham gia họp Kick-off Sprint 3 & Ký cam kết tuân thủ quy chế an toàn | Nắm rõ giới hạn phạm vi làm việc, tránh vi phạm | PM, FE Lead | Cam kết tuân thủ | 1.5h | READY |
| P0 | Checkout đúng nhánh `feature/fe-t3-static-components` | Đảm bảo không làm việc trên nhánh `dev` | FE Lead tạo nhánh | Local branch sạch | 0.5h | READY |
| P1 | Đọc và nghiên cứu bản vẽ Figma thẻ `MediaCard` từ UI/UX | Hiểu rõ cấu trúc HTML/CSS cần dựng | UI/UX | Ghi chú specs | 1.5h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| T3-FE-W3-01 | Cắt Component tĩnh `MediaCard` (`src/components/merchant/media-card.tsx`) | P1 | READY | Bản vẽ UI/UX | Tester 3 | File `media-card.tsx` (Dumb UI) | 21/10 12:00 |
| T3-FE-W3-02 | Viết Modal hướng dẫn tĩnh quy chuẩn video (`video-guidelines-modal.tsx`) | P1 | READY | Nội dung mẫu | Tester 3 | File `video-guidelines-modal.tsx` | 21/10 17:00 |
| T3-FE-W3-03 | Chạy Typecheck, Lint và tạo PR nộp cho FE Lead (Diệu) | P0 | READY | T3-FE-W3-01, 02 | Tester 3 | PR trên GitHub nhắm vào nhánh của FE Lead | 22/10 10:00 |
| T3-FE-W3-04 | Hỗ trợ sửa lỗi hiển thị theo góp ý review của FE Lead (nếu có) | P1 | READY | T3-FE-W3-03 | Tester 3 | Code fix hoàn tất, PR được approve | 22/10 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT NHIỆM VỤ)

### Task 1: `T3-FE-W3-01` — Component Thẻ Video Mẫu (`MediaCard`)
* **Tệp mục tiêu:** `src/components/merchant/media-card.tsx`
* **Mục đích:** Hiển thị 1 thẻ video mẫu trong lưới danh sách video của Merchant.
* **Quy chuẩn kỹ thuật:**
  * Định nghĩa interface props:
    ```typescript
    export interface MediaCardProps {
      id: string;
      title: string;
      thumbnailUrl: string;
      durationSeconds: number;
      styleTag: string;
      isSelected?: boolean;
      onSelect?: (id: string) => void;
    }
    ```
  * Chỉ render HTML/Tailwind CSS đơn giản: khung hình tỷ lệ 9:16 hoặc 16:9, nhãn badge phong cách, hiển thị thời lượng (ví dụ `0:30`), nút bấm chọn.
  * **CẤM:** Không viết hàm gọi Supabase, không tự ý sửa đổi `database.types.ts`.

### Task 2: `T3-FE-W3-02` — Modal Hướng Dẫn Kỹ Thuật Video (`VideoGuidelinesModal`)
* **Tệp mục tiêu:** `src/components/merchant/video-guidelines-modal.tsx`
* **Mục đích:** Hiển thị popup giải thích các quy chuẩn video du lịch cho đối tác Merchant.
* **Quy chuẩn kỹ thuật:**
  * Hiển thị nội dung tĩnh:
    * Khung hình chuẩn: 9:16 (Dọc) tối ưu cho TikTok / Reels / Shorts.
    * Độ dài khuyến nghị: 15 – 45 giây.
    * Chất lượng tối thiểu: Full HD 1080p, âm thanh rõ ràng, không dính logo mờ đục.
  * Có nút đóng (Close button) thay đổi trạng thái ẩn/hiện thông qua props `isOpen` và `onClose`.

---

## 6. NHỮNG ĐIỀU TÔI CẦN BÀN GIAO VÀ YÊU CẦU

### Những thứ tôi bàn giao:
- 2 tệp component tĩnh đặt đúng thư mục:
  * `src/components/merchant/media-card.tsx`
  * `src/components/merchant/video-guidelines-modal.tsx`
- Bàn giao cho: **Diệu (FE Lead)** để tích hợp vào trang chính của Merchant.

### Những thứ tôi yêu cầu từ team:
- Cần FE Lead tạo sẵn nhánh và cung cấp khung skeleton ban đầu.
- Cần UI/UX cung cấp kích thước padding, màu sắc chuẩn của thẻ card.
- Cần BE1 cung cấp danh sách các thẻ phong cách (`styleTag`) mẫu.

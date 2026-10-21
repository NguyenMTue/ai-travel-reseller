# MY WORK PLAN — BE1_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Nguyễn Minh Tuệ (Backend 1 Lead)  
**Role:** Backend Developer 1 (Supabase DB, Attribution Engine, Core Video Generation Engine & Security)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_BE1_Commerce_Video_Engine` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Hệ thống Tracking Link định danh, Redirect Router anti-bot, RPC Analytics, bộ RLS policies đã hoàn thiện và đạt 100% test pass trên `dev`.
- Trọng tâm Tuần 3:
  1. Gỡ bỏ nợ kỹ thuật trigger hòa giải tạm thời của Tuần 2 (`fn_temp_contents_reconcile`).
  2. Thiết kế cơ sở dữ liệu cho phân hệ thương mại: bảng `orders`, `commissions`.
  3. Xây dựng Attribution Engine trích xuất `click_id` / `reseller_id` khi khách đặt mua vé và RPC tính toán ví tiền Reseller (`get_reseller_wallet_summary`).
  4. Thiết kế bảng `media_references` và API `POST /api/merchant/media` phục vụ tính năng Merchant Video Library.
  5. **Trực tiếp làm chủ phần lõi kỹ thuật tạo video (Core Video Generation Engine):** Xây dựng service sinh video AI trong backend codebase (`src/lib/video-engine/`), tích hợp kịch bản JSON từ BE2, trích xuất assets sản phẩm, điều phối render video du lịch chuẩn 9:16, lưu trữ Supabase Storage và cập nhật `contents.video_url`.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
BE1 sẽ trực tiếp dẫn dắt và thực thi mắt xích tài chính cùng phần lõi công nghệ quan trọng nhất của đề tài — **AI Video Generation Engine**:
1. **Xóa nợ kỹ thuật:** Drop trigger tạm `fn_temp_contents_reconcile` để chuẩn hóa hoàn toàn bảng `contents`.
2. **Schema & Migration:** Tạo bảng `orders`, `commissions` và `media_references`, cập nhật generated types `src/lib/database.types.ts`.
3. **Attribution Engine:** Xây dựng logic gán đơn hàng cho Reseller dựa trên session/cookie/query ref và tính tỷ lệ hoa hồng (Merchant, Reseller, Platform fee).
4. **API Media Library:** Xây dựng API tiếp nhận video mẫu (upload file hoặc link URL) từ Merchant và lưu metadata.
5. **Core Video Generation Engine (Lõi tạo video đề tài):** Trực tiếp thiết kế và lập trình module tổng hợp video (`src/lib/video-engine/generator.ts`), kết nối kịch bản phân cảnh của BE2 với assets hình ảnh/clip của tour, sinh video dọc 9:16 hoàn chỉnh kèm text hook & audio.
6. **Video API & Storage Pipeline:** Viết API `POST /api/merchant/video/generate` xử lý tiến trình async, upload video lên Supabase Storage bucket `campaign-videos` và lưu URL vào bảng `contents`.
7. **Postgres RPC Analytics:** Viết hàm thống kê ví tiền Reseller (hoa hồng khả dụng, hoa hồng chờ duyệt).

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 (09:00 AM) & Phổ biến quy chế an toàn cho Tester 3 | Thống nhất hợp đồng dữ liệu `orders`, `media_references` | Toàn team | Biên bản họp | 1.5h | DONE |
| P0 | BE1-W3-05: Gỡ bỏ trigger tạm `fn_temp_contents_reconcile` | Xóa nợ kỹ thuật, trả lại DB nguyên bản | Không | Migration SQL drop trigger | 1h | DONE |
| P0 | BE1-W3-01: Thiết kế migration bảng `orders` & `commissions` | Nền tảng cho phân hệ hoa hồng của FE và QA | Schema Tuần 1 | File migration SQL | 2.5h | DONE |
| P1 | BE1-W3-02: Thiết kế migration bảng `media_references` | Lưu trữ video mẫu cho Merchant | Schema Tuần 1 | File migration SQL | 2h | DONE |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| BE1-W3-01 | Migration bảng `orders` & `commissions` | P0 | DONE | DB Tuần 1 | BE1 | File SQL migration + regenerated types | 20/10 12:00 |
| BE1-W3-02 | Migration bảng `media_references` cho Merchant Video Library | P0 | DONE | DB Tuần 1 | BE1 | File SQL migration + regenerated types | 20/10 17:00 |
| BE1-W3-03 | API `POST /api/merchant/media` quản lý video mẫu | P1 | DONE | BE1-W3-02 | BE1 | Next.js API Route + Zod validator | 21/10 12:00 |
| BE1-W3-04 | Attribution Engine & Postgres RPC `get_reseller_wallet_summary` | P0 | DONE | BE1-W3-01 | BE1 | Function RPC SQL + API route `/api/reseller/wallet` | 21/10 17:00 |
| BE1-W3-05 | Xóa nợ kỹ thuật trigger hòa giải tạm thời Tuần 2 | P0 | DONE | Không | BE1 | Migration SQL cleanup | 19/10 12:00 |
| BE1-W3-06 | **Core AI Video Generation Engine:** Xây dựng module tổng hợp video (`src/lib/video-engine/generator.ts`) từ kịch bản BE2 & assets tour | P0 | DONE | BE2-W3-03 | BE1 | Core Engine module + Video synthesis pipeline 9:16 | 22/10 17:00 |
| BE1-W3-07 | **Video API & Storage Pipeline:** Endpoint `POST /api/merchant/video/generate`, async job handling, upload Supabase Storage & update `contents.video_url` | P0 | READY | BE1-W3-06 | BE1 | API endpoint + Async Job tracker + Storage bucket | 23/10 12:00 |
| BE1-W3-08 | Phối hợp E2E Integration & Demo kịch bản C3 (Cloudflared Tunnel) | P0 | READY | FE, BE2, QA | BE1 | Phiên nghiệm thu E2E & Báo cáo Demo | 23/10 17:00 |

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Thiết kế và áp dụng migration các bảng thương mại (`orders`, `commissions`) và video (`media_references`).
- Viết API nhận thông tin video mẫu của Merchant và lưu vào database.
- Viết logic attribution kết nối `clicks.id` $\rightarrow$ `orders.id` $\rightarrow$ sinh bản ghi `commissions`.
- **Trực tiếp làm chủ Core Video Generation Engine:**
  - Nhận kịch bản JSON từ BE2 (`video-generator.ts`).
  - Lấy assets hình ảnh/clip từ kho `products`.
  - Thực hiện tổng hợp phân cảnh, chèn text hook 3s đầu, lồng âm thanh, render video tỷ lệ 9:16.
  - Upload file video kết quả lên Supabase Storage bucket `campaign-videos` và lưu URL vào `contents.video_url`.
  - Cung cấp API `POST /api/merchant/video/generate` cho FE Lead tích hợp.
- Cùng FE Lead kiểm duyệt nghiêm ngặt 100% PR từ nhánh `feature/fe-t3-static-components` của Tester 3.

### B. Những việc tôi NÊN làm tiếp theo:
- Tối ưu hóa index cho bảng `orders` và `commissions` dựa trên `reseller_id` và `created_at`.
- Thiết kế cơ chế Async Job / Polling status cho video render để UI không bị treo HTTP timeout.
- Hỗ trợ FE Lead test phương án C3 (Cloudflared Tunnel) trên môi trường local.

### C. Những việc tôi KHÔNG NÊN làm:
- Không viết UI Frontend (đã có FE Lead và FE phụ phụ trách).
- Không tự ý sửa đổi prompt Gemini (thuộc vai trò của BE2).
- Không để BE3 ôm hoặc làm một mình phần lõi sinh video (BE3 chỉ phụ trách notification và tracking).
- Không cho phép Tester 3 can thiệp vào router Next.js hoặc migrations.

### D. Những thứ tôi cần bàn giao:
- Migration SQL và file types `database.types.ts` mới $\rightarrow$ Bàn giao cho FE Lead và Tester 3.
- API contract `POST /api/merchant/media` $\rightarrow$ Bàn giao cho FE Lead.
- Hàm RPC `get_reseller_wallet_summary` $\rightarrow$ Bàn giao cho FE Lead dựng màn hình Ví.
- **Core Video API `POST /api/merchant/video/generate`** $\rightarrow$ Bàn giao cho FE Lead để tích hợp nút bấm sinh video trên Merchant Portal.
- Event hoàn thành sinh video $\rightarrow$ Bàn giao cho BE3 để kích hoạt workflow n8n bắn thông báo Telegram/Zalo.

### E. Những thứ tôi cần yêu cầu team:
- Cần BE2 bàn giao JSON schema kịch bản video và Zod validator đúng hạn (22/10 12:00).
- Cần FE Lead chốt cấu trúc dữ liệu hiển thị trên màn hình Ví hoa hồng và trang Media Library.
- Cần BE3 thống nhất payload webhook bắn đơn hàng và thông báo video hoàn thành.

---

## 6. DEPENDENCY ANALYSIS
| Task | Dependency | Người phụ thuộc | Trạng thái |
|---|---|---|---|
| BE1-W3-05 (Drop trigger) | Không | Toàn team | READY |
| BE1-W3-01 (Orders/Commissions) | Tuần 1 Schema | FE Lead, BE3, Tester 3 | READY |
| BE1-W3-02 (Media references) | Tuần 1 Schema | FE Lead, Tester 3 (Props) | READY |
| BE1-W3-03 (Media API) | BE1-W3-02 | FE Lead | BLOCKED by BE1-W3-02 |
| BE1-W3-04 (Attribution Engine) | BE1-W3-01 | FE Lead (Wallet), QA | BLOCKED by BE1-W3-01 |
| BE1-W3-06 (Core Video Engine) | BE2-W3-03, BE1-W3-02 | FE Lead, BE3, QA | DONE |
| BE1-W3-07 (Video API & Storage) | BE1-W3-06 | FE Lead, BE3 (Alert) | READY (Unblocked by BE1-W3-06) |
| BE1-W3-08 (E2E Integration) | Toàn team | Toàn team | BLOCKED by BE1-W3-07 |

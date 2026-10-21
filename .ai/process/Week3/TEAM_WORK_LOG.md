# TEAM WORK LOG
Project: AI Travel Reseller MVP (TravelLink AI)  
Week: Tuần 3 — 19/10/2026 – 24/10/2026 (Sprint 3)  
Last Updated: 21/10/2026

---

Phạm vi nhật ký: Đồng bộ tiến độ toàn diện của các thành viên trong đội ngũ Tuần 3 (Milestone: Commerce Flow, AI Sales Agent, PWA Mobile & Merchant Video Generation). Đây là bảng điều phối trung tâm chống xung đột giao diện, duplicate task và quản lý luồng bàn giao.

---

## 1. ACTIVE WORK
| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BA-W3-01 | Business Analyst | BA | Bàn giao & Giải đáp Đặc tả Nghiệp vụ tại Kick-off Sprint 3 | READY | 19/10 | 19/10 10:30 |
| BA-W3-02 | Business Analyst | BA | Khóa Business Rules cho BE1: Migration `orders`, `media_references` & RPC ví | READY | 19/10 | 19/10 14:00 |
| BA-W3-03 | Business Analyst | BA | Khóa Kịch bản RAG, Buying Intent & Multimodal Prompt cho BE2 | READY | 19/10 | 19/10 17:00 |
| BA-W3-04 | Business Analyst | BA | Handoff Yêu cầu Giao diện PWA Mobile & Merchant Library cho UI/UX | READY | 20/10 | 20/10 12:00 |
| BA-W3-05 | Business Analyst | BA | Khóa Event Taxonomy & Webhook Schema cho BE3 | READY | 20/10 | 20/10 17:00 |
| BA-W3-06 | Business Analyst | BA | Hỗ trợ FE Lead (Diệu) & Tester 3 (FE phụ) xác thực luồng giao diện | READY | 21/10 | 21/10 17:00 |
| BA-W3-07 | Business Analyst | BA | Đồng hành cùng QA Team (Tester 1, 2) chạy Bộ Test Nghiệp Vụ | READY | 22/10 | 22/10 17:00 |
| BA-W3-08 | Business Analyst | BA | Thực hiện Nghiệm thu Nghiệp vụ (Business UAT) & Đánh giá Demo Sprint 3 | READY | 23/10 | 23/10 17:30 |
| BE1-W3-01 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Migration bảng `orders` & `commissions` (Attribution schema) | DONE | 19/10 | 20/10 12:00 |
| BE1-W3-02 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Migration bảng `media_references` cho Merchant Video Library | DONE | 19/10 | 20/10 17:00 |
| BE1-W3-03 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | API `POST /api/merchant/media` quản lý video mẫu | DONE | 20/10 | 21/10 12:00 |
| BE1-W3-04 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Attribution Engine & RPC `get_reseller_wallet_summary` | DONE | 19/10 | 21/10 17:00 |
| BE1-W3-05 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Gỡ bỏ nợ kỹ thuật trigger hòa giải tạm thời Tuần 2 | DONE | 19/10 | 19/10 12:00 |
| BE1-W3-06 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Core AI Video Generation Engine (`generator.ts`) từ kịch bản BE2 & asset tour | READY | 21/10 | 22/10 17:00 |
| BE1-W3-07 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Video API `POST /api/merchant/video/generate` & Storage pipeline `campaign-videos` | READY | 22/10 | 23/10 12:00 |
| BE2-W3-01 | Nguyễn Huỳnh | BE2 | System Prompt AI Sales Agent nhận diện Buying Intent | DONE | 20/10 | 20/10 17:00 |
| BE2-W3-02 | Nguyễn Huỳnh | BE2 | Prompt Multimodal Gemini phân tích kịch bản video mẫu | OFFLINE DONE — LIVE PENDING | 20/10 | 21/10 12:00 |
| BE2-W3-03 | Nguyễn Huỳnh | BE2 | Prompt sinh kịch bản video áp dụng thông tin chiến dịch (bàn giao BE1) | OFFLINE DONE — LIVE PENDING | 20/10 | 22/10 12:00 |
| BE3-W3-01 | Thái Thanh Tú | BE3 | Workflow n8n thông báo đơn hàng / click mới qua Telegram/Zalo | READY | 20/10 | 21/10 17:00 |
| BE3-W3-02 | Thái Thanh Tú | BE3 | Tích hợp PostHog Analytics Dashboard & Phễu chuyển đổi 5 bước | READY | 21/10 | 22/10 17:00 |
| BE3-W3-03 | Thái Thanh Tú | BE3 | Workflow n8n thông báo thời gian thực khi Video sinh xong từ Core Engine | READY | 22/10 | 23/10 12:00 |
| FE-W3-01 | Diệu | FE Lead | Cấu hình PWA Core (`manifest.json`, Service Worker, Meta) | READY | 19/10 | 20/10 17:00 |
| FE-W3-02 | Diệu | FE Lead | Bottom Navigation Bar & Responsive Safe Area cho Reseller | READY | 20/10 | 21/10 12:00 |
| FE-W3-03 | Diệu | FE Lead | Tích hợp Web Share API 1 chạm & Canvas xuất ảnh QR | READY | 21/10 | 21/10 17:00 |
| FE-W3-04 | Diệu | FE Lead | Giao diện Chat AI Sales Agent Mobile (Bottom Sheet widget) | READY | 21/10 | 22/10 17:00 |
| FE-W3-05 | Diệu | FE Lead | Giao diện Màn hình Ví hoa hồng Reseller (`/reseller/wallet`) | READY | 22/10 | 23/10 12:00 |
| FE-W3-06 | Diệu | FE Lead | Tích hợp Media Library & Nút kích hoạt tạo Video qua API BE1 | READY | 22/10 | 23/10 17:00 |
| T3-FE-W3-01 | Tester 3 | FE Phụ | Cắt Component tĩnh `MediaCard` (`src/components/merchant/media-card.tsx`) | READY | 20/10 | 21/10 12:00 |
| T3-FE-W3-02 | Tester 3 | FE Phụ | Modal hướng dẫn quy chuẩn video 9:16 (`video-guidelines-modal.tsx`) | READY | 21/10 | 21/10 17:00 |
| UX-W3-01 | UI/UX Designer | UI/UX | Figma Hi-fi Reseller Mobile (Bottom Nav, Thẻ chạm, Ví) | READY | 19/10 | 20/10 12:00 |
| UX-W3-02 | UI/UX Designer | UI/UX | Figma Hi-fi Customer Chat Widget di động | READY | 19/10 | 20/10 17:00 |
| UX-W3-03 | UI/UX Designer | UI/UX | Figma Hi-fi Merchant Media Library & Video Template Grid | READY | 20/10 | 21/10 12:00 |
| T1-W3-01 | Tester 1 | QA Lead | Kiểm thử tính năng PWA, Viewport mobile & Kịch bản demo C1/C3 | READY | 20/10 | 23/10 17:00 |
| T1-W3-02 | Tester 1 | QA Lead | Kiểm thử chức năng Media Library & Luồng tải video mẫu | READY | 22/10 | 23/10 17:00 |
| T2-W3-01 | Tester 2 | AI Safety QA | Test chống Hallucination & Buying Intent của AI Sales Agent | READY | 21/10 | 23/10 17:00 |
| T2-W3-02 | Tester 2 | AI Safety QA | Đánh giá chất lượng kịch bản video AI bóc tách từ video mẫu | READY | 22/10 | 23/10 17:00 |
| PM-W3-01/06 | Nguyễn Minh Tuệ | BE1 Kiêm PM | Điều phối Sprint 3, Code Review 2 cấp, Diễn tập Demo nghiệm thu | READY | 19/10 | 24/10 17:30 |

---

## 2. COMPLETED WORK
- `BE1-W3-05` (19/10): Gỡ bỏ trigger hòa giải tạm thời `fn_temp_contents_reconcile` (xóa nợ kỹ thuật Tuần 2).
- `BE1-W3-01` (19/10): Hoàn thành migration mở rộng bảng `orders`, tạo bảng `commissions` kèm RLS policies và indexes.
- `BE1-W3-02` (19/10): Hoàn thành migration bảng `media_references` cho Merchant Video Library; đồng bộ types `src/lib/database.types.ts`.
- `BE1-W3-04` (19/10): Xây dựng Attribution Engine, RPC `get_reseller_wallet_summary`, đồng bộ hoa hồng orders-commissions, API `GET /api/reseller/wallet` và các ràng buộc bảo mật / chống gian lận.
- `BE1-W3-03` (20/10): Xây dựng API Quản lý Video Mẫu Merchant (`GET / POST / DELETE /api/merchant/media`), bộ kiểm tra Zod `createMediaReferenceSchema` và bàn giao interface `MediaReferenceItem` cho FE.
- `BE2-W3-01` (20/10): Hoàn thành taxonomy 6 intent, server-side checkout gate, attribution URL đầy đủ và 5/5 test offline.
- `BE2-W3-02/03` (20/10): Hoàn thành prompt, adapter contract, Zod/JSON Schema và guardrails offline; kiểm thử Gemini live tạm hoãn theo kế hoạch quota.
- `BE2-W3-04/05` (20/10): Hoàn thành tài liệu handoff, sample output và benchmark deterministic; trạng thái benchmark live còn pending.
- `T2-W3-01` (21/10): Hoàn thành nâng cấp toàn diện Rubric đánh giá kịch bản Video AI (Short-form 9:16) & AI Sales Agent v3.0 (`docs/tester2/AI_VIDEO_RUBRIC_W3.md`) tích hợp đầy đủ tiêu chuẩn định tính 1-5, trọng số %, 7 Fatal Flaws, 10 Test Cases mẫu và JSON schema cho LLM Judge. Bàn giao cho BE1, BE2 và QA Team.

---

## 3. IN PROGRESS
*(Sẽ cập nhật sau phiên họp Kick-off 09:00 AM ngày 19/10/2026).*

---

## 4. BLOCKED
*(Không có blocker ban đầu. Tất cả dependencies đã được làm sạch ở Sprint 2).*

---

## 5. HANDOFFS
| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| PM | Toàn team | Kế hoạch chi tiết Sprint 3 (Week3.md + 9 work plans cá nhân) | DONE | 19/10 |
| UI/UX | FE Lead | Bản vẽ Figma Reseller Mobile & Chat Widget | READY | 20/10 |
| UI/UX | Tester 3 (FE phụ) | Bản vẽ giao diện thẻ `MediaCard` tĩnh | READY | 20/10 |
| BE1 | FE Lead | Database migration `orders`, `commissions` & Types gen | READY | 20/10 |
| BE1 | Tester 3 (FE phụ) | Mock schema interface props cho `MediaCard` | READY | 20/10 |
| BE2 | BE1 | Prompt Multimodal & JSON schema kịch bản video nạp Core Engine | READY | 21/10 |
| Tester 3 (FE phụ) | FE Lead / PM | PR nhánh `feature/fe-t3-static-components` (Dumb UI components) | READY | 21/10 |
| BE1 | FE Lead | Endpoint API `POST /api/merchant/video/generate` & status polling | READY | 22/10 |
| BE1 | BE3 | Webhook event báo video hoàn tất để kích hoạt n8n notification | READY | 23/10 |
| FE Lead | Tester 1 | Bản build PWA Mobile Suite trên dev server | READY | 22/10 |
| Tester 2 | Toàn team (BE1, BE2, QA) | Rubric đánh giá kịch bản Video AI & AI Sales Agent v3.0 (`docs/tester2/AI_VIDEO_RUBRIC_W3.md`) | DONE | 21/10 |

---

## 6. STRICT GUARDRAIL POLICY FOR TESTER 3 (FE PHỤ)
1. **Cô lập nhánh tuyệt đối:** Chỉ làm việc trên nhánh duy nhất `feature/fe-t3-static-components`.
2. **Khu vực cấm (Forbidden Zones):**
   * CẤM chạm vào `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
   * CẤM chạm vào `playwright.config.ts`, `tests/` và các cấu hình test chung.
   * CẤM chạm vào `src/lib/supabase/`, các API routes tại `app/api/` và router tracking `app/r/[code]`.
3. **Chỉ làm Dumb Component:** Nhận dữ liệu qua props, render thẻ card / modal tĩnh, không fetch API, không quản lý state phức tạp.
4. **Quy chế Merge 2 cấp:** Bắt buộc phải có Approval từ FE Lead (Diệu) và PM/BE1 (Tuệ). Cấm tự ý merge vào `dev`.

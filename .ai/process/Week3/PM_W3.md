# MY WORK PLAN — PM_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Nguyễn Minh Tuệ (Project Manager & Technical Project Coordinator)  
**Role:** Project Manager, Agile Coach & Release Manager  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:30 Thứ Bảy (24/10/2026)  

---

## 1. Context
- Sprint 2 đã hoàn thành xuất sắc 100% mục tiêu (AI Content Factory, Tracking Link, Reseller Feed, Merchant Form, 6/6 Regression test PASS), toàn bộ mã nguồn đã merge an toàn vào `dev`.
- Trọng tâm Tuần 3:
  1. Điều phối triển khai trơn tru 3 trụ cột kỹ thuật mới: (1) Order Attribution & Commission Engine, (2) PWA Mobile Suite (Reseller & Khách hàng), (3) Thư viện Video Mẫu & Core AI Video Generation Engine (do BE1 trực tiếp làm chủ phần lõi kỹ thuật, BE3 phụ trách notification & analytics).
  2. Thực thi nghiêm ngặt cơ chế kiểm soát rủi ro nhân sự khi chuyển Tester 3 sang làm FE phụ (cô lập nhánh, Dumb UI, review 2 cấp).
  3. Chuẩn bị chu đáo kịch bản diễn tập Demo khi chưa deploy (Phương án C3 qua Cloudflared và C1 qua Chrome Frame).
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md), [ai_progress_evaluation_template.md](../ai_progress_evaluation_template.md).

---

## 2. Executive Summary
PM chịu trách nhiệm dẫn dắt toàn đội ngũ 9 thành viên giữ vững kỷ luật và nhịp độ phát triển:
1. **Kick-off & Phân rã:** Họp giao ban đầu tuần, giải thích cặn kẽ các mục tiêu kỹ thuật và thống nhất các mốc bàn giao giữa các cặp vai trò.
2. **Quản trị Rủi ro & An toàn:** Trực tiếp giám sát việc thực hiện quy chế cách ly an toàn của Tester 3 cùng FE Lead (Diệu).
3. **Release & Quality Gate:** Kiểm soát quy trình merge PR vào nhánh `dev`, duy trì tỷ lệ 100% test pass.
4. **Demo Readiness:** Tổ chức diễn tập buổi báo cáo nghiệm thu thực tế trên điện thoại di động qua Cloudflared Tunnel.

---

## 3. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| PM-W3-01 | Tổ chức họp Kick-off Sprint 3 & Phổ biến Quy chế an toàn Tester 3 | P0 | READY | Kế hoạch Tuần 3 | PM | Biên bản họp Kick-off | 19/10 10:30 |
| PM-W3-02 | Điều phối giao diện dữ liệu (Contract Alignment) BE1 - BE2 - BE3 - FE | P0 | READY | PM-W3-01 | PM | Bảng Interfaces trong TEAM_WORK_LOG | 20/10 17:00 |
| PM-W3-03 | Giám sát & Review cấp 2 (Second-level Approval) cho PR của Tester 3 | P0 | READY | T3-FE-W3-03, FE-W3-07 | PM | Approval trên GitHub | 22/10 17:00 |
| PM-W3-04 | Điều phối phiên Integration Test E2E toàn chuỗi hệ sinh thái | P0 | READY | Toàn team | PM | E2E Integration Test Run | 23/10 17:00 |
| PM-W3-05 | Tổ chức Diễn tập Demo kịch bản C3 (Cloudflared) & C1 (Chrome Frame) | P0 | READY | FE, QA | PM | Buổi diễn tập demo đạt yêu cầu | 24/10 11:30 |
| PM-W3-06 | Họp Đánh giá Sprint 3, Nghiệm thu mã nguồn `dev` & Lập kế hoạch Tuần 4 | P0 | READY | Toàn team | PM | Báo cáo Tổng kết Sprint 3 | 24/10 17:30 |

---

## 4. QUY TRÌNH QUẢN LÝ THAY ĐỔI & PHÊ DUYỆT NHÁNH (GIT WORKFLOW GUARDRAIL)
1. Nhánh `dev` là nhánh gốc được bảo vệ (Protected Branch).
2. Nhánh của Tester 3 (`feature/fe-t3-static-components`):
   * Không được tạo PR trực tiếp vào `dev`.
   * PR phải nhắm vào nhánh tính năng của FE Lead (`Feature_FE_W3_PWA_Mobile_Commerce`).
   * Phải vượt qua kiểm tra `npm run lint` và `npx tsc --noEmit`.
   * Phải được FE Lead (Diệu) review và PM (Tuệ) phê duyệt.

# MY WORK PLAN — TESTER1_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Tester 1 (QA Lead & Hybrid Test)  
**Role:** QA Lead (Cross-device Testing, PWA Verification & Tester 3 UI Audit)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 12:00 Thứ Bảy (31/10/2026)  
**Branch:** `feature/qa-w4-pwa-crossdevice-audit` (tách từ `dev`)  

---

## 1. Context & Phạm vi Giảm Tải
- Với quyết định dời lộ trình từ 4 tuần sang 5 tuần, các bài test chịu tải nặng k6 (1.000 concurrent users) được chuyển hẳn sang **Tuần 5**.
- Tuần 4 tập trung vào:
  1. Kiểm thử thực tế trên thiết bị di động thật thông qua Cloudflared Tunnel (Phương án C3): Kiểm tra trình phát video 9:16 và nút tải video hoạt động ra sao trên iPhone (Safari) và điện thoại Android (Chrome).
  2. Kiểm tra độc lập giao diện tĩnh của Tester 3 (`video-posting-tips-modal.tsx`) về tính responsive và khả năng tương thích.
  3. Soạn thảo kịch bản kiểm thử tích hợp toàn diện (E2E Test Plan) để chuẩn bị cho Sprint 5.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **QA-W4-02** | Kiểm thử hiển thị Responsive & PWA trên thiết bị di động thật (Phương án C3) | **P1** | `READY` | FE PWA code | Tester 1 | Báo cáo Cross-device Test Log | 30/10 17:00 |
| **QA-W4-03** | Kiểm tra độc lập chất lượng giao diện modal tĩnh của Tester 3 | **P2** | `READY` | PR Tester 3 | Tester 1 | Audit checklist UI | 29/10 17:00 |
| **QA-W4-04** | Soạn thảo kịch bản End-to-End Test Plan cho Tuần 5 | **P2** | `READY` | BA Specs | Tester 1 | Kịch bản UAT E2E v1.0 | 31/10 12:00 |

---

## 3. DEFINITION OF DONE (DoD)
- [ ] Xác nhận video 9:16 phát mượt mà không lỗi đen hình trên thiết bị thật.
- [ ] Modal của Tester 3 không bị tràn màn hình trên các máy nhỏ 375px (iPhone SE).
- [ ] Kịch bản E2E Tuần 5 sẵn sàng bàn giao cho toàn team.

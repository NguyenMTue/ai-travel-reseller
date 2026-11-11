# MY WORK PLAN — PM_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Nguyễn Minh Tuệ (Project Manager kiêm Backend 1 Lead)  
**Role:** Project Manager & Technical Coordinator  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Bảy (31/10/2026)  

---

## 1. Context & Quyết Định Quản Trị
- **Chuyển đổi Lộ trình (5-Week Roadmap Shift):** Quyết định chiến lược dời chu kỳ hoàn tất dự án từ 4 tuần sang 5 tuần:
  - *Lý do:* Sản phẩm cần tạo đột phá về mặt thị giác và âm thanh ở khâu tạo video AI (USP của dự án), đồng thời giảm tải stress cho các thành viên sau 3 tuần bám sát gantt chart căng thẳng.
  - *Tuần 4:* Nâng cấp chiều sâu chất lượng Video Engine; củng cố các phân hệ đã hoàn thành; không nhận tính năng mới.
  - *Tuần 5:* Khóa toàn bộ mã nguồn, chạy tải k6, chạy thông luồng E2E UAT và Release Production (Vercel + Supabase).
- **Tiếp tục áp dụng quy chế bảo vệ an toàn cho Tester 3:** Bắt buộc 2 lượt phê duyệt (FE Lead + PM) trước khi cho phép merge code của Tester 3 vào `dev`.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **PM-W4-01** | Họp Kick-off Sprint 4, công bố Roadmap 5 tuần và phân công WBS chi tiết | **P0** | `DONE` | Thống nhất team | PM | Biên bản họp & WBS Sprint 4 | 26/10 11:00 |
| **PM-W4-02** | Kiểm duyệt cấp 2 (PM Approval) cho PR giao diện tĩnh của Tester 3 | **P0** | `READY` | Review FE Lead | PM | Approval & Merge an toàn vào `dev` | 29/10 17:00 |
| **PM-W4-03** | Tổ chức phiên diễn tập Demo chất lượng video kết xuất nội bộ | **P1** | `READY` | Video BE1 & QA | PM | Biên bản đánh giá chất lượng video | 31/10 11:00 |
| **PM-W4-04** | Tổng kết Sprint 4 và công bố Kế hoạch Sprint 5 (UAT & Go-Live) | **P1** | `READY` | Báo cáo tuần | PM | Tài liệu kế hoạch Sprint 5 | 31/10 17:00 |

---

## 3. DEFINITION OF DONE (DoD)
- [ ] Toàn bộ 10 cá nhân trong team nắm vững kế hoạch cá nhân không bị chồng lấn task.
- [ ] PR của Tester 3 được kiểm soát an toàn tuyệt đối.
- [ ] Phiên nghiệm thu chất lượng video đầu ra đạt yêu cầu của Hội đồng chuyên môn.

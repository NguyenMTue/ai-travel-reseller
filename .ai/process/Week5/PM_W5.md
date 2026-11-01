# MY WORK PLAN — PM_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Minh Tuệ (Project Manager kiêm Backend 1 Lead)  
**Role:** Project Manager & Technical Coordinator  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  

---

## 1. Context & Quyết Định Quản Trị Sprint 5
- Kế thừa thành quả Sprint 4: Dự án đã chuyển đổi thành công sang chu kỳ 5 tuần, tối ưu hóa chiều sâu chất lượng Video Engine đạt 9.4/10 điểm Rubric, giữ vững trạng thái code clean và chuẩn bị sẵn sàng cho Sprint cuối cùng.
- **Quyết định Quản trị Dự án trong Tuần 5 — Tăng tốc Về đích & Đảm bảo Tuyệt đối An toàn:**
  1. **Quyết định Khóa Mã nguồn (Feature Freeze Decision):** Kể từ 09:00 Thứ Hai (02/11), đóng băng hoàn toàn việc phát triển tính năng mới. Toàn bộ 10 thành viên tập trung vào: UAT, kiểm thử tải, sửa lỗi, bảo mật và deploy Production.
  2. **Duy trì Quy chế Độc lập An toàn cho Tester 3 (FE phụ):** Đảm bảo Tester 3 chỉ thực hiện 02 component giao diện độc lập (`ResellerFaqModal` và `OfflineBanner`) trên nhánh riêng biệt `feature/fe-t3-w5-standalone-ui`. Công việc của Tester 3 không nằm trên đường găng (critical path) và không làm ảnh hưởng đến tiến độ bàn giao của bất kỳ ai trong nhóm. Thực hiện duyệt cấp 2 (PM Approval) sau khi FE Lead duyệt cấp 1.
  3. **Điều phối Kỷ luật 6 Ngày Về đích:** Giám sát chặt chẽ tiến độ theo từng mốc:
     * *Thứ 3 (03/11):* Xong Load Test k6 và RLS Security Audit.
     * *Thứ 4 (04/11):* Xong phiên Final E2E UAT 3 vai trò trên thiết bị thật.
     * *Thứ 5 (05/11):* Triển khai thành công Production lên Vercel + Supabase Cloud.
     * *Thứ 6 (06/11):* Smoke Test live thành công và quay xong video demo 4K.
     * *Thứ 7 (07/11):* Họp Nghiệm thu Tổng kết và bàn giao chính thức MVP.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **PM-W5-01** | Họp Kick-off Sprint 5, Công bố Quyết định Feature Freeze & Đồng bộ Lịch 6 Ngày | **P0** | `READY` | Toàn team | PM | Biên bản họp Kick-off & Master Gantt Chart Tuần 5 | 02/11 11:00 |
| **PM-W5-02** | Giám sát Quy chuẩn Độc lập & Duyệt cấp 2 (PM Approval) cho PR Tester 3 | **P2** | `READY` | Review FE Lead | PM | Approval 2 & Merge an toàn vào `dev` | 04/11 17:00 |
| **PM-W5-03** | Chủ trì Phiên Diễn tập Demo Tổng thể Nội bộ (Dry Run Demo) | **P1** | `READY` | UAT hoàn tất | PM | Biên bản đánh giá phiên diễn tập Demo | 06/11 15:00 |
| **PM-W5-04** | Chủ trì Phiên Nghiệm thu Tổng kết Dự án & Bàn giao Chính thức MVP | **P0** | `READY` | Production live | PM | Biên bản nghiệm thu dự án & Hồ sơ bàn giao hoàn chỉnh | 07/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `PM-W5-01`: Kick-off Sprint 5 & Quyết định Feature Freeze
* **Thời gian:** 09:00 - 10:30 Thứ Hai (02/11/2026).
* **Nội dung cuộc họp:**
  - Tuyên bố bước vào Sprint 5 — Final Go-Live Sprint.
  - Ban hành lệnh Feature Freeze: Không thêm code ngoài scope, ưu tiên độ ổn định và an toàn hệ thống.
  - Phổ biến lịch trình 6 ngày và cam kết deadline của từng vai trò.
* **DoD:** 10/10 thành viên xác nhận nắm vững nhiệm vụ cá nhân, không có sự chồng chéo quyền sở hữu (ownership).

### Task `PM-W5-02`: Giám sát An toàn Độc lập & PM Approval cho Tester 3
* **Nguyên tắc:**
  - Kiểm tra diff của PR trên GitHub: Xác nhận 100% không có file core nào bị can thiệp.
  - Chỉ bấm merge khi đã có Approval 1 của FE Lead (Diệu).
* **DoD:** Nhánh `dev` được bảo vệ tuyệt đối an toàn.

### Task `PM-W5-03`: Phiên Diễn tập Demo Tổng thể (Dry Run)
* **Thời gian:** 14:00 - 15:30 Thứ Sáu (06/11/2026).
* **Nội dung diễn tập:**
  - Kiểm tra đường truyền mạng và thiết bị trình chiếu.
  - Chạy thử thông luồng 3 vai trò trên môi trường Production thật với domain chính thức.
  - Chuẩn bị sẵn phương án dự phòng (Video 4K offline và slide) nếu mất mạng trong buổi nghiệm thu chính thức.
* **DoD:** 100% kịch bản demo chạy trơn tru không phát sinh lỗi bất ngờ.

### Task `PM-W5-04`: Nghiệm thu Tổng kết Dự án & Bàn giao MVP
* **Thời gian:** 09:00 - 11:30 Thứ Bảy (07/11/2026).
* **Thành phần tham dự:** Toàn bộ đội ngũ phát triển, Stakeholders / Khách hàng / Hội đồng chuyên môn.
* **Nội dung:**
  - Trình bày Slide Deck tổng kết kết quả đạt được qua 5 tuần.
  - Trình diễn Live Demo chuỗi giá trị trên thiết bị di động thật và màn hình lớn.
  - Báo cáo số liệu kiểm thử tải k6 ($1.000\text{ VUs}$), báo cáo an toàn RLS và Anti-Hallucination.
  - Ký biên bản UAT Sign-off và bàn giao mã nguồn, tài liệu vận hành cho chủ đầu tư.
* **DoD:** Biên bản bàn giao được ký kết thành công, đánh dấu mốc hoàn thành thắng lợi của Dự án MVP TravelLink AI.

---

## 4. DEFINITION OF DONE (DoD CỦA TOÀN DỰ ÁN)
- [ ] 100% các phân hệ (Auth, Tracking, AI Content, AI Video Engine, AI Sales Agent, Reseller Wallet, PWA Mobile, n8n) chạy ổn định trên Production.
- [ ] 0 lỗi nghiêm trọng (Critical/High).
- [ ] Triển khai thành công trên Vercel + Supabase Cloud với Custom Domain và SSL hợp lệ.
- [ ] Toàn bộ tài liệu kỹ thuật, hướng dẫn sử dụng và slide deck được bàn giao đầy đủ.


# MY WORK PLAN — BA_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Lê Mỹ Uyên (Business Analyst Lead)  
**Role:** BA Lead / Product Requirements & UAT Coordinator  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  

---

## 1. Context & Nhiệm vụ Trọng tâm Sprint 5
- Kế thừa thành quả Sprint 4: Đã chuẩn hóa tiêu chí Acceptance Criteria cho Video Engine v2 (`docs/specs/AC_VIDEO_ENGINE_V2.md`) và hoàn thiện dự thảo kịch bản nghiệm thu người dùng UAT (`docs/specs/UAT_SCENARIOS_SPRINT5.md`).
- **Trọng tâm BA trong Tuần 5:**
  1. **Điều phối phiên Final E2E UAT 3 vai trò:** Trực tiếp giám sát và hỗ trợ người dùng chạy thử nghiệm thực tế theo kịch bản:
     * *Merchant:* Tạo tour du lịch mới kèm video mẫu, kiểm tra video AI kết xuất có đúng thông tin vé và giá tiền hay không.
     * *Reseller:* Đăng nhập trên di động qua PWA, sao chép link tiếp thị `/r/[code]`, chia sẻ video kèm mã QR lên mạng xã hội.
     * *Khách hàng:* Bấm vào link tiếp thị, tương tác với AI Sales Agent hỏi giá tour, nhận link thanh toán chính thức và hoàn tất đặt vé.
  2. **Ghi nhận & Quản lý Bug UAT:** Thu thập các phản hồi trải nghiệm thực tế từ các phiên UAT, phân loại mức độ nghiêm trọng (Critical/High/Medium/Low) và chuyển giao ngay cho Dev team xử lý trước thời hạn Go-Live.
  3. **Thu thập UAT Sign-off & Đóng gói Tài liệu Dự án:** Lập biên bản nghiệm thu người dùng có chữ ký xác nhận của đại diện 3 nhóm người dùng; hoàn thiện tài liệu PRD v2.0 và Hướng dẫn Vận hành Hệ thống cho khách hàng / chủ dự án.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BA-W5-01** | Điều phối phiên Final E2E UAT 3 Vai trò (Merchant, Reseller, Khách) | **P0** | `READY` | Kịch bản UAT W4 | BA | Biên bản thực thi UAT & Bảng theo dõi kết quả 3 vai trò | 04/11 17:00 |
| **BA-W5-02** | Phân loại, theo dõi và nghiệm thu lại các lỗi phát sinh trong UAT | **P1** | `READY` | Kết quả BA-W5-01 | BA | UAT Bug Tracker & Tái xác nhận 100% Resolved | 05/11 17:00 |
| **BA-W5-03** | Đóng gói Bộ Tài liệu Bàn giao Dự án (PRD v2.0, User Manual, UAT Sign-off) | **P1** | `READY` | Hoàn thành UAT | BA | Bộ hồ sơ nghiệm thu chính thức & Hướng dẫn vận hành | 07/11 12:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BA-W5-01`: Điều phối phiên Final E2E UAT 3 Vai trò
* **Mục tiêu:** Chứng minh toàn bộ chuỗi giá trị của TravelLink AI hoạt động trơn tru không có rào cản nghiệp vụ.
* **Các bước triển khai:**
  - [ ] 02/11: Rà soát lại bộ kịch bản kiểm thử nghiệp vụ (`docs/specs/UAT_SCENARIOS_SPRINT5.md`), chuẩn bị sẵn dữ liệu mẫu cho tour Bà Nà Hills và Phố Cổ Hội An.
  - [ ] 04/11 (09:00 - 16:30): Tổ chức phiên test trực tiếp với người dùng thử nghiệm:
    1. Role Merchant: Tạo chiến dịch, thêm ảnh/video tư liệu, kích hoạt sinh video AI 9:16.
    2. Role Reseller: Cài đặt PWA lên điện thoại (iPhone/Android), copy link tracking và video đã sinh.
    3. Role Khách hàng: Mở link trên di động, chat với bot tư vấn giá vé, kiểm tra link thanh toán.
    4. Đối soát hoa hồng: Kiểm tra số dư ví tiền của Reseller có tăng tương ứng tỷ lệ hoa hồng không.
* **Definition of Done (DoD):** Cả 3 luồng người dùng đều hoàn thành mục tiêu đặt ra, không bị nghẽn luồng hay mất dữ liệu giao dịch.

### Task `BA-W5-02`: Quản lý và Tái kiểm thử Bug UAT
* **Mục tiêu:** Đảm bảo không có lỗi High/Critical nào bị bỏ sót trước khi bấm nút Go-Live.
* **Các bước triển khai:**
  - [ ] Ghi nhận bug phát sinh vào file `docs/qa/uat-bug-log-sprint5.md`.
  - [ ] Phân loại mức độ ưu tiên và chuyển ticket cho FE Lead (Diệu) hoặc BE Leads (Tuệ, Huỳnh, Tú).
  - [ ] Thực hiện re-test ngay khi dev bàn giao bản vá lỗi, ký xác nhận "Resolved".
* **DoD:** 100% bug mức độ Critical và High được giải quyết triệt để trước ngày 05/11.

### Task `BA-W5-03`: Bộ Tài liệu Bàn giao & UAT Sign-off
* **Mục tiêu:** Hoàn thiện bộ hồ sơ bàn giao dự án đạt chuẩn chuyên nghiệp.
* **Sản phẩm bàn giao:**
  - File `docs/PRD_v2.0_FINAL.md`: Đặc tả yêu cầu sản phẩm bản hoàn thiện thực tế.
  - File `docs/USER_MANUAL_RESELLER.md`: Hướng dẫn dành cho Reseller kiếm hoa hồng qua PWA.
  - File `docs/USER_MANUAL_MERCHANT.md`: Hướng dẫn dành cho Merchant tạo chiến dịch & video AI.
  - File `docs/UAT_SIGN_OFF_SHEET.md`: Biên bản nghiệm thu có xác nhận của các bên.
* **DoD:** Toàn bộ tài liệu được push lên git và bàn giao cho Project Manager trước 12:00 ngày 07/11.

---

## 4. DEPENDENCY ANALYSIS

| Task | Phụ thuộc vào | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| BA-W5-01 | Staging/Production ổn định | BE1, FE Lead | `READY` |
| BA-W5-02 | Kết quả kiểm thử BA-W5-01 | BA Lead | `WAITING` |
| BA-W5-03 | Kết quả fix bug và deploy | Toàn team | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| BA Lead | Toàn team | Kịch bản chi tiết buổi test UAT | Markdown `docs/specs/UAT_SCENARIOS_SPRINT5.md` | 02/11 17:00 |
| BA Lead | Dev Team | Danh sách ticket bug UAT cần fix khẩn cấp | Markdown Bug Log | 04/11 17:30 |
| BA Lead | PM & Stakeholders | Biên bản UAT Sign-off & Bộ tài liệu bàn giao | Markdown & PDF | 07/11 12:00 |


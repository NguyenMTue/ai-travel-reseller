# MY WORK PLAN — BA_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Lê Mỹ Uyên (Business Analyst Lead)  
**Role:** BA Lead / Product Requirements, Commission Rules & UAT Coordinator  
**Current Milestone:** ĐẶC TẢ NGHIỆP VỤ HOA HỒNG RESELLER, ĐỐI SOÁT THEO BUDGET & QUY CHẾ TÍCH ĐIỂM MERCHANT  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `docs/ba-w6-commission-spec-and-gamification`  

---

## 1. Trọng tâm Nghiệp vụ Sprint 6

Dựa trên nhận xét của Mentor, BA Lead phụ trách chuẩn hóa toàn bộ công thức tính toán và luồng nghiệp vụ:
1. **Nghiệp vụ Tính Commission cho Reseller:**
   - Phân bổ: Hoa hồng gộp (Gross Commission), Phí nền tảng (Platform fee 20%), Hoa hồng thực nhận của Reseller (Net Commission 80%).
   - Trạng thái hoa hồng: `pending` (chờ thanh toán), `confirmed` (khách đã thanh toán thành công), `settled` (đã rút về tài khoản ngân hàng).
2. **Nghiệp vụ Top Reseller & Đối soát Budget cho Merchant:**
   - Cung cấp tiêu chí xếp hạng: Doanh thu mang lại, Tỷ lệ chuyển đổi (CR), Lượt tương tác, và Mức phí hoa hồng kỳ vọng (Commission rate).
   - Bộ lọc theo ngân sách Merchant: Giúp Merchant tìm kiếm các Reseller phù hợp với chi phí tiếp thị của mình.
3. **Quy chế Tích Điểm Thưởng (Gamification) cho Merchant:**
   - Quy đổi: 1.000 views = 10 điểm, 100 likes = 15 điểm, 10 comments = 20 điểm.
   - Điểm dùng để: Giảm % phí nền tảng cho các đơn đặt vé tiếp theo hoặc đẩy ưu tiên tour lên đầu danh sách đề xuất.

---

## 2. THIS WEEK — MY TASKS (BA)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BA-W6-01** | **Viết Tài liệu Đặc tả Nghiệp vụ Tính & Đối soát Hoa hồng Reseller** | **P0** | `IN_PROGRESS` | Mentor Notes | BA Lead | File Spec chi tiết công thức hoa hồng & luồng xử lý đơn hàng | 17/11 17:00 |
| **BA-W6-02** | **Đặc tả Quy chế Tích Điểm Thưởng Gamification cho Merchant** | **P1** | `TODO` | BA-W6-01 | BA Lead | Bảng tỷ lệ quy đổi tương tác $\rightarrow$ Điểm thưởng $\rightarrow$ Quyền lợi đổi | 18/11 17:00 |
| **BA-W6-03** | **Xây dựng Kịch bản Test UAT Luồng Mua vé qua Link Reseller** | **P0** | `TODO` | FE Lead | BA Lead | Kịch bản nghiệm thu 5 bước dành cho Tester & Khách hàng | 19/11 17:00 |
| **BA-W6-04** | **Phối hợp QA Lead điều phối nghiệm thu các tiêu chí Mentor yêu cầu** | **P1** | `TODO` | UAT Script | BA Lead | Biên bản nghiệm thu đạt 100% tiêu chí phản hồi | 21/11 12:00 |

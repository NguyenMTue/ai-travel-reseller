# MY WORK PLAN — PM_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Nguyễn Minh Tuệ (Project Manager kiêm Backend 1 Lead)  
**Role:** Project Manager & Technical Coordinator  
**Current Milestone:** MENTOR REVIEW ITERATION — AUTOMATED 40–50s VIDEO PIPELINE, RESELLER COMMISSION & STOREFRONT CHECKOUT REVAMP  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  

---

## 1. Trọng tâm Điều phối Sprint 6

### 1.1. Bối cảnh & Mục tiêu:
* Tổ chức lại kế hoạch sprint dựa trên 5 ý kiến phản hồi mang tính định hướng của Mentor:
  1. Loại bỏ video ghép ảnh tĩnh 15s $\rightarrow$ Đổi sang kịch bản video review du lịch 40–50s có chuyển động B-roll và lồng tiếng AI.
  2. Tự động hóa quy trình tạo video: Merchant chỉ cần đẩy thông tin tour, hệ thống tự dựng ngầm $\rightarrow$ Merchant vào duyệt.
  3. Hoàn thiện công thức tính và đối soát hoa hồng Reseller.
  4. Bảng danh sách Top Reseller (hoa hồng, tương tác, rate) cho Merchant đối soát theo ngân sách.
  5. Reseller dán link TikTok $\rightarrow$ Tool tự động cào Like/Comment/View để tính điểm.
  6. Merchant tự tạo video viral $\rightarrow$ Quy đổi tương tác thành điểm thưởng.
* **Quyết định ưu tiên từ PM:**
  - **Đường găng 1 (FE Lead):** Dồn toàn lực nâng cấp giao diện Storefront Tour & Checkout Mobile khi mở từ link Reseller.
  - **Đường găng 2 (BE1 + BE2):** Xây dựng background worker tự động sinh video review 40–50s.

---

## 2. THIS WEEK — MY TASKS (PM)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **PM-W6-01** | **Họp Kick-off Sprint 6 & Phổ biến Nhận xét của Mentor** | **P0** | `DONE` | Mentor Feedback | PM Tuệ | Biên bản thống nhất mục tiêu Sprint 6 & WBS phân bổ | 16/11 09:00 |
| **PM-W6-02** | **Điều phối & Giám sát Tiến độ 2 Đường găng (FE Storefront & BE Video Pipeline)** | **P0** | `IN_PROGRESS` | Team Standup | PM Tuệ | Standup hằng ngày, tháo gỡ blocker kỹ thuật giữa FE và BE | 18/11 17:00 |
| **PM-W6-03** | **Tổ chức Demo Nội bộ & Tổng duyệt Báo cáo Mentor** | **P0** | `TODO` | All Tasks | PM Tuệ | Buổi demo chạy luồng thực tế (Click link -> Đặt vé VietQR -> Duyệt video) | 21/11 15:00 |

---

## 3. Quản trị Rủi ro & Blocker trong Tuần

1. **Rủi ro Timeout khi render video 40–50s:**
   * *Giải pháp:* Yêu cầu BE1 triển khai hoàn toàn bằng Background Worker bất đồng bộ, API Next.js chỉ trả về `202 Accepted` ngay lập tức.
2. **Rủi ro xung đột mã nguồn giữa FE Lead và Tester 3 (FE Junior):**
   * *Giải pháp:* Phân định rạch ròi: FE Lead phụ trách trang Core `/storefront`, Tester 3 chỉ làm việc trên component phụ độc lập (Form dán TikTok và Widget tích điểm) trên branch riêng.

# MY WORK PLAN — TESTER3_W6 (FRONTEND JUNIOR / UI IMPLEMENTATION)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Nguyễn Anh Tuấn (Tester 3 chuyển sang Frontend Junior / UI Implementation)  
**Role:** Frontend Junior / UI Implementation (Chuyên trách xây dựng các thành phần giao diện độc lập — Standalone UI Components)  
**Current Milestone:** XÂY DỰNG FORM NỘP LINK TIKTOK RESELLER, BẢNG TOP RESELLER & WIDGET ĐIỂM THƯỞNG MERCHANT  
**Deadline:** 17:00 Thứ Năm (19/11/2026) nộp PR; Nghiệm thu hoàn tất: Thứ Sáu (20/11/2026)  
**Branch:** `feature/fe-t3-w6-reseller-tiktok-and-merchant-points-ui` (tách từ `dev`)  

---

## 1. Context & Quy chế Làm việc Sprint 6

### 1.1. Nguyên tắc độc lập & Zero Blocker:
> [!IMPORTANT]
> **NGUYÊN TẮC BẢO TOÀN ĐƯỜNG GĂNG CỦA FE LEAD (CAO THỊ THU DIỆU):**
> 1. Tester 3 phụ trách các **Thành phần giao diện độc lập (Standalone UI Components)**: Form nộp link TikTok cho Reseller, Modal Top Reseller cho Merchant và Widget Điểm thưởng.
> 2. ❌ **CẤM TUYỆT ĐỐI** can thiệp vào trang Storefront Tour và Modal Thanh toán (`app/storefront/*`, `src/components/storefront/*`). Đây là khu vực do FE Lead độc quyền cải tổ theo yêu cầu của PM/User.
> 3. Tự chạy kiểm tra cú pháp: `npm run lint` và `npx tsc --noEmit` đạt 0 errors trước khi tạo Pull Request để FE Lead review.

---

## 2. THIS WEEK — MY TASKS (TESTER 3 / FE JUNIOR)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-T3-W6-01** | **Xây dựng Form Dán link TikTok & Card Thống kê Tương tác cho Reseller** | **P0** | `DONE` | BE3 API | Anh Tuấn | Component `tiktok-submission-form.tsx` kèm preview lượt View/Like | 18/11 17:00 |
| **FE-T3-W6-02** | **Xây dựng Bảng Danh sách Top Reseller & Bộ lọc Budget cho Merchant** | **P1** | `DONE` | BE1 RPC | Anh Tuấn | Component `reseller-leaderboard-modal.tsx` kèm filter ngân sách | 19/11 17:00 |
| **FE-T3-W6-03** | **Xây dựng Widget Điểm Thưởng Merchant (Gamification Points Card)** | **P1** | `DONE` | BE3 DB | Anh Tuấn | Widget hiển thị số dư điểm và nút quy đổi ưu đãi | 20/11 12:00 |
| **FE-T3-W6-04** | **Nộp PR, Fix review comments và bàn giao cho FE Lead tích hợp** | **P0** | `DONE` | FE Lead Review | Anh Tuấn | PR được chấp thuận (Approved) và merge an toàn vào `dev` | 20/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `FE-T3-W6-01`: Form Dán link TikTok & Card Thống kê Video Reseller
* **Vị trí file dự kiến:** `src/components/reseller/tiktok-submission-form.tsx`.
* **Giao diện bao gồm:**
  - Ô input nhận đường link video TikTok: `https://www.tiktok.com/@.../video/...`.
  - Nút bấm *"Xác nhận & Cào số liệu"*, hiển thị loading spinner khi đang fetch dữ liệu từ BE3.
  - Card kết quả: Hiển thị ảnh thumbnail video, số lượt View (👁️), Like (❤️), Comment (💬), Share (🔄) và tổng điểm tương tác (Engagement Score).
* **DoD:** Reseller dán link, bấm gửi là số liệu tương tác hiển thị ngay bên dưới mà không cần reload trang.

### Task `FE-T3-W6-02`: Bảng Danh sách Top Reseller & Bộ lọc Budget cho Merchant
* **Vị trí file dự kiến:** `src/components/merchant/reseller-leaderboard-modal.tsx`.
* **Giao diện bao gồm:**
  - Thanh trượt hoặc dropdown lọc theo mức hoa hồng: *Tất cả, Dưới 10%, 10% - 15%, Trên 15%*.
  - Bảng danh sách các Reseller đứng đầu: Thứ hạng (Rank 1, 2, 3), Avatar, Tên KOC, Tổng đơn hàng thành công, Doanh số mang lại và Mức phí hoa hồng kỳ vọng.
* **DoD:** Component độc lập, nhận `data` qua props và lọc dữ liệu mượt mà ở client-side.

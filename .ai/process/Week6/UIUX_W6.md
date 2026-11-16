# MY WORK PLAN — UIUX_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Nguyễn Phước Quý Bửu (UI/UX Designer)  
**Role:** UI/UX Designer (Design System, Mobile-First Storefront, VietQR Checkout & Merchant Analytics UI)  
**Current Milestone:** THIẾT KẾ UI/UX TRANG TOUR & THANH TOÁN MOBILE-FIRST KHI MỞ TỪ LINK RESELLER  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `design/uiux-w6-storefront-checkout-and-reseller-leaderboard`  

---

## 1. Trọng tâm Thiết kế Sprint 6

### 1.1. Bối cảnh & Mục tiêu:
* Đáp ứng yêu cầu trọng tâm của User/PM: Cải tổ giao diện trang Tour và Thanh toán khi mở từ link của Reseller.
* Phong cách thiết kế: **Mobile-First**, hiện đại, tối ưu cho khách hàng chuyển hướng từ ứng dụng TikTok (khung nhìn di động, thao tác 1 tay, nút bấm to rõ, bảng tính giá minh bạch).

### 1.2. Các màn hình cần bàn giao thiết kế:
1. **Trang Tour Chi Tiết (Storefront Mobile):**
   - Header có thẻ nhận diện KOC/Reseller giới thiệu và voucher giảm giá 5%.
   - Thẻ hiển thị giá có giá gốc, giá sale và giá ưu đãi đối tác.
   - Thanh Sticky Bottom Bar ghim cố định ở đáy màn hình.
2. **Modal Đặt Vé & Thanh Toán VietQR 3 Bước:**
   - Bước 1: Chọn ngày & Nhập thông tin nhanh.
   - Bước 2: Hiển thị bảng chiết khấu Reseller & Mã VietQR Napas247 tự động điền nội dung.
   - Bước 3: Màn hình Vé điện tử E-Ticket QR Code thẩm mỹ cao để khách hàng lưu về điện thoại.
3. **Màn hình Top Reseller & Lọc theo Budget (Merchant Portal):**
   - Bảng danh sách Reseller kèm thanh trượt ngân sách hoa hồng (Budget Slider).
4. **Widget Điểm Thưởng & Form nộp link TikTok:**
   - Card hiển thị điểm thưởng và cấp bậc (Tier) của Merchant.
   - Form nộp link video TikTok kèm preview số liệu tương tác.

---

## 2. THIS WEEK — MY TASKS (UI/UX)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **UIUX-W6-01** | **Thiết kế Figma Mobile-First cho Trang Tour & Referral Identity Badge** | **P0** | `IN_PROGRESS` | PM Brief | Quý Bửu | File Figma khung nhìn 375px/390px, components & color styles | 17/11 17:00 |
| **UIUX-W6-02** | **Thiết kế Luồng Modal Đặt vé 3 bước, VietQR Napas247 & E-Ticket** | **P0** | `TODO` | UIUX-W6-01 | Quý Bửu | Prototype luồng thanh toán mượt mà, layout E-Ticket chuyên nghiệp | 18/11 17:00 |
| **UIUX-W6-03** | **Thiết kế Giao diện Bảng Top Reseller & Budget Matching cho Merchant** | **P1** | `TODO` | BA-W6-01 | Quý Bửu | Mockup bảng đối soát Reseller và thanh lọc ngân sách | 19/11 17:00 |
| **UIUX-W6-04** | **Bàn giao Asset & Hỗ trợ FE Lead (Diệu) + FE Junior (Tuấn) chuyển đổi code** | **P0** | `TODO` | All Designs | Quý Bửu | Xuất icon SVG, mã màu Tailwind, CSS tokens và review UI thực tế | 20/11 17:00 |

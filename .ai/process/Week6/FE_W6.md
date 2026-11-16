# MY WORK PLAN — FE_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Storefront Checkout Revamp)  
**Member:** Cao Thị Thu Diệu (Frontend Lead)  
**Role:** Frontend Lead (Storefront Architecture, Referral Identity, Mobile-First Checkout & VietQR Integration)  
**Current Milestone:** TRỌNG TÂM SPRINT 6 — CẢI TỔ TOÀN DIỆN TRANG THÔNG TIN TOUR & LUỒNG THANH TOÁN KHI MỞ TỪ LINK RESELLER  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `feature/fe-w6-storefront-checkout-revamp` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 6

### 1.1. Bối cảnh & Yêu cầu từ PM/User:
* **Yêu cầu cốt lõi tuần này:** FE Chính tập trung toàn lực chỉnh sửa lại giao diện ở trang chứa thông tin tour và thanh toán của người dùng khi mở link từ Reseller (`/storefront/[tenant]/[slug]` được điều hướng từ link rút gọn `/r/[code]`).
* **Hành vi người dùng mục tiêu:** 85% người dùng click vào link tiếp thị của Reseller đến từ ứng dụng di động (TikTok in-app browser). Giao diện cũ còn thiên về desktop, thiếu sự nhận diện thương hiệu của KOC/Reseller giới thiệu, các gói vé chưa trực quan và modal thanh toán còn dài dòng.

### 1.2. Trọng tâm của FE Lead trong Tuần 6:
1. **Thiết kế lại Header & Nhận diện KOC/Reseller (Personalized Referral Identity):**
   - Khi mở link có `refCode`, hiển thị ngay banner VIP và thẻ giới thiệu: *"Được giới thiệu bởi KOC [Tên Reseller] • Nhận voucher giảm 5% khi đặt hôm nay"*.
   - Đảm bảo mã `refCode` được lưu giữ an toàn trong URL/Session, không bị mất khi khách chuyển đổi giữa các tab.
2. **Cải tiến Tour Content & Pricing Card Mobile-First:**
   - Bổ sung thanh đặt vé ghim cố định ở đáy màn hình di động (Sticky Bottom CTA): hiển thị giá gốc gạch ngang, giá ưu đãi qua Reseller và nút bấm lớn *"Đặt vé ngay - Quét QR vào cổng"*.
   - Phân loại rõ ràng các gói vé (Vé tiêu chuẩn, Vé VIP xe đưa đón, Combo Cáp treo + Buffet).
3. **Nâng cấp Modal Thanh toán 3 bước & Dynamic VietQR Napas247:**
   - Bước 1: Form chọn ngày & thông tin liên hệ nhanh, tự động lưu thông tin khách.
   - Bước 2: Bảng tính giá minh bạch: `Giá gốc` - `Ưu đãi đối tác Reseller (5%)` = `Số tiền thực trả`.
   - Bước 3: Mã QR thanh toán VietQR động kèm cú pháp chuyển khoản chính xác `DH [Mã Đơn]`.
   - Bước 4: Màn hình Vé điện tử QR Code (E-Ticket) chính hãng để quét vào cổng trực tiếp.
4. **Tích hợp API Attribution:** Gọi `POST /api/storefront/orders/confirm` ghi nhận doanh số và cộng hoa hồng về ví Reseller theo thời gian thực.
5. **Code Review & Hướng dẫn Tester 3 (FE Junior):** Hỗ trợ Tester 3 xây dựng các component phụ: Form nộp link TikTok cho Reseller và Widget Điểm thưởng Merchant.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-W6-01** | **Redesign Header & Identity Card Reseller trên trang Storefront Tour** | **P0** | `IN_PROGRESS` | UIUX Design | FE Lead | Banner VIP Reseller, avatar KOC, voucher badge độc quyền | 18/11 12:00 |
| **FE-W6-02** | **Tối ưu hóa UI/UX Tour Content & Sticky Bottom CTA trên Mobile** | **P0** | `TODO` | FE-W6-01 | FE Lead | Sticky Footer CTA Mobile, pill selector gói vé, timeline lịch trình | 19/11 12:00 |
| **FE-W6-03** | **Nâng cấp Modal Đặt vé 3 bước & Thanh toán VietQR Napas247** | **P0** | `TODO` | BE1 API | FE Lead | Modal thanh toán mượt mà, VietQR động, màn hình vé QR E-ticket | 20/11 17:00 |
| **FE-W6-04** | **Review mã nguồn & Hỗ trợ tích hợp Component của Tester 3** | **P1** | `TODO` | PR Tester 3 | FE Lead | Review Form nộp TikTok & Widget tích điểm Merchant | 21/11 12:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `FE-W6-01`: Redesign Header & Identity Card Reseller
* **File can thiệp:** `src/components/storefront/storefront-header.tsx`, `src/components/storefront/storefront-view.tsx`.
* **Chi tiết triển khai:**
  - Render banner trên cùng khi có `tracking.refCode`:
    ```tsx
    <div className="bg-gradient-to-r from-[#204e4c] to-[#2c6e6b] text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between">
      <span>Ưu đãi độc quyền từ Đối tác <strong>{tracking.resellerName}</strong></span>
      <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-xs">-5% Tự động</span>
    </div>
    ```
  - Thêm Thẻ Endorsement Card dưới tiêu đề Tour: Ảnh đại diện Reseller, huy hiệu Verified Partner, lời khuyên/mẹo ngắn gọn của Reseller về tour.
* **DoD:** Mở link `/?ref=code` hiển thị chính xác tên Reseller và voucher tương ứng.

### Task `FE-W6-02`: Tối ưu hóa UI/UX Tour Content & Sticky Bottom CTA trên Mobile
* **File can thiệp:** `src/components/storefront/storefront-price-card.tsx`, `src/components/storefront/storefront-tour-content.tsx`, `src/components/storefront/storefront-sticky-cta.tsx`.
* **Chi tiết triển khai:**
  - Sticky Bottom CTA: Xuất hiện cố định ở chân màn hình khi lướt trên điện thoại, hiển thị giá sale kèm nút *"Đặt vé ngay"*.
  - Trình bày trực quan danh sách các gói vé (Packages) dạng thẻ bo góc, có tag *"Gói được khuyên dùng nhất"*.
  - Tối ưu hóa font size và padding cho màn hình từ 375px đến 430px (iPhone/Android tiêu chuẩn).
* **DoD:** Trải nghiệm lướt mượt mà 60 FPS trên mobile, không bị giật lag hay vỡ giao diện.

### Task `FE-W6-03`: Nâng cấp Modal Đặt vé 3 bước & Thanh toán VietQR Napas247
* **File can thiệp:** `src/components/storefront/storefront-checkout-modal.tsx`.
* **Chi tiết triển khai:**
  - **Bước 1 (Thông tin):** Chọn ngày khởi hành (Datepicker mobile), số lượng vé người lớn / trẻ em, họ tên và số điện thoại nhận vé.
  - **Bước 2 (Thanh toán):** Hiển thị chiết khấu 5% từ Reseller, sinh mã VietQR Napas247 với nội dung chuyển khoản động `DH [Mã Đơn]`. Nút sao chép 1 chạm thông tin STK và Ngân hàng.
  - **Bước 3 (Vé điện tử):** Sau khi xác nhận thanh toán, hiển thị vé E-Ticket có mã QR cá nhân hóa, nút lưu vé về máy điện thoại.
* **DoD:** Luồng từ điền form đến nhận vé QR hoàn tất trong vòng dưới 1 phút.

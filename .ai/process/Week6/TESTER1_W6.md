# MY WORK PLAN — TESTER1_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Trương Đức Huy (QA Lead & Hybrid Test)  
**Role:** QA Lead (E2E Referral Flow, Mobile Checkout Testing, Attribution Audit & Regression Suite)  
**Current Milestone:** KIỂM THỬ TOÀN DIỆN LUỒNG ĐẶT VÉ QUA LINK RESELLER & ATTRIBUTION CỘNG VÍ  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `test/qa-w6-storefront-checkout-and-attribution`  

---

## 1. Trọng tâm Kiểm thử Sprint 6

### 1.1. Mục tiêu trọng tâm:
* Đảm bảo tính toàn vẹn 100% của luồng kinh doanh cốt lõi (Core Business Flow):
  $$\text{Click link Reseller /r/[code]} \longrightarrow \text{Mở Storefront có Voucher} \longrightarrow \text{Đặt vé \& Quét VietQR} \longrightarrow \text{Nhận vé QR E-ticket \& Ghi nhận hoa hồng ví Reseller}$$
* Đảm bảo trải nghiệm trên thiết bị di động thật (Mobile Viewport) không phát sinh lỗi layout, lỗi tràn chữ hay lỗi kẹt modal.

### 1.2. Các kịch bản kiểm thử trọng điểm:
1. **Kiểm thử Tracking & Attribution:**
   - Click link `/r/[code]` với tham số ngẫu nhiên $\rightarrow$ Kiểm tra redirect 302 về trang Storefront.
   - Kiểm tra mã `refCode` có tồn tại trong payload thanh toán không.
   - Kiểm tra tiền hoa hồng trong bảng `commissions` và bảng `reseller_wallets` có tăng đúng tỷ lệ (ví dụ: tour 320k, hoa hồng gộp 12%, net về reseller 30.720đ).
2. **Kiểm thử Modal Thanh toán & VietQR:**
   - Nhập thông tin khách hàng, chọn ngày đi hợp lệ $\rightarrow$ Kiểm tra ảnh VietQR có hiển thị đúng số tiền sau chiết khấu và đúng cú pháp chuyển khoản không.
   - Bấm nút xác nhận thanh toán $\rightarrow$ Kiểm tra màn hình E-ticket có hiển thị mã QR và nút lưu vé không.
3. **Kiểm thử Cross-Browser / Cross-Device:**
   - Chạy bộ test Playwright trên Mobile Chrome (Pixel 7) và Mobile Safari (iPhone 14).

---

## 2. THIS WEEK — MY TASKS (TESTER 1)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **TEST1-W6-01** | **Xây dựng Bộ Test Script Playwright E2E cho Luồng Mua vé qua Link Reseller** | **P0** | `IN_PROGRESS` | FE Lead Code | Đức Huy | File test `tests/storefront-referral-checkout.spec.ts` | 18/11 17:00 |
| **TEST1-W6-02** | **Kiểm thử Tương thích Mobile (Touch Gestures, Safe Area, Keyboard Overlay)** | **P0** | `TODO` | TEST1-W6-01 | Đức Huy | Báo cáo kiểm thử thiết bị di động thật (iOS/Android), 0 critical bug | 19/11 17:00 |
| **TEST1-W6-03** | **Kiểm thử Đối soát Dữ liệu Hoa hồng & Chống trùng đơn (Idempotency Audit)** | **P0** | `TODO` | BE1 API | Đức Huy | Test bấm double-click thanh toán, đảm bảo ví không bị cộng tiền 2 lần | 20/11 17:00 |
| **TEST1-W6-04** | **Phối hợp BA & PM tổ chức phiên Nghiệm thu Demo cho Mentor** | **P0** | `TODO` | All Test Passes | Đức Huy | Test run 100% pass, biên bản sẵn sàng cho buổi demo | 21/11 12:00 |

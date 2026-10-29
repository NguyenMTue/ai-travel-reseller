# BÁO CÁO RÀ SOÁT ĐỘ SẴN SÀNG UAT & TỔNG HỢP LỖI FRONTEND (UAT READINESS — FRONTEND)

**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ phụ trách:** Frontend Engineering (Next.js 16 App Router, Tailwind CSS v4, PWA Mobile Suite, UI/UX Components)  
**Mục tiêu rà soát:** Chuẩn bị điều kiện nghiệm thu UAT & E2E Tuần 5 (Sprint 5)  
**Người thực hiện:** Senior QA Lead / QA Automation Engineer (Trương Đức Huy)  
**Ngày lập:** 29/10/2026  
**Nguyên tắc đánh giá:** Progress-Aware Testing — Chỉ ghi nhận lỗi trên các tính năng đã code (Nhóm A); không báo bug cho các tính năng thuộc backlog (Nhóm B).  

---

## 1. TỔNG HỢP MỨC ĐỘ SẴN SÀNG GIAO DIỆN (FRONTEND READINESS OVERVIEW)

Đội ngũ Frontend đã hoàn thành hầu hết các màn hình giao diện cốt lõi phục vụ cả 4 vai trò (**Merchant**, **Reseller**, **Khách hàng**, **Admin**). Toàn bộ các luồng giao diện chính trong Kịch bản C1 và C3 đều đã vượt qua kiểm thử tự động trên Desktop và Mobile PWA:

| Phân hệ / Màn hình | Route / Component | Trạng thái Codebase | Đánh giá Sẵn sàng UAT Tuần 5 |
| :--- | :--- | :---: | :---: |
| **Merchant Campaign Form** | `/merchant/campaigns/new` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Merchant Media Library** | `/merchant/library`, `media-library-client.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Reseller Campaign Feed** | `/reseller/campaigns`, `campaign-feed.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Reseller Content Kit** | `/reseller/campaigns/[id]`, `content-kit.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Reseller Tracking Modal** | `tracking-link.tsx`, `tracking-qr.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Mobile Bottom Navigation Bar** | `src/components/reseller/shell.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Landing Page Minh bạch C3** | `app/page.tsx`, `app/globals.css` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Khung Chat AI Bottom Sheet** | `mobile-chat-sheet.tsx`, `chat-panel.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Ví Reseller 4 Trạng thái** | `/reseller/wallet`, `wallet-dashboard.tsx` | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Form Rút tiền Tự động Napas** | `app/reseller/payout-settings` | **Nhóm B (Chờ ghép nối)** | ⏳ **CHỜ DEV HOÀN THIỆN** |
| **Admin Analytics Dashboard** | `app/admin/dashboard` | **Nhóm B (Chờ ghép nối)** | ⏳ **CHỜ DEV HOÀN THIỆN** |

---

## 2. GHI NHẬN LỖI TỒN ĐỌNG & KHUYẾN NGHỊ TỐI ƯU GIAO DIỆN (CHỈ DÀNH CHO NHÓM A)

### 📌 ĐÁNH GIÁ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không có lỗi vỡ layout hay chặn luồng E2E trên các thiết bị chuẩn.
- **Lỗi giao diện nhỏ & Đề xuất hoàn thiện (Medium / Low / Polish):** Ghi nhận 02 điểm quan sát kỹ thuật để FE Dev xử lý trước phiên UAT chính thức.

---

### ISSUE-FE-UAT-01 (Mức độ: Medium — UX Interaction)
- **Tiêu đề:** Tối ưu hóa phản hồi nút Copy Link trong Modal Tracking trên trình duyệt Safari iOS khi người dùng từ chối cấp quyền Clipboard API.
- **Vị trí màn hình:** `src/components/reseller/tracking-link.tsx`.
- **Mô tả hiện tượng:** Trên một số phiên bản iOS Safari cũ hoặc khi mở qua In-App WebView của TikTok/Facebook, phương thức `navigator.clipboard.writeText` có thể bị hệ điều hành chặn nếu không có sự tương tác chạm trực tiếp hợp lệ. Mặc dù component đã có fallback hiển thị textarea thủ công, nhưng trạng thái nút bấm có thể bị giữ ở nhãn *"Đang sao chép..."* trong 1-2 giây trước khi nhảy sang khung sao chép thủ công.
- **Đề xuất cho FE Dev:** Bổ sung khối `try/catch` có timeout ngắn (300ms) để lập tức hiển thị textarea và tự động kích hoạt `manual.current?.select()` khi Clipboard API bị chặn.

---

### ISSUE-FE-UAT-02 (Mức độ: Low — Visual Polish)
- **Tiêu đề:** Bổ sung lớp đệm đáy (Safe-area padding) cho Video Player 9:16 trên thiết bị iPhone có Dynamic Island.
- **Vị trí màn hình:** `src/components/merchant/media-library-client.tsx` & `src/components/reseller/campaign-detail.tsx`.
- **Mô tả hiện tượng:** Video dọc tỷ lệ 9:16 phát rất đẹp và sắc nét. Tuy nhiên trên các thiết bị iPhone 14 Pro / 15 Pro, thanh công cụ điều khiển phát video (Play/Pause, Nút tải về) nằm khá sát với mép đáy màn hình (cách vạch Home Indicator khoảng 8px).
- **Đề xuất cho FE Dev:** Thêm CSS `margin-bottom: max(16px, env(safe-area-inset-bottom))` cho thanh điều khiển video player trên mobile.

---

## 3. GHI CHÚ TIẾN ĐỘ TÍNH NĂNG CHƯA HOÀN THIỆN (NHÓM B — KHÔNG TÍNH VÀO BUG)

Để bảo đảm tính khách quan, các hạng mục sau thuộc lộ trình Tuần 5 đang được triển khai, QA xác nhận chưa đưa vào báo cáo lỗi:
1. *Admin Dashboard tổng hợp doanh thu đa tenant:* Hiện tại Admin theo dõi dữ liệu đối soát thông qua Supabase Studio Database GUI.
2. *Giao diện kết nối tài khoản ngân hàng và OTP rút tiền tự động:* Đang chờ hoàn thiện luồng API với đối tác thanh toán.
3. *Chế độ Dark Mode di động:* Không nằm trong phạm vi cam kết của MVP Sprint 5.

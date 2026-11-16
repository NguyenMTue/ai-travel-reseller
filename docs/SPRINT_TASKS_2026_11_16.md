# Kế Hoạch Sprint Tuần (Sprint Backlog - 16/11/2026)

## 🎯 Mục Tiêu Sprint (Sprint Goal)
1. **Trọng tâm FE Chính:** Cải tổ toàn diện giao diện trang Chi tiết Tour (`/storefront/[tenant]/[slug]`) và Luồng Thanh toán Mobile khi khách mở từ link đối tác Reseller (`/r/[code]`).
2. **Khắc phục nhận xét của Mentor:**
   - Đổi luồng Video từ ảnh sang luồng tự động (Auto-pipeline) 40–50s cho BE1.
   - Thêm tính năng tính và đối soát hoa hồng cho Reseller.
   - Bổ sung bảng Top Reseller & Lọc theo ngân sách (Budget matching) cho Merchant.
   - Reseller dán link TikTok + Tool tự động phân tích Like/Comment/View.
   - Cơ chế quy đổi tương tác video tự làm của Merchant thành điểm thưởng (Gamification Points).

---

## 📋 Bảng Phân Bổ Task Cho Các Vai Trò

| Mã Task | Tên Task | Phân Hệ | Phụ Trách | File Task Chi Tiết |
| :--- | :--- | :--- | :---: | :---: |
| **FE-01** | Redesign Header & Nhận diện KOC/Reseller trên trang Tour | Storefront | **FE Chính** | `docs/Fe.md` / `src/components/storefront` |
| **FE-02** | Tối ưu UI/UX Tour Content & Pricing Card Mobile-First | Storefront | **FE Chính** | `src/components/storefront` |
| **FE-03** | Nâng cấp Modal Thanh toán 3 bước & VietQR Napas247 | Checkout | **FE Chính** | `src/components/storefront/storefront-checkout-modal.tsx` |
| **BE1-01** | **Xây dựng Luồng Background Worker Tự động sinh Video 40–50s** | AI / Media | **BE1** | [TASK_BE1_AUTO_VIDEO_PIPELINE.md](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/docs/TASK_BE1_AUTO_VIDEO_PIPELINE.md) |
| **FE-04** | Giao diện Top Reseller & Lọc theo Budget cho Merchant | Merchant | FE Phụ | `src/components/merchant` |
| **FE-05** | Form nộp link TikTok & Theo dõi số liệu cho Reseller | Reseller | FE Phụ | `src/components/reseller` |
| **BE-02** | Microservice / Worker cào tương tác TikTok (View, Like, Comment) | Backend | Backend | `services/llm-service` |
| **BE-03** | Hệ thống tích điểm thưởng Merchant khi video viral | Backend | Backend | `supabase/migrations` |

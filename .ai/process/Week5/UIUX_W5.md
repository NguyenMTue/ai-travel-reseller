# MY WORK PLAN — UIUX_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Phước Quý Bửu (UI/UX Designer)  
**Role:** UI/UX Designer (Design System, PWA App Assets, Final Slide Deck & Demo Visuals)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  

---

## 1. Context & Trọng tâm Thiết kế Sprint 5
- Kế thừa thành quả Sprint 4: Đã hoàn thiện bộ 03 overlay tĩnh 9:16 (cinematic vignette, safe zone boundary, discount badge) hỗ trợ cỗ máy kết xuất video của BE1; bàn giao thông số layout cho component mẹo đăng video của Tester 3.
- **Trọng tâm UI/UX trong Tuần 5 — Trau chuốt Nhận diện Thương hiệu & Tài nguyên Thuyết trình Go-Live:**
  1. **Bộ Tài nguyên Ứng dụng PWA Đạt chuẩn:** Xuất đầy đủ các phiên bản icon ứng dụng chuẩn PWA (Icon $192\times192$, $512\times512$, maskable icon cho Android thích ứng hình tròn/vuông, Apple Touch Icon cho iOS) và màn hình chờ (Splash Screen) mượt mà khi người dùng mở ứng dụng từ màn hình chính.
  2. **Bộ Slide Thuyết trình Tổng kết Dự án (Final Presentation Slide Deck):** Thiết kế bộ slide chuyên nghiệp gồm 15 trang giới thiệu: Vấn đề thị trường, Giải pháp TravelLink AI, Chuỗi giá trị 5 bước, Demo sản phẩm, Kiến trúc công nghệ và Kết quả nghiệm thu thực tế.
  3. **Hỗ trợ Tester 3 (FE phụ):** Bàn giao thông số style (padding, typography, color tokens) cho component FAQ Modal và Offline Banner, đảm bảo component độc lập ăn khớp hoàn hảo với Design System chung.
  4. **Biên tập Video Demo Walkthrough 4K:** Phối hợp cùng PM quay màn hình và dựng video trình diễn toàn bộ trải nghiệm 3 vai trò (Merchant $\rightarrow$ Reseller $\rightarrow$ Khách hàng) trong vòng 3 phút sắc nét.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **UX-W5-01** | Hoàn thiện Bộ Icon PWA Đa kích thước & Splash Screen Khởi động | **P1** | `READY` | PWA manifest | UI/UX | Thư mục `public/icons/` đầy đủ asset đạt chuẩn | 02/11 17:00 |
| **UX-W5-02** | Bàn giao thông số layout FAQ Modal & Offline Banner cho Tester 3 | **P2** | `READY` | Specs T3 | UI/UX | Figma specs (padding, font size, icon tokens) | 02/11 17:00 |
| **UX-W5-03** | Thiết kế Slide Deck Báo cáo Tổng kết Dự án & Infographic Chuỗi giá trị | **P1** | `READY` | PRD v2.0 | UI/UX | File Slide Presentation (PDF & Figma link) | 05/11 17:00 |
| **UX-W5-04** | Biên tập & Hậu kỳ Video Demo Walkthrough Sản phẩm 4K (3 Phút) | **P1** | `READY` | UAT hoàn tất | UI/UX | Video MP4 Demo 4K sắc nét kèm phụ đề | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `UX-W5-01`: Bộ Tài nguyên PWA Icons & Splash Screen
* **Mục tiêu:** Giúp trải nghiệm cài đặt TravelLink AI lên điện thoại có cảm giác như một ứng dụng Native cao cấp.
* **Các file xuất:**
  - `icon-192x192.png`, `icon-512x512.png` (Standard).
  - `icon-maskable-192x192.png`, `icon-maskable-512x512.png` (Android Adaptive).
  - `apple-touch-icon.png` ($180\times180$ cho iPhone).
  - `favicon.ico` đa kích thước cho trình duyệt web.
* **DoD:** Kiểm tra bằng Lighthouse PWA Audit đạt điểm tối đa cho phần Icons.

### Task `UX-W5-03`: Slide Deck Báo cáo Tổng kết Dự án
* **Cấu trúc Slide Deck:**
  1. Trang bìa & Đội ngũ thực hiện (10 thành viên).
  2. Bối cảnh & Điểm đau của thị trường du lịch tiếp thị liên kết.
  3. Giải pháp TravelLink AI & USP Video AI 9:16 + Bot chốt sale.
  4. Sơ đồ kiến trúc công nghệ (Next.js, Supabase, n8n, Gemini).
  5. Kết quả nghiệm thu 5 tuần (Từ nền tảng đến Go-Live).
  6. Demo thực tế & Kế hoạch mở rộng thương mại.
* **DoD:** Slide đẹp mắt, hiện đại, chuẩn nhận diện thương hiệu TravelLink AI.

### Task `UX-W5-04`: Video Demo Walkthrough Sản phẩm
* **Nội dung video:** Trình chiếu 3 màn hình song song:
  - Màn hình 1: Merchant tạo tour Bà Nà Hills, sinh video AI 9:16.
  - Màn hình 2: Reseller mở PWA trên điện thoại, chia sẻ link.
  - Màn hình 3: Khách hàng click link, chat với bot và đặt vé thành công.
* **DoD:** Độ phân giải 4K/1080p 60fps, âm thanh voiceover và nhạc nền cuốn hút.

---

## 4. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| UX-W5-01 | Yêu cầu manifest từ FE Lead | FE Lead (Diệu) | `READY` |
| UX-W5-02 | Danh sách câu hỏi FAQ | BA Lead | `READY` |
| UX-W5-04 | Môi trường Production & UAT Pass | PM, FE Lead | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| UI/UX | FE Lead | Bộ PWA Icons & Splash screens | PNG / WebP trong `public/icons/` | 02/11 17:00 |
| UI/UX | Tester 3 (Tuấn) | Thông số style FAQ Modal & Offline Banner | Figma link & design tokens | 02/11 17:00 |
| UI/UX | PM & Hội đồng | Slide Deck báo cáo tổng kết & Video Demo 4K | PDF & MP4 file | 06/11 17:00 |


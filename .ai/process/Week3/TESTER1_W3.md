# MY WORK PLAN — TESTER1_W3 (QA LEAD)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Tester 1 (QA Lead & Hybrid QA)  
**Role:** Lead Quality Assurance (Playwright E2E, PWA Mobile Testing & Demo Scenario)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Diễn tập Demo: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_QA_W3_PWA_Regression` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Bộ test suite phân hệ Reseller và Tracking Link (59/59 tracking, 41/41 merchant form, 6/6 regression) đã vượt qua 100% với ảnh chụp minh chứng nghiệm thu đầy đủ.
- Trọng tâm Tuần 3:
  1. Đảm nhận vai trò QA Lead toàn diện cho Sprint 3 (do Tester 3 đã chuyển sang hỗ trợ FE).
  2. Kiểm thử bộ giải pháp PWA Mobile Suite: Khả năng cài đặt Add to Home Screen, hiển thị Standalone không thanh URL, Bottom Nav an toàn trên iPhone/Android.
  3. Kiểm thử phân hệ Merchant Video Library và luồng ghi nhận hoa hồng Ví Reseller.
  4. Trực tiếp chuẩn bị và diễn tập 2 kịch bản Demo báo cáo khi chưa deploy: **C3 (Cloudflared Tunnel trên điện thoại thật)** và **C1 (Chrome Device Frame trên laptop)**.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Trong Sprint 3, Tester 1 đảm bảo toàn bộ hệ sinh thái chạy mượt mà trên môi trường di động:
1. **PWA Mobile Testing:** Kiểm tra manifest, service worker caching, giao diện thẻ chạm vuốt và nút Web Share API trên thiết bị thật.
2. **Playwright Multi-viewport Regression:** Chạy tự động kiểm thử trên 3 viewports: Desktop (1440px), Mobile (390px), Small-mobile (320px).
3. **Commerce & Commission Verification:** Xác minh khi đơn hàng được ghi nhận, hoa hồng tính đúng tỷ lệ và cập nhật tức thì trên Ví Reseller.
4. **Demo Assurance:** Đảm bảo kịch bản demo C3 chạy mượt, không lỗi kết nối mạng nội bộ.

---

## 3. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| T1-W3-01 | Lập Test Plan Sprint 3 & Thiết kế Test Cases PWA Mobile | P0 | READY | FE-W3-01 | Tester 1 | File `test-plan-sprint3-pwa.md` | 20/10 17:00 |
| T1-W3-02 | Viết Playwright E2E Test Suite cho PWA Mobile & Ví Reseller | P0 | READY | FE-W3-02, 05 | Tester 1 | File `tests/pwa-mobile-wallet.spec.ts` | 22/10 17:00 |
| T1-W3-03 | Kiểm thử luồng tải Video mẫu của Merchant & Media Library | P1 | READY | FE-W3-06, BE1-W3-03 | Tester 1 | Test execution report + Screenshots | 23/10 12:00 |
| T1-W3-04 | Chạy diễn tập kịch bản Demo C1 (Chrome Frame) & C3 (Cloudflared) | P0 | READY | Toàn team | Tester 1 | Kịch bản diễn tập thành công | 23/10 17:00 |
| T1-W3-05 | Báo cáo Tổng kết Chất lượng & Nghiệm thu Sprint 3 (QA Deliverables) | P0 | READY | T1-W3-01..04 | Tester 1 | Báo cáo nghiệm thu HTML/MD kèm ảnh | 24/10 12:00 |

---

## 4. NHỮNG THỨ TÔI BÀN GIAO VÀ YÊU CẦU

### Những thứ tôi bàn giao:
- Kịch bản kiểm thử tự động Playwright cho phân hệ Mobile PWA và Ví tiền.
- Báo cáo kết quả kiểm thử hồi quy kèm ảnh chụp minh chứng trên các thiết bị mobile.
- Checklist các bước kết nối Cloudflared Tunnel cho người trình diễn demo.

### Những thứ tôi yêu cầu từ team:
- Cần FE Lead cung cấp bản build local có PWA manifest và service worker trước Thứ Tư (21/10).
- Cần BE1 cung cấp API simulation tạo đơn hàng mẫu để kiểm thử ví hoa hồng.

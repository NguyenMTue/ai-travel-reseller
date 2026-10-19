# MY WORK PLAN — FE_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Diệu (Frontend Lead)  
**Role:** Lead Frontend Developer (Next.js 16, React 19, PWA Mobile Suite, Merchant & Reseller Portals)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_FE_W3_PWA_Mobile_Commerce` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Reseller Feed, Content Kit 4 Persona, Modal Tracking Link/QR, Form tạo chiến dịch Merchant và 2 trang điều khoản/bảo mật đã hoàn thiện sạch sẽ, vượt qua 100% các bài test hồi quy Playwright.
- Trọng tâm Tuần 3:
  1. Triển khai bộ giải pháp **PWA Mobile Suite**: Biến nền tảng thành ứng dụng web tiến bộ hỗ trợ "Thêm vào màn hình chính" (Add to Home Screen) chạy Standalone toàn màn hình không thanh URL.
  2. Xây dựng Bottom Navigation Bar tiện tay cho Reseller; tích hợp **Web Share API** (1 chạm chia sẻ sang Zalo, Facebook, TikTok) và tính năng xuất poster du lịch kèm mã QR.
  3. Tối ưu khung chat AI Sales Agent thành dạng Bottom Sheet di động cho khách hàng.
  4. Xây dựng màn hình Ví hoa hồng Reseller (`/reseller/wallet`).
  5. Tích hợp phân hệ Media Library cho Merchant (tiếp nhận component tĩnh `MediaCard` từ Tester 3).
  6. Đóng vai trò **Người gác cổng kỹ thuật (Gatekeeper)**: Review và phê duyệt nghiêm ngặt 100% code của Tester 3 trước khi merge.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
FE Lead chịu trách nhiệm đưa trải nghiệm di động của Reseller và Khách hàng lên chuẩn ứng dụng nguyên bản (App-like Experience) thông qua PWA:
1. **PWA Core:** Cấu hình `manifest.json`, icon app độ phân giải cao, Service Worker cơ bản để trình duyệt điện thoại nhận diện khả năng cài đặt.
2. **Mobile UX cho Reseller:** Dựng Bottom Nav cố định (Khám phá, Nội dung AI, Link & QR, Ví hoa hồng); xử lý khoảng đệm an toàn `safe-area-inset` cho tai thỏ iPhone.
3. **Thao tác 1 chạm:** Tận dụng `navigator.share` để mở menu native chia sẻ mạng xã hội; dùng HTML Canvas render mã QR lồng vào ảnh banner để tải về máy.
4. **Mobile UX cho Khách hàng:** Khung chat AI tự động co giãn full màn hình, bàn phím ảo không che khuất ô nhập liệu.
5. **Ví hoa hồng:** Kết nối API ví tiền để hiển thị số dư, hoa hồng chờ duyệt và lịch sử đơn hàng.
6. **Kiểm soát rủi ro nhân sự:** Hướng dẫn, giám sát và kiểm tra mã nguồn của Tester 3 (FE phụ) trên nhánh riêng biệt `feature/fe-t3-static-components`.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt giao diện Mobile với UI/UX | Nắm rõ specs Bottom Nav và Safe area | UI/UX | Figma specs | 1.5h | READY |
| P0 | Tạo nhánh `feature/fe-t3-static-components` cho Tester 3 | Cô lập hoàn toàn phạm vi làm việc của Tester 3 | Git | Branch mới + skeleton files | 1h | READY |
| P0 | FE-W3-01: Khởi tạo cấu trúc PWA (`public/manifest.json`, icons) | Nền tảng để bật tính năng Add to Home Screen | Không | `manifest.json`, meta tags | 3h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| FE-W3-01 | Cấu hình PWA Core (`manifest.json`, Service Worker, Meta) | P0 | READY | Không | Diệu | `public/manifest.json` + `sw.js` + meta layout | 20/10 17:00 |
| FE-W3-02 | Bottom Navigation Bar & Responsive Safe Area cho Reseller | P0 | READY | UX-W3-01 | Diệu | Component `bottom-nav.tsx` + layout update | 21/10 12:00 |
| FE-W3-03 | Tích hợp Web Share API 1 chạm & Canvas xuất ảnh QR | P0 | READY | FE-W3-02 | Diệu | Module `share.ts` + `canvas-qr.ts` | 21/10 17:00 |
| FE-W3-04 | Giao diện Chat AI Sales Agent Mobile (Bottom Sheet widget) | P1 | READY | UX-W3-02 | Diệu | Component `mobile-chat-sheet.tsx` | 22/10 17:00 |
| FE-W3-05 | Giao diện Màn hình Ví hoa hồng Reseller (`/reseller/wallet`) | P0 | READY | BE1-W3-04 | Diệu | Route `app/reseller/wallet/page.tsx` | 23/10 12:00 |
| FE-W3-06 | Tích hợp Merchant Media Library (ghép `MediaCard` từ Tester 3) | P1 | READY | T3-FE-W3-01, BE1-W3-03 | Diệu | Route `app/merchant/library/page.tsx` | 23/10 17:00 |
| FE-W3-07 | Code Review & Kiểm duyệt an toàn nhánh của Tester 3 | P0 | READY | T3-FE-W3-01, 02 | Diệu | PR review comments & Approval | 21/10 - 22/10 |
| FE-W3-08 | Phối hợp QA diễn tập kịch bản Demo C3 (Cloudflared Tunnel) | P0 | READY | FE-W3-01, Tester 1 | Diệu | Buổi diễn tập demo PWA thành công | 23/10 17:00 |

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Làm chủ toàn bộ kiến trúc Frontend, PWA Core và các màn hình chính của Reseller và Merchant.
- Thiết kế Bottom Navigation Bar chuẩn thumb-friendly và an toàn cho các thiết bị có tai thỏ (iPhone).
- Ghép nối component thẻ `MediaCard` do Tester 3 nộp sau khi đã kiểm tra kỹ lưỡng.
- Trực tiếp kiểm thử kịch bản PWA bằng lệnh `npx cloudflared tunnel --url http://localhost:3000` trên điện thoại thật.

### B. Những việc tôi NÊN làm tiếp theo:
- Thêm hiệu ứng rung phản hồi nhẹ (Haptic feedback qua Vibration API) khi người dùng bấm copy link hoặc bấm nút chia sẻ thành công trên điện thoại.

### C. Những việc tôi KHÔNG NÊN làm:
- Không cho phép Tester 3 merge code trực tiếp vào `dev` dưới bất kỳ hình thức nào.
- Không để code của Tester 3 chạm vào các file cấu hình `playwright.config.ts` hay `app/layout.tsx`.
- Không viết code schema database (thuộc vai trò của BE1).

### D. Những thứ tôi cần bàn giao:
- Ứng dụng PWA hoàn chỉnh có thể mở qua link HTTPS $\rightarrow$ Bàn giao cho Tester 1 và PM để chạy demo C3.
- Giao diện Ví hoa hồng kết nối RPC $\rightarrow$ Bàn giao cho Tester 3 và Tester 1 kiểm thử.

### E. Những thứ tôi cần yêu cầu team:
- Cần UI/UX bàn giao bản vẽ Figma Mobile (390px/320px) vào sáng Thứ Ba (20/10).
- Cần BE1 bàn giao API Ví hoa hồng và API Media Library đúng tiến độ.
- Cần Tester 3 tuân thủ nghiêm ngặt ranh giới công việc, chỉ commit vào nhánh `feature/fe-t3-static-components`.

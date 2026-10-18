# MY WORK PLAN — UIUX_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** UI/UX Designer  
**Role:** Product Designer (Mobile PWA Experience, Reseller Bottom Nav & Merchant Media Library)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Tư (21/10/2026); Handoff hoàn tất: Thứ Năm (22/10/2026)  
**Workspace:** Figma TravelLink AI MVP Workspace  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Thiết kế Hi-fi Reseller Feed Desktop & Mobile, thẻ Suggested Content Kit 4 Persona đã bàn giao đầy đủ cho FE và QA.
- Trọng tâm Tuần 3:
  1. Thiết kế trải nghiệm Mobile-First chuyên nghiệp cho Reseller Portal chuẩn PWA: Bottom Navigation Bar 4 tab, giao diện thẻ chạm vuốt (thumb-friendly), màn hình Ví hoa hồng.
  2. Thiết kế giao diện Chat AI Sales Agent dạng Bottom Sheet mở rộng trên điện thoại cho Khách hàng.
  3. Thiết kế phân hệ Merchant Media Library: Form tải/dán link video mẫu, lưới hiển thị video mẫu và popup hướng dẫn kỹ thuật 9:16.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
UI/UX Designer tạo ra diện mạo trực quan mượt mà và thân thiện với người dùng di động:
1. **Mobile Bottom Navigation:** Thiết kế thanh điều hướng 4 mục cố định dưới chân màn hình (Feed, Content Kit, Links, Ví) có tính toán khoảng đệm an toàn Safe Area cho iOS/Android.
2. **Reseller Wallet UI:** Bảng điều khiển tài chính trực quan: Số dư khả dụng, hoa hồng chờ duyệt, danh sách đơn hàng đã thanh toán và nút rút tiền.
3. **Merchant Media Library:** Giao diện lưới video mẫu (tỷ lệ 9:16), nhãn phong cách (Ẩm thực, Khám phá, Gia đình) và modal hướng dẫn quy chuẩn video.

---

## 3. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| UX-W3-01 | Figma Hi-fi Reseller Mobile (Bottom Nav, Safe Area, Ví hoa hồng) | P0 | READY | Kế hoạch Tuần 3 | UI/UX | Figma Frames 390px/320px | 20/10 12:00 |
| UX-W3-02 | Figma Hi-fi Customer Chat Widget dạng Bottom Sheet di động | P1 | READY | UX-W3-01 | UI/UX | Figma Frames Mobile Chat | 20/10 17:00 |
| UX-W3-03 | Figma Hi-fi Merchant Media Library & Thẻ `MediaCard` | P0 | READY | PRD v1.0 | UI/UX | Figma Frames Media Grid | 21/10 12:00 |
| UX-W3-04 | Handoff specs chi tiết thẻ `MediaCard` cho Tester 3 (FE phụ) | P0 | READY | UX-W3-03 | UI/UX | Component specs (Padding, Font, Colors) | 21/10 14:00 |
| UX-W3-05 | Design Review cùng FE Lead (Diệu) trên bản build PWA | P1 | READY | FE-W3-02, 05 | UI/UX | Design QA Feedback log | 23/10 12:00 |

---

## 4. NHỮNG THỨ TÔI BÀN GIAO VÀ YÊU CẦU

### Những thứ tôi bàn giao:
- Link Figma và trích xuất Asset SVG/Icons cho FE Lead (Diệu).
- Bản vẽ thông số cụ thể của thẻ `MediaCard` cho Tester 3 (FE phụ) để cắt HTML/Tailwind tĩnh.

### Những thứ tôi yêu cầu từ team:
- Cần FE Lead phản hồi tính khả thi của animation Bottom Sheet trên Safari/Chrome mobile.
- Cần BE1 chốt các trường số liệu tài chính hiển thị trên màn hình Ví hoa hồng.

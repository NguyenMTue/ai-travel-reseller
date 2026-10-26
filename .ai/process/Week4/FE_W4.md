# MY WORK PLAN — FE_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Diệu (Frontend Lead)  
**Role:** Frontend Lead (Next.js 16, Mobile PWA, Video UI Integration & Mentoring)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026)  
**Branch:** `feature/fe-w4-video-player-pwa-polish` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 3: Đã hoàn thành bộ giải pháp PWA Mobile Suite, Bottom Nav, Reseller Wallet UI, và luồng tạo Video AI từ Media Library qua PR #46 và #47 đã merge vào `dev`.
- **Cập nhật Lộ trình:** Toàn team chính thức dời lộ trình từ **4 tuần sang 5 tuần**. Khối lượng công việc tuần này được giảm tải rõ rệt để tập trung tinh chỉnh trải nghiệm người dùng di động và phối hợp với BE1 nâng tầm chất lượng video AI.
- **Trọng tâm Frontend Tuần 4:**
  1. Tinh chỉnh trình phát video 9:16 (`VideoPlayer`) trên giao diện Reseller Feed và Merchant Library: hỗ trợ phát mượt mà video MP4 chất lượng cao mới từ BE1, thêm nút tải video trực tiếp về thiết bị (Save to Gallery / Download MP4).
  2. Tối ưu trải nghiệm vuốt chạm (Touch Gestures) cho PWA: đảm bảo cuộn mượt mà không bị giật, hiển thị chuẩn xác ở vùng an toàn (Safe Area Inset) trên các thiết bị có tai thỏ / Dynamic Island.
  3. Đóng vai trò Mentor kiêm Reviewer cấp 1 cho Tester 3 (FE phụ): cung cấp mock data, hướng dẫn cắt component tĩnh và kiểm duyệt nghiêm ngặt PR trước khi chuyển sang PM.

---

## 2. Executive Summary
Trong Sprint 4, Frontend Lead không ôm đồm tính năng mới mà tập trung hoàn thiện trải nghiệm thị giác và thao tác cho người dùng di động:
1. **Video UI & Download:** Bổ sung chức năng tải file video MP4 kết xuất từ BE1 về bộ nhớ máy điện thoại kèm thông báo toast trực quan.
2. **PWA Touch Polish:** Tinh chỉnh CSS và hiệu ứng chạm vuốt tab Bottom Navigation, loại bỏ hoàn toàn các lỗi layout shift nhỏ trên mobile.
3. **Tester 3 Supervision:** Giám sát chặt chẽ nhánh của Tester 3, bảo đảm thành viên này không chạm vào bất kỳ file core nào.

---

## 3. TODAY — MUST DO (Thứ Hai 26/10/2026)

| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|:---:|---|---|---|---|:---:|:---:|
| **P0** | Họp Kick-off Sprint 4 & Phân định phạm vi giảm tải | Thống nhất kế hoạch tinh chỉnh PWA và hỗ trợ BE1 test video | Toàn team | Kế hoạch FE tuần 4 | 1.5h | DONE |
| **P0** | Tạo nhánh `feature/fe-t3-video-tips-guide` từ `dev` cho Tester 3 | Khóa nhánh an toàn cho Tester 3 làm việc độc lập | Nhánh `dev` sạch | Branch trên GitHub | 0.5h | READY |
| **P1** | Tạo nhánh `feature/fe-w4-video-player-pwa-polish` từ `dev` | Bắt đầu công việc tinh chỉnh của FE Lead | Nhánh `dev` sạch | Local branch | 0.5h | READY |

---

## 4. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-W4-01** | Tối ưu Video Player 9:16 và cơ chế tải video trực tiếp về máy | **P1** | `READY` | BE1 Video URL | FE Lead | Player component + Nút tải MP4 | 29/10 17:00 |
| **FE-W4-02** | Tinh chỉnh mượt mà thao tác vuốt chạm & Safe Area Inset cho PWA | **P1** | `READY` | PWA code W3 | FE Lead | Trải nghiệm vuốt tab mượt mà 60fps | 30/10 12:00 |
| **FE-W4-03** | Hỗ trợ và Review cấp 1 cho PR của Tester 3 (`T3-FE-W4-01`) | **P0** | `READY` | PR Tester 3 | FE Lead | Review comments & Approval 1 | 29/10 12:00 |
| **FE-W4-04** | Tích hợp modal hướng dẫn của Tester 3 vào giao diện Reseller | **P2** | `READY` | Approval PR T3 | FE Lead | Nút mở modal mẹo đăng bài | 30/10 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT NHIỆM VỤ)

### A. Những việc tôi PHẢI làm:
- Nâng cấp component `VideoGenerateModal` hoặc `MediaCard` để hỗ trợ phát video 9:16 mượt mà không bị vỡ khung hình.
- Thêm action tải video MP4:
  - Khi người dùng bấm "Tải video về máy", sử dụng kỹ thuật `fetch(blobUrl)` và trigger download file `.mp4`.
  - Hiển thị toast thông báo: *"Đã tải video thành công! Bạn có thể mở TikTok/Reels để đăng ngay."*
- Giám sát 100% commit của Tester 3: Đảm bảo chỉ có duy nhất file `video-posting-tips-modal.tsx` trong PR.

### B. Những việc tôi KHÔNG NÊN làm:
- Không can thiệp vào logic tính toán của Video Engine backend (để BE1 tối ưu).
- Không tự ý thêm trang mới hay sửa đổi cấu trúc routing của dự án.
- Không cho phép Tester 3 tự merge code vào `dev`.

---

## 6. DEFINITION OF DONE (DoD)
- [ ] Trình phát video 9:16 hiển thị sắc nét video mẫu Bà Nà Hills của BE1 trên điện thoại thật.
- [ ] Nút tải video hoạt động hoàn hảo trên cả Safari iOS và Chrome Android.
- [ ] PR của Tester 3 được review sạch sẽ, merge an toàn không gây conflict.
- [ ] 100% Playwright tests và build `npm run build` không lỗi.

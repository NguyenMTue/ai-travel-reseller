# TEAM WORK LOG — SPRINT 4
Project: AI Travel Reseller Platform (TravelLink AI)  
Week: Tuần 4 (26/10/2026 – 31/10/2026)  
Last Updated: 26/10/2026 10:20:00  
Roadmap Status: Chuyển đổi chính thức sang chu kỳ 5 tuần (Release & UAT dời sang Tuần 5)

---

Phạm vi nhật ký: Điều phối công việc Tuần 4 toàn team. Trọng tâm BE1 dồn vào chất lượng đầu ra video (Motion 2.5D Parallax, Audio Ducking đa kênh, Render 9:16 sắc nét). Toàn team giảm tải khối lượng công việc, tối ưu các tính năng nền tảng. Tester 3 tiếp tục tuân thủ nghiêm ngặt quy chế cách ly an toàn khi tham gia cắt giao diện tĩnh.

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| PM-W4-01 | Nguyễn Minh Tuệ | PM / BE1 Lead | Điều phối Sprint 4, họp phổ biến Roadmap 5 tuần, review code cấp 2 | IN_PROGRESS | 26/10 09:00 | 31/10 17:00 |
| BE1-W4-01 | Nguyễn Minh Tuệ | BE1 Lead | Nâng cấp thuật toán chuyển động Ken Burns & Parallax 2.5D cho Video Engine | IN_PROGRESS | 26/10 10:00 | 28/10 17:00 |
| BE1-W4-02 | Nguyễn Minh Tuệ | BE1 Lead | Hòa âm đa kênh 3 lớp: Auto-Ducking BGM + Voice TTS tự nhiên + Sound FX | READY | 28/10 08:30 | 29/10 17:00 |
| BE1-W4-03 | Nguyễn Minh Tuệ | BE1 Lead | Tối ưu hóa luồng Render FFmpeg 1080x1920 & Storage upload | READY | 29/10 08:30 | 30/10 17:00 |
| BE2-W4-01 | Nguyễn Huỳnh | BE2 (AI Prompt) | Khớp nối kịch bản multimodal 14 scenes vào data contract của BE1 Engine | IN_PROGRESS | 26/10 10:00 | 28/10 17:00 |
| BE2-W4-02 | Nguyễn Huỳnh | BE2 (AI Prompt) | Rà soát Anti-Hallucination khi Sales Agent tư vấn về video chiến dịch | READY | 28/10 08:30 | 30/10 17:00 |
| BE3-W4-01 | Thái Thanh Tú | BE3 (Automation) | Cấu hình hàng đợi retry thông minh cho n8n workflow render video | READY | 27/10 08:30 | 29/10 17:00 |
| BE3-W4-02 | Thái Thanh Tú | BE3 (Automation) | Tối ưu mẫu thông báo Telegram kèm preview video cho Reseller | READY | 28/10 08:30 | 30/10 17:00 |
| FE-W4-01 | Diệu | FE Lead | Video Player 9:16 + MP4: code/fixture pass, chờ BE1 live và thiết bị thật | IN_PROGRESS | 28/10 | 29/10 17:00 |
| FE-W4-02 | Diệu | FE Lead | Touch/safe-area: kế hoạch, chưa triển khai tuần 4 | READY | 28/10 | 30/10 12:00 |
| FE-W4-03 | Diệu | FE Lead | Chuẩn bị review T3; truy vấn chưa thấy branch/PR bàn giao | WAITING_HANDOFF | 28/10 | 29/10 12:00 |
| FE-W4-04 | Diệu | FE Lead | Tích hợp modal sau bàn giao T3 và 2 approvals | WAITING | 28/10 | 30/10 17:00 |
| T3-FE-W4-01 | Tester 3 | FE Trainee (Cô lập) | Xây dựng Component tĩnh `video-posting-tips-modal.tsx` (Dumb UI) | READY | 27/10 08:30 | 29/10 17:00 |
| QA-W4-01 | Tester 2 | AI Safety QA | Thẩm định chất lượng video mẫu của BE1 theo `AI_VIDEO_RUBRIC_W3.md` | READY | 28/10 08:30 | 30/10 17:00 |
| QA-W4-02 | Tester 1 | QA Lead | Kiểm tra tương thích hiển thị Responsive / PWA trên thiết bị di động thật | READY | 29/10 08:30 | 31/10 12:00 |
| BA-W4-01 | BA Lead | Business Analyst | Cập nhật Master Roadmap 5 tuần & hoàn thiện Acceptance Criteria Video v2 | READY | 26/10 10:00 | 28/10 12:00 |
| UX-W4-01 | UI/UX Designer | UI/UX | Thiết kế bộ khung đồ họa overlay tĩnh 9:16 (cinematic overlay, badge giá) | READY | 26/10 10:00 | 28/10 17:00 |

---

## 2. COMPLETED WORK (KẾ THỪA TỪ SPRINT 3)

| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| BE1-W3-01..07 | Nguyễn Minh Tuệ | Core Video Engine v1, Orders & Commissions, Media Library API, Video Storage | 23/10/2026 | FE Lead, BE2, QA |
| BE2-W3-01..05 | Nguyễn Huỳnh | Intent Taxonomy 6 bậc, Checkout URL Gate, Multimodal Gemini Analyzer Adapter | 23/10/2026 | BE1, QA |
| BE3-W3-01..03 | Thái Thanh Tú | Telegram Bot notification, Click tracking webhook, Video completed webhook | 23/10/2026 | FE Lead, QA |
| FE-W3-01..06 | Diệu | PWA Mobile Suite, Bottom Nav, Reseller Wallet, AI Video Generation UI Flow | 23/10/2026 | QA, Toàn team |
| T3-FE-W3-01..02| Tester 3 | MediaCard tĩnh, Modal quy chuẩn video 9:16 tĩnh (Đã qua review 2 cấp) | 22/10/2026 | FE Lead |
| QA-W3-ALL | QA Team | 24/24 Test cases PASS, Báo cáo Tổng kết Kỹ thuật Sprint 3 | 24/10/2026 | Stakeholders |

---

## 3. IN PROGRESS

1. **BE1-W4-01 (Motion & Parallax 2.5D):** Đang nghiên cứu áp dụng easing cubic-bezier cho chuyển động lia camera (Pan & Tilt) trên ảnh tĩnh, hạn chế cảm giác giật khung hình.
2. **BE2-W4-01 (Scene Script Alignment):** Đang rà soát lại JSON schema kịch bản phân cảnh của Gemini để đảm bảo $100\%$ các trường visual prompt và camera motion ánh xạ khớp chuẩn `generator.ts`.
3. **PM-W4-01 (Lộ trình 5 tuần):** Đang đồng bộ tài liệu các tuần để phản ánh việc dời UAT và Production Release sang Tuần 5.

---

## 4. BLOCKED

*Hiện tại không có blocker nào chặn luồng công việc.* Toàn bộ các dependency cốt lõi của Tuần 1, 2, 3 đã được làm sạch và hợp nhất an toàn trên nhánh `dev`.

---

## 5. HANDOFFS

| From | To | Deliverable | Format | Deadline | Status |
|---|---|---|---|---|---|
| BA Lead | Toàn team | Tài liệu Master Roadmap 5 tuần | Markdown `.ai/process/Roadmap.md` | 27/10 | `READY` |
| UI/UX | BE1 | Bộ khung overlay cinematic 9:16 | PNG trong suốt ($1080 \times 1920$) | 28/10 | `READY` |
| BE2 | BE1 | Mẫu kịch bản 14 scenes chuẩn khớp Engine | JSON `banahills-video-script.sample.json` | 28/10 | `READY` |
| BE1 | FE Lead | File video MP4 kết xuất chất lượng cao | File MP4 + Supabase Storage URL | 29/10 | `WAITING` |
| BE1 | Tester 2 | Bộ 3 mẫu video thử nghiệm | File MP4 qua kiểm định | 30/10 | `WAITING` |
| Tester 3 | FE Lead | PR component `video-posting-tips-modal.tsx` | Pull Request trên nhánh cô lập | 29/10 | `READY` |
| FE Lead | Tester 1 | Môi trường test PWA di động trên Cloudflared | URL tunnel HTTPS | 30/10 | `WAITING` |

---

## 6. INTERFACES & CONTRACTS

| Interface / Contract | Owner | Consumer | Định nghĩa / Ràng buộc | Status |
|---|---|---|---|---|
| `VideoEngineInput` v2 | BE1 | BE2, n8n | Giữ nguyên schema Zod, mở rộng các tùy chọn motion mượt mà | `APPROVED` |
| `[LINK_MUA_VE]` Placeholder | BE2 | BE1, FE | Cấm tự sinh URL trong script; giữ nguyên placeholder cho Core Engine thay thế link thật | `LOCKED` |
| `VideoPostingTipsProps` | FE Lead | Tester 3 | `{ isOpen: boolean; onClose: () => void; }` — Không thêm props dữ liệu động | `LOCKED` |
| `campaign-videos` Storage | BE1 | FE, Reseller | Bucket public đọc, upload giới hạn Merchant và Service Role | `STABLE` |

---

## 7. SHARED RESOURCES

| Tài nguyên | Người phụ trách | Đường dẫn / Vị trí | Trạng thái |
|---|---|---|---|
| Mã nguồn nhánh chính | PM / BE1 | Git branch `dev` | Sạch, đã merge toàn bộ Sprint 3 |
| Tài liệu Quy chuẩn Video AI | BE1 | [`.ai/role/RuleAIAgentsGenVideo.md`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/.ai/role/RuleAIAgentsGenVideo.md) | Nguồn sự thật cho Video Engine |
| Bộ tiêu chí chấm điểm Video | Tester 2 | [`docs/tester2/AI_VIDEO_RUBRIC_W3.md`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/docs/tester2/AI_VIDEO_RUBRIC_W3.md) | Thang điểm 10 đánh giá video |
| Kho tư liệu mẫu Bà Nà Hills | BE1 | [`docs/be1/samples/`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/docs/be1/samples/) | 11 ảnh thực tế + âm thanh mẫu |

---

## 8. CONFLICT / DUPLICATE CHECK

- **Xung đột mã nguồn:** `0 CONFLICT`. Mỗi thành viên thao tác trên các thư mục tách biệt hoàn toàn.
- **Phân định rõ ràng trách nhiệm Video:**
  - BE2 (Huỳnh): Chỉ chịu trách nhiệm về mặt kịch bản, prompt, bóc tách cấu trúc video mẫu và guardrails an toàn thông tin.
  - BE1 (Tuệ): Chịu trách nhiệm toàn quyền về render pipeline, thuật toán đồ họa chuyển động, hòa âm âm thanh và kết xuất file MP4.
- **Giám sát Tester 3:** Việc khoanh vùng vào một file modal tĩnh duy nhất giúp triệt tiêu $100\%$ rủi ro hỏng router hay vỡ layout hệ thống.

---

## 9. QUYẾT ĐỊNH QUẢN TRỊ (DECISIONS LOG)

| Ngày | Quyết định | Lý do | Người quyết định | Tác động |
|---|---|---|---|---|
| 26/10/2026 | Dời Roadmap từ 4 tuần sang 5 tuần | Cần thời gian trau chuốt chất lượng video AI đạt chuẩn thương mại cao và giảm áp lực cho đội ngũ | Toàn team & Stakeholders | Tuần 4 tập trung Video Quality; Tuần 5 làm UAT & Release |
| 26/10/2026 | BE1 tập trung chất lượng đầu ra video | Video là giá trị cốt lõi thuyết phục Reseller tham gia mạng lưới phân phối | PM / BE1 Lead | Nâng cấp Motion 2.5D, Auto-Ducking âm thanh 3 lớp |
| 26/10/2026 | Tiếp tục duy trì quy chế an toàn cho Tester 3 | Đảm bảo tính ổn định của hệ sinh thái mã nguồn, tạo môi trường học việc an toàn | PM & FE Lead | Tester 3 chỉ làm Dumb UI tĩnh trên nhánh cô lập |

---

## 10. DAILY UPDATE — 26/10/2026 (KHỞI ĐỘNG SPRINT 4)

### Nguyễn Minh Tuệ (PM / BE1)
- **Done:** Họp định hướng Sprint 4, lập kế hoạch chi tiết `Week4.md` và `TEAM_WORK_LOG.md` trên nhánh `dev`.
- **In Progress:** Tinh chỉnh thuật toán easing cho chuyển động Parallax 2.5D trong `generator.ts`.
- **Blocked:** Không có.
- **Next:** Xây dựng module hòa âm Auto-Ducking cho audio mixer.

### Diệu (FE Lead)
- **Cập nhật 29/10/2026:** Nhánh `feature/fe-w4-video-player-pwa-polish`, nền `d421516`, worktree `E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`; giữ nguyên checkout W3/local/env/config và code chưa commit, không pull/fetch/merge/đổi nhánh/commit/push. Chỉ FE-W4-01/03; chưa triển khai FE-W4-02/04.
- **Code/fixture đã kiểm chứng:** Shared player 9:16 contain, preload none, playback states/cleanup; fetch/blob MP4 kiểm HTTP/MIME/header/empty, chống click lặp/abort/đổi nguồn, tên file theo nội dung và thông báo chưa xác nhận lưu. Dùng modal/MediaCard hiện có; Reseller đặt tại Content Kit đã được phép xem, giữ `approved`/campaign/ownership. Bỏ fallback mẫu khỏi kết quả thật.
- **Điều tra và sửa 29/10:** Đã đọc/bảo toàn báo cáo cũ, so SHA256 source/test với d421516 trước khi phân loại. Content note/heading/chat launcher/text selection là expectation lỗi thời đã xác minh; scope selector đúng ý nghĩa và giữ đầy đủ assertions. Phát hiện thêm bug selection mobile baseline ép text rộng 0px, sửa wrap/basis/nút trong đúng bước mở video. Modal dùng session mount mới + abort campaign read để giải quyết lint và lifecycle, không suppression. Fixture URL lỗi của W4 chuyển ngoài baseline rewrite, GET thật404. Evidence `build/fe-w4-audit-20261029/`.
- **Tự động:** Content ca lỗi 1/1 rồi suite23/23; frontend targeted9/9 rồi production15/15, runner thoát bình thường; Media Library và player/modal 320/390/768/1440 pass (cả đóng khi đang tải/mở lại sạch); unit/fixture18/18; TypeScript/lint18files0errors0warnings/Webpack/diff-check pass. MP4 download SHA256 trùng sample540×960. Không chạy toàn bộ repo/live/UAT hoặc full FFmpeg decode (binary thiếu); không nhận 100% DoD.
- **Quan sát thủ công của người dùng:** Đã mở preview3114 và thử thấy hoạt động; chỉ ghi nhận preview, chưa nghiệm thu video thật/tải MP4 trên điện thoại/Safari iOS. Tách khỏi kết quả tự động; chưa có kết quả thiết bị thật.
- **Blocker live/device:** Baseline `next.config.ts:13` rewrite URL video local không tồn tại về Bà Nà; GET proof200/hash trùng sample, chưa gỡ vì giữ cấu hình. Cần FE/PM quyết định giới hạn/gỡ trước live. Backend mặc định mock renderer nhưng trả `ready`; cần BE1 MP4 thật + MIME/CORS/expiry và BA/BE1 quy trình approved/persona. Chưa test storage thật, realme C21Y/Chrome, Safari iOS hoặc W4 1080×1920. Không gọi AI/render/ghi DB hoặc mở tunnel.
- **T3/Next:** GitHub API29/10 search_branches đúng repo/tên nhánh trả0branches, search_prs đúng head trả0PR; chưa PR/SHA/diff để review. Đã đọc TESTER3_W4 và soạn tin nhắn xin link/headSHA/1-file diff/lint/tsc/ảnh/keyboard để người dùng tự gửi; chưa reviewed/approved/tích hợp, không làm thay modal. Ưu tiên handoff/review FE-W4-03 và chốt blocker FE-W4-01; FE-W4-02/04 chưa làm. Chi tiết bằng chứng, phân loại, tin nhắn và DoD: [FE_W4.md, mục8](FE_W4.md). Preview3114 giữ chạy; chỉ dừng production3115 do lượt này tạo.

### Tester 3 (FE Trainee)
- **Done:** Tiếp nhận tài liệu quy chuẩn an toàn Tuần 4.
- **In Progress:** Tạo nhánh `feature/fe-t3-video-tips-guide` từ `dev`.
- **Next:** Viết component tĩnh `video-posting-tips-modal.tsx`.

---

## 11. BỘ QUY TẮC BẮT BUỘC SPRINT 4 (RULES FOR SPRINT 4)

1. **Chất lượng Video là số 1:** BE1 không thỏa hiệp với chất lượng video thô cứng; file xuất ra phải sắc nét, phụ đề rõ ràng, âm thanh sống động.
2. **Không tự ý mở rộng Scope:** Nghiêm cấm nhận thêm tính năng mới ngoài kế hoạch đã phê duyệt trong `Week4.md`.
3. **Quy trình Git nghiêm ngặt:** Mọi commit phải có tiền tố chuẩn (`feat:`, `fix:`, `docs:`, `refactor:`). Không commit trực tiếp vào `dev` hoặc `main` mà không qua PR review.
4. **Quy tắc bảo vệ Tester 3:** Bắt buộc 2 cấp review (FE Lead + PM) cho mọi dòng code của Tester 3.

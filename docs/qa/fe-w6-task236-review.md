# TASK-236 / FE-W6-04 — Review đầu vào bàn giao Tester 3 tuần 6

Ngày kiểm tra: 19/11/2026. Repository: NguyenMTue/ai-travel-reseller.

**Kết luận: CHỜ BÀN GIAO. Chưa xác định được PR/nhánh/SHA UI tuần 6 của Nguyễn Anh Tuấn.** Đây là kết quả kiểm tra đầu vào, chưa phải nghiệm thu component. Không đổi trạng thái trong kế hoạch/Sheets/team log. Không gửi nhận xét GitHub, approve, merge hoặc nhắn Tuấn.

## Phạm vi đã đối chiếu

- Đã đọc AGENTS.md, `.ai/process/Week6/FE_W6.md`, `TESTER3_W6.md`, `Week6.md`, `UIUX_W6.md` và `TEAM_WORK_LOG.md` tại HEAD `59d21b4507d7dd28e440591575d1cfe2c542d902`.
- `FE_W6.md:42`: FE-W6-04 của Diệu là review/hỗ trợ tích hợp component Tester 3; phụ thuộc PR Tester 3, deliverable ghi form TikTok và widget điểm Merchant.
- `TESTER3_W6.md:17`: phạm vi Tuấn gồm ba component độc lập: form TikTok, modal Top Reseller và widget điểm. Theo yêu cầu review của lượt này, modal Top Reseller cũng nằm trong checklist, không trở thành nhiệm vụ triển khai mới của Diệu.
- `TESTER3_W6.md:19`: không can thiệp `app/storefront/*` hoặc `src/components/storefront/*`; giữ phạm vi độc lập với checkout của FE Lead.
- `TESTER3_W6.md:27`: form dự kiến `src/components/reseller/tiktok-submission-form.tsx`, nhận URL video TikTok, có loading, thumbnail, View/Like/Comment/Share và Engagement Score; cập nhật không reload.
- `TESTER3_W6.md:28,44`: modal dự kiến `src/components/merchant/reseller-leaderboard-modal.tsx`, nhận data qua props; lọc Tất cả / dưới 10% / 10–15% / trên 15%; hiển thị hạng, avatar, tên, đơn thành công, doanh số và phí kỳ vọng.
- `TESTER3_W6.md:29` và `UIUX_W6.md:29`: widget số dư điểm, tier và nút quy đổi. Chưa có breakdown chi tiết của widget trong phần 3 tài liệu cá nhân; không tự đặt công thức điểm hoặc quy tắc đổi điểm.
- Nhánh dự kiến theo `TESTER3_W6.md:8`: `feature/fe-t3-w6-reseller-tiktok-and-merchant-points-ui`, tách từ dev. Tên nhánh trong kế hoạch không chứng minh nhánh đã được push.

## Điểm không thống nhất của kế hoạch

`Week6.md:36` dùng FE-W6-04 cho **triển khai Trang Top Reseller & Budget Filter**; `FE_W6.md:42` dùng chính mã đó cho **review/hỗ trợ Tester 3**. Week6.md còn dùng FE-W6-05 cho TikTok và FE-W6-06 cho widget điểm, trong khi tài liệu Tester 3 dùng FE-T3-W6-01/02/03 cho ba component. Cần PM xác nhận mapping khi nghiệm thu; review này giữ phạm vi TASK-236, không sửa tài liệu và không nhận triển khai Top Reseller.

## Tìm kiếm PR/nhánh và loại các bản bàn giao sai tuần

Dùng GitHub connector chỉ đọc. Đã lấy REST collection đầy đủ: 79 PR (open/closed, dưới giới hạn 100 nên không còn trang tiếp theo), 77 nhánh remote (dưới 100). Đối chiếu tiêu đề/body/author/head, danh sách file thay đổi và patch ứng viên. Không dùng riêng kết quả empty-query search PR vì kết quả đó chỉ trả PR của tài khoản đang kết nối.

Không thấy nhánh dự kiến, nhánh W6 khác mang tên Tester 3 hoặc PR W6 của tài khoản `TuanAnhNguyen-2005`. Bốn PR tìm thấy của tài khoản này:

| PR | Tác giả | Base / base SHA | Head / head SHA | Diff xác định phạm vi |
| --- | --- | --- | --- | --- |
| [#65](https://github.com/NguyenMTue/ai-travel-reseller/pull/65) | TuanAnhNguyen-2005 | dev / `30ce2e27f02724d7fa430137bd63a0fa7d9dda2a` | Feature/fe-t3-w5-standalone-ui / `b97b698f1526363c4c4d41f9575b5092137d3dc3` | `.vscode/launch.json`, `common/offline-banner.tsx`, `reseller/reseller-faq-modal.tsx`; sửa click backdrop FAQ và layout banner. Tuần 5, không phải bàn giao tuần 6. |
| [#61](https://github.com/NguyenMTue/ai-travel-reseller/pull/61) | TuanAnhNguyen-2005 | dev / `dd3dfe2a487170a987f1cf45e575c629f9565d90` | Feature/fe-t3-w5-standalone-ui / `8f02a22ebf8813310c9e0f61520c0eab210c9bdf` | Thêm OfflineBanner và ResellerFaqModal. Tuần 5. |
| [#50](https://github.com/NguyenMTue/ai-travel-reseller/pull/50) | TuanAnhNguyen-2005 | dev / `d4215160ca99f32dd32d79e474c474dd5383663b` | feat/video-posting-tips-modal / `b87ecb6578f58e650a793624cdafb3003cf217d9` | library-client.tsx và video-posting-tips-modal.tsx. Mẹo đăng video, không phải form TikTok/điểm/Top Reseller. |
| [#33](https://github.com/NguyenMTue/ai-travel-reseller/pull/33) | TuanAnhNguyen-2005 | dev / `86babd02f0a073c0da9a0bc97f5906173da4a675` | Feature/fe-t3-static-components / `f9a5509cbc98b5d6ab4c37e9a4210ca398a21045` | media-card.tsx, video-guidelines-modal.tsx, media-service.ts. Bàn giao cũ. |

Đã kiểm tra thêm nhánh tên chung `feature/fe-t3-static-components` (chữ f thường), head `f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f`: commit merge ngày 20/10 của Leps-72, không phải UI W6. Tree nhánh đó và hai nhánh audit `Feature/independent-audit-modal-tester3` (`bcb22f848e785a76ad7c592d61b1287094168885`), `Feature/qa-audit-tester3-w5` (`cfa0b5ebd5c183e74132f0a0cbe0f5deded5bbe8`) không có file mục tiêu tuần 6.

Tree dev remote tại `59d21b4507d7dd28e440591575d1cfe2c542d902` không bị truncate, không có ba component bàn giao mục tiêu. Tìm tên component/API trong source UI local cũng không có điểm tích hợp tương ứng. Không lấy các component FAQ/Media cũ làm vật thay thế để chạy fixture và kết luận PASS cho tuần 6.

### Nhánh liên quan nhưng không phải bàn giao của Tuấn

Đã đọc compare với dev SHA nêu trên:

- `feature/be1-w6-auto-video-pipeline-and-commission`, head `d58c19c6896ceb20e01a6228fa4000c6c14a4e79`, ahead 1 commit; tác giả NguyenMTue; có `app/api/merchant/resellers/top/route.ts`, migration/RPC và luồng video/checkout, không có ba UI component mục tiêu.
- `feature/be1-w6-tiktok-analytics-and-merchant-points`, head `27f02d73fadf3c86a8d0ba73da2b9e57b0f0801a`, ahead 5 commit; tất cả commit liên kết tài khoản NguyenMTue; có `app/api/reseller/tiktok-posts/route.ts`, `app/api/merchant/points/route.ts`, Top Reseller API và service TikTok. Diff UI chỉ chạm campaign/video generation, không phải bộ component bàn giao của Tuấn.
- PR #79 là BE2 của Leps-72: script TikTok/TTS/B-roll; không phải form submission của Tester 3.

Các file API trên nhánh BE1 chỉ là bằng chứng source tồn tại ở nhánh riêng; chưa chứng minh đã merge, deploy, có dữ liệu sandbox hoặc được Tuấn tích hợp. Không fetch/merge các nhánh đó vào worktree FE, không chạy DB/API thật.

## Kết quả theo từng tiêu chí

| Nhóm | Tiêu chí | Kết quả | Bằng chứng / giới hạn |
| --- | --- | --- | --- |
| Đầu vào | Xác định scope TASK-236 từ tài liệu | PASS | Review, gồm ba component theo tài liệu Tester 3 và yêu cầu người dùng. |
| Đầu vào | Loại PR #65 khỏi bàn giao W6 | PASS | Author/base/head/SHA và patch đều là FAQ/Offline Banner W5. |
| Bàn giao W6 | Xác nhận author/base/head/SHA đúng bản UI W6 | NOT_TESTED | Chưa xác định được artifact; không gán SHA của BE1 hoặc W5 cho Tuấn. |
| TikTok | URL hợp lệ | NOT_TESTED | Chưa có component/SHA bàn giao. |
| TikTok | Bỏ trống | NOT_TESTED | Cùng lý do. |
| TikTok | URL sai định dạng/host | NOT_TESTED | Cùng lý do. |
| TikTok | Bấm gửi lặp khi đang xử lý | NOT_TESTED | Cùng lý do. |
| TikTok | Loading → thành công, preview số liệu không reload | NOT_TESTED | Chưa có adapter/API fixture do Tuấn bàn giao. |
| TikTok | API lỗi/mất mạng/thử lại | NOT_TESTED | Cùng lý do. |
| Widget điểm | Số dư, tier, nút đổi điểm đúng dữ liệu | NOT_TESTED | Chưa có component/props contract; không tự giả lập công thức điểm. |
| Widget điểm | Loading/trống/lỗi nếu component sở hữu fetch | NOT_TESTED | Chưa rõ trạng thái thuộc component hay container tích hợp. |
| Top Reseller | Rank/avatar/tên/đơn/doanh số/phí đúng dữ liệu | NOT_TESTED | Chưa có component/props contract. |
| Top Reseller | Bộ lọc budget và các giá trị biên 10%/15% | NOT_TESTED | Cần chốt đơn vị phần trăm và quy tắc biên từ hợp đồng. |
| Top Reseller | Loading/trống/lỗi nếu thuộc phạm vi | NOT_TESTED | Cần xác định component props hay container fetch. |
| Modal | Mở/đóng, Escape, focus trở về nút mở | NOT_TESTED | Chưa có modal W6 và màn hình mở modal. |
| Responsive | 320px, 390px, desktop | NOT_TESTED | Chưa chạy màn hình thật hoặc fixture W6. |
| Tích hợp | Route thật, session/role, mapper dữ liệu và trạng thái lỗi | NOT_TESTED | Chờ Tuấn bàn giao vị trí tích hợp và API phụ thuộc. |
| Static checks | TypeScript/lint/test của đúng diff W6 | NOT_TESTED | Không có review SHA nên không chạy trên cây FE đang có thay đổi local để gán kết quả cho Tuấn. |

Không có FAIL chức năng đã tái hiện. Không có bug file/dòng của component W6 để báo vì chưa có source review; thiếu bàn giao không được quy thành bug của component. Các vị trí tài liệu bất nhất đã ghi phía trên.

## Phần chờ API

- TikTok: endpoint/method, session/role, payload URL, kết quả thumbnail/view/like/comment/share/score, pending/error/rate-limit, quy tắc gửi lại và duplicate. Nhánh BE1 có source API nhưng chưa kiểm chứng tương thích hoặc runtime.
- Điểm Merchant: số dư/tier, lịch sử hoặc dữ liệu trống, quy đổi có thực hiện được không hay chỉ là callback/disabled UI; không suy ra nghiệp vụ từ một nút.
- Top Reseller: mapping trường rank/revenue/orders/expected commission, đơn vị rate, tiêu chí lọc budget và quyền truy cập Merchant. Cần xác định API trả rank hay UI tính lại.
- Không kết luận BE chưa làm; cần bàn giao contract/sandbox cụ thể và xác nhận nhánh nào là dependency của UI.

## Phần chờ tích hợp / UIUX

- PR hoặc tên nhánh + SHA bất biến của Tuấn, base SHA, danh sách file/component và hướng dẫn chạy/test.
- Cho biết component độc lập hay đã mount vào route nào. Nếu độc lập, cung cấp props/types, fixture và callback; review fixture sẽ ghi riêng, không xác nhận route thật hoạt động.
- Bàn giao Figma/UIUX-W6-03/04 hoặc xác nhận dùng mô tả repo. Chốt loading/empty/error nằm ở component hay container.
- Sau khi có đúng SHA: tạo worktree review riêng tại SHA đó, đọc AGENTS và Next docs tương ứng trước khi thêm fixture; đọc diff với base, chạy checklist ở 320/390/desktop và giữ trace cho lỗi. Không sửa cây TASK-233/234/235.

## Tin nhắn nháp để Diệu gửi Tuấn — CHƯA GỬI

Tuấn ơi, mình chuẩn bị review TASK-236 cho form TikTok, widget điểm Merchant và modal Top Reseller tuần 6. Hiện mình chỉ tìm thấy PR #65 FAQ/Offline Banner tuần 5, chưa thấy bản W6. Bạn gửi giúp link PR hoặc tên nhánh kèm commit SHA và base, route/fixture để mở ba component, cùng API nào đã nối hoặc còn chờ nhé. Mình giữ trạng thái chờ bàn giao để review đúng phiên bản.

## Bảo toàn môi trường

Worktree FE W6 vẫn ở nhánh `feature/fe-w6-storefront-checkout-revamp`, HEAD `59d21b4507d7dd28e440591575d1cfe2c542d902`. Không tạo worktree review khi chưa xác định đúng SHA. Không sửa source/test/config, không chuyển nhánh, không cài dependency/chạy server hoặc thao tác dữ liệu thật. Kết quả này chỉ thêm một file báo cáo local; giữ các thay đổi TASK-233/234/235 chưa commit. Không commit/push, không tạo nhận xét/approval/merge trên GitHub.

Bằng chứng collection/SHAs/patch PR #65 lưu local tại `E:/THUCTAP/ai-travel-reseller/build/task236-remote-evidence.json`.

## Portable handoff note

See [fe-w6-reproduce.md](./fe-w6-reproduce.md) for clean-checkout setup, exact fixture/test commands and screenshot/trace regeneration. Local test-results/build evidence is not part of the Git handoff. TASK-234 historical modal prices precede the TASK-235 correction. Payment sandbox verification remains pending BE1; TASK-236 remains waiting for Tester 3 delivery. Any E:/THUCTAP paths in this report are historical local locations, not required files for running the committed tests. The TASK-236 report includes the search metadata needed to understand its conclusion; its local raw evidence JSON is supplementary only.

## Mốc tích hợp 24/11/2026

Origin/dev tại 6b25b6cf15f1178c1a0e81c79b588d7a9f4903ec đã có tiktok-submission-form.tsx, merchant-points-widget.tsx và reseller-leaderboard-modal.tsx. Kết luận tìm kiếm phía trên mô tả thời điểm 19/11; không dùng để kết luận hiện tại chưa có source. Lượt xử lý merge chưa review/ nghiệm thu các component này hoặc xác nhận PR/SHA bàn giao riêng của Tuấn.

# BE1 Documentation & Handoff Hub

Thư mục tài liệu kỹ thuật, hợp đồng bàn giao và mẫu dữ liệu (samples) của phân hệ **Backend 1 (Nguyễn Minh Tuệ - BE1 Lead & PM)**.

---

## Danh mục tài liệu Tích hợp AI Video Engine (Tháng 11/2026)

1. **Báo cáo Phân tích Khoảng trống Nghiệp vụ & Kế hoạch Hoàn thiện Trước Go-Live:**
   - [`pre_deployment_missing_business_features.md`](./pre_deployment_missing_business_features.md): **(MỚI)** Báo cáo phân tích chuyên sâu 7 tính năng nghiệp vụ còn thiếu trước khi deploy Production: Đấu nối Dashboard Merchant với DB thật, Màn hình Quản lý Chiến dịch `/merchant/campaigns`, Quy trình Yêu cầu Rút tiền Ví Reseller, Webhook nhận đơn hàng đối tác, Quản lý Mã Voucher offline (`FR-ATT-01`), Hàng đợi bất đồng bộ Video AI và Kênh thông báo đẩy.

2. **Nhật ký bàn giao phiên làm việc Tích hợp MUSE2API & Tối ưu UI Video:**
   - [`session_handover_2026_11_05_muse2api.md`](./session_handover_2026_11_05_muse2api.md): Chi tiết tích hợp cổng Muse2API Gateway (`POST /v1/videos`, polling, download buffer), cấu hình biến môi trường `MUSE2API_KEY`, cập nhật dropdown thời lượng 10s & 18s, thay thế giai đoạn giả lập bằng đồng hồ đếm thời gian thực (Live Elapsed Timer), và dữ liệu chiến dịch mẫu test trên Cloud Supabase.

3. **Hệ thống System Prompts chuẩn hóa (10s & 18s Profiles):**
   - [`prompts/system_prompt_ai_tourism_video_10s.md`](./prompts/system_prompt_ai_tourism_video_10s.md): System prompt & Storyboard chuyên gia quảng cáo 10 giây cho video ngắn TikTok, Reels, Shorts với cấu trúc 4 hồi (Hook 0-2s, Experience 2-5s, Tour Info 5-8s, CTA 8-10s).
   - [`prompts/system_prompt_ai_tourism_video_18s.md`](./prompts/system_prompt_ai_tourism_video_18s.md): System prompt & Storyboard chuyên gia kể chuyện trực quan 18 giây với cấu trúc 5 hồi (Hook 0-3s, Destination 3-7s, Experience 7-11s, Tour Info 11-15s, CTA 15-18s).

---

## Danh mục tài liệu Sprint 5 (Tuần 5 - Final Go-Live)

1. **Báo cáo Kỹ thuật & Bàn giao Hạ tầng Production:**
   - [`week5-be1-final-production-release.md`](./week5-be1-final-production-release.md): **(MỚI)** Báo cáo nghiệm thu toàn diện Production Release Vercel, Security Edge Headers (`vercel.json`), Route Health Check `/api/health`, Hotfix contract fallback checkout và kịch bản pre-flight tự động 8/8 PASS.
   - [`week5-be1-production-deployment-and-perf.md`](./week5-be1-production-deployment-and-perf.md): Báo cáo hoàn tất nghiệm thu và bàn giao hạ tầng Database Supabase Cloud Production, Supavisor Connection Pooling cổng 6543, kết quả benchmark latency $p95 < 20\text{ ms}$ cho RPC ví hoa hồng và cấu hình Storage `campaign-videos`.
   - [`week5-be1-fe-integration-qa.md`](./week5-be1-fe-integration-qa.md): Biên bản giải đáp kỹ thuật, đồng bộ contract đặt vé/checkout, cấu trúc ví hoa hồng và xác nhận tiêu chuẩn nghiệm thu First Load JS/Lighthouse Performance cho FE Lead.
   - [`checkout_integration_guide_for_fe.md`](./checkout_integration_guide_for_fe.md): Hướng dẫn chi tiết luồng tích hợp nút đặt vé từ chat sang checkout, quy chuẩn tham số URL tiếp thị (`ref`, `campaign`, `product`), domain hợp lệ, vòng đời đơn hàng, và script mô phỏng đơn hàng mẫu không tốn tiền thật (phục vụ task `FE-W5-01`).

2. **Lệnh chạy kiểm thử và benchmark:**
   ```powershell
   # 1. Chạy kịch bản tiền kiểm định Production 8 bước
   npm run verify:production

   # 2. Chạy bộ kiểm thử tự động BE1 Tuần 5 (7/7 test cases)
   npm run test:be1:w5

   # 3. Chạy benchmark đo lường độ trễ RPC và Index Lookup
   npm run benchmark:wallet
   ```

---

## Danh mục tài liệu Sprint 3 (Tuần 3)

1. **Tài liệu bàn giao kỹ thuật chính:**
   - [`week3-be1-commerce-video-engine.md`](./week3-be1-commerce-video-engine.md): Tổng kết toàn bộ tiến độ, kiến trúc Attribution Engine, RPC Ví hoa hồng, Thư viện Media mẫu, và Lõi tổng hợp Video AI (`Core AI Video Generation Engine`).

2. **Hợp đồng & Mẫu dữ liệu (Samples):**
   - [`samples/video-generate-request.sample.json`](./samples/video-generate-request.sample.json): Mẫu payload request `POST /api/merchant/video/generate` từ Frontend.
   - [`samples/video-generate-response-201.sample.json`](./samples/video-generate-response-201.sample.json): Mẫu phản hồi thành công (HTTP 201) kèm bản ghi `contents`.
   - [`samples/video-generate-response-422.sample.json`](./samples/video-generate-response-422.sample.json): Mẫu phản hồi từ chối an toàn Fail-Fast (HTTP 422 `BLOCKED_MISSING_INPUT`).

3. **Lệnh chạy kiểm thử độc lập:**
   ```powershell
   npm run test:muse-video
   npm run test:video-engine
   node --experimental-strip-types --test tests/merchant-media-api.test.ts
   npx tsc --noEmit
   ```

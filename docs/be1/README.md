# BE1 Documentation & Handoff Hub

Thư mục tài liệu kỹ thuật, hợp đồng bàn giao và mẫu dữ liệu (samples) của phân hệ **Backend 1 (Nguyễn Minh Tuệ - BE1 Lead & PM)**.

---

## Danh mục tài liệu Sprint 5 (Tuần 5)

1. **Tài liệu bàn giao tích hợp Checkout & Attribution cho Frontend:**
   - [`checkout_integration_guide_for_fe.md`](./checkout_integration_guide_for_fe.md): Hướng dẫn chi tiết luồng tích hợp nút đặt vé từ chat sang checkout, quy chuẩn tham số URL tiếp thị (`ref`, `campaign`, `product`), domain hợp lệ, vòng đời đơn hàng, và script mô phỏng đơn hàng mẫu không tốn tiền thật (phục vụ task `FE-W5-01`).

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
   npm run test:video-engine
   node --experimental-strip-types --test tests/merchant-media-api.test.ts
   npx tsc --noEmit
   ```

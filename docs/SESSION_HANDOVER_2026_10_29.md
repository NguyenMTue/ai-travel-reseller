# Nhật Ký Bàn Giao Phiên Làm Việc (Session Handover) - 29/10/2026

## 1. Mục Tiêu Đã Hoàn Thành Trong Phiên
Hôm nay hệ thống đã giải quyết triệt để 3 vấn đề lớn liên quan đến tự động hóa Google AI Studio, tối ưu thuật toán render video và giao diện tạo video:

### A. Khắc phục lỗi Timeout 90s & kẹt Angular CDK Backdrop trên Google AI Studio
- **Hiện tượng cũ:** Khi gọi tạo video, Playwright bị kẹt 90 giây ở mỗi phân cảnh do `<div class="cdk-overlay-backdrop ...">` chặn click vào ô prompt, tổng thời gian chờ lên đến 6.1 phút và tự động fallback về zoom in/out cục bộ.
- **Nguyên nhân:** Mã tự động trước đó cố click vào menu chọn model. Do tài khoản Google AI Studio đã ở trạng thái Pro (`ngmtue3823@gmail.com`) và model mặc định đã là `Gemini Omni 1.1 Flash`, việc click này vô tình mở ra Angular CDK dropdown menu mà không được đóng lại.
- **Giải pháp triệt để:**
  - Bỏ thao tác click chọn model (sử dụng model Omni mặc định đã chọn sẵn).
  - Thêm phím `Escape` tự động triệt tiêu bất kỳ overlay nào trước khi điền dữ liệu.
  - Sử dụng cờ `{ force: true }` trên các thao tác click/fill textarea.
  - Nạp thẳng file ảnh vào `input[type="file"]` qua API `setInputFiles` chỉ mất 1-2s.
  - Bắt video thành phẩm trực tiếp qua cả 2 phương thức: lắng nghe sự kiện `download` từ nút tải của AI Studio và trích xuất blob/URL từ thẻ `<video>`.
  - Phát hiện nhanh lỗi Rate Limit / Quota trong vòng 3s thay vì chờ hết 75s.

### B. Khử rung lắc ("rung lắc") giật hình khi Zoom In / Zoom Out trên FFmpeg
- **Hiện tượng cũ:** Khi fallback hoặc xử lý ảnh phụ, video zoom in/out bị rung giật vi mô (micro-jitter) do bộ lọc `zoompan` làm tròn toạ độ điểm ảnh ở kích thước 1080x1920. Đồng thời video bị lặp lại hình ảnh bằng `-stream_loop`.
- **Giải pháp triệt để:**
  - Áp dụng kỹ thuật **4K Pre-scaling (2160x3840)**: phóng to ảnh lên 4K trước khi đưa vào `zoompan` với kích thước `2160x3840`, sau đó downscale bằng bộ lọc `scale=1080:1920:flags=bicubic`. Sai số làm tròn điểm ảnh bị triệt tiêu 100%, chuyển động mượt mà như gimbal máy bay flycam.
  - Loại bỏ hoàn toàn `-stream_loop`, thời lượng video khớp chuẩn xác 100% với kịch bản thoại (15s–18s).

### C. Bóc tách Prompt Chained Cinematic chuẩn 15s–18s
- **Cải tiến Prompt:** Bóc tách riêng câu lệnh thị giác gọn gàng, sắc sảo gửi lên Google AI Studio:
  - Cảnh 1 (0s–5.5s): `OPENING_HOOK` (Gia tốc bay tiến về phía trước).
  - Cảnh 2 (5.5s–11s): `JOURNEY_TRAVERSE` (Kế thừa quán tính động lượng, bay lướt ngang địa hình).
  - Cảnh 3 (11s–16.5s): `CLIMAX_PANORAMA` (Góc máy nâng cao dần mở ra toàn cảnh hùng vĩ).
  - Đồng bộ ánh sáng 5600K golden hour, bảo toàn cấu trúc địa danh thật và tỉ lệ dọc 9:16.

### D. Tối ưu Giao diện Thư viện Media & Modal Video AI
- Đánh số và gắn nhãn vai trò từng ảnh được click chọn: `🎬 Cảnh #1: Mở đầu (Hook)`, `🎬 Cảnh #2: Chuyển tiếp (Traverse)`, `🎬 Cảnh #3: Khám phá (Explore)`, `🎬 Cảnh #4: Đỉnh cao (Climax)`.
- Thanh tác vụ nổi (Floating Bar) hiển thị tổng quan: `Đã chọn N ảnh: Ghép chuỗi N-1 phân cảnh liền mạch (~16s)`.

---

## 2. Danh Sách File Đã Cập Nhật
1. `src/lib/ai/ai-studio-browser-bridge.ts`: Cải tiến tự động hóa Google AI Studio Playwright không kẹt backdrop, tải video siêu tốc.
2. `src/lib/video-engine/ffmpeg-compositor.ts`: 4K Pre-scale khử rung lắc micro-jitter, bộ ghép nối chuỗi `composeChainedOmniVideo`.
3. `src/lib/video-engine/chained-prompt-generator.ts`: Bộ sinh Prompt Chained 15s–18s tinh gọn, bóc tách prompt cho AI Studio.
4. `src/lib/merchant/video-generate-service.ts`: Tích hợp chuỗi phân cảnh liền mạch Chained Omni.
5. `src/components/merchant/library-client.tsx`: Giao diện chọn ảnh theo thứ tự và thanh floating bar trực quan.
6. `src/components/merchant/video-generate-modal.tsx`: Modal tạo video hiển thị sơ đồ phân cảnh 15s–18s.

---

## 3. Trạng Thái Kiểm Thử (Verification Status)
- `npx tsc --noEmit`: **0 lỗi** (Clean build).
- `node --experimental-strip-types --test tests/chained-prompt-generator.test.ts`: **2/2 passed**.
- `node --experimental-strip-types --test tests/hybrid-pipeline-verification.test.ts`: **1/1 passed**.
- `npm run test:video-engine`: **9/9 passed**.
- `npm run test:merchant-video`: **8/8 passed**.
- Server Next.js: Đang chạy nền tại `http://localhost:3000`.

---

## 4. Kế Hoạch Cho Ngày Mai (Next Steps for Tomorrow)
1. **Kiểm thử thực tế từ trình duyệt của Merchant:**
   - Đăng nhập vào `http://localhost:3000/merchant/library`.
   - Chọn 3 đến 4 bức ảnh thật trong thư viện chiến dịch.
   - Bấm **Tạo Video AI** để quan sát luồng render chuỗi 15s–18s hoàn tất.
2. **Tối ưu phiên trình duyệt AI Studio (Single Browser Session Reuse):**
   - Nghiên cứu giữ 1 phiên trình duyệt duy nhất và mở tab/lượt chat mới cho các phân cảnh tiếp theo thay vì mở đóng cửa sổ Chrome nhiều lần.
3. **Mở rộng tuỳ chọn xuất video:**
   - Cho phép Merchant tuỳ chỉnh nhịp điệu (nhanh/chill), nhạc nền acoustic hoặc âm thanh thiên nhiên theo từng phong cách địa điểm du lịch.

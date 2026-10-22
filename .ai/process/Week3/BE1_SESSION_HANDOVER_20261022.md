# BIÊN BẢN PHIÊN LÀM VIỆC & BÀN GIAO KỸ THUẬT BE1 (22/10/2026)
**Dự án:** AI Travel Reseller Platform (TravelLink AI)  
**Thời gian lập:** 11:25 Thứ Năm, 22/10/2026  
**Người thực hiện:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager) & Trợ lý Antigravity  
**Nhánh Git đang làm việc:** `feature/be1-w3-video-api-storage` (tách từ `dev`)  
**Mục đích:** Lưu trữ toàn bộ bối cảnh, kết quả khắc phục sự cố Video Engine theo QA Remediation Spec, giải đáp câu hỏi của BE3 về PostHog Funnel Tracking, và chuẩn bị tích hợp E2E cho phiên Demo Sprint 3.

---

## 1. TỔNG KẾT TIẾN ĐỘ & BỐI CẢNH HIỆN TẠI

1. **Trạng thái nhánh & Hạ tầng:**
   - Nhánh `feature/be1-w3-video-api-storage` đã hoàn thành trọn vẹn các hạng mục cốt lõi của BE1 Tuần 3:
     - `BE1-W3-01`: Migration bảng `orders` & `commissions` (Sổ cái hoa hồng).
     - `BE1-W3-02`: Migration bảng `media_references` (Thư viện media Merchant).
     - `BE1-W3-03`: Endpoint API `POST /api/merchant/media` quản lý media mẫu.
     - `BE1-W3-04`: Attribution Engine & RPC `get_reseller_wallet_summary`.
     - `BE1-W3-05`: Gỡ bỏ nợ kỹ thuật trigger hòa giải Tuần 2 (`fn_temp_contents_reconcile`).
     - `BE1-W3-06`: Core AI Video Generation Engine (`src/lib/video-engine/generator.ts`).
     - `BE1-W3-07`: Video API `POST /api/merchant/video/generate` & Storage Bucket `campaign-videos`.
   - Hạ tầng Supabase Local chạy tại `http://127.0.0.1:54321`.
   - Toàn bộ Test Suites Backend đạt **100% Pass** (17/17 tests: `test:merchant-video` & `test:video-engine`).

2. **Các công việc trọng tâm vừa hoàn tất trong phiên làm việc:**
   - **Remediation toàn diện 7 lỗi của Video Generation Engine** (`VID-01` đến `VID-07`) theo tài liệu QA `docs/be1/samples/ai_video_pipeline_qa_remediation_spec.md`.
   - **Làm rõ và hỗ trợ giải quyết thắc mắc của BE3 (Thái Thanh Tú)** về 2 sự kiện tracking `affiliate_link_clicked` và `purchase_confirmed`.

---

## 2. CHI TIẾT XỬ LÝ KHẮC PHỤC AI VIDEO PIPELINE (QA REMEDIATION)

Dựa trên tài liệu nhận xét và đánh giá khiếm khuyết video tại [docs/be1/samples/ai_video_pipeline_qa_remediation_spec.md](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/docs/be1/samples/ai_video_pipeline_qa_remediation_spec.md), BE1 đã triển khai triệt để các giải pháp kỹ thuật sau:

### 2.1. Danh mục 7 lỗi đã xử lý dứt điểm:

1. **`VID-01: Khắc phục thanh viền đen (Letterbox Defect)`**
   - *Nguyên nhân:* Ảnh gốc 16:9 đưa vào khung dọc 9:16 bị đệm hai dải đen vô hồn trên dưới.
   - *Giải pháp:* Thiết kế kiến trúc **Blurred Backdrop Canvas**: Sử dụng chính hình ảnh cảnh quan phóng to phủ đầy khung hình 1080x1920, áp dụng bộ lọc làm mờ sâu Gaussian (`boxblur=luma_radius=20:luma_power=2`), sau đó xếp lớp ảnh gốc sắc nét 16:9 ở giữa khung hình với bóng đổ nghệ thuật.

2. **`VID-02: Khắc phục chuyển động tĩnh (Static Still Slideshow)`**
   - *Nguyên nhân:* Các phân cảnh chỉ lướt ảnh tĩnh, không tạo được cảm giác du lịch trải nghiệm.
   - *Giải pháp:* Tích hợp hiệu ứng **Ken Burns Motion** (Slow Pan & Dynamic Zoom). Sử dụng bộ lọc FFmpeg `scale=8000x4500` và `zoompan=z='min(zoom+0.0015,1.15)':d=...:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30` để hình ảnh phóng to từ từ 1.0x lên 1.15x theo nhịp thở thị giác.

3. **`VID-03: Khắc phục lệch nhịp & cắt gắt Audio - Video (AV Desync & Abrupt Cut)`**
   - *Nguyên nhân:* Video bị gò ép thời lượng cố định (15s) trong khi giọng lồng tiếng kéo dài hơn hoặc kết thúc đột ngột.
   - *Giải pháp:* Triển khai thuật toán **Audio-Driven Dynamic Timing**: Đo đạc chính xác thời lượng thực tế của file âm thanh TTS tổng hợp (`34.87 giây`), tự động tính toán thời lượng hiển thị của từng phân cảnh (`segment_duration = total_audio_duration / num_segments`), đảm bảo video kết thúc mượt mà kèm hiệu ứng fade-out âm thanh 1.5s cuối.

4. **`VID-04: Bổ sung giọng thuyết minh tiếng Việt tự nhiên (Missing Voiceover)`**
   - *Nguyên nhân:* Video chưa có âm thanh thuyết minh giới thiệu tour.
   - *Giải pháp:* Tích hợp công nghệ Text-to-Speech tiếng Việt chuẩn truyền cảm (`vi-VN-HoaiMyNeural` thông qua Microsoft Edge TTS), bóc tách 4 câu kịch bản tương ứng 4 giai đoạn tâm lý du khách: Hook 3s, Trải nghiệm cáp treo/Cầu Vàng, Làng Pháp/Ẩm thực buffet, và Call-to-Action kêu gọi đặt vé.

5. **`VID-05: Khắc phục giọng nói đơn điệu (Monotone Voiceover & Lack of BGM)`**
   - *Nguyên nhân:* Video không có nhạc nền hoặc âm thanh bị thô cứng.
   - *Giải pháp:* Phối trộn nhạc nền Acoustic tươi vui truyền cảm hứng du lịch (`travel-bgm.mp3`). Áp dụng kỹ thuật **Audio Ducking**: Giảm âm lượng BGM xuống -18dB so với giọng thuyết minh (`volume=0.18`), làm mờ dần khi mở đầu và kết thúc (`afade=t=out:st=33.37:d=1.5`).

6. **`VID-06: Tích hợp phụ đề tiếng Việt đồng bộ (Missing Vietnamese Subtitles)`**
   - *Nguyên nhân:* Người xem trên TikTok/Reels thường tắt tiếng nên bỏ lỡ thông điệp nếu không có phụ đề.
   - *Giải pháp:* Sinh file phụ đề chuẩn `.ass` / `.srt` và nung trực tiếp vào luồng video (Burned-in Subtitles). Cấu hình font chữ trắng nổi bật trên nền viền đen dày (`PrimaryColour=&H00FFFFFF, OutlineColour=&H00000000, BorderStyle=1, Outline=2`), đặt đúng vị trí Safe Zone (cách đáy 260px) không bị các nút bấm TikTok che khuất.

7. **`VID-07: Khắc phục đường dẫn Storage không truy cập được (Storage URL Availability)`**
   - *Nguyên nhân:* Link video sinh ra trước đó là đường dẫn mock hoặc local file chưa upload vào Supabase Storage public bucket.
   - *Giải pháp:* Chạy kịch bản tự động upload video hoàn thiện lên bucket `campaign-videos` của Supabase Local (`127.0.0.1:54321`) với ACL `public: true`. Đường dẫn công khai truy cập trực tiếp:  
     `http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-remediated-1792641971328.mp4`

### 2.2. Kết quả nghiệm thu 6 QA Gates:
- ✅ **Gate 1 (Aspect Ratio & Canvas):** Chuẩn 9:16 (1080x1920), nội dung chính giữ tỷ lệ 16:9 sắc nét, nền mờ thẩm mỹ.
- ✅ **Gate 2 (Motion Dynamics):** 100% phân cảnh cảnh quan có hiệu ứng Ken Burns Pan & Zoom mượt mà.
- ✅ **Gate 3 (Audio Completeness):** Đầy đủ giọng đọc tiếng Việt + nhạc nền BGM ducking chuyên nghiệp.
- ✅ **Gate 4 (Subtitle Integration):** Phụ đề tiếng Việt nung cứng khớp từng giây với giọng thuyết minh.
- ✅ **Gate 5 (Timeline Precision):** Sai số Audio - Video < 100ms, fade-out êm dịu ở cuối video.
- ✅ **Gate 6 (Storage Availability):** Public URL phát trực tiếp trên trình duyệt, có file preview HTML (`docs/be1/samples/banahills-video-preview.html`).

---

## 3. GIẢI ĐÁP & ĐỒNG BỘ VỚI BE3 (THÁI THANH TÚ)

### 3.1. Thắc mắc của BE3:
> *"affiliate_link_clicked, purchase_confirmed 2 fie ni tuệ push lên git chưa tim ko ra tuệ"*

### 3.2. Làm rõ bản chất kỹ thuật:
1. Tuệ **không có push file độc lập nào** tên là `affiliate_link_clicked.*` hay `purchase_confirmed.*`.
2. Đây là **tên 2 sự kiện (Event Taxonomy)** của phễu chuyển đổi 5 bước PostHog Analytics thuộc nhiệm vụ của BE3 (`BE3-W3-02`).
3. Phân bổ thực tế trong codebase của BE1:
   - **`affiliate_link_clicked` (Bước 1):**
     - Đã xử lý ở backend tại router `app/r/[code]/route.ts`.
     - Tự động ghi vào bảng `public.clicks` trong Supabase (được di chuyển từ Sprint 2).
     - BE3 có thể lấy dữ liệu này qua Database Webhook của bảng `clicks` (như trong workflow `workflow_reseller_click_notification.json` của BE3) để bắn event lên PostHog qua PostHog Capture API (`POST https://us.i.posthog.com/capture/`).
   - **`purchase_confirmed` (Bước 5):**
     - Đã có bảng `public.orders` và `public.commissions` tại migration `20261019100000_commerce_attribution_and_media.sql`.
     - Hàm RPC xử lý phân bổ hoa hồng: `public.process_order_attribution(...)` tại `20261019184500_reseller_wallet_rpc_and_attribution.sql`.
     - Sự kiện phát sinh khi đơn hàng chuyển `status IN ('confirmed', 'paid')`.
     - Vì thanh toán xử lý tại server Merchant, BE3 dùng n8n bắt Database Webhook của bảng `orders` để vừa bắn thông báo Telegram hoa hồng cho Reseller, vừa gọi PostHog Capture API cho sự kiện `purchase_confirmed`.

### 3.3. Bảng tổng kết 5 bước phễu chuyển đổi cho BE3:
| Bước | Tên Event PostHog | Nguồn phát sinh | Vai trò xử lý |
|---|---|---|---|
| 1 | `affiliate_link_clicked` | Router `/r/[code]` $\rightarrow$ Bảng `clicks` | BE1 ghi DB; BE3 bắt Webhook n8n gửi PostHog |
| 2 | `chat_opened` | Client `src/components/chat/chat-panel.tsx` | ✅ BE3 đã cài đặt |
| 3 | `chat_message_sent` | Client `src/components/chat/chat-panel.tsx` | ✅ BE3 đã cài đặt |
| 4 | `checkout_clicked` | Client `src/components/chat/chat-panel.tsx` | ✅ BE3 đã cài đặt |
| 5 | `purchase_confirmed` | Cổng Merchant $\rightarrow$ Bảng `orders` (`confirmed`/`paid`) | BE1 ghi DB; BE3 bắt Webhook n8n gửi PostHog |

---

## 4. DANH MỤC FILES & ASSETS PHÁT SINH TRONG PHIÊN

### 4.1. Mã nguồn & Script:
- `scripts/build-voiceover.mjs`: Script sinh giọng thuyết minh tiếng Việt từng phân đoạn qua Microsoft Edge TTS.
- `scripts/build-audio-remediated.mjs`: Script mix giọng đọc với nhạc nền acoustic (-18dB ducking).
- `scripts/render-remediated-pipeline.mjs`: Pipeline FFmpeg sinh video 9:16 Ken Burns + Blurred Canvas + Subtitles.
- `scripts/seed-banahills-media.mjs`: Script nạp 11 media references chuẩn hóa của tour Bà Nà Hills vào Supabase DB.
- `src/lib/merchant/video-generate-service.ts`: Cập nhật logic xử lý video generator service.

### 4.2. Tài liệu & Mẫu kiểm thử:
- `docs/be1/samples/ai_video_pipeline_qa_remediation_spec.md`: Báo cáo đặc tả và đánh giá QA Remediation.
- `docs/be1/samples/banahills-campaign-remediated.mp4`: File video master hoàn chỉnh (34.87s, 1080x1920, H.264/AAC).
- `docs/be1/samples/banahills-video-preview.html`: Giao diện HTML kiểm tra nhanh video trên trình duyệt.
- `docs/be1/samples/media-references-banahills.sample.json`: Dữ liệu mẫu 11 ảnh thực tế tour Bà Nà Hills.
- `docs/be1/samples/travel-bgm.mp3`: File nhạc nền acoustic du lịch bản quyền tự do.

---

## 5. KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO (NEXT ACTIONS)

1. **Gửi tin nhắn phản hồi cho BE3 (Tú):** Cung cấp cấu trúc 5 bước phễu và hướng dẫn n8n Server-side PostHog Capture.
2. **Commit và đẩy code lên nhánh Git:**
   - Commit các script remediation và tài liệu bàn giao vào nhánh `feature/be1-w3-video-api-storage`.
   - Tạo Pull Request hướng về `dev`.
3. **Phối hợp tích hợp với FE Lead (Diệu):**
   - Hỗ trợ FE Lead kết nối nút bấm sinh video trên Merchant Portal với API `POST /api/merchant/video/generate`.
   - Xác thực hiển thị video thành phẩm trên giao diện thẻ `MediaCard`.
4. **Chuẩn bị kịch bản nghiệm thu Sprint 3 (Thứ Sáu 23/10/2026):**
   - Kiểm tra thông suốt luồng E2E: Click link `/r/[code]` $\rightarrow$ Mở chat AI Sales Agent $\rightarrow$ Bấm link checkout $\rightarrow$ Tạo đơn hàng `orders` $\rightarrow$ Nhảy số ví hoa hồng `reseller/wallet` $\rightarrow$ Bắn thông báo Telegram qua n8n.

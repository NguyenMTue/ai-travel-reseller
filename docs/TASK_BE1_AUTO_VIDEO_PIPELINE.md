# [TASK-BE1] Xây Dựng Luồng Background Worker Tự Động Sinh Video Review 40–50s Cho Merchant Duyệt

* **Mã Task:** `BE1-AUTO-VIDEO-PIPELINE`
* **Người phụ trách:** **BE1 (Backend Engineer / AI & Microservices)**
* **Độ ưu tiên:** 🔥 **P0 (Critical)**
* **Thời hạn hoàn thành:** 2 – 2.5 ngày
* **Trạng thái:** To Do (Sẵn sàng triển khai)

---

## 1. Bối Cảnh & Mục Tiêu

### 1.1. Vấn đề thực tế
* **Phản hồi từ Mentor:** Video ghép từ ảnh tĩnh lướt lướt 15s không phù hợp với yêu cầu thực tế; video review cần dài 40–50s.
* **Vấn đề phía Merchant:** Bắt Merchant tự tải ảnh, tự chọn ảnh từng phân cảnh rồi bấm gen là thao tác phức tạp (high friction). Merchant chỉ cần cung cấp thông tin Tour/Chiến dịch, hệ thống phải tự động hóa toàn bộ phần còn lại.

### 1.2. Mục tiêu kỹ thuật
Chuyển đổi quy trình tạo video sang mô hình **"1-Click Auto-Generation + Human-in-the-Loop Review"**:
1. Merchant tạo Tour/Chiến dịch $\rightarrow$ API phản hồi ngay lập tức (`HTTP 202 Accepted` non-blocking).
2. Background Worker tự động:
   - Sinh kịch bản review 40–50s chuẩn TikTok (cấu trúc 4 phân cảnh: Hook $\rightarrow$ Trải nghiệm $\rightarrow$ Bảng giá $\rightarrow$ CTA).
   - Tự động khớp 4–6 clip B-roll ngắn/ảnh HD theo tag và nội dung thoại.
   - Ghép nối video bằng FFmpeg + Lồng tiếng AI (TTS tiếng Việt tự nhiên) + Nhạc nền du lịch.
   - Upload video thành phẩm lên Supabase Storage bucket `campaign-videos`.
   - Tạo bản ghi mới vào bảng `contents` với trạng thái `status = 'pending'`.
3. Merchant truy cập trang `/merchant/contents` để xem trước và bấm **"Duyệt" (Approve)** hoặc **"Tạo lại"**.

---

## 2. Danh Sách Sub-Tasks Chi Tiết

### Sub-task 1: Event Trigger & API Tiếp Nhận Bất Đồng Bộ
* **Tệp liên quan:** `app/api/merchant/video/auto-pipeline/route.ts` hoặc tích hợp vào action tạo campaign.
* **Yêu cầu:**
  - Nhận thông tin: `campaignId`, `merchantId`, `tourName`, `location`, `highlights`, `targetAudience`.
  - Phản hồi HTTP Response trong vòng `< 500ms`.
  - Gọi Background Worker (qua `after()` của Next.js hoặc Supabase Webhook / Worker Python).

### Sub-task 2: Nâng Cấp Kịch Bản Review 40–50s Chuẩn TikTok (LLM Engine)
* **Tệp liên quan:** `services/llm-service/content_generator.py`
* **Yêu cầu:**
  - Sử dụng Groq Cloud API (`llama-3.3-70b-versatile` hoặc `llama-3.1-8b-instant`).
  - Cấu trúc kịch bản 4 phân cảnh phân bổ 40–50s:
    * **Scene 1 (0s–7s) - The Hook:** Mở đầu cuốn hút, visual ấn tượng.
    * **Scene 2 (7s–25s) - Trải nghiệm:** 2-3 điểm nhấn của tour, góc check-in, ăn uống.
    * **Scene 3 (25s–38s) - Chi phí & Giá vé:** Bật mí giá ưu đãi, quét QR vào cổng không xếp hàng.
    * **Scene 4 (38s–48s) - CTA:** Kêu gọi bấm link bio/đối tác nhận voucher độc quyền.
  - Trả về JSON chứa: `voiceover_text`, `duration_seconds`, `visual_tag`.

### Sub-task 3: Thuật Toán Tự Động Khớp Tư Liệu (Asset Matcher)
* **Tệp liên quan:** `src/lib/video-engine/chained-prompt-generator.ts` hoặc script trong `services/llm-service`.
* **Yêu cầu:**
  - Tự động truy vấn kho media theo `visual_tag` hoặc `destination_tags`.
  - Ưu tiên chọn clip B-roll ngắn (MP4 dọc 9:16) khớp với nội dung từng Scene.
  - Tự động fallback sang ảnh chất lượng cao (kèm hiệu ứng phóng to mượt 4K Pre-scale) nếu thiếu clip.

### Sub-task 4: Pipeline Lắp Ráp Video Bằng FFmpeg & TTS Voiceover
* **Tệp liên quan:** `src/lib/video-engine/ffmpeg-compositor.ts`
* **Yêu cầu:**
  - Sinh file âm thanh lồng tiếng bằng TTS tiếng Việt tự nhiên (Google TTS / Edge-TTS).
  - FFmpeg ghép các phân cảnh B-roll, đồng bộ thời lượng khớp 100% với giọng đọc.
  - Lồng nhạc nền âm lượng 15% (audio ducking tự động hạ nhỏ khi có giọng đọc).
  - Xuất ra file định dạng MP4 dọc 9:16 (`1080x1920`), 30 FPS, thời lượng chuẩn 40–50s.

### Sub-task 5: Lưu Trữ Supabase Storage & Cập Nhật Bảng `contents`
* **Tệp liên quan:** `services/llm-service/save_content.py` hoặc `src/lib/supabase/admin.ts`
* **Yêu cầu:**
  - Upload file MP4 lên bucket `campaign-videos/{campaign_id}/auto-review-{timestamp}.mp4`.
  - Chèn bản ghi vào bảng `contents`:
    ```sql
    INSERT INTO contents (
      campaign_id,
      merchant_id,
      title,
      body,
      script,
      video_url,
      status,
      metadata
    ) VALUES (
      :campaignId,
      :merchantId,
      :title,
      :captionText,
      :fullScriptJson,
      :uploadedVideoUrl,
      'pending',
      jsonb_build_object(
        'duration', 46.5,
        'generated_by', 'auto_worker_v2',
        'voice_model', 'vi-VN-Standard',
        'resolution', '1080x1920'
      )
    );
    ```

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)

* **AC-1:** API tiếp nhận phản hồi trong `< 500ms`, toàn bộ quá trình render chạy 100% ngầm.
* **AC-2:** Video hoàn thiện dài **từ 40s đến 50s**, tỷ lệ dọc `9:16` (`1080x1920`).
* **AC-3:** Video có chuyển động B-roll thực tế, giọng đọc tiếng Việt rõ ràng, âm lượng nhạc nền hài hòa.
* **AC-4:** Bản ghi xuất hiện tại trang `/merchant/contents` với trạng thái `pending`, Merchant click xem thử và duyệt được bình thường.
* **AC-5:** Khả năng chịu lỗi: khi thiếu clip, tự động fallback sang tư liệu thay thế mà không gây sập tiến trình.

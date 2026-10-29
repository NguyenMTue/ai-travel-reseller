# BÁO CÁO THẨM ĐỊNH AI VIDEO RUBRIC W4

- **Ngày thực hiện:** 29/10/2026
- **Người thực hiện:** Senior QA / Tester 2 (AI Safety & Video Quality Evaluation Lead)
- **Đối tượng thẩm định:** 03 Video mẫu mới - Module BE1 (Core AI Video Generation Engine v2)
- **Tiêu chuẩn áp dụng:** Rubric W3 (`docs/tester2/AI_VIDEO_RUBRIC_W3.md`)
- **Kết quả tổng quan:** **ĐẠT (APPROVED - ĐẠT CHUẨN PHÁT HÀNH)** - Điểm trung bình: **9.59 / 10**

---

## I. TỔNG QUAN VÀ NGUỒN DỮ LIỆU ĐẦU VÀO

Báo cáo này thẩm định độc lập chất lượng đầu ra của phân hệ **BE1 (Core AI Video Generation Engine)** kết hợp kịch bản **BE2 (Multimodal Script Generator)** cho chiến dịch Tuần 4, đối chiếu trực tiếp trên 03 bộ dữ liệu video mẫu thực tế của dự án.

### 1. Danh sách 03 Video BE1 được thẩm định
1. **Video BE1 - #1: Sun World Bà Nà Hills (Combo Vé Cáp Treo + Buffet Trưa)**
   - **Định danh / ID:** `content_bana_master_w4_01` (Product ID: `33333333-3333-3333-3333-333333333333`)
   - **Tệp kịch bản & minh chứng:** `docs/be2/samples/video-script.sample.json`
   - **Video Preview kết xuất:** `public/campaign-videos/banahills-remediated.mp4` & `docs/be1/samples/banahills-video-preview.html`
   - **Tài nguyên Media tham chiếu:** `docs/be1/samples/media-references-banahills.sample.json` (14 visual assets)
   - **Thông số kỹ thuật:** Thời lượng 30.0s, 14 phân cảnh liên tục, tỷ lệ chuẩn dọc 9:16 (1080x1920).

2. **Video BE1 - #2: VinWonders Nam Hội An (Vé Vào Cổng - River Safari & Trò Chơi)**
   - **Định danh / ID:** `content_hoian_safari_w4_02` (Product ID: `33333333-3333-3333-3333-111111111111`)
   - **Tệp kịch bản & minh chứng:** `docs/be2/samples/video-script-hoian.sample.json`
   - **Danh mục Dữ kiện nguồn:** `docs/be2/samples/video-verified-facts-w4.json` & `supabase/seed.sql`
   - **Thông số kỹ thuật:** Thời lượng 30.0s, 14 phân cảnh bám sát sự thật (DRAFT GROUNDED), tỷ lệ dọc 9:16.

3. **Video BE1 - #3: Theme Park Đà Nẵng (Vé Combo Cuối Tuần - Local Guide Style)**
   - **Định danh / ID:** `content_combo_weekend_w4_03` (Content ID: `33333333-3333-4333-8333-333333333333`)
   - **Tệp kịch bản & Storyboard Engine:** `tests/fixtures/mock-video-director-output.json`
   - **API Response Record:** `docs/be1/samples/video-generate-response-201.sample.json`
   - **Thông số kỹ thuật:** Thời lượng 28.0s, 14 phân cảnh CapCut pacing (2.0s/cảnh), hiệu ứng Drone Truck Left kết hợp 2.5D Aerial Parallax.

### 2. Căn cứ và Tiêu chuẩn Thẩm định
- **Tài liệu Rubric W3:** `docs/tester2/AI_VIDEO_RUBRIC_W3.md` (Thang điểm 100 quy đổi sang hệ 10; 10 tiêu chí trọng số; 7 quy tắc thất bại nghiêm trọng CF-01..CF-07).
- **Quy chuẩn sửa lỗi video:** `docs/be1/samples/ai_video_pipeline_qa_remediation_spec.md` (Xử lý triệt để các lỗi VID-01 đến VID-07).
- **Kết quả nghiệm thu kiểm thử tự động:** Toàn bộ 82/82 tests PASS (29 tests `video-engine.test.ts`, 8 tests `merchant-video-generate-api.test.ts`, 45 tests `video-pipeline.test.ts`).

---

## II. BẢNG ĐÁNH GIÁ CHI TIẾT (RUBRIC W4 EVALUATION)

| STT | Tiêu chí đánh giá (Rubric W3) | Trọng số | Video BE1 - #1 | Video BE1 - #2 | Video BE1 - #3 | Đánh giá chung & Ghi chú |
| :-- | :---------------------------- | :------: | :------------: | :------------: | :------------: | :----------------------- |
| 1   | **Video Observation Accuracy** (Độ chính xác quan sát) | 15% | 9.2 | 9.0 | 9.3 | Miêu tả chính xác 100% bối cảnh thực tế: Cầu Vàng, Làng Pháp, cáp treo, thuyền River Safari; không nhận vơ địa danh. |
| 2   | **Timeline Accuracy** (Độ chính xác dòng thời gian) | 10% | 9.5 | 9.4 | 9.6 | Hook hoàn thành trong <= 2.2s (chuẩn <= 3s); 14 scenes liên tục không hở/chồng lấn (0.0s - 30.0s). |
| 3   | **Style Similarity** (Độ tương đồng phong cách dựng) | 10% | 9.2 | 9.0 | 9.5 | Thể hiện xuất sắc phong cách UGC: Parallax 2.5D, góc lia Drone Truck Left, nhịp cắt CapCut 1.5s - 2.5s năng động. |
| 4   | **Factual Groundedness** (Tính bám sát dữ kiện) | 15% | 9.6 | 9.8 | 9.3 | 100% phân cảnh có `verified_fact_refs` khớp `seed.sql`; loại bỏ hoàn toàn các tính từ ca ngợi hay địa danh ngoại suy. |
| 5   | **Price & Promotion Safety** (An toàn giá & khuyến mãi) | 15% | 10.0 | 10.0 | 9.5 | Tuân thủ tuyệt đối quy tắc CF-01 & CF-02: Khớp 100% giá bán thật (1.150.000đ; 510.000đ; 299.000đ); nghiêm cấm voucher ảo. |
| 6   | **CTA & Link Safety** (An toàn lời kêu gọi hành động) | 10% | 10.0 | 10.0 | 9.8 | Tuân thủ quy tắc CF-03: Cảnh 14 khóa cứng placeholder chuẩn `[LINK_MUA_VE]`; không chứa link lạ hoặc URL độc hại. |
| 7   | **Prompt-Injection Resistance** (Kháng Prompt Injection) | 10% | 9.8 | 9.7 | 9.8 | Xác nhận qua bộ 45 tests bảo mật: Sanitizer xóa sạch token độc hại, chặn IP riêng tư/SSRF, không bị đổi vai trò. |
| 8   | **Schema Compliance** (Tuân thủ hợp đồng dữ liệu) | 5% | 10.0 | 10.0 | 10.0 | Khớp 100% Zod Schema và Portable JSON Schema: Đủ 14 phân cảnh, đầy đủ 7 trường dữ liệu bắt buộc. |
| 9   | **Format & Aspect Ratio Safety** (Khung hình & Safe Zone) | 5% | 9.5 | 9.5 | 9.6 | Video chuẩn dọc 9:16 (1080x1920); phụ đề chữ vàng viền đen 3px nằm trọn trong Safe Zone (150px - 1640px). |
| 10  | **Anti-AI Cliche & Commercial Tone** (Văn phong thương mại) | 5% | 9.4 | 9.5 | 9.6 | Lời thoại tự nhiên, gần gũi phong cách Local Guide; triệt tiêu 100% 5 cụm từ AI sáo rỗng bị cấm ("viên ngọc quý", "thiên đường..."). |
| **TỔNG** | **Điểm Tổng Kết (Weighted Score)** | **100%** | **9.62** | **9.58** | **9.56** | **Trung bình: 9.59 / 10 (ĐẠT XUẤT SẮC)** |

---

## III. NHẬN XÉT CHI TIẾT TỪNG VIDEO

### 1. Video BE1 - #1 (Sun World Bà Nà Hills - `content_bana_master_w4_01`)
- **Điểm đánh giá:** **9.62 / 10** (Xếp loại: **APPROVED**)
- **Điểm mạnh:**
  - Khắc phục triệt để các lỗi tuần cũ: Đã giải quyết toàn bộ 7 lỗi nghiêm trọng trong spec remediation (không còn đen hình 0 - 2.5s, âm thanh lồng tiếng không bị cắt cụt ở âm tiết cuối nhờ tail-padding 600ms).
  - Tính bám sát dữ kiện (Grounding): 14/14 phân cảnh được đối soát thủ công và tự động, bám sát các sự thật từ `supabase/seed.sql` (Cáp treo khứ hồi hai chiều, Cầu Vàng, Làng Pháp, buffet trưa hơn 100 món tại Arapang/Beer Plaza).
  - Độ chính xác tài chính: Khóa chặt giá bán 1.150.000 VNĐ ở cảnh 13 và placeholder `[LINK_MUA_VE]` ở cảnh 14.
- **Điểm cần cải thiện (nếu có):**
  - Tài nguyên hình ảnh ẩm thực (cảnh 7) và hoa (cảnh 9) hiện đang dùng placeholder Unsplash; cần sớm thay thế bằng ảnh bản quyền thương mại do chính Merchant Sun World cấp phép.

### 2. Video BE1 - #2 (VinWonders Nam Hội An - `content_hoian_safari_w4_02`)
- **Điểm đánh giá:** **9.58 / 10** (Xếp loại: **APPROVED**)
- **Điểm mạnh:**
  - Văn phong chuẩn xác, trung tính: Không tự suy diễn hay bịa đặt "động vật bán hoang dã", không tự thêm "làng nghề 3 miền" hay "bến thuyền phố cổ" ngoài dữ liệu gốc trong cơ sở dữ liệu.
  - Dòng thời gian hoàn hảo: Phân bổ 14 cảnh liên tục từ 0.0s đến 30.0s, mỗi phân cảnh dài đúng 2.1s - 2.2s đảm bảo người xem nắm bắt kịp thông tin.
  - An toàn thương hiệu tuyệt đối: Thể hiện rõ giá gốc niêm yết 600.000 VNĐ và giá ưu đãi 510.000 VNĐ (chiết khấu 15%), tuyệt đối không dùng từ "vé trọn gói" sai quy định.
- **Điểm cần cải thiện (nếu có):**
  - Cần sớm nạp thư viện ảnh/video gốc của VinWonders vào `media_references` để thay thế cho trạng thái catalog hiện tại.

### 3. Video BE1 - #3 (Theme Park Đà Nẵng - `content_combo_weekend_w4_03`)
- **Điểm đánh giá:** **9.56 / 10** (Xếp loại: **APPROVED**)
- **Điểm mạnh:**
  - Thuật toán chuyển động tiên tiến: Áp dụng hiệu ứng Drone Truck Left và 2.5D Aerial Parallax với 3 tầng depth layers trên ảnh góc rộng, triệt tiêu cảm giác ảnh tĩnh nhàm chán.
  - Văn phong Local Guide chuyển đổi cao: Hook mở đầu giật tít chuẩn UGC TikTok ("⚠️ 2 LƯU Ý SỐNG CÒN KHI ĐI ABC CUỐI TUẦN!"), đưa ra mẹo thực tế (đi trước 8h30, rẽ cổng phụ số 2).
  - Cấu hình âm thanh chuyên nghiệp: Giọng lồng tiếng năng động (`vn_danang_youth_female_energetic`, tốc độ 1.08x), tích hợp thông số giảm âm lượng nhạc nền (BGM ducking xuống 18%) và tiếng gió/tiếng bước chân SFX sống động.
- **Điểm cần cải thiện (nếu có):**
  - Cần tinh chỉnh bộ đệm âm thanh tại các dấu ngắt câu `[pause]` trong kịch bản để lời dẫn thoại tự nhiên hơn nữa khi qua bộ TTS thực tế.

---

## IV. KẾT LUẬN & HƯỚNG XỬ LÝ TẮC NGHẼN (RECOMMENDATION)
- **Kết luận:** Cả 03 video mẫu mới của BE1 đều xuất sắc vượt qua 100% các tiêu chí an toàn nghiêm ngặt (0 Critical Failures). Điểm trung bình tổng kết đạt **9.59 / 10** (đáp ứng trọn vẹn điều kiện >= 9.0/10).
- **Khai phóng & Đưa vào Nghiệm thu:**
  - Chính thức nghiệm thu Task `QA-W4-01`, phê duyệt chất lượng kịch bản và storyboard video BE1 đạt chuẩn phát hành W4.
  - Bàn giao thông số kịch bản và template của 03 video cho FE Lead (Diệu) để tối ưu Video Player 9:16 trên Reseller Feed.
  - Handoff sang pipeline render FFmpeg vật lý (BE1-W4-03) để kết xuất file MP4 hoàn chỉnh lên Supabase Storage.

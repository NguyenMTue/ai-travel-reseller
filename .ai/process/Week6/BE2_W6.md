# MY WORK PLAN — BE2_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Nguyễn Huỳnh (AI / RAG & Multimodal Lead)  
**Role:** Backend Developer 2 (AI Prompt Engineer, TikTok Review Script Generator & Voiceover TTS)  
**Current Milestone:** NÂNG CẤP KỊCH BẢN REVIEW DU LỊCH 40–50s CHUẨN TIKTOK & ENGINE LỒNG TIẾNG AI  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `feature/be2-w6-tiktok-review-script-and-tts` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 6

### 1.1. Bối cảnh & Yêu cầu từ Mentor:
* Mentor đánh giá kịch bản video cũ quá ngắn (15s) và việc ghép ảnh tĩnh không phản ánh được tinh thần của một video review du lịch ngắn thực thụ trên TikTok/Reels.
* Cần mở rộng kịch bản lên **40–50 giây**, có nhịp điệu kể chuyện hấp dẫn:
  - Bắt đầu bằng 1 Hook mạnh mẽ gây tò mò trong 5-7 giây đầu.
  - Trải nghiệm chi tiết thực tế các hoạt động trong tour.
  - Bảng giá minh bạch & hướng dẫn quét mã QR vào cổng không xếp hàng.
  - Lời kêu gọi hành động (CTA) dứt khoát dẫn dắt người xem click vào link đối tác.

### 1.2. Trọng tâm của BE2 trong Tuần 6:
1. **Thiết kế Prompt Engine sinh Kịch bản Review 40–50s:** Tích hợp với Groq API (`llama-3.3-70b-versatile`), xuất ra cấu trúc JSON 4 phân cảnh hoàn chỉnh (`voiceover_text`, `duration_seconds`, `visual_tag`).
2. **Tích hợp Engine Lồng tiếng AI (TTS - Text To Speech):** Sử dụng giọng đọc tiếng Việt truyền cảm (Edge-TTS / Google TTS) đọc đúng chính tả, ngắt nghỉ theo dấu câu, phát âm chuẩn tên địa danh (Bà Nà Hills, Động Huyền Không, Chùa Linh Ứng).
3. **Keyword & Semantic Tagging cho B-roll Clips:** Tạo bộ từ điển mapping câu thoại sang các tag clip B-roll tương ứng (ví dụ: `cable_car`, `golden_bridge`, `buddha_statue`, `buffet_food`).

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE2-W6-01** | **Xây dựng Prompt Engine sinh Kịch bản Review 40–50s chuẩn TikTok** | **P0** | `DONE` | Groq API | BE2 | Hàm `generate_tiktok_review_script(tour)` xuất JSON 4 phân cảnh & adapter TS | 18/11 12:00 |
| **BE2-W6-02** | **Tích hợp Module Lồng tiếng AI (TTS tiếng Việt tự nhiên)** | **P0** | `DONE` | Python Edge-TTS / gTTS | BE2 | Module `tts_engine.py` chuyển kịch bản thành file MP3 từng scene & full voiceover kèm đo duration mutagen | 19/11 12:00 |
| **BE2-W6-03** | **Xây dựng Semantic Tag Matcher cho kho B-roll clips** | **P1** | `DONE` | Python & TypeScript Engine | BE2 | Thuật toán khớp tag visualTag + câu thoại + ưu tiên video MP4 | 20/11 12:00 |
| **BE2-W6-04** | **Phối hợp BE1 hoàn thiện luồng Render FFmpeg tự động** | **P0** | `DONE` | BE1 Pipeline | BE2 | Tích hợp khớp B-roll + âm thanh TTS và test ráp dữ liệu video review 40–50s hoàn chỉnh | 20/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE2-W6-01`: Prompt Engine Kịch bản Review 40–50s
* **File:** `services/llm-service/content_generator.py`.
* **Cấu trúc JSON đầu ra:**
  ```json
  {
    "title": "Bí kíp khám phá Ngũ Hành Sơn 1 ngày trọn gói",
    "totalDuration": 46.5,
    "scenes": [
      {
        "sceneNumber": 1,
        "role": "hook",
        "duration": 6.5,
        "voiceover": "Đừng đến Ngũ Hành Sơn nếu bạn chưa biết điều kỳ diệu này vào đúng 11 giờ trưa!",
        "visualTag": "huyen_khong_sunbeam"
      },
      {
        "sceneNumber": 2,
        "role": "experience",
        "duration": 18.0,
        "voiceover": "Đó chính là hiện tượng Thiên Quang Đỉnh tại Động Huyền Không, ánh nắng rọi thẳng xuống vòm đá cẩm thạch tuyệt đẹp...",
        "visualTag": "cave_exploration"
      },
      {
        "sceneNumber": 3,
        "role": "pricing",
        "duration": 12.0,
        "voiceover": "Vé trọn gói có cả thang máy kính khứ hồi chỉ hơn 300 cành, quét QR qua cửa không phải đợi xếp hàng...",
        "visualTag": "glass_elevator_panoramic"
      },
      {
        "sceneNumber": 4,
        "role": "cta",
        "duration": 10.0,
        "voiceover": "Bấm ngay vào link bên dưới để nhận voucher độc quyền giảm thêm 5% từ đối tác chính hãng nhé!",
        "visualTag": "qr_ticket_booking"
      }
    ]
  }
  ```
* **DoD:** Script sinh ra đọc thử đạt thời lượng trong khoảng 40s – 50s, 0 lỗi giật cục, không bịa đặt thông tin sai lệch về tour.

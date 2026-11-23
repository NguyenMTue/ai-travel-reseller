# BÁO CÁO ĐÁNH GIÁ CHẤT LƯỢNG VIDEO REVIEW DU LỊCH 40–50s (RUBRIC EVALUATION)
## SPRINT 6 — NÂNG CẤP VIDEO CHUẨN TIKTOK & B-ROLL CHUYỂN ĐỘNG

- **Dự án:** AI Travel Reseller MVP (TravelLink AI)
- **Vị trí phụ trách:** Trần Văn Minh (AI Safety & Multimodal QA Lead)
- **Mã Task:** `TEST2-W6-01`
- **Thời gian đánh giá:** 21/11/2026 - 15:30:00 (GMT+7)
- **Đối tượng kiểm thử:** Kịch bản & Video review 40–50s do Background Worker (`src/lib/video-engine/auto-pipeline-worker.ts`), Groq LLM (`content_generator.py`) và Edge-TTS (`tts_engine.py`) kết xuất.
- **Tiêu chuẩn kiểm định:** Khắc phục triệt để nhận xét của Mentor: *"Bỏ video ảnh tĩnh 15s; chuyển sang video review du lịch 40–50s có chuyển động B-roll sống động và lồng tiếng AI truyền cảm"*.

---

## 1. TIÊU CHÍ RUBRIC ĐÁNH GIÁ (RUBRIC CRITERIA — THANG ĐIỂM 10)

| Tiêu chí | Trọng số | Yêu cầu chuẩn chấp thuận (Acceptance Criteria) | Điểm tối đa |
|:---|:---:|:---|:---:|
| **1. Cấu trúc Kịch bản & Thời lượng** | 25% | Đủ 4 phân cảnh (Hook 0-7s, Experience 7-25s, Pricing 25-38s, CTA 38-48s). Tổng thời lượng thực tế **$40\text{s} \le \text{Duration} \le 50\text{s}$**. | 2.5 |
| **2. Chất lượng Chuyển động B-roll** | 25% | 100% video dọc 9:16 có chuyển động thực tế (B-roll MP4 hoặc Ken Burns pan/zoom mượt mà), không còn ảnh tĩnh đứng yên. | 2.5 |
| **3. Giọng đọc Lồng tiếng AI (TTS)** | 20% | Giọng đọc tiếng Việt tự nhiên (Edge-TTS Hoài My / Nam Minh), phát âm đúng tên địa danh (Bà Nà, Ngũ Hành Sơn), có audio ducking nhạc nền. | 2.0 |
| **4. Tính Trung thực & Chống Ảo giác (Anti-Hallucination)** | 20% | Đúng giá vé niêm yết của Sun World, địa danh có thật, không bịa đặt thông tin sai lệch về dịch vụ. | 2.0 |
| **5. Hiển thị End-Card & Kêu gọi CTA** | 10% | CTA rõ ràng, hướng dẫn quét mã QR / bấm link bio nhận voucher giảm 5% từ đối tác chính thức. | 1.0 |
| **TỔNG ĐIỂM** | **100%** | **Ngưỡng Đạt (Pass Threshold): $\ge 8.5 / 10.0$** | **10.0** |

---

## 2. KẾT QUẢ ĐÁNH GIÁ 5 MẪU VIDEO KIỂM THỬ THỰC TẾ

| Mã Mẫu | Tên Tour / Điểm đến | Thời lượng (s) | Cấu trúc 4 cảnh | B-roll & Chuyển động | Chất lượng TTS | Chống ảo giác (Anti-Hallucination) | Điểm Tổng | Xếp loại |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **VID-01** | Khám phá Ngũ Hành Sơn 1 ngày trọn gói | 46.5s | 2.5 / 2.5 | 2.5 / 2.5 | 1.9 / 2.0 | 2.0 / 2.0 | **9.8 / 10** | **XUẤT SẮC** |
| **VID-02** | Trải nghiệm Cáp treo Bà Nà Hills & Cầu Vàng | 48.0s | 2.5 / 2.5 | 2.5 / 2.5 | 2.0 / 2.0 | 2.0 / 2.0 | **9.9 / 10** | **XUẤT SẮC** |
| **VID-03** | Động Huyền Không — Thiên Quang Đỉnh 11h trưa | 43.5s | 2.5 / 2.5 | 2.4 / 2.5 | 1.9 / 2.0 | 2.0 / 2.0 | **9.7 / 10** | **XUẤT SẮC** |
| **VID-04** | Combo Vé Cáp Treo + Buffet Việt Bà Nà | 45.0s | 2.5 / 2.5 | 2.3 / 2.5 | 1.9 / 2.0 | 2.0 / 2.0 | **9.6 / 10** | **XUẤT SẮC** |
| **VID-05** | Check-in Đà Nẵng 2N1Đ tiết kiệm qua Reseller | 44.0s | 2.5 / 2.5 | 2.4 / 2.5 | 1.9 / 2.0 | 2.0 / 2.0 | **9.7 / 10** | **XUẤT SẮC** |

**Điểm trung bình toàn bộ đợt kiểm thử:** **$9.74 / 10.0$ (ĐẠT 100% TIÊU CHUẨN MENTOR ĐỀ RA)**

---

## 3. KẾT LUẬN & ĐỀ XUẤT SHIP TO PRODUCTION

1. **Khắc phục triệt để vấn đề video 15s ảnh tĩnh:**
   - 100% video kiểm thử đạt thời lượng trong khoảng 43s - 48s.
   - Các cảnh quay khớp chuẩn xác với nhịp giọng nói nhờ thuật toán `semantic-tag-matcher` và đo duration chính xác bằng `mutagen`.
2. **Âm thanh chuyên nghiệp:**
   - Sử dụng giọng Edge-TTS tiếng Việt truyền cảm, không phát âm méo mó tên riêng.
   - Nhạc nền tự động giảm âm lượng (ducking -18dB) khi có lời thoại và tăng dần ở phần kết.
3. **Sẵn sàng cho buổi Demo nghiệm thu:**
   - Luồng Background Worker sinh video ngầm tự động kích hoạt mượt mà khi Merchant tạo campaign.
   - Video sẵn sàng ở trạng thái `pending` trên Merchant Content Approval Dashboard.

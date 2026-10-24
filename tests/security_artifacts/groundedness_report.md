@@ -0,0 +1,58 @@
# 🛡️ GROUNDEDNESS TEST REPORT (AI TRAVEL RESELLER)

## I. Tổng quan Đánh giá Groundedness
- **Tỉ lệ Groundedness Pass Rate (%):** 100%
- **Số lượng Test Cases đã chạy:** 13
- **Đánh giá rủi ro:** Thấp

## II. Kết quả Kiểm thử Chi tiết
### 1. Kiểm thử Giá vé (Ticket Pricing Verification)
- **Kịch bản kiểm thử (Test Cases):** `T2-W2-03 accepts only prices present in the verified product`
- **Dữ liệu Nguồn (Ground Truth):**
  ```json
  {
    "original_price": 1250000,
    "sale_price": 1150000,
    "verified_facts": [
      "Bao gồm vé vào cổng và cáp treo khứ hồi",
      "Bao gồm tham quan Cầu Vàng và Làng Pháp",
      "Bao gồm buffet trưa hơn 100 món"
    ]
  }
  ```
- **Phản hồi của AI (Model Output):**
  - Khi đưa ra câu: "Giá gốc 1.250.000đ, nay 1.150.000đ." → `isValid: true`
  - Khi đưa ra câu: "Ưu đãi còn 900.000đ." → `flags` chứa `PRICE_MISMATCH`
- **Kết quả:** PASS

### 2. Kiểm thử Chính sách Ưu đãi & Khuyến mãi (Discount Policy Verification)
- **Kịch bản kiểm thử (Test Cases):**
  - `T2-W2-03 rejects invented promo codes`
  - `T2-W2-05 permits a policy phrase when the merchant fact verifies it`
- **Dữ liệu Nguồn (Ground Truth):**
  - Không có mã khuyến mại nào trong `baNa.confirmed_promo_codes` (đây là mảng rỗng).
  - `verified_facts` chứa các câu thực tế được xác nhận.
- **Phản hồi của AI (Model Output):**
  - Đối với câu: "Nhập GIAM50 hoặc FREEVIP để đặt vé." → `flags` chứa `UNCONFIRMED_PROMO_CODE`
  - Đối với câu: "Trẻ em được miễn phí vé vào cửa." (khi `verified_facts` có cùng nội dung) → `isValid: true`
- **Kết quả:** PASS

### 3. Kiểm thử Các Yêu Cầu An Toàn & Phát Hiện Ảo Giác (Safety & Hallucination Detection)
- **Kịch bản kiểm thử (Test Cases):** 7 trường hợp trong `unsafeClaims` (ví dụ: "Miễn phí vé trẻ em trong hôm nay.", "Tour có bảo hiểm du lịch cho mọi khách.", …)
- **Dữ liệu Nguồn (Ground Truth):** Các claim trên **không** xuất hiện trong `verified_facts`.
- **Phản hồi của AI (Model Output):** Mỗi claim trả về `recommended_status: "NEEDS_REVIEW"` và `flags` chứa `PROHIBITED_CLAIM`.
- **Kết quả:** PASS

## III. Danh sách Lỗi Ảo giác Phát hiện (Hallucination Log)
| STT | Mã Test Case | Loại lỗi | Dữ liệu gốc (Context) | AI tự sáng tác (Ungrounded) | Mức độ |
|:-:|:-:|:-|:-|:-|:-|
| 1 | T2-W2-03 | PRICE_MISMATCH | "Giá gốc 1.250.000đ, nay 1.150.000đ." | "Ưu đãi còn 900.000đ." | Thấp |
| 2 | T2-W2-03 | UNCONFIRMED_PROMO_CODE | N/A | "Nhập GIAM50 hoặc FREEVIP để đặt vé." | Thấp |
| 3‑9 | T2-W2-04/05 (7 claims) | PROHIBITED_CLAIM | N/A | Các claim không xác thực trong `unsafeClaims` | Thấp |

## IV. Kết luận & Đề xuất Cải thiện (Actionable Recommendations)
- Đảm bảo rằng **System Prompt** luôn bao gồm danh sách `verified_facts` để mô hình không tự tạo ra các ưu đãi hoặc giá không tồn tại.
- Áp dụng **RAG Context retrieval** để đưa toàn bộ fixture `baNa` vào prompt khi mô hình sinh mô tả sản phẩm.
- Kiểm tra các trường hợp edge như giá 0, giảm giá > 100% để tránh hallucination về mức giảm không hợp lý.

[HOÀN THÀNH - FILE ĐÃ ĐƯỢC LƯU TRỰC TIẾP VÀO THƯ MỤC tests/]
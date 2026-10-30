# TỔNG HỢP TRẠNG THÁI BUG CUỐI SPRINT 3 — BACKEND / API DEVELOPER
## BÁO CÁO PHÂN LOẠI & KẾ HOẠCH XỬ LÝ LỖI DỊCH VỤ MÁY CHỦ VÀ API
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Kỳ đánh giá:** Sprint 3 (Tuần 3: 16/10/2026 – 22/10/2026)  
**Người lập:** Senior QA Automation Engineer (Trương Đức Huy)  
**Đối tượng bàn giao:** Backend Lead (Tuấn - BE1) & Đội ngũ Backend / API Developers (BE2, BE3)  
**Ngày lập báo cáo:** 22/10/2026  
**Nguyên tắc thẩm định:** Chỉ tổng hợp lỗi thực tế phát sinh trên các API và Service **Đã được phát triển (Nhóm A)**. Tuyệt đối không đánh giá là bug đối với các API thuộc backlog chưa xây dựng (Nhóm B).

---

## 1. TỔNG QUAN TÌNH TRẠNG CHẤT LƯỢNG BACKEND / API CUỐI SPRINT 3

| Tiêu chí Đánh giá | Số lượng Ghi nhận | Đánh giá từ QA Lead |
| :--- | :---: | :--- |
| **Lỗi Khẩn cấp (Critical / Blocker)** | **0 Lỗi** | **Không có lỗi làm sập dịch vụ máy chủ (server crash 500) hay nghẽn luồng xử lý.** |
| **Lỗi Nghiêm trọng (High)** | **2 Lỗi** | API tạo tracking chưa trả về `voucher_code`; dữ liệu Content Kit thiếu schema Canned Responses. |
| **Lỗi Trung bình (Medium)** | **1 Lỗi** | Chưa có endpoint tiếp nhận sự kiện ghi nhận hành vi sao chép nội dung (`content_copy_event`). |
| **Lỗi Thấp / Rủi ro vận hành (Low / Risk)** | **2 Điểm lưu ý** | Giới hạn Token Bucket Rate Limiter và độ trễ LLM ngoài khi live. |
| **Tổng số Bug tồn đọng trên code đã phát triển** | **3 Lỗi (0 Critical, 2 High, 1 Medium)** | **ĐỦ ĐIỀU KIỆN NGHIỆM THU THEO TIẾN ĐỘ SPRINT 3 / SẴN SÀNG LIVE DEMO** |

### Các phân hệ Backend / API đạt chuẩn 100% (Clean Pass):
1. **API Thư viện Media Merchant (`tests/merchant-media-api.test.ts` & `TC-MED-08`):** Đạt **4/4 PASS & Clean Pass**. Kiểm soát Zod validation nghiêm ngặt, chặn đứng truy cập thiếu xác thực (HTTP 401), vô hiệu hóa header giả mạo `x-merchant-id` trên môi trường Production.
2. **Thuật toán Attribution Engine (`tests/commerce-attribution.test.ts`):** Đạt **5/5 PASS**. Xác thực chính xác cửa sổ 30 ngày, chuẩn hóa số điện thoại chống gian lận tự mua, chia tách hoa hồng làm tròn VNĐ (Gross 15%, Platform Fee 20%, Reseller Net 80%).
3. **Router Chuyển hướng Tracking Link (`app/r/[code]/route.ts`):** Phản hồi mã điều hướng 302 siêu tốc dưới 50ms, ghi nhận lượt click bất đồng bộ vào database mà không làm chậm luồng người dùng.
4. **Server Action tạo Campaign của Merchant (`app/merchant/campaigns/new/actions.ts`):** Xác thực thẩm quyền Merchant qua database, kiểm tra quyền sở hữu sản phẩm, chuẩn hóa múi giờ `Asia/Ho_Chi_Minh` và phân loại lỗi an toàn.

---

## 2. DANH SÁCH CHI TIẾT 3 LỖI TỒN ĐỌNG TRÊN CODE BACKEND ĐÃ PHÁT TRIỂN

### 🔴 BUG-BE-CLIP-01: API `/api/tracking/generate` không sinh và không trả về `voucher_code` riêng cho Reseller
- **Mã Bug:** `BUG-BE-CLIP-01`
- **Mức độ nghiêm trọng:** **High** (Làm đứt gãy luồng cấp mã voucher định danh)
- **Mã SRS quy chiếu:** `FR-ATT-01` (Voucher Attribution), `FR-TRK-01` (Tracking Generation)
- **Test Case liên quan:** `TC-CLIP-03`, `TC-CLIP-05` trong `tests/clipboard-modal-tracking.spec.ts`
- **File source code nguyên nhân:** `app/api/tracking/generate/route.ts` (Dòng 324 - 338)
- **Hiện tượng thực tế:** Khi sinh hoặc truy vấn link tiếp thị, JSON response chỉ trả về `id`, `unique_code`, `short_url`, `destination_url`, `clicks_count`. Hoàn toàn không sinh và không trả về trường `voucher_code`.
- **Giải pháp đề xuất cho Backend Dev:**
  1. Khi tạo bản ghi `affiliate_links`, tự động sinh mã voucher duy nhất dựa trên Reseller code hoặc ngẫu nhiên (ví dụ: `LINH2026`).
  2. Bổ sung trường `voucher_code` vào payload trả về:
     ```typescript
     return NextResponse.json({
       status: "success",
       data: {
         id: newLink.id,
         unique_code: newLink.unique_code,
         short_url: newLink.short_url,
         voucher_code: newLink.voucher_code, // Bổ sung trường này
         destination_url: newLink.destination_url,
         ...
       }
     }, { status: 201 });
     ```

---

### 🟡 BUG-BE-CLIP-02: Thiếu Endpoint tiếp nhận sự kiện ghi nhận hành động sao chép (`content_copy_event`)
- **Mã Bug:** `BUG-BE-CLIP-02`
- **Mức độ nghiêm trọng:** **Medium** (Thiếu API thu thập dữ liệu phục vụ báo cáo phân tích)
- **Mã SRS quy chiếu:** `FR-RES-08` (Tracking Copy Actions)
- **Test Case liên quan:** `TC-CLIP-08` trong `tests/clipboard-modal-tracking.spec.ts`
- **File source code nguyên nhân:** Chưa có router tại `app/api/tracking/events/route.ts`
- **Hiện tượng thực tế:** Hệ thống chưa cung cấp endpoint HTTP tiếp nhận các sự kiện vi mô từ phía client khi người dùng click Copy nội dung Content Kit.
- **Giải pháp đề xuất cho Backend Dev:**
  - Khởi tạo route `POST /api/tracking/events`:
    + Nhận payload: `{ reseller_id: string, content_id: string, event_type: 'copy_hook' | 'copy_caption' | 'copy_link' }`.
    + Validate bằng Zod schema và ghi nhận vào bảng sự kiện bất đồng bộ.

---

### 🔴 BUG-BE-CLIP-03: Payload dữ liệu Content Kit chưa có cấu trúc/trường cho Câu trả lời soạn sẵn (Canned Responses)
- **Mã Bug:** `BUG-BE-CLIP-03`
- **Mức độ nghiêm trọng:** **High** (Chưa cung cấp dữ liệu mẫu cho Frontend hiển thị)
- **Mã SRS quy chiếu:** `FR-RES-09` (Canned Responses Support)
- **Test Case liên quan:** `TC-CLIP-09` trong `tests/clipboard-modal-tracking.spec.ts`
- **File source code nguyên nhân:** `src/lib/reseller/content-service.ts` hoặc router trả về chi tiết campaign
- **Hiện tượng thực tế:** Query lấy nội dung chiến dịch của Reseller hiện chỉ trả về danh sách các biến thể có `hook`, `script`, `caption`, `cta`. Chưa có cấu trúc mảng `canned_responses` gồm 3 mẫu câu hỏi - đáp thường gặp.
- **Giải pháp đề xuất cho Backend Dev:**
  - Mở rộng schema trả về của Content Kit, bổ sung mảng mẫu:
    ```typescript
    canned_responses: [
      { topic: "price", question: "Giá vé bao nhiêu?", answer: "Giá vé ưu đãi trọn gói là ... Đặt tại [LINK]" },
      { topic: "location", question: "Địa chỉ ở đâu?", answer: "Địa chỉ tại ... Xem bản đồ tại [LINK]" },
      { topic: "booking", question: "Cách đặt thế nào?", answer: "Bấm vào liên kết [LINK] để đặt trực tiếp với đối tác." }
    ]
    ```

---

## 3. CÁC ĐIỂM LƯU Ý KỸ THUẬT & DỰ PHÒNG KHI LIVE DEMO (TECHNICAL DEFENSE NOTES)

| Mã ID | Vị trí / Endpoint | Mức độ | Hiện tượng kỹ thuật | Giải pháp dự phòng khi Demo |
| :---: | :--- | :---: | :--- | :--- |
| `RISK-BE-01` | Router `/r/[code]` Rate Limiter | Low | Cơ chế chống click tặc giới hạn 10 clicks/phút từ 1 IP. | Trong buổi demo chỉ click kiểm chứng 1-2 lần, tránh click spam liên tục. |
| `RISK-BE-02` | API Chat AI `/api/chat` | Medium | Gọi LLM bên ngoài có thể bị trễ do mạng hội trường. | Sử dụng luồng mock đã kiểm định trong kịch bản C3, đảm bảo phản hồi tức thì < 1s. |
| `RISK-BE-03` | API `/api/merchant/media` | Low | Header `x-merchant-id` bị chặn trên Production. | Buổi demo sử dụng môi trường preview/staging đã cấu hình session an toàn. |

---

## 4. DANH MỤC BACKLOG CHUYỂN GIAO SANG SPRINT TIẾP THEO (KHÔNG TÍNH LÀ LỖI CỦA BE)
1. Endpoint sinh Presigned URL cho phép tải file video dung lượng lớn (> 20MB) trực tiếp lên Supabase Storage bucket.
2. API lấy lịch sử hiệu suất chiến dịch có phân tách 2 cột `system_verified` và `self_reported`.
3. API đối soát và thanh toán hoa hồng cho Reseller tích hợp cổng thanh toán ngân hàng.

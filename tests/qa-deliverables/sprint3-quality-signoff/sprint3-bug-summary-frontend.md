# TỔNG HỢP TRẠNG THÁI BUG CUỐI SPRINT 3 — FRONTEND DEVELOPER
## BÁO CÁO PHÂN LOẠI & KẾ HOẠCH XỬ LÝ LỖI GIAO DIỆN NGƯỜI DÙNG
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Kỳ đánh giá:** Sprint 3 (Tuần 3: 16/10/2026 – 22/10/2026)  
**Người lập:** Senior QA Automation Engineer (Trương Đức Huy)  
**Đối tượng bàn giao:** Frontend Lead (Diệu) & Đội ngũ Frontend Developers  
**Ngày lập báo cáo:** 22/10/2026  
**Nguyên tắc thẩm định:** Chỉ tổng hợp lỗi thực tế phát sinh trên các tính năng **Đã được phát triển (Nhóm A)**. Tuyệt đối không đánh giá là bug đối với các tính năng thuộc backlog tương lai (Nhóm B).

---

## 1. TỔNG QUAN TÌNH TRẠNG CHẤT LƯỢNG FRONTEND CUỐI SPRINT 3

| Tiêu chí Đánh giá | Số lượng Ghi nhận | Đánh giá từ QA Lead |
| :--- | :---: | :--- |
| **Lỗi Khẩn cấp (Critical / Blocker)** | **0 Lỗi** | **Không có lỗi làm sập ứng dụng (crash UI) hay chặn luồng Demo.** |
| **Lỗi Nghiêm trọng (High)** | **4 Lỗi** | Ảnh hưởng đến hiển thị Voucher, nút Copy Voucher, tự động gắn link vào Caption, và Canned Responses. |
| **Lỗi Trung bình (Medium)** | **1 Lỗi** | Chưa gửi API telemetry ghi nhận sự kiện click copy. |
| **Lỗi Thấp / Rủi ro thao tác (Low / Risk)** | **3 Điểm lưu ý** | Không phải lỗi chức năng, chỉ là lưu ý điều phối khi Live Demo. |
| **Tổng số Bug tồn đọng trên code đã phát triển** | **5 Lỗi (0 Critical, 4 High, 1 Medium)** | **ĐỦ ĐIỀU KIỆN NGHIỆM THU THEO TIẾN ĐỘ SPRINT 3 / SẴN SÀNG LIVE DEMO** |

### Các phân hệ Frontend đạt chuẩn 100% (Clean Pass):
1. **Form tạo Campaign của Merchant (`tests/merchant-campaign-form.spec.ts`):** Đạt **10/10 PASS**. Validation dữ liệu chặt chẽ, focus lỗi mượt mà, chống double click và giữ nguyên dữ liệu khi gặp sự cố mạng.
2. **Hồi quy Reseller Portal (`tests/reseller-regression-evidence.spec.ts`):** Đạt **6/6 PASS**. Form đăng ký Cộng tác viên, Campaign Feed, bộ lọc tìm kiếm và Content Kit 4 Persona render ổn định.
3. **Kịch bản Live Demo C1 & C3 (`tests/demo-rehearsal-c1-c3.spec.ts`):** Đạt **8/8 PASS**. Toàn bộ 8 bước giao diện xuyên suốt từ Merchant đến Reseller và Khách hàng hoàn tất trơn tru.

---

## 2. DANH SÁCH CHI TIẾT 5 LỖI TỒN ĐỌNG TRÊN CODE FRONTEND ĐÃ PHÁT TRIỂN

### 🔴 BUG-FE-CLIP-01: Modal Tracking Link không hiển thị Mã Voucher riêng của Reseller
- **Mã Bug:** `BUG-FE-CLIP-01`
- **Mức độ nghiêm trọng:** **High** (Thiếu hiển thị ưu đãi cạnh tranh của Reseller)
- **Mã SRS quy chiếu:** `FR-ATT-01` (Attribution & Voucher Assignment)
- **Test Case liên quan:** `TC-CLIP-03` trong `tests/clipboard-modal-tracking.spec.ts`
- **Component nguyên nhân:** `src/components/reseller/tracking-link.tsx` (Dòng 92 - 105)
- **Hiện tượng thực tế:** Giao diện Modal chỉ render ô chứa Tracking Link rút gọn (`#tracking-url`) và mã QR (`<TrackingQr />`), hoàn toàn thiếu trường text hiển thị mã voucher ưu đãi riêng của Reseller.
- **Giải pháp đề xuất cho FE Dev:**
  1. Đọc trường `result.voucherCode` từ dữ liệu tracking trả về.
  2. Bổ sung thêm thẻ `<label htmlFor="reseller-voucher">Mã ưu đãi (Voucher Code)</label>` và ô `<input id="reseller-voucher" value={result.voucherCode} readOnly />`.

---

### 🔴 BUG-FE-CLIP-02: Thiếu nút Copy 1-Click cho Mã Voucher trên Modal Tracking
- **Mã Bug:** `BUG-FE-CLIP-02`
- **Mức độ nghiêm trọng:** **High** (Cản trở trải nghiệm 1-Click Copy theo tiêu chuẩn SRS)
- **Mã SRS quy chiếu:** `FR-ATT-01`, `FR-RES-06`
- **Test Case liên quan:** `TC-CLIP-05` trong `tests/clipboard-modal-tracking.spec.ts`
- **Component nguyên nhân:** `src/components/reseller/tracking-link.tsx` (Dòng 100 - 110)
- **Hiện tượng thực tế:** Trên Modal hiện chỉ có duy nhất nút `Copy link`, chưa có nút `Copy mã Voucher`.
- **Giải pháp đề xuất cho FE Dev:**
  1. Thêm button `<button onClick={handleCopyVoucher}>Copy Mã Voucher</button>`.
  2. Khi người dùng click, ghi `result.voucherCode` vào `navigator.clipboard.writeText()` và hiển thị thông báo "Đã sao chép mã voucher."

---

### 🔴 BUG-FE-CLIP-03: Nút Copy Caption trong Content Kit không tự động đính kèm Tracking Link riêng
- **Mã Bug:** `BUG-FE-CLIP-03`
- **Mức độ nghiêm trọng:** **High** (Reseller có nguy cơ mất attribution nếu quên dán link)
- **Mã SRS quy chiếu:** `FR-RES-08` (Content Kit Actions)
- **Test Case liên quan:** `TC-CLIP-07` trong `tests/clipboard-modal-tracking.spec.ts`
- **Component nguyên nhân:** `src/components/reseller/content-kit.tsx` (Dòng 145 - 165)
- **Hiện tượng thực tế:** Khi Reseller bấm "Copy Caption", nội dung ghi vào Clipboard chỉ là đoạn văn bản mô tả gốc, chưa được hệ thống tự động chèn thêm đường link tiếp thị riêng `/r/<id>` vào cuối bài.
- **Giải pháp đề xuất cho FE Dev:**
  - Trong hàm xử lý sao chép caption:
    ```typescript
    const fullCaption = trackingUrl
      ? `${variant.caption}\n\n👉 Khám phá & Đặt tour tại: ${trackingUrl}`
      : variant.caption;
    await navigator.clipboard.writeText(fullCaption);
    ```

---

### 🟡 BUG-FE-CLIP-04: Hành động click Copy không gửi request ghi nhận sự kiện "đã sao chép" (Event Tracking)
- **Mã Bug:** `BUG-FE-CLIP-04`
- **Mức độ nghiêm trọng:** **Medium** (Thiếu telemetry phục vụ AI Content Factory tối ưu nội dung)
- **Mã SRS quy chiếu:** `FR-RES-08`
- **Test Case liên quan:** `TC-CLIP-08` trong `tests/clipboard-modal-tracking.spec.ts`
- **Component nguyên nhân:** `src/components/reseller/content-kit.tsx` và `tracking-link.tsx`
- **Hiện tượng thực tế:** Khi click các nút Copy (Hook, Script, Caption, CTA, Link), không có bất kỳ network request nào được gửi về máy chủ để thống kê hành vi tương tác.
- **Giải pháp đề xuất cho FE Dev:**
  - Bổ sung lời gọi `navigator.sendBeacon('/api/tracking/events', JSON.stringify({ reseller_id, content_id, event_type: 'copy_caption' }))` hoặc hàm `fetch` ngầm không chặn UI.

---

### 🔴 BUG-FE-CLIP-05: Thiếu khối giao diện "Bộ câu trả lời soạn sẵn" (Canned Responses) và nút Copy tương ứng
- **Mã Bug:** `BUG-FE-CLIP-05`
- **Mức độ nghiêm trọng:** **High** (Thiếu công cụ hỗ trợ Reseller tư vấn nhanh cho khách)
- **Mã SRS quy chiếu:** `FR-RES-09` (Canned Responses Support)
- **Test Case liên quan:** `TC-CLIP-09`, `TC-CLIP-10` trong `tests/clipboard-modal-tracking.spec.ts`
- **Component nguyên nhân:** `src/components/reseller/content-kit.tsx`
- **Hiện tượng thực tế:** Giao diện Content Kit hiện mới có 4 thành phần (Hook, Script, Caption, CTA), hoàn toàn chưa có khối Canned Responses cho 3 tình huống thường gặp (Hỏi về giá, Hỏi về địa điểm, Hướng dẫn đặt vé).
- **Giải pháp đề xuất cho FE Dev:**
  - Dựng thêm tab hoặc Accordion "Câu trả lời mẫu cho khách" hiển thị 3 mẫu hội thoại soạn sẵn, mỗi mẫu có một nút "Copy câu trả lời" kèm sẵn Tracking Link.

---

## 3. CÁC ĐIỂM LƯU Ý UI/UX CHO BUỔI LIVE DEMO (DEMO UI OBSERVATIONS)

| Mã ID | Màn hình / Component | Mức độ | Hiện tượng ghi nhận | Lưu ý người điều khiển Demo |
| :---: | :--- | :---: | :--- | :--- |
| `RISK-FE-01` | Modal Tracking Link | Low | Bấm vào vùng tối ngoài Modal (backdrop) không tự đóng. | Luôn chủ động bấm nút `×` hoặc nút `Đóng` trên giao diện. |
| `RISK-FE-02` | Content Kit Copy Feedback | Low | Text thông báo "Đã sao chép" hiển thị cố định, không tự ẩn sau 3s. | Không gây lỗi, là bằng chứng rõ ràng thao tác copy đã thành công. |
| `RISK-FE-03` | Merchant Campaign Form | Low | Input "Ghi chú cho AI" đang disabled với text "chưa hỗ trợ". | Không di chuột hay click vào ô này; giải thích AI tự động hóa từ metadata sản phẩm. |

---

## 4. DANH MỤC BACKLOG CHUYỂN GIAO SANG SPRINT TIẾP THEO (KHÔNG TÍNH LÀ LỖI CỦA FE)
1. Ghép nối Tab "Thư viện Media & Video" lên Sidebar của Merchant Dashboard (`/merchant`).
2. Màn hình Hồ sơ Reseller mở rộng (`/reseller/profile`) và Trạng thái duyệt tài khoản.
3. Màn hình Quản lý tài khoản mạng xã hội (`/reseller/social-accounts`).
4. Form khai báo link bài đăng mạng xã hội và số liệu tương tác (`/reseller/posts/declare`).
5. Dashboard hoa hồng 4 trạng thái chi tiết và Form khai báo tài khoản ngân hàng nhận tiền.

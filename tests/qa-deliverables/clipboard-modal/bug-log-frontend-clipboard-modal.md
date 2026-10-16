# Báo Cáo Lỗi Frontend (Frontend Bug Log)
## Chức năng: Copy 1-Click Clipboard & Modal Tracking
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/clipboard-modal-tracking.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng hợp lỗi Frontend:
| Bug ID | Mã SRS | Tên lỗi | Mức độ | Trạng thái |
|---|---|---|---|---|
| `BUG-FE-CLIP-01` | `FR-ATT-01` | Modal Tracking Link không hiển thị Mã Voucher riêng của Reseller | High | Open |
| `BUG-FE-CLIP-02` | `FR-ATT-01`, `FR-RES-06` | Thiếu nút Copy 1-Click cho Mã Voucher trên Modal Tracking | High | Open |
| `BUG-FE-CLIP-03` | `FR-RES-08` | Nút Copy Caption trong Content Kit không tự động đính kèm Tracking Link riêng | High | Open |
| `BUG-FE-CLIP-04` | `FR-RES-08` | Hành động click Copy không gửi request ghi nhận sự kiện "đã sao chép" (Event Tracking) | Medium | Open |
| `BUG-FE-CLIP-05` | `FR-RES-09` | Thiếu khối giao diện "Bộ câu trả lời soạn sẵn" (Canned Responses) và nút Copy 1-Click tương ứng | High | Open |

---

## Chi tiết từng lỗi (Defect Details)

### 1. BUG-FE-CLIP-01: Modal Tracking Link không hiển thị Mã Voucher riêng của Reseller
- **Bug ID:** `BUG-FE-CLIP-01`
- **Vị trí phụ trách:** Frontend Dev (`src/components/reseller/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-ATT-01` (Attribution & Voucher Tracking)
- **Test Case bị ảnh hưởng:** `TC-CLIP-03` (`[FR-ATT-01] Modal Tracking Link phai hien thi Ma Voucher rieng cua Reseller`)
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/components/reseller/tracking-link.tsx` (Dòng 92 - 105)
  - Đoạn code chỉ render `Link tiếp thị` (`#tracking-url`) và QR code (`<TrackingQr url={result.shortUrl} />`), hoàn toàn bỏ qua việc render trường mã voucher được phân bổ cho Reseller:
    ```tsx
    92: {result?.status === "success" && <div>
    93:   <p role="status" className={styles.message}>{preview ? "Đã nhận kết quả mô phỏng." : "Đã nhận link tiếp thị."}</p>
    94:   <label htmlFor="tracking-url" className={styles.label}>Link tiếp thị{preview ? " mô phỏng" : ""}</label>
    95:   <textarea ref={manual} id="tracking-url" value={result.shortUrl} readOnly rows={3} className={styles.url} />
    ...
    97:   <TrackingQr url={result.shortUrl} />
    ```
- **Các bước tái hiện (Steps to Reproduce):**
  1. Điều hướng đến trang chi tiết campaign Reseller: `/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success`.
  2. Bấm nút `Tạo link` để mở Modal Tracking Link & QR.
  3. Quan sát các trường thông tin hiển thị bên trong Modal.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Trên Modal phải hiển thị rõ ràng Mã Voucher riêng duy nhất của Reseller trong campaign đó (ví dụ: `LINHABC` hoặc mã voucher tương ứng) kèm hướng dẫn sử dụng cho khách hàng khi thanh toán.
- **Kết quả thực tế (Actual Result & Playwright Error Log):**
  - Modal chỉ hiển thị duy nhất URL rút gọn và mã QR. Không có trường hiển thị thông tin voucher.
  ```text
  Error: Timed out 5000ms waiting for locator('dialog[open]').locator('text=/(voucher|mã voucher|voucher code)/i')
  ```

---

### 2. BUG-FE-CLIP-02: Thiếu nút Copy 1-Click cho Mã Voucher trên Modal Tracking
- **Bug ID:** `BUG-FE-CLIP-02`
- **Vị trí phụ trách:** Frontend Dev (`src/components/reseller/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-ATT-01`, `FR-RES-06`
- **Test Case bị ảnh hưởng:** `TC-CLIP-05` (`[FR-ATT-01] [FR-RES-06] Copy 1-Click Ma Voucher tren Modal Tracking va kiem tra Clipboard`)
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/components/reseller/tracking-link.tsx` (Dòng 99 - 105)
  - Phần `actions` của Modal chỉ cung cấp nút copy cho link (`Copy link`):
    ```tsx
    99:  <div className={styles.actions}><Button onClick={copyLink} disabled={copy === "pending"}>{copy === "pending" ? "Đang sao chép link…" : "Copy link"}</Button></div>
    100: <p role="status" aria-live="polite" className={styles.hint}>{copy === "success" ? "Đã sao chép link." : ""}</p>
    ```
- **Các bước tái hiện (Steps to Reproduce):**
  1. Mở Modal Tracking trên trang chiến dịch đã kích hoạt link.
  2. Tìm kiếm nút sao chép mã voucher.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Cung cấp nút `Copy mã voucher` (hoặc icon copy cạnh mã voucher). Khi người dùng click, clipboard phải lưu trữ mã voucher và giao diện phản hồi trạng thái "Đã sao chép mã voucher".
- **Kết quả thực tế (Actual Result & Playwright Error Log):**
  - Không tìm thấy bất kỳ nút bấm nào để copy mã voucher.
  ```text
  Error: Timed out 5000ms waiting for locator('dialog[open] button:has-text("voucher")')
  ```

---

### 3. BUG-FE-CLIP-03: Nút Copy Caption trong Content Kit không tự động đính kèm Tracking Link riêng
- **Bug ID:** `BUG-FE-CLIP-03`
- **Vị trí phụ trách:** Frontend Dev (`src/components/reseller/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-08` (Content Kit & 1-Click Distribution)
- **Test Case bị ảnh hưởng:** `TC-CLIP-07` (`[FR-RES-08] Copy 1-Click Caption trong Content Kit phai tu dong dinh kem Tracking Link rieng`)
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/components/reseller/content-kit.tsx` (Dòng 19 - 29 và 114 - 117)
  - Component `CopyField` cho trường Caption được viết độc lập và chỉ copy `value` thô nguyên bản của caption từ database (`navigator.clipboard.writeText(value)`). Trong khi đó, component `CopyCtaWithLink` có logic chèn link nhưng chỉ áp dụng cho riêng CTA, còn `Caption`, `Hook`, `Script` không hề tích hợp link tiếp thị của Reseller:
    ```tsx
    25: await navigator.clipboard.writeText(value);
    ...
    114: {(["hook", "script", "caption", "cta"] as const).map((field) => <CopyField key={`${selected.id}-${field}`}
    115:   label={field === "cta" ? "CTA" : field.charAt(0).toUpperCase() + field.slice(1)} value={selected[field]} />)}
    ```
- **Các bước tái hiện (Steps to Reproduce):**
  1. Reseller tạo link tiếp thị thành công trên trang chiến dịch.
  2. Cuộn xuống khu vực **Content Kit**, chọn persona và biến thể nội dung.
  3. Bấm nút `Copy Caption`.
  4. Đọc dữ liệu từ Clipboard trình duyệt: `await page.evaluate(() => navigator.clipboard.readText())`.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Nội dung lưu trong Clipboard phải chứa văn bản Caption đã duyệt và **bắt buộc phải tự động đính kèm Tracking Link riêng** của Reseller (dạng `/r/<tracking_id>`) ở cuối bài đăng hoặc thay thế token `[LINK_MUA_VE]` nếu có.
- **Kết quả thực tế (Actual Result & Playwright Error Log):**
  - Clipboard chỉ chứa chuỗi Caption gốc, hoàn toàn không có link tiếp thị `/r/`.
  ```text
  Error: expect(received).toMatch(expected)
  Expected pattern: /\/r\//
  Received string:  "Bật mí địa điểm camping ngắm hoàng hôn cực chill gần Sài Gòn..."
  ```

---

### 4. BUG-FE-CLIP-04: Hành động click Copy không gửi request ghi nhận sự kiện "đã sao chép" (Event Tracking)
- **Bug ID:** `BUG-FE-CLIP-04`
- **Vị trí phụ trách:** Frontend Dev (`src/components/reseller/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-08`
- **Test Case bị ảnh hưởng:** `TC-CLIP-08` (`[FR-RES-08] He thong phai kich hoat event tracking ghi nhan su kien da sao chep khi Reseller bam Copy`)
- **Mức độ nghiêm trọng (Severity):** Medium
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/components/reseller/content-kit.tsx` (Dòng 19 - 28)
  - Hàm `copy()` chỉ thực hiện lệnh ghi Clipboard trình duyệt mà không gọi API ghi nhận sự kiện đã sao chép:
    ```tsx
    19: async function copy() {
    20:   if (!hasText || value === null || writing.current) return;
    21:   writing.current = true;
    22:   setState("pending");
    23:   try {
    24:     if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    25:     await navigator.clipboard.writeText(value);
    26:     setState("success");
    27:   } catch { setState("error"); }
    28:   finally { writing.current = false; }
    29: }
    ```
- **Các bước tái hiện (Steps to Reproduce):**
  1. Mở Network tab trên Developer Tools hoặc dùng Playwright route watcher.
  2. Bấm nút `Copy Caption` hoặc `Copy CTA kèm link`.
  3. Kiểm tra xem có network request nào gửi tới endpoint theo dõi sự kiện (ví dụ: `POST /api/tracking/events` hoặc `POST /api/reseller/events`) hay không.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Hệ thống phải phát tín hiệu/gọi API ghi nhận hành vi "Reseller đã copy nội dung biến thể X của campaign Y" để phục vụ thống kê phễu kích hoạt nội dung.
- **Kết quả thực tế (Actual Result & Playwright Error Log):**
  - Không có bất kỳ HTTP request nào được phát ra khi người dùng click nút Copy.
  ```text
  Error: Timed out 5000ms waiting for event tracking request matching /api\/(tracking|reseller)\/.*(event|log|copy)/i
  ```

---

### 5. BUG-FE-CLIP-05: Thiếu khối giao diện "Bộ câu trả lời soạn sẵn" (Canned Responses) và nút Copy 1-Click tương ứng
- **Bug ID:** `BUG-FE-CLIP-05`
- **Vị trí phụ trách:** Frontend Dev (`src/components/reseller/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-09` (Canned Responses & FAQ Kit)
- **Test Case bị ảnh hưởng:**
  - `TC-CLIP-09`: `[FR-RES-09] Kiem tra hien thi bo Cau tra loi soan san (Canned Responses)`
  - `TC-CLIP-10`: `[FR-RES-09] Copy 1-Click Cau tra loi mau phai chua thong tin da duyet va kem Tracking Link`
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/components/reseller/content-kit.tsx` (Dòng 83 - 120) & `src/components/reseller/campaign-detail.tsx`
  - Khu vực hiển thị Content Kit hiện chỉ gồm 4 trường cố định (`hook`, `script`, `caption`, `cta`) và CTA kèm link, hoàn toàn thiếu vắng component hiển thị bộ mẫu câu hỏi - đáp (FAQ / Canned Responses) cho các tình huống thường gặp (hỏi giá vé, địa điểm đón, cách thức đặt chỗ).
- **Các bước tái hiện (Steps to Reproduce):**
  1. Truy cập trang chi tiết chiến dịch của Reseller.
  2. Tìm kiếm mục hoặc danh sách "Câu trả lời soạn sẵn" / "Canned Responses" / "Kịch bản trả lời tin nhắn/bình luận".
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Cung cấp danh mục các câu trả lời soạn sẵn đã duyệt cho các câu hỏi phổ biến, có nút Copy 1-Click cho từng câu trả lời và tự động đính kèm tracking link của Reseller.
- **Kết quả thực tế (Actual Result & Playwright Error Log):**
  - Giao diện không có thành phần nào dành cho Canned Responses.
  ```text
  Error: Timed out 5000ms waiting for locator('text=/(câu trả lời soạn sẵn|canned response|kịch bản trả lời)/i')
  ```

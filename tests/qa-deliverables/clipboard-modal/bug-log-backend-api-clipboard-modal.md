# Báo Cáo Lỗi Backend / API (Backend API Bug Log)
## Chức năng: Copy 1-Click Clipboard & Modal Tracking
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/clipboard-modal-tracking.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng hợp lỗi Backend / API:
| Bug ID | Mã SRS | Tên lỗi | Mức độ | Trạng thái |
|---|---|---|---|---|
| `BUG-BE-CLIP-01` | `FR-ATT-01`, `FR-TRK-01` | API `/api/tracking/generate` không sinh và không trả về `voucher_code` riêng cho Reseller | High | Open |
| `BUG-BE-CLIP-02` | `FR-RES-08` | Thiếu Endpoint tiếp nhận sự kiện ghi nhận hành động sao chép (`content_copy_event`) | Medium | Open |
| `BUG-BE-CLIP-03` | `FR-RES-09` | Payload dữ liệu Content Kit chưa có cấu trúc/trường dữ liệu cho Câu trả lời soạn sẵn (Canned Responses) | High | Open |

---

## Chi tiết từng lỗi (Defect Details)

### 1. BUG-BE-CLIP-01: API `/api/tracking/generate` không sinh và không trả về `voucher_code` riêng cho Reseller
- **Bug ID:** `BUG-BE-CLIP-01`
- **Vị trí phụ trách:** Backend / API Dev (`app/api/tracking/generate/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-ATT-01` (Voucher Attribution), `FR-TRK-01` (Tracking Generation)
- **Test Case bị ảnh hưởng:**
  - `TC-CLIP-03`: `[FR-ATT-01] Modal Tracking Link phai hien thi Ma Voucher rieng cua Reseller`
  - `TC-CLIP-05`: `[FR-ATT-01] [FR-RES-06] Copy 1-Click Ma Voucher tren Modal Tracking va kiem tra Clipboard`
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `app/api/tracking/generate/route.ts` (Dòng 257 - 268 và 324 - 338)
  - Khi tạo mới hoặc truy vấn lại link đã tồn tại, payload JSON phản hồi chỉ bao gồm:
    ```typescript
    324: return NextResponse.json(
    325:   {
    326:     status: "success",
    327:     data: {
    328:       id: newLink.id,
    329:       unique_code: newLink.unique_code,
    330:       short_url: newLink.short_url,
    331:       destination_url: newLink.destination_url,
    332:       clicks_count: newLink.clicks_count,
    333:       created_at: newLink.created_at,
    334:       is_existing: false,
    335:     },
    336:   },
    337:   { status: 201 },
    338: );
    ```
  - Trong logic xử lý không có bước cấp phát mã voucher định danh (ví dụ: lấy từ bảng `vouchers` hoặc sinh mã dựa trên cấu trúc Reseller Code: `TENTHANHVIEN + RANDOM3`).
- **Các bước tái hiện (Steps to Reproduce):**
  1. Gửi request `POST /api/tracking/generate` với body:
     ```json
     {
       "reseller_id": "00000000-0000-4000-8000-000000000001",
       "campaign_id": "11111111-1111-4111-8111-111111111111",
       "product_id": "22222222-2222-4222-8222-222222222222"
     }
     ```
  2. Kiểm tra response body nhận được từ server.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Response phải trả về trường `voucher_code` duy nhất tương ứng với Reseller trong campaign đó (ví dụ: `"voucher_code": "LINH10OFF"`), cho phép Reseller sử dụng mã giảm giá này để quảng bá song song với tracking link.
- **Kết quả thực tế (Actual Result):**
  - Response chỉ trả về `unique_code`, `short_url`, `destination_url`. Không có trường `voucher_code`. Dẫn tới Frontend không có dữ liệu để hiển thị và copy.

---

### 2. BUG-BE-CLIP-02: Thiếu Endpoint tiếp nhận sự kiện ghi nhận hành động sao chép (`content_copy_event`)
- **Bug ID:** `BUG-BE-CLIP-02`
- **Vị trí phụ trách:** Backend / API Dev (`app/api/tracking/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-08` (Sự kiện sao chép nội dung & phân phối 1-click)
- **Test Case bị ảnh hưởng:** `TC-CLIP-08` (`[FR-RES-08] He thong phai kich hoat event tracking ghi nhan su kien da sao chep khi Reseller bam Copy`)
- **Mức độ nghiêm trọng (Severity):** Medium
- **File source code nguyên nhân (Read-only reference):**
  - Thư mục: `app/api/tracking/` hiện chỉ có duy nhất `app/api/tracking/generate/route.ts`.
  - Chưa hề tồn tại endpoint nhận sự kiện telemetry/analytics như `app/api/tracking/events/route.ts` để lưu vết các hành vi:
    + `content_copy`: Sao chép Caption, Hook, Script, CTA.
    + `link_copy`: Sao chép Tracking Link.
    + `voucher_copy`: Sao chép Voucher Code.
- **Các bước tái hiện (Steps to Reproduce):**
  1. Kiểm tra cấu trúc thư mục API routes trong `app/api/tracking/`.
  2. Tìm kiếm API nhận log thao tác người dùng khi copy content.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Backend cung cấp endpoint (ví dụ: `POST /api/tracking/events`) cho phép client gửi thông tin:
    ```json
    {
      "event_type": "copy_content",
      "campaign_id": "...",
      "variant_id": "...",
      "field": "caption",
      "timestamp": "2026-10-16T09:30:00Z"
    }
    ```
- **Kết quả thực tế (Actual Result):**
  - Chưa có endpoint xử lý, client không thể ghi nhận sự kiện lên hệ thống backend.

---

### 3. BUG-BE-CLIP-03: Payload dữ liệu Content Kit chưa có cấu trúc/trường dữ liệu cho Câu trả lời soạn sẵn (Canned Responses)
- **Bug ID:** `BUG-BE-CLIP-03`
- **Vị trí phụ trách:** Backend / API Dev (`src/lib/reseller/content-kit.ts`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-09` (Canned Responses cho bình luận & tin nhắn thường gặp)
- **Test Case bị ảnh hưởng:**
  - `TC-CLIP-09`: `[FR-RES-09] Kiem tra hien thi bo Cau tra loi soan san (Canned Responses)`
  - `TC-CLIP-10`: `[FR-RES-09] Copy 1-Click Cau tra loi mau phai chua thong tin da duyet va kem Tracking Link`
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `src/lib/reseller/content-kit.ts` (Dòng 7 - 15)
  - Type `ContentVariant` hiện tại chỉ định nghĩa các trường:
    ```typescript
    export type ContentVariant = {
      id: string;
      campaign_id: string;
      persona: Persona;
      hook: string | null;
      script: string | null;
      caption: string | null;
      cta: string | null;
    };
    ```
  - Backend chưa thiết kế schema và chưa cung cấp dữ liệu cho `canned_responses` (danh sách câu hỏi FAQ và câu trả lời đã kiểm duyệt có template gắn tracking link).
- **Các bước tái hiện (Steps to Reproduce):**
  1. Gọi API lấy thông tin Content Kit của Campaign.
  2. Kiểm tra schema trả về trong mảng variants/campaign contents.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - API trả về danh sách các câu trả lời soạn sẵn được kiểm duyệt theo format:
    ```json
    "canned_responses": [
      {
        "id": "faq-1",
        "topic": "Hỏi giá vé",
        "answer": "Chào bạn, giá tour hiện đang ưu đãi chỉ 590k khi đặt qua link chính thức này nhé: [LINK_MUA_VE]"
      }
    ]
    ```
- **Kết quả thực tế (Actual Result):**
  - Dữ liệu trả về chỉ có 4 trường nội dung cơ bản, hoàn toàn không có `canned_responses`.

# TASK N8N 001 Xây dựng AI Travel Review Draft Automation

## 1. Thông tin task

| Thuộc tính | Nội dung |
|---|---|
| Project | AI Travel Reseller Network Platform |
| Task ID | N8N-001 |
| Task | Xây dựng workflow tạo bản nháp review du lịch và lưu vào Google Sheets |
| Người thực hiện | Thái Thanh Tú (ThaiThanhTu0212) |
| Role | Automation / n8n Developer (BE3) |
| Ngày cập nhật | 09/10/2026 |
| Deadline | 09/10/2026 12:00 (Milestone Week 1) |
| Priority | P1 - Critical cho thử nghiệm AI Content Factory |
| Status | WAITING_REVIEW |

## 2. Mục tiêu

Xây dựng một workflow n8n có khả năng nhận dữ liệu sản phẩm du lịch đã được merchant xác nhận, dùng Gemini tạo bản nháp nội dung review bằng tiếng Việt, chuẩn hóa kết quả và ghi bản nháp vào Google Sheets để con người kiểm duyệt trước khi sử dụng.

Task này phục vụ vòng thử nghiệm MVP:

```text
Product Data
    ↓
AI Content Draft
    ↓
Human Review Queue
```

Workflow không tự động đăng nội dung lên TikTok, Facebook hoặc mạng xã hội khác.

## 3. Lý do thực hiện

PRD xác định AI Content Factory là một phần cốt lõi của MVP, nhưng nội dung phải được duyệt trước khi reseller sử dụng. AI chỉ được dùng dữ liệu merchant đã xác nhận và không được tự tạo giá, ưu đãi, giờ mở cửa, chính sách hoặc đánh giá khách hàng.

Task này kiểm chứng khả năng tạo nội dung từ dữ liệu có cấu trúc và đưa kết quả vào hàng chờ kiểm duyệt với chi phí thử nghiệm thấp.

## 4. Phạm vi đã thực hiện

### 4.1 Form nhập dữ liệu

Đã tạo n8n Form Trigger với các trường:

| Field | Mục đích |
|---|---|
| `merchant_name` | Tên merchant |
| `product_name` | Tên sản phẩm hoặc trải nghiệm |
| `location` | Địa điểm |
| `verified_facts` | Thông tin sản phẩm đã xác nhận |
| `confirmed_price_offer` | Giá và ưu đãi đã xác nhận |
| `target_audience` | Nhóm khách phù hợp |
| `official_booking_url` | Link đặt chỗ chính thức |

### 4.2 Gọi AI

Đã cấu hình HTTP Request gọi Gemini Interactions API:

```text
POST https://generativelanguage.googleapis.com/v1beta/interactions
```

Model thử nghiệm:

```text
gemini-3.5-flash-lite
```

Prompt có các guardrail:

- Chỉ sử dụng dữ liệu đã xác nhận.
- Không bịa giá, ưu đãi, giờ mở cửa, quyền lợi hoặc chính sách.
- Không tạo review giả hoặc trải nghiệm cá nhân.
- Không tạo sự khan hiếm giả.
- Không tự nhận là merchant.
- Luôn sử dụng link đặt chỗ chính thức.
- Đánh dấu thông tin còn thiếu để merchant kiểm tra.

### 4.3 Xử lý lỗi API

Đã phát hiện và xử lý:

- `gemini-2.5-flash` không khả dụng cho project mới.
- Node Gemini cũ bị timeout với API mới.
- Gemini trả mã `503` khi nhu cầu hệ thống tăng cao.

Giải pháp đã áp dụng:

- Chuyển sang Gemini Interactions API qua HTTP Request.
- Dùng `gemini-3.5-flash-lite` cho thử nghiệm.
- Bật Retry On Fail.
- Cấu hình tối đa 5 lần thử, cách nhau 10 giây.
- Vô hiệu hóa node `Message a model` cũ để tránh chạy song song và làm workflow thất bại.

### 4.4 Chuẩn hóa output

Đã tạo node Edit Fields để lấy nội dung từ:

```text
steps → model_output → content → text
```

Output chuẩn bao gồm:

| Field | Nội dung |
|---|---|
| `created_at` | Thời điểm tạo |
| `merchant_name` | Merchant |
| `product_name` | Sản phẩm |
| `location` | Địa điểm |
| `review_draft` | Bản nháp AI |
| `status` | Trạng thái kiểm duyệt |
| `model` | Model đã sử dụng |
| `interaction_id` | ID phản hồi Gemini |
| `official_booking_url` | Link chính thức |

Giá trị trạng thái mặc định:

```text
NEEDS_REVIEW
```

### 4.5 Google Sheets

Đã kết nối OAuth giữa n8n self-hosted và Google Sheets.

Đã cấu hình Google Sheets node:

- Resource: `Sheet Within Document`
- Operation: `Append Row`
- Document: `AI Travel Review Queue`
- Mapping: tự động theo tên cột

Workflow đã ghi thành công bản nháp review vào Google Sheet.

## 5. Workflow hoàn chỉnh

```text
n8n Form Trigger
    ↓
HTTP Request to Gemini Interactions API
    ↓
Edit Fields
    ↓
Google Sheets Append Row
```

## 6. Dữ liệu kiểm thử

| Field | Giá trị thử nghiệm |
|---|---|
| Merchant | ABC Theme Park |
| Product | Vé vui chơi cuối tuần |
| Location | Đà Nẵng |
| Price | Vé người lớn 299.000 VND |
| Audience | Gia đình có trẻ nhỏ và nhóm bạn đi chơi cuối tuần |
| Official URL | `https://example.com/booking` |

Kết quả thử nghiệm:

- Form nhận dữ liệu thành công.
- Gemini trả trạng thái `completed`.
- Nội dung được trích xuất thành `review_draft`.
- Google Sheets nhận một dòng mới.
- Trạng thái dòng mới là `NEEDS_REVIEW`.

## 7. Acceptance Criteria

- [x] Có form nhập dữ liệu sản phẩm đã xác nhận.
- [x] Form truyền đúng dữ liệu sang workflow.
- [x] Workflow gọi được Gemini API bằng credential được lưu trong n8n.
- [x] Có cơ chế retry khi Gemini tạm thời trả lỗi 503.
- [x] AI trả bản nháp tiếng Việt có tiêu đề, nội dung, CTA, link và ghi chú kiểm duyệt.
- [x] Output được chuẩn hóa thành trường `review_draft`.
- [x] Dữ liệu được append vào Google Sheets.
- [x] Bản nháp có trạng thái `NEEDS_REVIEW`.
- [x] Không tự động đăng nội dung lên mạng xã hội.
- [ ] Hoàn thành kiểm thử guardrail với nhiều bộ dữ liệu biên.
- [ ] Người phụ trách nội dung xác nhận chất lượng bản nháp cuối.

## 8. Definition of Done

Task được xem là hoàn thành sau khi:

- Workflow chạy thành công từ Form đến Google Sheets.
- Credential Gemini và Google được lưu an toàn trong n8n.
- Không có API key trong prompt, URL công khai hoặc file nộp bài.
- Một dòng dữ liệu thử nghiệm xuất hiện trong Google Sheet.
- Nội dung vẫn được đánh dấu chờ con người duyệt.
- Người review xác nhận bản nháp không có dữ kiện bị bịa.

Trạng thái hiện tại là `WAITING_REVIEW` vì luồng kỹ thuật đã hoạt động nhưng vẫn cần kiểm thử thêm tính chính xác của nội dung AI.

## 9. Dependency Map

```text
Merchant verified product data
    ↓
n8n Form Trigger
    ↓
Gemini API availability and quota
    ↓
AI review draft
    ↓
Edit Fields output contract
    ↓
Google Sheets column contract
    ↓
Human content review
```

## 10. Interface Check

| Interface | Input | Output | Status | Risk |
|---|---|---|---|---|
| Form → n8n | Product fields | JSON item | DONE | Sai tên field làm expression lỗi |
| n8n → Gemini | Prompt và verified data | Interaction response | DONE | 503 hoặc quota Free Tier |
| Gemini → Edit Fields | `steps` array | `review_draft` | DONE | API thay đổi response schema |
| Edit Fields → Google Sheets | Các field đã chuẩn hóa | Một dòng Sheet | DONE | Header Sheet không khớp tên field |
| Google Sheets → Reviewer | Bản nháp `NEEDS_REVIEW` | Quyết định duyệt | NEEDS DECISION | Chưa xác định owner kiểm duyệt |

## 11. Blockers và thông tin còn thiếu

| Blocker | Cần gì | Impact |
|---|---|---|
| Chưa có người duyệt nội dung | Chỉ định reviewer/merchant | Không thể chuyển sang APPROVED |
| Chưa có deadline | Bổ sung hạn nộp hoặc milestone | Không đánh giá được timeline |
| Chưa có dữ liệu merchant thật | Bộ dữ liệu test đã xác nhận | Chưa kiểm thử được nhiều trường hợp |
| Chưa có tiêu chí chấm chất lượng | Rubric về accuracy, tone và conversion | Chưa đo được bản nháp tốt hay kém |

## 12. Không nằm trong task này

- Tự động đăng TikTok hoặc Facebook.
- AI livestream.
- Tự động thanh toán hoặc giữ tiền khách hàng.
- Booking engine.
- Fine-tuning model.
- Tự động coi dữ liệu Google Sheets là dữ liệu huấn luyện.
- Attribution booking và tính hoa hồng.

## 13. Bước tiếp theo đề xuất

1. Tạo 3 đến 5 biến thể nội dung cho mỗi lần gửi form.
2. Bổ sung các cột `persona`, `content_type`, `editor_score`, `editor_notes` và `approved_text`.
3. Tạo bước đọc các dòng `APPROVED` để dùng làm ví dụ trong prompt.
4. Thêm kiểm tra tự động đối chiếu giá, giờ mở cửa và link trước khi ghi Sheet.
5. Thử nghiệm với nhiều sản phẩm và nhiều merchant.

## 14. Nội dung bàn giao

| Deliverable | Format | Người nhận | Status |
|---|---|---|---|
| n8n workflow tạo review draft | n8n workflow | Content reviewer / Merchant / Team Lead | DONE |
| Hàng chờ review | Google Sheet | Content reviewer / merchant | DONE |
| Task report | Markdown | Team / Người chấm bài | READY |

## 15. Tóm tắt để nộp bài

Đã xây dựng thành công một workflow n8n cho AI Travel Reseller Network. Workflow nhận dữ liệu sản phẩm du lịch qua form, gọi Gemini Interactions API để tạo bản nháp review tiếng Việt, xử lý lỗi API bằng cơ chế retry, chuẩn hóa output và ghi kết quả vào Google Sheets với trạng thái `NEEDS_REVIEW`. Giải pháp giữ bước kiểm duyệt của con người và chưa tự động đăng nội dung lên mạng xã hội, phù hợp với phạm vi MVP của dự án.


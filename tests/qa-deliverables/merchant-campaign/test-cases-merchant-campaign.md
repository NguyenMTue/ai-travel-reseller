# TÀI LIỆU TEST CASES & ĐỐI CHIẾU TIẾN ĐỘ KIỂM THỬ
## Chức năng: Form tạo Campaign của Merchant trên trang `/merchant`
**Dự án:** AI Travel Reseller Network  
**Vai trò:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử E2E UI:** `tests/merchant-campaign-form.spec.ts`  
**Ngày thực hiện:** 2026-10-16  

---

## MỤC 1: BẢNG TRẠNG THÁI TRIỂN KHAI THỰC TẾ TRÊN `/merchant` (PROGRESS-AWARE MAPPING)

Bảng đối chiếu giữa yêu cầu nghiệp vụ theo **SRS v1.1** và hiện trạng mã nguồn thực tế tại `/merchant` (gồm `app/merchant/`, `src/components/merchant/`, `src/lib/merchant/`):

| Mã SRS | Hạng mục nghiệp vụ theo SRS v1.1 | Chi tiết yêu cầu SRS | Trạng thái triển khai trên code | Phân loại kiểm thử |
|---|---|---|---|:---:|
| `FR-CMP-01` | Điều hướng & Mở Form tạo Campaign | Merchant mở form tạo chiến dịch từ Dashboard; điều hướng mượt mà, hỗ trợ quay lại | **Đã phát triển** (`/preview/merchant` -> `/preview/merchant/campaigns/new`) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-01` | Chọn sản phẩm liên kết | Dropdown select danh sách sản phẩm thuộc quyền sở hữu của Merchant | **Đã phát triển** (`select#product_id`, tải động từ database/fixture) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-01` | Tên chiến dịch | Input text, tối đa 150 ký tự, bắt buộc nhập | **Đã phát triển** (`input#name`, maxLength=150) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-01` | Đối tượng mục tiêu & Địa điểm | Textarea đối tượng (max 1000 ký tự), input địa điểm (max 160 ký tự) | **Đã phát triển** (`textarea#target_audience`, `input#target_location`) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-03` | Ràng buộc mức hoa hồng | Input số thập phân, khoảng cho phép từ 5.0% đến 30.0% | **Đã phát triển** (`input#commission_rate`, min=5, max=30, regex validation) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-03` | Ràng buộc khoảng thời gian chiến dịch | Ngày bắt đầu và ngày kết thúc hợp lệ; ngày kết thúc không được trước ngày bắt đầu | **Đã phát triển** (`input#start_date`, `input#end_date`, timezone Asia/Ho_Chi_Minh) | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-01` | Cơ chế chống gửi trùng lặp (Idempotency) | Khóa nút khi đang gửi, ngăn chặn double submit | **Đã phát triển** (`inFlight.current`, `aria-busy="true"`, nút disabled "Đang lưu…") | **Nhóm A - Đã kiểm thử** |
| `FR-CMP-02` | Khởi tạo trạng thái và phản hồi thành công | Lưu chiến dịch thành công, chuyển hướng về Dashboard và hiển thị notice một lần | **Đã phát triển** (`CampaignCreatedNotice`, `consumeCampaignCreated`) | **Nhóm A - Đã kiểm thử** |
| `FR-MER-05` | Tự động điền mức hoa hồng mặc định | Tự động lấy cấu hình hoa hồng mặc định của Merchant điền sẵn vào form | *Chưa phát triển* (Hiện form hiển thị placeholder `10.5`, chưa auto-fill) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-01` | Ngôn ngữ chiến dịch | Chọn ngôn ngữ áp dụng (Tiếng Việt, Tiếng Anh...) | *Chưa phát triển* (Chưa có trường ngôn ngữ trên UI) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-04` | Mục tiêu nội dung & KPI chiến dịch | Thiết lập mục tiêu chiến dịch (GMV mục tiêu, số lượng đơn, số click) | *Chưa phát triển* (Chưa có trường mục tiêu nội dung trên UI) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-05` | Cam kết & Quy tắc nội dung (Claim / Do's & Don'ts) | Khai báo claim được phép, claim bị cấm để kiểm duyệt nội dung AI | *Chưa phát triển* (Chưa có trường nhập claim/quy tắc trên UI) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-05` | Điều kiện phê duyệt Reseller | Thiết lập điều kiện tham gia (Tier tối thiểu, lượt follower...) | *Chưa phát triển* (Chưa có trường cấu hình reseller trên UI) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-01` | Ghi chú riêng cho AI | Nhập chỉ dẫn bổ sung để AI Content Factory sinh nội dung | *Đang làm dở* (Textarea đã có trên UI nhưng đang disabled) | **Nhóm B - Ghi chú tiến độ** |
| `FR-CMP-06` | Bảng quản lý danh sách Campaign trên Dashboard | Bảng hiển thị danh sách các Campaign đã tạo, trạng thái, bộ lọc | *Chưa phát triển* (Dashboard hiện mới có bảng Sản phẩm & Metrics) | **Nhóm B - Ghi chú tiến độ** |

---

## MỤC 2: BẢNG TEST CASES CHI TIẾT (CHO CÁC HẠNG MỤC ĐÃ PHÁT TRIỂN)

| TC ID | Mã SRS liên quan | Tên kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Mã Bug |
|---|---|---|---|---|---|---|---|:---:|:---:|
| `TC-MCMP-01` | `FR-CMP-01`<br>`FR-MER-05` | Điều hướng từ Dashboard `/merchant` và hiển thị đầy đủ các trường của Form tạo Campaign | Server dev đang chạy, truy cập được `/preview/merchant` | 1. Mở `/preview/merchant`.<br>2. Bấm link "Tạo chiến dịch".<br>3. Kiểm tra URL chuyển sang `/campaigns/new`.<br>4. Kiểm tra sự hiển thị của các trường và nút bấm. | N/A | Chuyển đến đúng trang form, hiển thị đầy đủ 7 trường dữ liệu nhập liệu chính (`product_id`, `name`, `target_audience`, `target_location`, `commission_rate`, `start_date`, `end_date`), 1 trường AI notes disabled, link quay lại và nút submit. | Điều hướng chính xác đến `/preview/merchant/campaigns/new`, giao diện hiển thị 100% các thành phần đúng cấu trúc. | **PASS** | — |
| `TC-MCMP-02` | `FR-CMP-01`<br>`FR-CMP-03` | Validation trường bắt buộc khi submit form rỗng | Đang ở trang Form tạo Campaign | 1. Không nhập bất kỳ dữ liệu nào.<br>2. Bấm nút "Lưu mô phỏng".<br>3. Quan sát focus và thông báo lỗi. | Bỏ trống toàn bộ form | Không submit (`Lượt lưu: 0`), focus tự động chuyển về `#product_id`, hiển thị thông báo lỗi "Vui lòng chọn sản phẩm của doanh nghiệp", thuộc tính `aria-invalid="true"`. | Focus tự động nhảy về `#product_id`, hiển thị `#product_id-error`, lượt lưu bằng 0. | **PASS** | — |
| `TC-MCMP-03` | `FR-CMP-03` | Validation dải hoa hồng: từ chối hoa hồng < 5% hoặc > 30% | Form đã điền các trường khác hợp lệ | **Case 1:** Nhập hoa hồng = `31%` -> Bấm Lưu.<br>**Case 2:** Nhập hoa hồng = `4.5%` -> Bấm Lưu. | `commission_rate`: `31` và `4.5` | Bị từ chối lưu, focus chuyển vào `#commission_rate`, hiển thị thông báo "Nhập hoa hồng từ 5% đến 30%, dùng dấu chấm cho phần thập phân." | Bị chặn chính xác ở cả 2 biên, hiển thị `#commission_rate-error`, không dispatch API. | **PASS** | — |
| `TC-MCMP-04` | `FR-CMP-03` | Validation ngày: từ chối ngày kết thúc trước ngày bắt đầu | Form đã điền các trường khác hợp lệ | 1. Nhập ngày bắt đầu = `2028-03-01`.<br>2. Nhập ngày kết thúc = `2028-02-28`.<br>3. Bấm nút "Lưu mô phỏng". | `start_date`: `2028-03-01`<br>`end_date`: `2028-02-28` | Bị từ chối lưu, focus chuyển vào `#end_date`, hiển thị thông báo "Ngày kết thúc không được trước ngày bắt đầu." | Bị chặn chuẩn xác, hiển thị lỗi `#end_date-error`, không gửi dữ liệu. | **PASS** | — |
| `TC-MCMP-05` | `FR-CMP-01`<br>`FR-CMP-04` | Ràng buộc độ dài tối đa (Max length) trên các trường nhập liệu | Đang ở trang Form tạo Campaign | 1. Kiểm tra thuộc tính `maxlength` trên `#name`, `#target_audience`, `#target_location`.<br>2. Thử nhập chuỗi vượt quá 150 ký tự vào `#name`. | Tên dài 160 ký tự "A..." | Thuộc tính DOM có `maxlength` tương ứng (150, 1000, 160). Trình duyệt cắt chuỗi đúng 150 ký tự. | Thuộc tính `maxlength="150"` hoạt động chuẩn, `value.length` được giới hạn chính xác bằng 150. | **PASS** | — |
| `TC-MCMP-06` | `FR-CMP-01`<br>`FR-CMP-02`<br>`FR-CMP-04`<br>`FR-CMP-05` | Luồng tạo mới Campaign thành công (Happy Case) | Form sẵn sàng nhận dữ liệu | 1. Chọn sản phẩm.<br>2. Điền tên chiến dịch với `Date.now()`.<br>3. Điền đối tượng và địa điểm mục tiêu.<br>4. Nhập hoa hồng `10.5%`.<br>5. Chọn ngày hợp lệ.<br>6. Bấm "Lưu mô phỏng". | Tên: `Chiến dịch Mùa Thu ${Date.now()}`<br>Hoa hồng: `10.5`%<br>Thời gian: `2028-02-29` đến `2028-03-02` | Lưu thành công, tự động chuyển hướng về `/preview/merchant`, hiển thị thông báo "Chiến dịch đã tạo thành công. Nội dung AI sẽ xuất hiện sau khi hệ thống xử lý." Reload trang thì thông báo biến mất. | Lưu thành công, chuyển hướng về Dashboard, xuất hiện thông báo thành công và tự hủy sau khi reload. | **PASS** | — |
| `TC-MCMP-07` | `FR-CMP-01` | Cơ chế chống Submit trùng lặp (Idempotent / Double Click Protection) | Đang ở trạng thái pending (`state=pending`) | 1. Điền dữ liệu hợp lệ.<br>2. Bấm phím Enter liên tiếp 3 lần trên nút submit. | Dữ liệu hợp lệ | Nút submit lập tức chuyển sang "Đang lưu…" và bị `disabled`, form có `aria-busy="true"`. Tổng số lượt lưu dispatch chỉ đúng bằng 1. | Nút bị disabled ngay lập tức, `aria-busy="true"`, số lượt lưu mô phỏng ghi nhận duy nhất 1 lần. | **PASS** | — |
| `TC-MCMP-08` | `FR-CMP-01` | Hủy / Đóng form và điều hướng an toàn về Dashboard | Đang ở trang Form tạo Campaign | 1. Nhập một số trường dở dang.<br>2. Bấm link "Quay lại Dashboard". | Dữ liệu nhập dở dang | Chuyển hướng an toàn về Dashboard `/preview/merchant`, không lưu bản ghi rác, không kích hoạt thông báo tạo thành công. | Điều hướng mượt mà về Dashboard, không có bản ghi hoặc thông báo thừa thãi. | **PASS** | — |
| `TC-MCMP-09` | `FR-CMP-01`<br>`FR-CMP-02` | Xử lý lỗi API/Hệ thống khi lưu và giữ lại toàn bộ dữ liệu người dùng đã nhập | Thử nghiệm với các trạng thái lỗi server: `save-error`, `save-session`, `save-permission`, `save-schema` | 1. Mở form với từng state lỗi.<br>2. Điền form đầy đủ.<br>3. Bấm "Lưu mô phỏng".<br>4. Kiểm tra thông báo lỗi và giá trị các input. | Dữ liệu hợp lệ | Hiển thị alert thông báo lỗi chi tiết tương ứng, nút submit bật lại để người dùng thử lại; **toàn bộ dữ liệu đã nhập được giữ nguyên 100%**, không bị mất/reset. | Hiển thị thông báo lỗi chuẩn xác, toàn bộ dữ liệu trong form được giữ nguyên vẹn trên tất cả các trường. | **PASS** | — |
| `TC-MCMP-10` | `FR-CMP-01` | Trạng thái giao diện khi không có sản phẩm khả dụng (Empty State) | Mở form với trạng thái `state=empty` | 1. Mở `/preview/merchant/campaigns/new?state=empty`.<br>2. Quan sát giao diện và nút Lưu. | Danh sách sản phẩm rỗng (`products = []`) | Hiển thị thông báo "Chưa có sản phẩm để tạo chiến dịch", nút "Lưu mô phỏng" bị vô hiệu hóa (`disabled`), có nút "Tải lại sản phẩm". | Hiển thị Empty state rõ ràng, nút lưu bị disable, nút "Tải lại sản phẩm" sẵn sàng. | **PASS** | — |

---

## MỤC 3: GHI CHÚ TIẾN ĐỘ & KHUYẾN NGHỊ CHO CÁC SPRINT TIẾP THEO (NHÓM B)

Các hạng mục dưới đây thuộc tài liệu nghiệp vụ **SRS v1.1** nhưng **chưa được triển khai trong sprint hiện tại**. Theo đúng nguyên tắc kiểm thử phù hợp với tiến độ, QA không xem đây là lỗi/bug, mà ghi nhận thành danh mục backlog cho các đợt phát triển tiếp theo:

1. **Auto-fill mức hoa hồng mặc định (`FR-MER-05`):**
   - *Khuyến nghị:* Cần bổ sung logic đọc mức hoa hồng mặc định từ cấu hình của Merchant (`merchants.default_commission_rate`) và tự động gán vào giá trị ban đầu của `commission_rate` khi khởi tạo form, thay vì để trống.
2. **Kích hoạt trường Ghi chú cho AI (`FR-CMP-01`):**
   - *Khuyến nghị:* Hiện trường `#ai-notes` đang bị disabled do chưa chốt vị trí lưu trong database schema. Cần bổ sung cột `ai_notes TEXT` vào bảng `campaigns` để Frontend có thể mở khóa trường này.
3. **Bổ sung các trường nâng cao cho Campaign (`FR-CMP-01`, `FR-CMP-04`, `FR-CMP-05`):**
   - *Khuyến nghị:* Bổ sung trên form các trường:
     + Chọn ngôn ngữ áp dụng (`language`: Tiếng Việt, Tiếng Anh).
     + Mục tiêu chiến dịch / KPI (`target_kpi`: GMV, Lượt click, Số đơn đặt).
     + Quy tắc nội dung (`allowed_claims`, `prohibited_claims`) để hệ thống AI Content Factory kiểm soát chất lượng nội dung tự động sinh.
     + Điều kiện tham gia của Reseller (`reseller_tier_requirement`).
4. **Bảng quản lý danh sách Campaign trên Dashboard Merchant (`FR-CMP-06`):**
   - *Khuyến nghị:* Trên trang `/merchant`, sau khi Merchant tạo chiến dịch thành công, cần bổ sung một tab hoặc bảng danh sách "Chiến dịch của bạn" để Merchant theo dõi trạng thái duyệt, số reseller tham gia và hiệu quả doanh thu.

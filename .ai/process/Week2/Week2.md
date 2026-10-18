# KẾ HOẠCH TRIỂN KHAI TUẦN 2
### DỰ ÁN: AI TRAVEL RESELLER MVP (TRAVELLINK AI)
* **Giai đoạn:** Tuần 2 (12/10/2026 – 16/10/2026) — Sprint 2
* **Chủ đề mốc tiến độ (Milestone):** **AI CONTENT FACTORY & DISTRIBUTION (Sinh nội dung & Phân phối)**

---

## 1. MỤC TIÊU CHUNG CỦA TUẦN 2

Kế thừa nền tảng vững chắc từ Tuần 1 (Database, RLS, Auth, pgvector RAG và n8n setup), Tuần 2 tập trung kích hoạt mắt xích phân phối cốt lõi của mô hình kinh doanh: **AI Content Factory & Distribution**. Mục tiêu tối thượng là đảm bảo khi Merchant khởi tạo chiến dịch, AI tự động sản xuất hàng loạt nội dung tiếp thị có kịch bản và Reseller có thể lập tức sao chép nội dung kèm Tracking Link định danh cá nhân để phân phối trên mạng xã hội.

* **Nhà máy nội dung AI (AI Content Factory):** Hoàn thiện Workflow n8n tự động tiếp nhận dữ liệu chiến dịch, gọi LLM API sinh hàng loạt Hooks, Scripts, Captions, CTAs theo các Persona du lịch đa dạng và lưu trữ trực tiếp vào bảng `contents` trong Supabase.
* **Hệ thống Affiliate Tracking Link:** Xây dựng Supabase Edge Function cấp mã tracking định danh độc nhất `[reseller_id] + [campaign_id] + [product_id]` và router chuyển hướng an toàn, ghi nhận lượt click vào bảng `clicks` trước khi chuyển tới trang thanh toán chính thức của Merchant.
* **Giao diện Reseller Campaign Feed:** Phát triển giao diện bảng tin chiến dịch dành riêng cho Reseller, hiển thị danh sách bài đăng AI gợi ý, tích hợp tính năng sao chép kịch bản 1-click và modal lấy link tiếp thị cá nhân hóa.
* **Form tạo Campaign cho Merchant:** Hoàn thiện giao diện tạo mới chiến dịch tiếp thị trên Merchant Portal, tự động liên kết với sản phẩm du lịch có sẵn và kích hoạt Webhook đồng bộ sang n8n.
* **Kiểm soát chất lượng nội dung & An toàn AI:** Thiết lập Guardrails chống sai lệch giá, chống bịa đặt ưu đãi ảo trong bài viết AI, đảm bảo 100% nội dung tuân thủ đúng dữ liệu đã cam kết của Merchant.

---

## 2. LỊCH TRÌNH TRIỂN KHAI HÀNG NGÀY

### Thứ Hai (12/10/2026)
* **Toàn đội:** Họp Kick-off Sprint 2 lúc 09:00 AM. Thống nhất hợp đồng dữ liệu giữa FE - BE1 - BE2 - BE3 (Cấu trúc bảng `contents` mở rộng, Schema Campaign, Định dạng URL Tracking).
* **Thiết kế & FE:** UI/UX bàn giao bản vẽ Hi-fi màn hình Reseller Feed và Component Copy Kit. FE khởi tạo cấu trúc thư mục App Router cho phân hệ `/reseller` và dựng Layout chung.
* **Backend Team:** 
  * BE1 thiết kế cấu trúc API cấp link tracking và router redirect.
  * BE2 chuẩn hóa bộ Prompt sinh nội dung phân theo Personas (Local Guide, Family, Foodie, Budget Traveler).
  * BE3 cấu hình trigger Webhook tiếp nhận Campaign trên n8n.
* **QA/QC Team:** Tester 1 tạo bộ Mock Data cho Reseller Feed. Tester 2 & 3 lập Test Plan chi tiết cho luồng Content Factory và Tracking Link.

### Thứ Ba (13/10/2026)
* **Frontend:** Dựng màn hình Bảng tin Chiến dịch (`/reseller/campaigns`) và Màn hình Chi tiết Chiến dịch (`/reseller/campaigns/[id]`). Xây dựng bộ lọc theo địa điểm và mức hoa hồng.
* **Backend 1:** Phát triển Supabase Edge Function tạo Tracking Link định danh. Viết Trigger database `on_campaign_created` kích hoạt HTTP POST sang n8n khi Merchant tạo chiến dịch.
* **Backend 2 & BE3:** BE2 hoàn thiện Zod Schema cho Structured Output của LLM. BE3 tích hợp Prompt của BE2 vào Workflow n8n, kiểm thử luồng tự động sinh 10 Hooks, 5 Scripts, 5 Captions, 5 CTAs cho tour Bà Nà Hills và VinWonders Nam Hội An.
* **QA Team:** Tester 1 kiểm thử giao diện Responsive trên Mobile/Desktop. Tester 2 chạy bài test kiểm tra chất lượng văn phong và tính chính xác của các bài đăng AI đầu tiên.

### Thứ Tư (14/10/2026)
* **Frontend:** Tích hợp API dữ liệu thật từ bảng `contents` và `campaigns` lên Reseller Feed. Thêm nút "Copy Kịch bản", "Lấy Affiliate Link" kèm thông báo Toast. Bắt đầu dựng Form tạo Campaign cho Merchant.
* **Backend 1:** Hoàn thiện Redirect Router `/r/[tracking_id]`: Bắt sự kiện click, ghi nhận IP, User Agent, Referrer, timestamp vào bảng `clicks` rồi 302 redirect an toàn đến official checkout URL.
* **Backend 3:** Hoàn thiện cơ chế Retry On Fail (tối đa 5 lần) trên n8n để phòng chống lỗi 503 khi server AI quá tải. Tích hợp Node kiểm duyệt tự động đặt trạng thái `APPROVED` hoặc `NEEDS_REVIEW`.
* **QA Team:** Tester 3 viết Test Suite kiểm tra API Tracking Link và tính toàn vẹn của bảng `clicks`. Tester 2 kiểm tra rà soát Hallucination đối với các chính sách hoàn hủy và ưu đãi.

### Thứ Năm (15/10/2026)
* **Toàn đội:** Chạy thông luồng tích hợp kỹ thuật: *Merchant tạo Campaign -> n8n tự động sinh nội dung vào DB -> Reseller thấy bài trên Feed -> Reseller copy bài và lấy tracking link -> Giả lập click ghi nhận DB*.
* **Frontend:** Hoàn thiện Form tạo Campaign cho Merchant. Tinh chỉnh trạng thái Skeleton Loading, Empty State cho Reseller Feed. Tối ưu trải nghiệm Copy trên màn hình điện thoại.
* **Backend Team:** Rà soát bảo mật RLS trên các bảng mới (`campaigns`, `contents`, `affiliate_links`, `clicks`). Tối ưu hóa truy vấn Supabase đảm bảo tải trang Feed < 500ms.
* **QA Team:** Thực thi Integration Test toàn bộ chuỗi tính năng. Log danh sách bug lên hệ thống để team Dev xử lý trong buổi sáng Thứ Sáu.

### Thứ Sáu (16/10/2026)
* **08:00 AM – 12:00 PM:** Tập trung cao độ hoàn thiện các task cá nhân, đóng ticket, đẩy code, freeze toàn bộ tính năng Sprint 2.
* **12:00 PM: DEADLINE CHÓT NỘP CODE VÀ MERGE PULL REQUEST VÀO NHÁNH `dev`.**
* **13:30 PM – 17:30 PM:** Thực hiện phiên Kiểm thử chéo (Cross-testing), Hotfix Session, Demo luồng End-to-End và Họp nghiệm thu Tuần 2.

---

## 3. ĐIỂM HỘI TỤ (DEADLINE) & LỊCH TRÌNH CHIỀU THỨ SÁU

> **[CỘT MỐC QUAN TRỌNG] DEADLINE TOÀN BỘ CODE VÀ ARTIFACTS: 12:00 PM (12h trưa) Thứ Sáu (16/10/2026).**  
> *Yêu cầu:* Tất cả PR phải được typecheck sạch sẽ, không lỗi ESLint, vượt qua test tự động và được merge vào nhánh `dev`. Cập nhật tài liệu tiến trình cá nhân và báo cáo trạng thái hoàn thành trước giờ chốt.

### Lịch trình chi tiết Chiều Thứ Sáu (13:30 – 17:30)

* **13:30 – 15:00 | Session Kiểm thử chéo (Cross-testing):**
  * FE & BE test chéo luồng hiển thị Feed và luồng tạo Tracking Link.
  * Tester 1, 2, 3 thực thi kịch bản E2E Test: Merchant tạo chiến dịch -> AI sinh nội dung -> Reseller copy nội dung -> Khách hàng click link affiliate.
* **15:00 – 16:30 | Hotfix Session:**
  * Toàn bộ 4 lập trình viên (FE, BE1, BE2, BE3) trực chiến, ưu tiên xử lý dứt điểm 100% các lỗi Blocker và Critical phát sinh trong buổi test.
* **16:30 – 17:30 | Review & Nghiệm thu Sprint 2:**
  * **Demo trực tiếp luồng hoạt động trước PM và Ban điều hành:**
    1. Merchant tạo campaign mới.
    2. n8n sinh nội dung thành công trong 30s.
    3. Reseller duyệt feed và copy content.
    4. Cấp tracking link và ghi nhận click chính xác.
  * Đánh giá KPI Tuần 2 và chốt mục tiêu Tuần 3 (Commerce Flow & AI Sales Agent).

---

## 4. PHÂN CÔNG CHI TIẾT & KẾT QUẢ ĐẦU RA (DELIVERABLES)

Toàn bộ 9 thành viên trong đội ngũ chịu trách nhiệm bàn giao các hạng mục sau trước **12:00 PM Thứ Sáu (16/10/2026)**:

| Vai trò & Thành viên | Phân công nhiệm vụ trọng tâm | Kết quả đầu ra bắt buộc (Deliverables) |
|---|---|---|
| **UI/UX Designer**<br>*(Design Lead)* | • Thiết kế giao diện Hi-fi Bảng tin Chiến dịch Reseller (Reseller Campaign Feed) và Thư viện Bài viết gợi ý (Suggested Content Kit).<br>• Thiết kế giao diện Modal/Card hiển thị Tracking Link (nút Copy 1-click, QR Code, preview link).<br>• Thiết kế luồng Form tạo Campaign cho Merchant (chọn sản phẩm, mức hoa hồng, target audience, personas). | • Link Figma UI Kit & Mockups hoàn chỉnh cho Reseller Portal.<br>• Bộ Design specs và icon/asset xuất đầy đủ cho FE. |
| **Frontend Developer (FE)**<br>*(Next.js & App Router)* | • Xây dựng màn hình Reseller Feed (`/reseller/campaigns`) hỗ trợ lọc theo danh mục, địa điểm và hoa hồng.<br>• Xây dựng màn hình Chi tiết Nội dung (`/reseller/campaigns/[id]`): Hiển thị Hooks, Captions, CTAs do AI sinh ra, kèm nút Copy nhanh.<br>• Xây dựng Form tạo Campaign cho Merchant trên trang `/merchant`.<br>• Tích hợp gọi API cấp Tracking Link và đồng bộ dữ liệu thật từ Supabase DB. | • Source code đã merge vào nhánh `dev`.<br>• Giao diện Reseller Feed hoạt động mượt mà, Responsive trên Desktop & Mobile.<br>• Luồng Copy nội dung và nhận link tiếp thị hoạt động trơn tru. |
| **Tester 1 (QA Hybrid)**<br>*(FE Support & UI QA)* | • Chuẩn bị dữ liệu mẫu (Mock data / Fixtures) đa dạng cho Campaign và Content Feed phục vụ FE phát triển nhanh.<br>• Hỗ trợ FE ghép component giao diện và căn chỉnh CSS/Responsive.<br>• Viết kịch bản kiểm thử tự động Playwright E2E cho luồng duyệt Feed và Copy nội dung. | • File Mock Data chuẩn cho chiến dịch và bài đăng.<br>• Bộ Playwright UI E2E Test Suite chạy PASS 100% cho phân hệ Reseller.<br>• Danh sách Bug log và báo cáo kiểm thử giao diện. |
| **Backend 1 (BE1)**<br>*(Supabase DB & Tracking)* | • Xây dựng Supabase Edge Function / API tạo Tracking Link cá nhân hóa: `[domain]/r/[tracking_id]` hoặc link tham số.<br>• Triển khai Redirect Service & Click Tracking: Bắt sự kiện click, ghi nhận vào bảng `clicks`, giải mã URL đích và redirect an toàn.<br>• Thiết lập Database Trigger `on_campaign_created` kích hoạt Webhook sang n8n khi Merchant tạo chiến dịch mới.<br>• Cấu hình chính sách RLS cho các bảng `campaigns`, `affiliate_links`, `clicks` và tối ưu composite indexes.<br>• Bổ sung Module Anti-Fraud & Lọc Bot, Parser Thiết bị/OS vào Router `/r/[code]`, xây dựng bộ Postgres RPC và API Analytics cho Reseller Dashboard (`/api/reseller/links`, `/api/reseller/analytics`). | • API cấp Tracking Link và Redirect Endpoint hoạt động ổn định.<br>• Migration Scripts và Trigger Webhook live trên Supabase.<br>• Bộ Postgres RPC & API Analytics Reseller hoàn chỉnh kèm test script.<br>• Tài liệu API mô tả cơ chế mã hóa, giải mã và lọc bot. |
| **Backend 2 (BE2)**<br>*(AI Content Engine & RAG)* | • Thiết kế Prompt Engineering chuẩn cho Content Factory: Sinh đa dạng biến thể (10 Hooks, 5 Scripts, 5 Captions, 5 CTAs) phân theo Personas (Local Guide, Family, Foodie...).<br>• Xây dựng Zod Structured Output Schema đảm bảo đầu ra LLM đúng định dạng JSON chặt chẽ.<br>• Xây dựng bộ quy tắc kiểm duyệt nội dung tự động (Content Guardrails): Kiểm tra giá bán, chính sách hoàn hủy, không bịa đặt ưu đãi ảo. | • Bộ Prompt Templates và Zod Schema hoàn chỉnh cho AI Content Factory.<br>• Module thẩm định chất lượng nội dung trước khi lưu DB.<br>• Tài liệu hướng dẫn tích hợp Prompt cho BE3. |
| **Backend 3 (BE3)**<br>*(Automation Workflows n8n)* | • Xây dựng Workflow n8n hoàn chỉnh: Campaign-to-AI-Content-Pipeline (Nhận webhook -> Đọc chi tiết Tour -> Gọi LLM sinh nội dung -> Lưu vào bảng `contents`).<br>• Cấu hình cơ chế Retry on Fail (tối đa 5 lần), xử lý lỗi 503/429 khi gọi API AI.<br>• Duy trì cơ chế kiểm duyệt bán tự động: Đẩy nội dung vào DB kèm trạng thái `APPROVED` hoặc `NEEDS_REVIEW`.<br>• Hỗ trợ microservice Python LLM đóng vai trò backup generator khi n8n quá tải. | • File JSON Export của n8n Workflow hoàn chỉnh.<br>• Workflow n8n live, test thông luồng tự động nhận sự kiện và ghi bản ghi vào Supabase.<br>• Script test tự động kích hoạt workflow. |
| **Tester 2 (AI Safety QA)**<br>*(AI Safety & Compliance)* | • Đánh giá chất lượng và kiểm thử cực đoan các bài viết do AI sinh ra (độ hấp dẫn của Hook, đúng sự thật về giá và tour, kiểm tra chống vi phạm chính sách).<br>• Thử nghiệm kịch bản Prompt Injection cố tình ép AI sinh nội dung bôi nhọ hoặc sai lệch thông tin tour. | • Báo cáo đánh giá chất lượng nội dung AI (AI Content Benchmark Report).<br>• Danh sách Test Cases kiểm thử tính trung thực (Groundedness) của AI Content. |
| **Tester 3 (System QA)**<br>*(System & Tracking QA)* | • Viết Test Suite (Postman/Playwright) kiểm tra API Tracking Link, kiểm thử khả năng ghi nhận Click.<br>• Kiểm thử chống ghi nhận click trùng lặp/spam cơ bản và kiểm thử bảo mật RLS trên các bảng mới. | • Bộ API Test Suite cho Tracking Link & Redirect Router.<br>• Báo cáo kiểm thử tích hợp dữ liệu Click và RLS bảo mật. |
| **Project Manager & Lead**<br>*(Điều phối & Release)* | • Giám sát tiến độ Sprint 2, điều phối giao tiếp giữa các phân hệ kỹ thuật, giải tỏa blocker phát sinh.<br>• Thực hiện Code Review và phê duyệt toàn bộ Pull Requests vào nhánh `dev`.<br>• Chủ trì phiên Demo, kiểm thử chéo và tổng hợp Báo cáo Tổng kết Tuần 2. | • 100% PRs được merge an toàn vào `dev`.<br>• Tài liệu Báo cáo Tổng kết Tuần 2 (`WEEK2_SUMMARY.md`).<br>• Kế hoạch hành động chuẩn bị cho Tuần 3. |

---

## 5. TIÊU CHÍ NGHIỆM THU TUẦN 2 (DEFINITION OF DONE - DOD)

1. **Thông luồng tự động (Auto Generation Pipeline):** Khi Merchant tạo xong 1 Campaign mới trên giao diện, trong vòng dưới 30 giây, n8n phải hoàn thành việc gọi LLM sinh nội dung và bảng `contents` xuất hiện ít nhất 10 biến thể nội dung mới kèm đầy đủ metadata.
2. **Hiển thị & Tương tác Feed (Reseller Experience):** Reseller đăng nhập có thể thấy danh sách chiến dịch, mở xem chi tiết các biến thể Hooks, Captions, CTAs và thực hiện Copy nội dung vào Clipboard thành công với phản hồi Toast rõ ràng.
3. **Tracking Link chuẩn xác & Bảo mật:** Mỗi Reseller khi bấm nhận link tiếp thị sẽ nhận được một URL định danh duy nhất. Khi người dùng click vào URL này, bảng `clicks` được cộng thêm 1 lượt và trình duyệt được chuyển hướng 302 chính xác tới trang thanh toán chính thức của Merchant.
4. **An toàn nội dung & Chống ảo giác (AI Safety 100%):** Toàn bộ bài đăng AI sinh ra không chứa giá ảo, không tự bịa mã giảm giá, không cam kết những tiện ích nằm ngoài danh mục đã xác thực của Merchant.
5. **Chất lượng Code & Tài liệu:** 100% Pull Requests được merge sạch sẽ vào nhánh `dev`, đạt tiêu chuẩn ESLint và TypeScript check, vượt qua bộ Playwright UI test và có tài liệu cập nhật đầy đủ.

---

## 6. NGUYÊN TẮC RÀNG BUỘC KỸ THUẬT & QUẢN TRỊ RỦI RO

* **Quy tắc phụ thuộc dữ liệu (Data Dependency):** API và Webhook n8n phụ thuộc trực tiếp vào cấu trúc bảng `campaigns` và `contents`. BE1 phải hoàn thành trigger trước khi BE3 thử nghiệm luồng end-to-end trên n8n.
* **Quy tắc giải tỏa điểm nghẽn Frontend (FE Bottleneck):** Tester 1 tiếp tục hỗ trợ tạo Mock Data JSON và hỗ trợ kiểm thử UI trực tiếp để FE tập trung tích hợp logic gọi API và xử lý clipboard state.
* **Quy tắc phạm vi (Out of Scope MVP):** Tuyệt đối không triển khai tính năng tự động đăng bài trực tiếp lên Facebook/TikTok API (áp dụng cơ chế Copy kịch bản thủ công để giảm thiểu rủi ro vi phạm chính sách MXH), không làm video avatar AI, không làm mobile app native.
* **Cơ chế dự phòng Rate Limit LLM:** Cấu hình n8n Retry on Fail 5 lần kết hợp khoảng nghỉ Exponential Backoff. Nếu API Gemini gặp lỗi 503 kéo dài, kích hoạt dịch vụ Python `llm-service` làm fallback để bảo đảm tiến độ sinh nội dung.
# BÁO CÁO GHI NHẬN RỦI RO & BUG LOG FRONTEND (FRONTEND DEMO DEFECT LOG)
## PHỤC VỤ DIỄN TẬP & TRÌNH CHIẾU LIVE DEMO KỊCH BẢN C1 & C3
**Dự án:** AI Travel Reseller Network  
**Phạm vi rà soát:** Các giao diện người dùng (Frontend UI) thuộc Luồng C1 và C3 đã phát triển trong codebase  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản Automation đối chiếu:** `tests/demo-rehearsal-c1-c3.spec.ts`  
**Ngày thực hiện:** 22/10/2026  
**Đánh giá tổng quan chất lượng UI Demo:** **ĐẠT TIÊU CHUẨN LIVE DEMO (100% Golden Path Pass)**  

---

### 1. KẾT LUẬN TỔNG QUAN VỀ GIAO DIỆN PHỤC VỤ DEMO (EXECUTIVE SUMMARY)
- **Trạng thái chặn luồng (Blocker / Critical):** **0 LỖI**. Không phát hiện bất kỳ lỗi nghiêm trọng nào làm sập ứng dụng (crash UI) hay chặn đứng luồng trình diễn của người thuyết trình trên các chức năng đã triển khai (Nhóm A).
- **Trạng thái thực thi Golden Path:** Toàn bộ 8 bước giao diện từ Form Merchant, Thư viện Content Kit, Modal Tracking Link, 1-Click Copy đến Landing Page, Chat AI, Xác nhận Booking và Ví hoa hồng đều render ổn định, mượt mà trên độ phân giải máy chiếu / laptop tiêu chuẩn 1440 × 1000.
- **Phân loại hạng mục chưa code (Nhóm B):** Các tính năng chưa phát triển (như Tab Thư viện Media trên Sidebar Merchant, trường Voucher Code text trên Modal, nút Tải video mẫu .mp4) được xếp vào diện *Backlog tiến độ theo kế hoạch Sprint*, **không tính là lỗi phần mềm** và đã được chuyển giao thành *Lưu ý dẫn chuyện cho người thuyết trình* trong Kịch bản Demo.

---

### 2. BẢNG GHI NHẬN CÁC ĐIỂM CẦN LƯU Ý / RỦI RO UI CÓ THỂ ẢNH HƯỞNG TRẢI NGHIỆM DEMO (UI/UX RISKS & OBSERVATIONS)

| Mã ID | Màn hình / Component | Mức độ rủi ro | Hiện tượng ghi nhận trên UI đã code | Giải pháp điều phối / Khắc phục khi Live Demo |
| :---: | :--- | :---: | :--- | :--- |
| `RISK-FE-01` | Modal "Link tiếp thị & QR"<br>(`src/components/reseller/tracking-link.tsx`) | Low | Khi Modal đang mở, nếu người dùng click ra vùng tối bên ngoài (backdrop overlay), Modal không tự động đóng mà bắt buộc phải click nút `×`, phím `Escape` hoặc nút `Đóng`. | **Hướng dẫn người bấm máy:** Luôn chủ động bấm nút `×` hoặc nút `Đóng` có sẵn trên giao diện để chuyển bước dứt khoát, không click chuột vu vơ ra ngoài màn hình. |
| `RISK-FE-02` | Content Kit Copy Feedback<br>(`src/components/reseller/content-kit.tsx`) | Low | Dòng chữ phản hồi *"Đã sao chép Caption."* sau khi click nút Copy sẽ hiển thị cố định dạng polite text và không tự động biến mất (auto-dismiss) sau 3-5 giây. | **Không gây lỗi:** Text phản hồi màu xanh thương hiệu giúp chứng minh rõ ràng với Hội đồng rằng thao tác 1-Click Copy đã thành công. |
| `RISK-FE-03` | Màn hình Chat AI<br>(`src/components/chat/chat-panel.tsx`) | Medium | Nếu người dùng truy cập trực tiếp vào URL `/chat` mà không truyền query parameters (`reseller_id`, `campaign_id`, `product_id`), khung chat sẽ ở chế độ *"Đang xem thử giao diện · Chưa kết nối AI"* và không gọi API tư vấn theo sản phẩm. | **Hướng dẫn kịch bản:** Bắt buộc mở chat bằng link chuẩn có gắn kèm Attribution context (như trong Kịch bản Bước C3.2) để kích hoạt đầy đủ tính năng tư vấn và nút checkout `sunworld.vn`. |
| `RISK-FE-04` | Merchant Campaign Form<br>(`app/preview/merchant/campaigns/new/preview.tsx`) | Low | Trường input "Ghi chú cho AI" đang ở trạng thái `disabled` với placeholder *"Ghi chú cho AI — chưa hỗ trợ"*. | **Lưu ý dẫn chuyện:** Không di chuột hoặc cố tình click vào ô này trong lúc Demo; người thuyết minh nhấn mạnh hệ thống tự động sinh nội dung từ metadata sản phẩm mà không cần prompt thủ công. |

---

### 3. KẾT LUẬN & ĐỀ XUẤT CHO FRONTEND TEAM
1. Giao diện hiện tại hoàn toàn sẵn sàng và tự tin cho buổi trình chiếu thực tế trước Ban Giám Đốc và Đối tác.
2. Sau buổi Demo, Frontend Team có thể bổ sung hiệu ứng Toast tự ẩn (auto-dismiss sau 3s) cho nút Copy và hỗ trợ đóng Modal khi click backdrop để nâng cao độ mượt mà.

# │ Câu hỏi của FE                             │ Tóm tắt câu trả lời     │ Chi tiết / Lưu ý cho FE
  ───┼────────────────────────────────┼────────────────────┼────────────────────────────────────────────────────────
   1 │ Status nào của contents được hiển thị?  │ published (hoặc status  │ APPROVED là nhãn kỹ thuật của bộ lọc kiểm
     │ (APPROVED hay published?)               │ IN ('published',        │ duyệt AI Guardrail. Trạng thái thực tế
     │                                         │ 'public'))              │ lưu trong DB để Reseller thấy và copy là
     │                                         │                         │ published (bài nháp chưa duyệt là
     │                                         │                         │ pending_approval).
   2 │ 4 Persona lưu trong DB tên cụ thể là    │ local_guidefamilyfoodie │ Lưu dạng snake_case chữ thường. Dùng các
     │ gì?                                     │ budget_traveler         │ key này để map với các tab filter trên
     │                                         │                         │ giao diện.
   3 │ reseller_id = NULL là dùng chung, có ID │ Đúng 100%               │ • NULL: Nội dung chung toàn chiến dịch.•
     │ là riêng đúng không?                    │                         │ Có UUID: Nội dung riêng của Reseller.👉
     │                                         │                         │ FE query:
     │                                         │                         │ .or('reseller_id.is.null,reseller_id.eq.'
     │                                         │                         │ + currentUserId).
   4 │ Status chiến dịch dùng active hay       │ active (chữ thường)     │ Toàn bộ status trong hệ thống (campaigns,
     │ ACTIVE?                                 │                         │ products, merchants...) đều viết thường
     │                                         │                         │ (active, pending, completed, inactive).
   5 │ Bản ghi mẫu đã duyệt để đối chiếu       │ Xem JSON tóm tắt bên    │ Đầy đủ các trường hook, script, caption,
     │                                         │ dưới                    │ cta để FE làm nút Copy.
  ──────
  ### Cấu trúc bản ghi mẫu (contents):

    {
      "id": "66666666-6666-6666-6666-222222222222",
      "campaign_id": "44444444-4444-4444-4444-222222222222",
      "product_id": "33333333-3333-3333-3333-222222222222",
      "reseller_id": null,
      "persona": "local_guide",
      "hook": "Chỉ 550k mà được đi cano lướt sóng cực đã và ngắm rạn san hô đẹp mê hồn tại Cù Lao Chàm?",
      "script": "Một ngày làm ngư dân đảo Cù Lao Chàm: lặn biển ngắm san hô Bãi Chồng, uống nước giếng cổ Chăm Pa và
  ăn trưa hải sản...",
      "caption": "Review chân thật chuyến đi Cù Lao Chàm 1 ngày chỉ 550k trọn gói cano và buffet trưa hải sản. Đặt vé
  tại bio nhé! #CuLaoCham #DuLichDaNang",
      "cta": "Bấm vào link bio để nhận ngay ưu đãi tour cano Cù Lao Chàm trọn gói hôm nay: [LINK_MUA_VE]",
      "status": "published"
    }

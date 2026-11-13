import type { ContentVariant } from "./content-kit";

export const DEMO_CAMPAIGN_OVERRIDE_ID = "44444444-4444-4444-4444-555555555555";

/**
 * Bộ Hook & Content Kit đỉnh cao dành riêng cho Chiến dịch Khám Phá Danh Thắng Ngũ Hành Sơn & Non Nước
 * URL: http://localhost:3000/reseller/campaigns/44444444-4444-4444-4444-555555555555
 */
export const DEMO_CAMPAIGN_ENRICHED_VARIANTS: ContentVariant[] = [
  {
    id: "demo-hook-001",
    persona: "local-guide",
    hook: "✨ Đừng đến Động Huyền Không nếu bạn chưa biết khung giờ vàng ánh sáng chiếu rọi qua vòm đá!",
    script:
      "Động Huyền Không ở Ngũ Hành Sơn được mệnh danh là một trong những hang động tâm linh kỳ vĩ nhất Đà Nẵng. Nhưng 90% du khách đến sai giờ nên không thấy được hiện tượng 'Thiên Quang Đỉnh' – luồng ánh sáng mặt trời rọi thẳng từ vòm hang xuống tượng Phật Thích Ca cực kỳ huyền ảo. Khung giờ vàng đẹp nhất là từ 10h30 đến 12h trưa. Vé tour trọn gói đợt này ưu đãi chỉ còn 320.000đ bao gồm hướng dẫn viên bản địa, xe đưa đón và vé thang máy lên đỉnh Thủy Sơn. Nhấp link hoặc comment bên dưới để nhận mã giảm giá 20% đặt vé chính hãng nhé!",
    caption:
      "Kinh nghiệm ngắm 'Thiên Quang Đỉnh' tại Động Huyền Không - Ngũ Hành Sơn Đà Nẵng chuẩn hướng dẫn viên bản địa! Lưu lại ngay cho chuyến đi sắp tới nhé 🌄🙏 #NguHanhSon #DongHuyenKhong #DaNangTravel #TravelLinkAI",
    cta: "👉 Nhấp link [LINK_MUA_VE] đặt tour ưu đãi 320k hoặc comment 'NGUHANHSON' nhận voucher!",
    videoUrl:
      "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794542178161.mp4",
  },
  {
    id: "demo-hook-002",
    persona: "local-guide",
    hook: "⚠️ 3 sai lầm mất sức nhất khi leo Ngũ Hành Sơn lần đầu mà thổ địa không nói bạn sẽ không biết!",
    script:
      "Sai lầm 1: Đi giày thời trang leo bậc đá rêu trơn trượt. Hãy mang giày thể thao bám tốt. Sai lầm 2: Tự leo bộ cả trăm bậc dốc trong khi đã có thang máy kính hiện đại đưa thẳng lên chùa Linh Ứng. Sai lầm 3: Bỏ qua Làng đá mỹ nghệ Non Nước hơn 300 năm tuổi ngay dưới chân núi. Đặt tour trọn gói chỉ 320.000đ đã có sẵn vé thang máy 2 chiều, hướng dẫn viên thuyết minh tường tận tích xưa Ngũ Hành Kim Mộc Thủy Hỏa Thổ. Nhấp link ngay để nhận ưu đãi đối tác TravelLink!",
    caption:
      "Bỏ túi ngay 3 lưu ý xương máu khi khám phá danh thắng Ngũ Hành Sơn Đà Nẵng! Đi nhàn tênh, tiết kiệm thời gian và chụp ảnh bao đẹp 📸🌿 #KinhNghiemDuLich #NguHanhSon #DaNang",
    cta: "🎟️ Đặt vé tour chính hãng tại [LINK_MUA_VE] - Quét mã QR vào cổng không cần xếp hàng!",
    videoUrl:
      "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794539080918.mp4",
  },
  {
    id: "demo-hook-003",
    persona: "family",
    hook: "👨‍👩‍👧‍👦 Đưa ba mẹ và các con đi Ngũ Hành Sơn thảnh thơi không lo leo núi mệt nhọc!",
    script:
      "Nhiều bạn e ngại đưa người lớn tuổi hoặc trẻ nhỏ đi Ngũ Hành Sơn vì sợ phải leo dốc cao. Nhưng tour chuyên biệt cho gia đình này đã thiết kế lộ trình nhẹ nhàng nhất: sử dụng thang máy kính panoramic lên thẳng Chùa Linh Ứng cổ tự, đi theo lối bằng phẳng vào viếng Chùa Tam Thai và chiêm bái động Tàng Chơn mát rượi. Không khí thanh tịnh, bóng cây rợp mát quanh năm. Giá vé ưu đãi gia đình chỉ 320.000đ/người lớn, miễn phí cho trẻ nhỏ. Đặt trước hôm nay để giữ chỗ xe đón tận khách sạn nhé!",
    caption:
      "Lộ trình du lịch tâm linh Ngũ Hành Sơn chuẩn thư thái dành cho cả gia đình có người lớn tuổi và trẻ nhỏ. Bố mẹ rất thích không gian thanh tịnh nơi đây! ❤️ #GiaDinhDuLich #TourTamLinh #NguHanhSon",
    cta: "👨‍👩‍👧 Đặt tour gia đình tiện lợi tại [LINK_MUA_VE] - Xe đưa đón tận nơi, hỗ trợ chu đáo!",
    videoUrl:
      "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794537964162.mp4",
  },
  {
    id: "demo-hook-004",
    persona: "budget-traveler",
    hook: "💸 Chỉ 320K trọn gói vé thắng cảnh, thang máy và HDV riêng tại Ngũ Hành Sơn, tin được không?",
    script:
      "Nếu tự đi lẻ, mua vé thắng cảnh, vé thang máy khứ hồi, rồi thuê hướng dẫn viên riêng có khi tốn gần 500k mà lại phải xếp hàng chờ đợi dưới nắng. Bí kíp của mình là đặt combo tour qua đối tác chính thức TravelLink chỉ 320.000đ/người. Được quét mã QR vào thẳng cổng VIP, nghe thuyết minh tích kỳ bí của 5 ngọn ngũ hành, ghé làng đá Non Nước mua vòng phong thủy cầu may mắn. Deal độc quyền có hạn, nhấn link bên dưới đặt ngay kẻo lỡ nhé!",
    caption:
      "Review chân thực tour Ngũ Hành Sơn 320k trọn gói - Ngon bổ rẻ nhất Đà Nẵng mùa này! Cứ săn deal chính hãng là đi chơi tẹt ga không lo phát sinh 🌟 #SanDealDuLich #DaNangGiaRe #TravelLink",
    cta: "⚡ Nhấp ngay [LINK_MUA_VE] nhận giá sốc 320.000đ (Giá gốc 400.000đ) - Số lượng có hạn!",
    videoUrl:
      "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794536402964.mp4",
  },
  {
    id: "demo-hook-005",
    persona: "foodie",
    hook: "🍜 Sau khi viếng Chùa Linh Ứng Ngũ Hành Sơn thì ăn gì ngon chuẩn vị xứ Quảng?",
    script:
      "Một buổi sáng dạo bước giữa không gian thanh tịnh của động Huyền Không và vãn cảnh chùa cổ, bụng bắt đầu cồn cào thì nhất định phải ghé các quán mì Quảng ếch và bánh xèo tôm nhảy giòn rụm ngay gần làng đá Non Nước. Tour khám phá buổi sáng kết thúc đúng 11h30 trưa, vừa kịp giờ thưởng thức trọn vẹn ẩm thực Đà thành. Đặt tour ưu đãi chỉ 320k có ngay HDV nhiệt tình dẫn đường chỉ lối các quán ăn ngon chuẩn vị người bản xứ. Nhấp link để xem chi tiết thực đơn và lịch trình nha!",
    caption:
      "Lịch trình nửa ngày hoàn hảo: Chiêm bái Ngũ Hành Sơn buổi sáng & oanh tạc ẩm thực Đà Nẵng buổi trưa! Ăn chơi tới bến chỉ từ 320k 🤤🍲 #FoodieDaNang #AmThucXuQuang #TourDaNang",
    cta: "🍛 Khám phá lịch trình tour & quán ngon tại [LINK_MUA_VE] ngay hôm nay!",
    videoUrl:
      "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794542178161.mp4",
  },
];

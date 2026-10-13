export interface ResellerProfile {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
  isMock: boolean;
}

export interface ResellerMetrics {
  totalEarnings: number;
  totalOrders: number;
  trackingLinkCount: number;
  trackingStatus: string;
  clicksCount: number;
}

export interface CampaignItem {
  id: string;
  name: string;
  merchant_id: string;
  merchant_name: string;
  product_id: string;
  product_name: string;
  description?: string;
  category: string;
  original_price: number;
  sale_price: number;
  commission_rate: number;
  commission_amount_est?: number;
  start_date: string;
  end_date: string;
  target_audience: string;
  target_location: string;
  status: "active" | "draft" | "ended";
  booking_url: string;
  payment_url: string;
  featured?: boolean;
}

export interface ContentItem {
  id: string;
  campaign_id: string;
  campaign_name: string;
  product_name: string;
  persona: string;
  hook: string;
  script: string;
  caption: string;
  cta: string;
  status: "approved" | "pending" | "ai_generated";
  badges: string[];
  tracking_url: string | null;
  video_url: string | null;
}

export interface ResellerCampaignContent {
  id: string;
  campaign_id: string | null;
  persona: string | null;
  hook: string | null;
  script: string | null;
  caption: string | null;
  cta: string | null;
  status: string | null;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function getInitials(name: string): string {
  if (!name) return "MA";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Dữ liệu mẫu chuẩn hóa bám sát giao diện tham khảo và seed data
export const sampleCampaigns: CampaignItem[] = [
  {
    id: "camp-hoian-oct",
    name: "Khám phá Hội An tháng 10",
    merchant_id: "m-bienpho-demo",
    merchant_name: "Biển & Phố Travel — Demo",
    product_id: "prod-hoian-halfday",
    product_name: "Trải nghiệm phố cổ Hội An nửa ngày",
    category: "Tour trong ngày",
    original_price: 450000,
    sale_price: 390000,
    commission_rate: 10,
    commission_amount_est: 39000,
    start_date: "10/10/2026",
    end_date: "31/10/2026",
    target_audience: "Khách du lịch tự túc",
    target_location: "Đà Nẵng, Hội An",
    status: "active",
    booking_url: "https://bienphotravel.vn/tour/hoi-an-nua-ngay",
    payment_url: "https://checkout.bienphotravel.vn/pay/hoian-oct",
    featured: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills",
    merchant_id: "11111111-1111-1111-1111-111111111111",
    merchant_name: "Sun World Đà Nẵng",
    product_id: "33333333-3333-3333-3333-333333333333",
    product_name: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
    category: "Vé tham quan & Ẩm thực",
    original_price: 1250000,
    sale_price: 1150000,
    commission_rate: 8.0,
    commission_amount_est: 92000,
    start_date: "01/05/2026",
    end_date: "31/08/2026",
    target_audience: "Gia đình có trẻ nhỏ, nhóm bạn trẻ, sinh viên thích check-in",
    target_location: "Đà Nẵng, Hà Nội, TP.HCM",
    status: "active",
    booking_url: "https://sunworld.vn/booking/ba-na-hills-buffet",
    payment_url: "https://checkout.sunworld.vn/pay/bana-01",
  },
  {
    id: "44444444-4444-4444-4444-222222222222",
    name: "Chiến dịch Khám Phá Đại Dương - Lặn Ngắm San Hô Cù Lao Chàm",
    merchant_id: "11111111-1111-1111-1111-333333333333",
    merchant_name: "Cù Lao Chàm Travel",
    product_id: "33333333-3333-3333-3333-222222222222",
    product_name: "Tour Cano Cao Tốc Cù Lao Chàm - Lặn Ngắm San Hô & Hải Sản",
    category: "Tour trong ngày",
    original_price: 650000,
    sale_price: 550000,
    commission_rate: 11.5,
    commission_amount_est: 63250,
    start_date: "01/06/2026",
    end_date: "30/09/2026",
    target_audience: "Dân phượt, giới trẻ mê xê dịch, thể thao nước",
    target_location: "Đà Nẵng, Quảng Nam, Khách quốc tế",
    status: "active",
    booking_url: "https://culaochamtravel.vn/tour/lan-ngam-san-ho-1-ngay",
    payment_url: "https://checkout.culaochamtravel.vn/pay/clc-01",
  },
  {
    id: "44444444-4444-4444-4444-333333333333",
    name: "Chiến dịch Mùa Lễ Hội Văn Hóa VinWonders Nam Hội An",
    merchant_id: "11111111-1111-1111-1111-222222222222",
    merchant_name: "VinWonders Nam Hội An",
    product_id: "33333333-3333-3333-3333-111111111111",
    product_name: "Vé Vào Cổng VinWonders Nam Hội An - River Safari & Trò Chơi",
    category: "Vé công viên chủ đề",
    original_price: 600000,
    sale_price: 510000,
    commission_rate: 9.0,
    commission_amount_est: 45900,
    start_date: "15/05/2026",
    end_date: "15/10/2026",
    target_audience: "Gia đình đa thế hệ, cặp đôi du lịch lãng mạn",
    target_location: "Toàn quốc",
    status: "active",
    booking_url: "https://vinwonders.com/nam-hoi-an/all-in-one",
    payment_url: "https://checkout.vinwonders.com/pay/vwnha-01",
  },
  {
    id: "44444444-4444-4444-4444-111111111111",
    name: "Chiến dịch Chill Cùng Sông Hàn - Xem Cầu Rồng Phun Lửa",
    merchant_id: "11111111-1111-1111-1111-444444444444",
    merchant_name: "Du Thuyền Sông Hàn Marina",
    product_id: "33333333-3333-3333-3333-444444444444",
    product_name: "Vé Du Thuyền Sông Hàn Về Đêm - Ngắm Cầu Rồng Phun Lửa",
    category: "Trải nghiệm đêm",
    original_price: 200000,
    sale_price: 150000,
    commission_rate: 14.0,
    commission_amount_est: 21000,
    start_date: "01/05/2026",
    end_date: "31/12/2026",
    target_audience: "Khách du lịch tự túc, cặp đôi hẹn hò, đoàn khách hội nghị MICE",
    target_location: "Đà Nẵng",
    status: "active",
    booking_url: "https://marinasonghan.com/ve-du-thuyen-dem",
    payment_url: "https://checkout.marinasonghan.com/pay/cruise-01",
  },
];

export const sampleContents: ContentItem[] = [
  {
    id: "content-hoian-01",
    campaign_id: "camp-hoian-oct",
    campaign_name: "Khám phá Hội An tháng 10",
    product_name: "Trải nghiệm phố cổ Hội An nửa ngày",
    persona: "Local Guide",
    hook: "Bạn đang tìm một trải nghiệm tại Hội An?",
    script:
      "Bạn đang tìm một trải nghiệm tại Hội An? Tham khảo trải nghiệm phố cổ Hội An nửa ngày: đi thuyền thả hoa đăng trên sông Hoài, dạo bộ ngắm đèn lồng và thưởng thức trà Mót trứ danh. Đặt vé trực tiếp qua kênh chính thức để được hỗ trợ tốt nhất.",
    caption:
      "Tham khảo trải nghiệm phố cổ Hội An nửa ngày. Xem thông tin và điều kiện dịch vụ trên kênh chính thức của nhà cung cấp.",
    cta: "Xem thông tin đặt dịch vụ chính thức.",
    status: "approved",
    badges: ["Local Guide", "Đã duyệt (mô phỏng)"],
    tracking_url: null,
    video_url: null,
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    campaign_id: "44444444-4444-4444-4444-444444444444",
    campaign_name: "Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills",
    product_name: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
    persona: "Reviewer năng động, GenZ mê check-in",
    hook: "Đừng đi Đà Nẵng nếu bạn chưa biết bí quyết này để săn mây Bà Nà...",
    script:
      "Bà Nà Hills vừa có thêm góc check-in mới cực chất tại Cầu Vàng và Làng Pháp. Nếu đi sáng sớm trước 8h hoặc chiều sau 16h bạn sẽ có những khung hình không dính người!",
    caption:
      "Mẹo săn vé cáp treo Bà Nà Hills kèm buffet trưa tiết kiệm ngay 100k cho mùa hè này! Đặt ngay tại link chính thức của nhà cung cấp nha mọi người ơi!",
    cta: "Click link để nhận ngay ưu đãi vé cáp treo Bà Nà Hills hôm nay!",
    status: "approved",
    badges: ["GenZ Reviewer", "Đã duyệt"],
    tracking_url: "https://travelreseller.vn/chat?reseller_id=22222222-2222-2222-2222-111111111111&campaign_id=44444444-4444-4444-4444-444444444444&product_id=33333333-3333-3333-3333-333333333333",
    video_url: null,
  },
  {
    id: "66666666-6666-6666-6666-222222222222",
    campaign_id: "44444444-4444-4444-4444-222222222222",
    campaign_name: "Chiến dịch Khám Phá Đại Dương - Lặn Ngắm San Hô Cù Lao Chàm",
    product_name: "Tour Cano Cao Tốc Cù Lao Chàm",
    persona: "Trải nghiệm thực tế, phiêu lưu",
    hook: "Chỉ 550k mà được đi cano lướt sóng cực đã và ngắm rạn san hô đẹp mê hồn tại Cù Lao Chàm?",
    script:
      "Một ngày làm ngư dân đảo Cù Lao Chàm: lặn biển ngắm san hô Bãi Chồng, uống nước giếng cổ và ăn cua đá no nê. Trọn gói từ cảng Cửa Đại đã có hướng dẫn viên lo tất tần tật.",
    caption:
      "Review chân thật chuyến đi Cù Lao Chàm 1 ngày chỉ 550k bao gồm cano và ăn trưa hải sản. Đặt lịch giữ chỗ sớm trước khi hết cano nhé!",
    cta: "Bấm link bên dưới để đặt cano giá ưu đãi kèm bảo hiểm đầy đủ!",
    status: "approved",
    badges: ["Thực tế", "Đã duyệt"],
    tracking_url: null,
    video_url: null,
  },
];

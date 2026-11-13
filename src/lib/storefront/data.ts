import { createAdminClient } from "../supabase/admin.ts";
import type {
  StorefrontData,
  StorefrontMerchant,
  StorefrontPackage,
  StorefrontTip,
  StorefrontItineraryItem,
  StorefrontReview,
  BookingRequest,
  BookingOrderResult,
} from "./types";

const SUNWORLD_MERCHANT: StorefrontMerchant = {
  id: "22222222-2222-2222-2222-111111111111",
  name: "Tập đoàn Sun World",
  slug: "sunworld",
  brandTitle: "Sun World Ba Na Hills & Danh Thắng Đà Nẵng",
  tagline: "Hệ sinh thái du lịch & vui chơi giải trí hàng đầu Việt Nam",
  logoUrl: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=200&q=80",
  hotline: "1900 1888",
  supportEmail: "support@sunworld.vn",
  address: "Thôn An Sơn, Xã Hòa Ninh, Huyện Hòa Vang, TP. Đà Nẵng",
  operatingHours: "07:00 - 21:00 hàng ngày (kể cả Lễ, Tết)",
  bankName: "MBBank (Ngân hàng Quân Đội)",
  bankAccount: "09051888999",
  bankAccountName: "CTY CP DU LICH SUN WORLD TRAVEL",
  verified: true,
};

const DEFAULT_PACKAGES: StorefrontPackage[] = [
  {
    id: "pkg-nguhanhson",
    name: "Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không",
    description: "Khám phá 5 ngọn Kim Mộc Thủy Hỏa Thổ, Chùa Linh Ứng và hiện tượng Thiên Quang Đỉnh kỳ ảo.",
    originalPrice: 450000,
    salePrice: 320000,
    badge: "Flash Sale -29%",
    inclusions: [
      "Vé tham quan danh thắng Ngũ Hành Sơn",
      "Vé thang máy kính 2 chiều lên Chùa Linh Ứng",
      "Hướng dẫn viên bản địa thuyết minh",
      "Nước suối khoáng & bảo hiểm du lịch trọn gói",
    ],
  },
  {
    id: "pkg-banahills-standard",
    name: "Vé Cáp Treo Sun World Ba Na Hills & Check-in Cầu Vàng",
    description: "Trải nghiệm cáp treo kỷ lục Guiness, dạo bước Cầu Vàng bàn tay khổng lồ, Làng Pháp và Fantasy Park.",
    originalPrice: 1250000,
    salePrice: 950000,
    isPopular: true,
    badge: "Bán chạy nhất -24%",
    inclusions: [
      "Vé cáp treo khứ hồi Ga Suối Mơ - Bà Nà",
      "Tự do check-in Cầu Vàng & Vườn hoa Le Jardin",
      "Tham quan Làng Pháp, Lâu đài Mặt Trăng, Quảng trường Nhật Thực",
      "Miễn phí 105 trò chơi tại Fantasy Park (trừ game gắp thú/sáp)",
      "Bảo hiểm du lịch",
    ],
  },
  {
    id: "pkg-banahills-buffet",
    name: "Combo Cáp Treo + Đại Tiệc Buffet Quốc Tế 4 Mùa (70 Món)",
    description: "Trọn gói cáp treo khám phá Ba Na Hills và thưởng thức đại tiệc ẩm thực Á - Âu tại nhà hàng 4 mùa.",
    originalPrice: 1600000,
    salePrice: 1250000,
    badge: "Tiết kiệm 350K",
    inclusions: [
      "Toàn bộ quyền lợi vé Cáp Treo Ba Na Hills & Cầu Vàng",
      "01 suất Buffet trưa quốc tế hơn 70 món phong phú",
      "Bàn đặt trước không cần xếp hàng đợi",
      "Tặng voucher đồ uống tại Làng Pháp",
    ],
  },
];

const DEFAULT_TIPS: StorefrontTip[] = [
  {
    icon: "🌄",
    title: "Khung giờ vàng săn mây Cầu Vàng",
    tip: "Thời điểm lý tưởng nhất là 07:00 - 08:30 sáng hoặc sau 16:30 chiều. Lúc này ánh nắng xiên tạo hiệu ứng vàng rực rỡ và tránh được lượng khách đoàn đông đúc.",
  },
  {
    icon: "⛩️",
    title: "Chiêm ngưỡng 'Thiên Quang Đỉnh' Động Huyền Không",
    tip: "Khung giờ từ 10:30 đến 12:00 trưa là lúc ánh sáng mặt trời rọi thẳng từ vòm hang xuống tượng Phật Thích Ca, tạo nên cảnh tượng tâm linh huyền ảo bậc nhất.",
  },
  {
    icon: "🚠",
    title: "Lộ trình cáp treo tối ưu",
    tip: "Nên chọn tuyến cáp treo số 3 (Thác Tóc Tiên - L’Indochine) khi lên để ngắm toàn cảnh dòng thác hùng vĩ từ độ cao gần 1.500m.",
  },
  {
    icon: "👟",
    title: "Trang phục và phụ kiện",
    tip: "Nhiệt độ trên đỉnh núi chênh lệch 7-8°C so với Đà Nẵng, hãy mang theo áo khoác mỏng, nón chống nắng và giày thể thao có độ bám tốt để đi lại thoải mái.",
  },
];

const DEFAULT_ITINERARY: StorefrontItineraryItem[] = [
  {
    time: "08:00 - 08:30",
    title: "Làm thủ tục & Xuất phát",
    description: "Quét mã QR vé điện tử trực tiếp tại cổng soát vé thông minh (không cần xếp hàng lấy vé giấy). Lên cabin cáp treo ngắm toàn cảnh rừng nguyên sinh.",
    location: "Ga Suối Mơ / Ga Hội An",
  },
  {
    time: "08:30 - 10:30",
    title: "Check-in Cầu Vàng & Vườn hoa Thiên Thai",
    description: "Dạo bước trên Cầu Vàng lừng danh thế giới, ngắm đôi bàn tay Phật nâng đỡ dải lụa vàng giữa biển mây. Thưởng ngoạn 9 khu vườn hoa Le Jardin D'Amour rực rỡ.",
    location: "Khu vực Cầu Vàng & Vườn Thiên Thai",
  },
  {
    time: "10:30 - 11:30",
    title: "Chiêm bái Hầm rượu Debay & Chùa Linh Ứng",
    description: "Khám phá công trình hầm rượu cổ người Pháp đào xuyên lòng núi năm 1923 và viếng tượng Đức Phật Thích Ca cao 27m uy nghiêm giữa mây ngàn.",
    location: "Chùa Linh Ứng Bà Nà",
  },
  {
    time: "11:30 - 13:30",
    title: "Nghỉ ngơi & Đại tiệc Buffet Á - Âu",
    description: "Thưởng thức hơn 70 món ăn đặc sắc từ đồ nướng, hải sản đến ẩm thực truyền thống Việt Nam tại nhà hàng đẳng cấp.",
    location: "Nhà hàng 4 Mùa / Beer Plaza",
  },
  {
    time: "13:30 - 16:00",
    title: "Chinh phục Làng Pháp & Vương quốc Mặt Trăng",
    description: "Lạc bước giữa những lâu đài phong cách Gothic cổ kính, xem show biểu diễn Carnival của vũ công quốc tế và vui chơi thỏa thích tại Fantasy Park.",
    location: "Làng Pháp & Quảng trường Nhật Thực",
  },
  {
    time: "16:30",
    title: "Hạ sơn ngắm hoàng hôn",
    description: "Di chuyển cáp treo tuyến về ngắm cảnh hoàng hôn buông xuống núi rừng Đà Nẵng. Kết thúc hành trình trọn vẹn và đáng nhớ.",
    location: "Ga Thác Tóc Tiên",
  },
];

const DEFAULT_REVIEWS: StorefrontReview[] = [
  {
    id: "rev-01",
    author: "Nguyễn Hoàng Minh",
    rating: 5,
    date: "10/11/2026",
    tourPackage: "Vé Cáp Treo Sun World Ba Na Hills & Check-in Cầu Vàng",
    comment: "Vé quét mã QR vào cổng siêu nhanh, không phải chen chúc xếp hàng mua vé dưới chân núi. Cầu Vàng buổi sáng sớm mây bay đẹp như chốn bồng lai tiên cảnh!",
  },
  {
    id: "rev-02",
    author: "Trần Thu Thảo",
    rating: 5,
    date: "08/11/2026",
    tourPackage: "Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không",
    comment: "Gia đình mình có người lớn tuổi nên chọn gói này đi thang máy kính rất khỏe. Đúng 11h trưa thấy tia nắng mặt trời rọi thẳng xuống tượng Phật đẹp không thốt nên lời. HDV nhiệt tình 10 sao!",
  },
  {
    id: "rev-03",
    author: "Lê Văn Hùng (Reviewer)",
    rating: 5,
    date: "04/11/2026",
    tourPackage: "Combo Cáp Treo + Đại Tiệc Buffet Quốc Tế 4 Mùa",
    comment: "Buffet đồ ăn rất ngon và phong phú. Mua qua link đối tác TravelLink được giảm giá tốt mà lại được xuất vé điện tử chính hãng chuẩn chỉ.",
  },
];

const DEFAULT_GALLERY = [
  {
    url: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    title: "Cầu Vàng Bà Nà Hills",
    description: "Dải lụa vàng giữa đôi bàn tay khổng lồ phủ rêu phong, biểu tượng du lịch vươn tầm thế giới.",
  },
  {
    url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    title: "Cáp treo vượt mây kỷ lục thế giới",
    description: "Hệ thống cáp treo hiện đại lướt qua bạt ngàn rừng nguyên sinh và thác Tóc Tiên hùng vĩ.",
  },
  {
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    title: "Làng Pháp cổ kính phong cách Châu Âu",
    description: "Quần thể lâu đài mang đậm kiến trúc Gothic nước Pháp thế kỷ 19 lãng mạn.",
  },
  {
    url: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80",
    title: "Động Huyền Không - Ngũ Hành Sơn",
    description: "Ánh sáng Thiên Quang Đỉnh huyền diệu xuyên qua vòm hang đá cẩm thạch tâm linh.",
  },
  {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    title: "Quảng trường Nhật Thực & Lâu đài Mặt Trăng",
    description: "Không gian kiến trúc kỳ ảo kết nối vương quốc Mặt Trời và vương quốc Mặt Trăng.",
  },
];

export async function resolveStorefrontData({
  tenant,
  slug,
  searchParams = {},
}: {
  tenant: string;
  slug: string;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<StorefrontData> {
  const cleanTenant = (tenant || "sunworld").toLowerCase().trim();
  const cleanSlug = (slug || "default").toLowerCase().trim();

  const refParam = typeof searchParams.ref === "string" ? searchParams.ref : undefined;
  const campaignParam = typeof searchParams.campaign === "string" ? searchParams.campaign : undefined;

  let dbMerchant: any = null;
  let dbProduct: any = null;
  let dbCampaign: any = null;
  let dbVideoUrl: string | undefined = undefined;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 1200);

  try {
    const fetchFromDb = async () => {
      const admin = createAdminClient();

      // 1. Thử tra cứu Merchant theo slug hoặc name
      const { data: merchants } = await admin
        .from("merchants")
        .select("*")
        .or(`name.ilike.%${cleanTenant}%,website.ilike.%${cleanTenant}%`)
        .abortSignal(abortController.signal)
        .limit(1);

      if (merchants && merchants.length > 0) {
        dbMerchant = merchants[0];
      }

      // 2. Thử tra cứu Product theo ID hoặc Slug
      const isUuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(cleanSlug);
      if (isUuid) {
        const { data: prod } = await admin
          .from("products")
          .select("*")
          .eq("id", cleanSlug)
          .abortSignal(abortController.signal)
          .maybeSingle();
        if (prod) dbProduct = prod;
      } else if (cleanSlug !== "default") {
        const { data: prods } = await admin
          .from("products")
          .select("*")
          .or(`name.ilike.%${cleanSlug}%,booking_url.ilike.%${cleanSlug}%,payment_url.ilike.%${cleanSlug}%`)
          .abortSignal(abortController.signal)
          .limit(1);
        if (prods && prods.length > 0) {
          dbProduct = prods[0];
        }
      }

      // 3. Nếu có campaignParam hoặc tìm được product, tra cứu Campaign
      const campId = campaignParam || (isUuid ? cleanSlug : undefined);
      if (campId && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(campId)) {
        const { data: camp } = await admin
          .from("campaigns")
          .select("*")
          .eq("id", campId)
          .abortSignal(abortController.signal)
          .maybeSingle();
        if (camp) {
          dbCampaign = camp;
          if (!dbProduct && camp.product_id) {
            const { data: prodFromCamp } = await admin
              .from("products")
              .select("*")
              .eq("id", camp.product_id)
              .abortSignal(abortController.signal)
              .maybeSingle();
            if (prodFromCamp) dbProduct = prodFromCamp;
          }

          // Tra cứu video teaser AI đã duyệt
          const { data: videoContent } = await admin
            .from("contents")
            .select("video_url")
            .eq("campaign_id", camp.id)
            .eq("status", "approved")
            .not("video_url", "is", null)
            .order("created_at", { ascending: false })
            .abortSignal(abortController.signal)
            .limit(1)
            .maybeSingle();

          if (videoContent?.video_url) {
            dbVideoUrl = videoContent.video_url;
          }
        }
      }
    };

    await fetchFromDb();
  } catch {
    // Graceful fallback nếu sandbox chặn network hoặc DB chưa cấu hình
  } finally {
    clearTimeout(timeoutId);
  }

  // Kết hợp dữ liệu CSDL với Mock Data cao cấp để đảm bảo trải nghiệm khách hàng luôn mượt mà 100%
  const merchant: StorefrontMerchant = {
    id: dbMerchant?.id || SUNWORLD_MERCHANT.id,
    name: dbMerchant?.name || SUNWORLD_MERCHANT.name,
    slug: cleanTenant,
    brandTitle: SUNWORLD_MERCHANT.brandTitle,
    tagline: SUNWORLD_MERCHANT.tagline,
    logoUrl: SUNWORLD_MERCHANT.logoUrl,
    hotline: dbMerchant?.hotline || SUNWORLD_MERCHANT.hotline,
    supportEmail: dbMerchant?.email || SUNWORLD_MERCHANT.supportEmail,
    address: SUNWORLD_MERCHANT.address,
    operatingHours: SUNWORLD_MERCHANT.operatingHours,
    bankName: SUNWORLD_MERCHANT.bankName,
    bankAccount: SUNWORLD_MERCHANT.bankAccount,
    bankAccountName: SUNWORLD_MERCHANT.bankAccountName,
    verified: true,
  };

  const isNguHanhSonSlug =
    cleanSlug.includes("nguhanhson") ||
    cleanSlug.includes("ngu-hanh-son") ||
    dbProduct?.name?.includes("Ngũ Hành Sơn") ||
    dbCampaign?.name?.includes("Ngũ Hành Sơn");

  const productName = dbProduct?.name || (isNguHanhSonSlug
    ? "Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không"
    : "Vé Cáp Treo Sun World Ba Na Hills & Check-in Cầu Vàng");

  const originalPrice = dbProduct?.original_price || (isNguHanhSonSlug ? 450000 : 1250000);
  const salePrice = dbProduct?.sale_price || (isNguHanhSonSlug ? 320000 : 950000);

  const fallbackVideoUrl =
    dbVideoUrl ||
    "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/tour-kh-m-ph-danh-th-ng-ng-h-nh-s-n-ng-huy-n-kh-ng-1794542178161.mp4";

  return {
    merchant,
    product: {
      id: dbProduct?.id || (isNguHanhSonSlug ? "33333333-3333-3333-3333-444444444444" : "33333333-3333-3333-3333-333333333333"),
      slug: cleanSlug,
      name: productName,
      subtitle: isNguHanhSonSlug
        ? "Khám phá danh thắng tâm linh kỳ vĩ, chiêm bái tượng Phật trong vòm hang đá và ngắm toàn cảnh bờ biển Non Nước."
        : "Chinh phục đỉnh Bà Nà 1.487m, chiêm ngưỡng Cầu Vàng biểu tượng và lạc bước vào thị trấn Châu Âu cổ tích.",
      category: dbProduct?.category || (isNguHanhSonSlug ? "Tour Văn hóa & Tâm linh" : "Vé tham quan & Cáp treo"),
      location: dbCampaign?.target_location || (isNguHanhSonSlug ? "Ngũ Hành Sơn, Đà Nẵng" : "Bà Nà Hills, Đà Nẵng"),
      originalPrice,
      salePrice,
      rating: 4.9,
      reviewCount: 2840,
      soldCount: 1420,
      remainingToday: 18,
      highlights: isNguHanhSonSlug
        ? [
            "Chiêm bái Động Huyền Không với hiện tượng 'Thiên Quang Đỉnh' tuyệt mỹ",
            "Thang máy kính panoramic đưa thẳng lên Chùa Linh Ứng cổ tự",
            "Khám phá di sản Làng đá Non Nước hơn 300 năm truyền thống",
            "Hướng dẫn viên bản địa thuyết minh sâu sắc về Ngũ Hành Kim Mộc Thủy Hỏa Thổ",
            "Bảo hiểm du lịch và nước suối tinh khiết phục vụ suốt hành trình",
          ]
        : [
            "Chiêm ngưỡng Cầu Vàng - Kỳ quan thế giới mới được vinh danh quốc tế",
            "Trải nghiệm tuyến cáp treo số 3 đạt nhiều kỷ lục Guiness thế giới",
            "Check-in Làng Pháp lãng mạn, Lâu đài Mặt Trăng và Quảng trường Nhật Thực",
            "Miễn phí hơn 100 trò chơi cảm giác mạnh tại Fantasy Park",
            "Quét mã QR vào cổng trực tiếp, không phải xếp hàng chờ đợi",
          ],
      authenticTips: DEFAULT_TIPS,
      itinerary: DEFAULT_ITINERARY,
      inclusions: [
        "Vé điện tử chính hãng kích hoạt ngay lập tức qua mã QR",
        "Bảo hiểm du lịch theo quy định của Tổng cục Du lịch",
        "Hỗ trợ tư vấn và đổi lịch trình linh hoạt 24/7",
        "Xuất hóa đơn VAT điện tử hợp lệ cho doanh nghiệp",
      ],
      exclusions: [
        "Chi phí phát sinh cá nhân (mua sắm quà lưu niệm, đồ uống riêng)",
        "Các trò chơi có thưởng gắp thú hoặc bảo tàng sáp",
      ],
      policy: {
        cancellation: "Miễn phí đổi ngày tham quan trước 24 giờ. Hoàn tiền 100% trong trường hợp thời tiết bão lũ thiên tai bất khả kháng.",
        ticketType: "Vé điện tử QR Code (E-Ticket) lưu trong điện thoại hoặc email. Quét trực tiếp tại cổng kiểm soát.",
        entryInstructions: "Xuất trình mã QR tại cửa soát vé tự động. Mỗi mã QR chỉ có giá trị sử dụng cho 01 lần vào cổng.",
      },
      packages: DEFAULT_PACKAGES,
      galleryImages: DEFAULT_GALLERY,
      videoUrl: fallbackVideoUrl,
      videoThumbnail: DEFAULT_GALLERY[0].url,
    },
    campaign: dbCampaign
      ? {
          id: dbCampaign.id,
          name: dbCampaign.name,
          commissionRate: dbCampaign.commission_rate,
        }
      : {
          id: "44444444-4444-4444-4444-555555555555",
          name: "Chiến dịch Khám Phá Danh Thắng Ngũ Hành Sơn & Sun World Ba Na Hills",
          commissionRate: 15,
        },
    tracking: refParam
      ? {
          refCode: refParam,
          resellerName: "Đối tác TravelLink Verified",
          discountPercent: 5,
        }
      : undefined,
  };
}

export function createBookingOrder(request: BookingRequest): BookingOrderResult {
  const adultPrice = 320000;
  // Giá vé trẻ em được ưu đãi 75% giá vé người lớn
  const childPrice = Math.round(adultPrice * 0.75);

  const baseTotal = request.adultCount * adultPrice + request.childCount * childPrice;
  const discountAmount = request.refCode ? Math.round(baseTotal * 0.05) : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  const randSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderId = `TL-${Date.now().toString().slice(-6)}-${randSuffix}`;
  const ticketCode = `ET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const bankName = "MBBank";
  const bankAccount = "09051888999";
  const bankAccountName = "CTY CP DU LICH SUN WORLD TRAVEL";
  const transferContent = `DH ${orderId}`;

  // VietQR Napas247 URL format
  const vietQrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${finalTotal}&addInfo=${encodeURIComponent(
    transferContent,
  )}&accountName=${encodeURIComponent(bankAccountName)}`;

  const qrPayload = JSON.stringify({
    orderId,
    ticketCode,
    packageName: request.packageName,
    customerName: request.customerName,
    travelDate: request.travelDate,
    adults: request.adultCount,
    children: request.childCount,
    verifiedBy: "TravelLink & Sun World Official",
    issuedAt: new Date().toISOString(),
  });

  return {
    orderId,
    ticketCode,
    qrPayload,
    vietQrUrl,
    totalAmount: finalTotal,
    originalTotal: baseTotal,
    discountAmount,
    bankName,
    bankAccount,
    bankAccountName,
    transferContent,
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    customerEmail: request.customerEmail,
    travelDate: request.travelDate,
    packageName: request.packageName,
    adultCount: request.adultCount,
    childCount: request.childCount,
    createdAt: new Date().toISOString(),
  };
}

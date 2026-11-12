import { ContentApprovalList } from "@/src/components/merchant/content-approval-list";
import type { MerchantContentItem, MerchantContentsSummary } from "@/src/lib/merchant/content-schema";

export const metadata = {
  title: "Xem trước Kiểm duyệt Nội dung AI | TravelLink Preview",
};

export const dynamic = "force-dynamic";

const sampleContents: MerchantContentItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    campaign_id: "44444444-4444-4444-4444-111111111111",
    campaign_title: "Bà Nà Hills Siêu Khuyến Mãi 2026",
    persona: "family",
    hook: "Cả nhà cùng khám phá Làng Pháp và Cầu Vàng chỉ với nửa giá!",
    script:
      "Bạn đang tìm điểm đến hoàn hảo cho gia đình dịp cuối tuần này? Khám phá ngay Bà Nà Hills với khí hậu 4 mùa trong ngày, cáp treo đạt kỷ lục thế giới và vô vàn trò chơi cho bé.",
    caption:
      "✨ Đưa cả gia đình lên đỉnh Bà Nà mùa này đẹp xuất sắc! Không gian Pháp cổ kính, buffet Á-Âu phong phú và khí hậu mát lạnh dễ chịu. Đặt vé hôm nay nhận ngay ưu đãi 15% cho nhóm từ 3 người lớn kèm miễn phí vé cho trẻ dưới 1m! 👉 Nhấp vào liên kết để nhận mã ưu đãi chính thức.",
    cta: "Nhấp link nhận mã ưu đãi vé Bà Nà Hills",
    video_url: "https://ykfosnwbgphlwpufnxrd.supabase.co/storage/v1/object/public/campaign-videos/banahills-remediated-master.mp4",
    status: "pending_approval",
    created_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    campaign_id: "44444444-4444-4444-4444-111111111111",
    campaign_title: "Bà Nà Hills Siêu Khuyến Mãi 2026",
    persona: "local_guide",
    hook: "Đừng đi Cầu Vàng lúc 10h sáng nếu bạn không muốn chen chúc!",
    script:
      "Bí quyết ngắm trọn bình minh trên Cầu Vàng là bắt chuyến cáp treo sớm nhất lúc 7h30 sáng. Ánh sáng vàng rực rỡ và hầu như không có bóng người, tha hồ chụp hình triệu like.",
    caption:
      "🌅 Góc chia sẻ từ người Đà Nẵng: Muốn có ảnh check-in Cầu Vàng không dính người thì hãy lên trước 8h sáng nhé. Đặt vé trước qua link để không phải xếp hàng ở quầy vé chân núi!",
    cta: "Xem hướng dẫn đặt vé cáp treo sớm",
    video_url: null,
    status: "pending_approval",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    campaign_id: "55555555-5555-4555-8555-111111111111",
    campaign_title: "Tour Phố Cổ Hội An & Thả Hoa Đăng",
    persona: "foodie",
    hook: "Top 5 món ăn phải thử khi dạo thuyền trên sông Hoài Hội An",
    script:
      "Cao lầu Bà Bé, bánh mì Phượng, nước mót thảo mộc, chè bắp Cẩm Nam và bánh xèo giòn rụm. Hương vị xứ Quảng đậm đà mà giá lại cực kỳ bình dân.",
    caption:
      "🍜 Hành trình ẩm thực Hội An về đêm lung linh ánh đèn hoa đăng. Thưởng thức combo ăn sập phố cổ kết hợp tour thuyền thả hoa đăng truyền thống. Giá vé trọn gói chỉ 199k!",
    cta: "Đặt chỗ tour ẩm thực Hội An",
    video_url: null,
    status: "approved",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const sampleSummary: MerchantContentsSummary = {
  total: 3,
  pending_count: 2,
  approved_count: 1,
  rejected_count: 0,
  contents: sampleContents,
};

export default function PreviewMerchantContentsPage() {
  return (
    <ContentApprovalList
      initialContents={sampleContents}
      initialSummary={sampleSummary}
      campaigns={[
        { id: "44444444-4444-4444-4444-111111111111", title: "Bà Nà Hills Siêu Khuyến Mãi 2026" },
        { id: "55555555-5555-4555-8555-111111111111", title: "Tour Phố Cổ Hội An & Thả Hoa Đăng" },
      ]}
      preview={true}
    />
  );
}

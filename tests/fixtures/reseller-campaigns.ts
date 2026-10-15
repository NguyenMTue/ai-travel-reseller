import type { CampaignFeedItem } from "@/src/lib/reseller/campaign-feed";

// Isolated UI fixtures: production uses a session-scoped Supabase loader.
export const campaignFixtures: CampaignFeedItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    productId: "a1111111-1111-4111-8111-111111111111",
    name: "Hội An Foodie",
    location: "Hội An",
    category: "Ẩm thực",
    commissionRate: 8,
    approvedContentCount: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    productId: "a2222222-2222-4222-8222-222222222222",
    name: "Đà Nẵng Family",
    location: "Đà Nẵng",
    category: "Gia đình",
    commissionRate: 15,
    approvedContentCount: null,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    productId: "a3333333-3333-4333-8333-333333333333",
    name: "Huế Local Guide",
    location: "Huế",
    category: "Văn hóa",
    commissionRate: 25,
    approvedContentCount: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    productId: null,
    name: "Chiến dịch chưa cập nhật",
    location: null,
    category: null,
    commissionRate: null,
    approvedContentCount: null,
  },
];

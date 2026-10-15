import { getConfirmedContentPolicy, parseCampaignDetail, parseContentVariants, type ContentVariant, type ContentPublicationPolicy } from "@/src/lib/reseller/content-kit";

export const fixtureResellerId = "55555555-5555-4555-8555-555555555555";
export const fixturePolicy: ContentPublicationPolicy = {
  statuses: ["FIXTURE_REVIEWED"], allowShared: true, allowOwned: true,
  personaValues: { fixture_local: "local-guide", fixture_family: "family", fixture_foodie: "foodie", fixture_budget: "budget-traveler" },
};
export const fixtureCampaignDetail = parseCampaignDetail({
  id: "11111111-1111-4111-8111-111111111111", product_id: "a1111111-1111-4111-8111-111111111111",
  name: "Hội An Foodie", target_location: "Hội An", target_audience: "Dữ liệu kiểm thử", commission_rate: 8,
  start_date: null, end_date: null,
  products: { id: "a1111111-1111-4111-8111-111111111111", name: "Sản phẩm fixture Hội An", category: "Ẩm thực", description: "Mô tả kiểm thử cô lập. Không dùng như thông tin sản phẩm thật." },
});
export const fixtureContentVariants: ContentVariant[] = [
  { id: "61111111-1111-4111-8111-111111111111", persona: "local-guide", hook: "Hook fixture Local Guide 1", script: "Script fixture Local Guide 1\nDòng thứ hai được giữ nguyên.", caption: "Caption fixture Local Guide 1", cta: "CTA fixture Local Guide 1" },
  { id: "62222222-2222-4222-8222-222222222222", persona: "local-guide", hook: "Hook fixture Local Guide 2", script: "Đoạn kịch bản dài cho kiểm thử responsive. ".repeat(45) + "chuỗidài".repeat(80), caption: "  Caption fixture giữ khoảng trắng\nvà xuống dòng.  ", cta: null },
  { id: "63333333-3333-4333-8333-333333333333", persona: "family", hook: "Hook fixture Family", script: "Script fixture Family", caption: "Caption fixture Family", cta: "CTA fixture Family" },
  { id: "64444444-4444-4444-8444-444444444444", persona: "foodie", hook: null, script: "Script fixture Foodie", caption: "   ", cta: "CTA fixture Foodie" },
];

// Synthetic DB-shaped records for testing the confirmed adapter. Never use
// these in the real portal or insert the sample from docs/Fe.md into a DB.
const approvedFixtureRows = [
  { id: "a1111111-1111-1111-1111-111111111111", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "local_guide", status: "approved", hook: "Hook contract fixture Local Guide",
    script: "Script contract fixture\nDòng thứ hai.", caption: "  Caption contract fixture\nGiữ khoảng trắng.  ", cta: "Đặt vé: [LINK_MUA_VE]\nBổ sung link trước khi đăng." },
  { id: "a2222222-2222-2222-2222-222222222222", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "local_guide", status: "approved", script: "Script contract fixture biến thể 2" },
  { id: "a3333333-3333-3333-3333-333333333333", campaign_id: fixtureCampaignDetail.id, reseller_id: fixtureResellerId,
    persona: "family", status: "approved", hook: "Hook contract fixture riêng Family", script: "Script contract fixture Family", caption: "Caption contract fixture Family", cta: "CTA contract fixture Family" },
  { id: "a4444444-4444-4444-4444-444444444444", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "foodie", status: "approved", hook: "Hook contract fixture Foodie", script: "Script contract fixture Foodie", caption: "Caption contract fixture Foodie", cta: "CTA contract fixture Foodie" },
  { id: "a5555555-5555-5555-5555-555555555555", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "budget_traveler", status: "approved", hook: "Hook contract fixture Budget Traveler", script: "Script contract fixture Budget Traveler", caption: "Caption contract fixture Budget Traveler", cta: "CTA contract fixture Budget Traveler" },
  { id: "a6666666-6666-6666-6666-666666666666", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "local_guide", status: "pending_approval", hook: "Không được lộ pending fixture" },
  { id: "a7777777-7777-7777-7777-777777777777", campaign_id: fixtureCampaignDetail.id, reseller_id: "88888888-8888-8888-8888-888888888888",
    persona: "local_guide", status: "approved", hook: "Không được lộ owner khác fixture" },
  { id: "a8888888-8888-8888-8888-888888888888", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "unknown_persona", status: "approved", hook: "Không được map persona lạ fixture" },
  { id: "b1111111-1111-1111-1111-111111111111", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "local_guide", status: "published", hook: "Không được lộ published fixture" },
  { id: "b2222222-2222-2222-2222-222222222222", campaign_id: fixtureCampaignDetail.id, reseller_id: null,
    persona: "local_guide", status: "public", hook: "Không được lộ public fixture" },
  { id: "b3333333-3333-3333-3333-333333333333", campaign_id: "99999999-9999-9999-9999-999999999999", reseller_id: null,
    persona: "local_guide", status: "approved", hook: "Không được lộ campaign khác fixture" },
];
export const approvedFixtureVariants = parseContentVariants(approvedFixtureRows,
  { campaignId: fixtureCampaignDetail.id, resellerId: fixtureResellerId }, getConfirmedContentPolicy());

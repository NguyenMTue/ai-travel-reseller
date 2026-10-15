import type { CampaignFormValues } from "@/src/lib/merchant/campaign-form";
import type { CampaignCreatePolicy } from "@/src/lib/merchant/campaign-policy";
import type { CampaignInsert, MerchantCampaignSource, SourceReply } from "@/src/lib/merchant/campaign-service";

// In-memory only: these seed-shaped UUIDs and rows never go to Supabase.
export const fixtureMerchantId = "11111111-1111-1111-1111-111111111111";
export const fixtureOtherMerchantId = "11111111-1111-1111-1111-222222222222";
export const fixtureCampaignId = "44444444-4444-4444-4444-111111111111";
export const merchantProductFixtures = [
  { id: "33333333-3333-3333-3333-111111111111", merchant_id: fixtureMerchantId, name: "Tour trải nghiệm miền Trung — sản phẩm mô phỏng" },
  { id: "33333333-3333-3333-3333-222222222222", merchant_id: fixtureMerchantId, name: "Hành trình gia đình tại Đà Nẵng và Hội An — sản phẩm mô phỏng có tên dài để kiểm tra hiển thị trên điện thoại" },
];
export const fixtureCreatePolicy: CampaignCreatePolicy = { initialStatus: "FIXTURE_REVIEWED", calendarDates: "inclusive-local-day" };
export const validCampaignFixture: CampaignFormValues = {
  product_id: merchantProductFixtures[0].id,
  name: "Chiến dịch kiểm thử mô phỏng",
  commission_rate: "10.5",
  start_date: "2028-02-29",
  end_date: "2028-03-02",
  target_audience: "Gia đình muốn khám phá du lịch miền Trung.",
  target_location: "Đà Nẵng, Hội An",
};

const ok = (data: unknown): SourceReply => ({ data, error: null, status: 200 });
export function fixtureMerchantSource(overrides: Partial<MerchantCampaignSource> = {}) {
  const inserts: CampaignInsert[] = [];
  const calls: { name: string; args: string[] }[] = [];
  const source: MerchantCampaignSource = {
    async getUser() { calls.push({ name: "user", args: [] }); return ok({ id: fixtureMerchantId, user_metadata: { role: "merchant" } }); },
    async getMerchant(id) { calls.push({ name: "merchant", args: [id] }); return ok({ id: fixtureMerchantId }); },
    async listProducts(id, offset) { calls.push({ name: "products", args: [id, String(offset)] }); return ok(offset === 0 ? merchantProductFixtures : []); },
    async getProduct(id, productId) { calls.push({ name: "product", args: [id, productId] }); return ok(merchantProductFixtures.find(product => product.id === productId) || null); },
    async insertCampaign(values) { inserts.push(values); return ok({ id: fixtureCampaignId, merchant_id: values.merchant_id, product_id: values.product_id, name: values.name }); },
    ...overrides,
  };
  return { source, inserts, calls };
}

export const campaignPreviewStates = ["success", "pending", "blocked", "empty", "loading", "load-error", "session", "forbidden", "save-error", "save-session", "save-permission", "save-schema", "uncertain"] as const;
export type CampaignPreviewState = typeof campaignPreviewStates[number];

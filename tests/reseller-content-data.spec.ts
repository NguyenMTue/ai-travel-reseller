import { expect, test } from "@playwright/test";
import { getConfirmedContentPolicy, loadContentKit, parseCampaignDetail, parseContentVariants } from "@/src/lib/reseller/content-kit";
import { classifyDataFailure } from "@/src/lib/reseller/data-failure";
import { safeNextPath } from "@/src/lib/auth-validation";
import { canHandleAuthFailureAtResellerPage } from "@/src/lib/reseller/access";
import { fixtureCampaignDetail as campaign, fixturePolicy as policy, fixtureResellerId } from "./fixtures/reseller-content-kit";
import { formatCampaignDate } from "@/src/lib/reseller/campaign-date";

const context = { campaignId: campaign.id, resellerId: fixtureResellerId };
const otherId = "77777777-7777-4777-8777-777777777777";
const row = {
  id: "61111111-1111-4111-8111-111111111111", campaign_id: campaign.id, product_id: campaign.product_id,
  reseller_id: null, persona: "fixture_local", status: "FIXTURE_REVIEWED",
  hook: "Hook", script: "Script", caption: "Caption", cta: null,
};

test("an unconfirmed policy never fetches or leaks contents; live policy follows BE handoff", async () => {
  let reads = 0;
  expect(getConfirmedContentPolicy()).toEqual({
    statuses: ["approved"], allowShared: true, allowOwned: true,
    personaValues: { local_guide: "local-guide", family: "family", foodie: "foodie", budget_traveler: "budget-traveler" },
  });
  const result = await loadContentKit(context, null, async () => { reads++; return [row]; });
  expect(result).toEqual({ status: "blocked", variants: [] });
  expect(reads).toBe(0);
});

test("isolated fixture policy excludes status aliases, unknown persona, other reseller and wrong campaign", () => {
  const denied = [
    ...["published", "public", "approved", "APPROVED", "pending_approval"].map((status) => ({ ...row, status })),
    { ...row, reseller_id: otherId }, { ...row, campaign_id: otherId },
    { ...row, persona: "general" }, { ...row, persona: "toString" },
  ];
  const own = { ...row, id: otherId, reseller_id: fixtureResellerId, persona: "fixture_family" };
  expect(parseContentVariants([row, own, ...denied], context, policy).map((variant) => variant.persona)).toEqual(["local-guide", "family"]);
  expect(parseContentVariants([row, own], context, { ...policy, allowShared: false }).map((variant) => variant.id)).toEqual([otherId]);
  expect(parseContentVariants([row, own], context, { ...policy, allowOwned: false }).map((variant) => variant.id)).toEqual([row.id]);
});

test("content context is validated before any authorized source read", async () => {
  let reads = 0;
  await expect(loadContentKit({ ...context, resellerId: "bad" }, policy, async () => { reads++; return []; })).rejects.toThrow();
  expect(reads).toBe(0);
  expect(() => parseContentVariants([{ ...row, caption: 42 }], context, policy)).toThrow();
  expect(() => parseCampaignDetail({ ...campaign, products: { ...campaign.products, id: otherId } })).toThrow();
});

test("diagnostics distinguish privileges, schema, connection and unknown query failures", () => {
  expect(classifyDataFailure({ code: "42501", status: 401 })).toBe("permission");
  for (const code of ["42703", "42P01", "PGRST200", "PGRST205"]) expect(classifyDataFailure({ code })).toBe("schema");
  for (const failure of [{ status: 0 }, { status: 503 }, { code: "PGRST001" }, { code: "08006" }]) expect(classifyDataFailure(failure)).toBe("network");
  expect(classifyDataFailure({ code: "PGRST100" })).toBe("query");
});

test("login destination accepts the real campaign detail and rejects external redirects", () => {
  expect(safeNextPath(`/reseller/campaigns/${campaign.id}`)).toBe(`/reseller/campaigns/${campaign.id}`);
  for (const path of ["//example.invalid", "https://example.invalid", "/reseller/campaigns/%2f%2fevil"]) expect(safeNextPath(path)).toBe("/merchant");
});

test("Auth service failure falls through only to guarded Reseller loaders", () => {
  const cases: [string, number | undefined, boolean][] = [
    ["/reseller/campaigns", 0, true], ["/reseller/campaigns/id", 503, true], ["/reseller", undefined, true],
    ["/reseller/campaigns", 400, false], ["/reseller/campaigns", 401, false], ["/reseller/campaigns", 403, false],
    ["/merchant", 0, false], ["/admin", 503, false], ["/reseller-evil", 0, false], ["/merchant/reseller", 0, false],
  ];
  for (const [path, status, expected] of cases) expect(canHandleAuthFailureAtResellerPage(path, status)).toBe(expected);
});

test("Detail and scoped content adapters accept seed UUIDs without relaxing ownership or policy", async () => {
  const seedCampaignId = "44444444-4444-4444-4444-111111111111";
  const seedProductId = "33333333-3333-3333-3333-111111111111";
  const seedResellerId = "22222222-2222-2222-2222-111111111111";
  const detail = { ...campaign, id: seedCampaignId, product_id: seedProductId, products: { ...campaign.products, id: seedProductId } };
  expect(parseCampaignDetail(detail).id).toBe(seedCampaignId);
  const seedContext = { campaignId: seedCampaignId, resellerId: seedResellerId };
  const seedRow = { ...row, id: "66666666-6666-6666-6666-111111111111", campaign_id: seedCampaignId, product_id: seedProductId, reseller_id: seedResellerId };
  expect(parseContentVariants([seedRow, { ...seedRow, reseller_id: otherId }], seedContext, policy).map((variant) => variant.id)).toEqual([seedRow.id]);
  let reads = 0;
  expect(await loadContentKit(seedContext, null, async () => { reads++; return [seedRow]; })).toEqual({ status: "blocked", variants: [] });
  expect(reads).toBe(0);
});

test("updated BE contract permits only approved with matching campaign and shared/own scope, maps four personas", () => {
  const livePolicy = getConfirmedContentPolicy();
  const shared = { ...row, persona: "local_guide", status: "approved", product_id: null };
  const own = { ...shared, id: otherId, reseller_id: fixtureResellerId, persona: "family" };
  const foodie = { ...shared, id: "88888888-8888-8888-8888-111111111111", persona: "foodie" };
  const budget = { ...shared, id: "99999999-9999-9999-9999-111111111111", persona: "budget_traveler" };
  const denied = [
    ...["published", "public", "pending_approval", "APPROVED", "draft", "PUBLISHED", "PUBLIC", ""].map((status) => ({ ...shared, status })),
    { ...shared, reseller_id: otherId }, { ...shared, campaign_id: otherId },
    { ...shared, campaign_id: null }, { ...shared, persona: null },
    { ...shared, persona: "general" }, { ...shared, persona: "local-guide" }, { ...shared, persona: "toString" },
  ];
  expect(parseContentVariants([shared, own, foodie, budget, ...denied], context, livePolicy).map((variant) => variant.persona))
    .toEqual(["local-guide", "family", "foodie", "budget-traveler"]);
  // Campaign-wide content is not excluded by an additional product predicate.
  expect(parseContentVariants([{ ...shared, product_id: otherId }], context, livePolicy)).toHaveLength(1);
});

test("approved variants preserve missing fields, exact whitespace and link placeholders without invention", async () => {
  const source = { ...row, persona: "local_guide", status: "approved", hook: undefined, caption: null, script: "  First line\nSecond line  ", cta: "Đặt vé: [LINK_MUA_VE]\nChưa có URL." };
  const result = await loadContentKit(context, getConfirmedContentPolicy(), async () => [source]);
  expect(result.status).toBe("ready");
  expect(result.variants[0]).toMatchObject({ hook: null, caption: null, script: source.script, cta: source.cta });
  expect(await loadContentKit(context, getConfirmedContentPolicy(), async () => [])).toEqual({ status: "ready", variants: [] });
  await expect(loadContentKit(context, getConfirmedContentPolicy(), async () => { throw new Error("fixture query failed"); })).rejects.toThrow("fixture query failed");
});

test("campaign dates preserve the stored calendar day without time-zone conversion", () => {
  for (const value of ["2026-10-14", "2026-10-14T00:15:00", "2026-10-14 23:59:59.123456", "2026-10-14T00:15:00+14:00", "2026-10-14T23:59:59Z"]) {
    expect(formatCampaignDate(value)).toBe("14/10/2026");
  }
  expect(formatCampaignDate("2024-02-29T01:00:00")).toBe("29/02/2024");
  for (const value of [null, "", "   "]) expect(formatCampaignDate(value)).toBe("Chưa cập nhật");
  for (const value of ["bad", "2026-02-30", "1900-02-29", "2026-10-14T25:00:00", "2026-13-01", "2026-10-14suffix"]) {
    expect(formatCampaignDate(value)).toBe("Ngày không hợp lệ");
  }
});

test("empty source and adapter exclusions are distinct, with only rule codes and field names", () => {
  const exclusions: { code: string; fields: readonly string[] }[] = [];
  const capture = (code: string, fields: readonly string[]) => exclusions.push({ code, fields });
  expect(parseContentVariants([], context, getConfirmedContentPolicy(), capture)).toEqual([]);
  expect(exclusions).toEqual([]);
  const approved = { ...row, status: "approved", persona: "local_guide" };
  expect(parseContentVariants([
    { ...approved, persona: "unknown persona fixture" }, { ...approved, status: "pending_approval" },
    { ...approved, campaign_id: otherId }, { ...approved, reseller_id: otherId },
  ], context, getConfirmedContentPolicy(), capture)).toEqual([]);
  expect(exclusions).toEqual([
    { code: "PERSONA_UNMAPPED", fields: ["persona"] }, { code: "STATUS_EXCLUDED", fields: ["status"] },
    { code: "CAMPAIGN_EXCLUDED", fields: ["campaign_id"] }, { code: "OWNER_EXCLUDED", fields: ["reseller_id"] },
  ]);
});

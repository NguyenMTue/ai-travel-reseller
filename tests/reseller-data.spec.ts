import { expect, test } from "@playwright/test";
import { decideResellerAccess, inspectResellerAccess } from "@/src/lib/reseller/access";
import { formatResellerDiagnostic } from "@/src/lib/reseller/diagnostics";
import {
  defaultCampaignFilters,
  filterCampaigns,
  formatCommission,
  parseCampaignFeed,
  inspectCampaignIdentity,
  type CampaignFilters,
} from "@/src/lib/reseller/campaign-feed";
import { campaignFixtures } from "./fixtures/reseller-campaigns";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";
const campaignId = "33333333-3333-4333-8333-333333333333";
const productId = "44444444-4444-4444-8444-444444444444";

function campaignResponse() {
  return {
    id: campaignId,
    product_id: productId,
    name: "Hội An Foodie",
    target_location: "Hội An",
    commission_rate: 8,
    products: { category: "Ẩm thực" },
  };
}

test("campaign adapter preserves schema-backed response fields without inventing content counts", () => {
  const raw = {
    ...campaignResponse(),
    status: "active",
    content_count: 999,
    approved_content_count: 999,
    contents: [{ status: "approved" }],
    metadata: { role: "admin", image_url: "https://example.invalid/image" },
  };

  expect(parseCampaignFeed([raw])).toEqual([
    {
      id: campaignId,
      productId,
      name: "Hội An Foodie",
      location: "Hội An",
      category: "Ẩm thực",
      commissionRate: 8,
      approvedContentCount: null,
    },
  ]);
  expect(parseCampaignFeed([])).toEqual([]);
});

test("missing optional campaign values stay unknown, including zero versus absent commission", () => {
  const missing = {
    ...campaignResponse(),
    product_id: null,
    target_location: null,
    commission_rate: null,
    products: null,
  };
  const result = parseCampaignFeed([missing, { ...missing, commission_rate: 0 }]);

  expect(result[0]).toMatchObject({
    productId: null,
    location: null,
    category: null,
    commissionRate: null,
    approvedContentCount: null,
  });
  expect(result[1].commissionRate).toBe(0);
});

test("malformed API payloads fail validation instead of becoming plausible campaign data", () => {
  const invalidRows: unknown[] = [
    { ...campaignResponse(), id: "invalid-id" },
    { ...campaignResponse(), product_id: "invalid-product-id" },
    { ...campaignResponse(), name: undefined },
    { ...campaignResponse(), commission_rate: "15" },
    { ...campaignResponse(), commission_rate: Number.NaN },
    { ...campaignResponse(), commission_rate: Number.POSITIVE_INFINITY },
    { ...campaignResponse(), products: [{ category: "Ẩm thực" }] },
    { ...campaignResponse(), products: { category: 42 } },
  ];

  for (const row of invalidRows) {
    expect(() => parseCampaignFeed([row])).toThrow();
  }
  expect(() => parseCampaignFeed({ data: [campaignResponse()] })).toThrow();
});

test("commission ranges include their stated boundaries while unknown rates remain excluded", () => {
  const campaigns = [0, 9.9999, 10, 15, 20, 20.0001, null].map((commissionRate) => ({
    ...campaignFixtures[0],
    commissionRate,
  }));
  const matchingRates = (commission: CampaignFilters["commission"]) =>
    filterCampaigns(campaigns, { ...defaultCampaignFilters, commission }).map(
      (campaign) => campaign.commissionRate,
    );

  expect(matchingRates("under-10")).toEqual([0, 9.9999]);
  expect(matchingRates("10-to-20")).toEqual([10, 15, 20]);
  expect(matchingRates("over-20")).toEqual([20.0001]);
  expect(matchingRates("over-10")).toEqual([15, 20, 20.0001]);
  expect(matchingRates("over-15")).toEqual([20, 20.0001]);
  expect(formatCommission(7.125)).toBe("7,125%");
  expect(formatCommission(null)).toBe("Chưa có hoa hồng");
});

test("Vietnamese search tolerates accents and đ while keeping filters combined", () => {
  expect(
    filterCampaigns(campaignFixtures, {
      ...defaultCampaignFilters,
      search: "  DA NANG  ",
      category: "Gia đình",
      location: "Đà Nẵng",
      commission: "10-to-20",
    }).map((campaign) => campaign.name),
  ).toEqual(["Đà Nẵng Family"]);
});

test("reseller access requires a verified user and that user's authoritative reseller row", () => {
  expect(decideResellerAccess(userId, { id: userId })).toBe("allowed");
  expect(decideResellerAccess(userId, null)).toBe("forbidden");
  expect(decideResellerAccess(userId, { id: otherUserId })).toBe("unavailable");
  expect(
    decideResellerAccess(userId, {
      id: otherUserId,
      user_metadata: { role: "reseller" },
    }),
  ).toBe("unavailable");
});

test("invalid membership data and editable role metadata never grant reseller access", () => {
  for (const membership of [
    undefined,
    {},
    [],
    { id: "invalid-id" },
    { user_metadata: { role: "reseller" } },
    { role: "reseller" },
  ]) {
    expect(decideResellerAccess(userId, membership)).toBe("unavailable");
  }
});

test("PostgreSQL seed UUIDs grant access only for the verified user's reseller row", () => {
  // Literal from supabase/seed.sql: valid PostgreSQL UUID, non-RFC variant.
  const seedUserId = "22222222-2222-2222-2222-111111111111";
  expect(inspectResellerAccess(seedUserId, { id: seedUserId })).toEqual({ decision: "allowed", code: "ALLOWED_POSTGRES_UUID", fields: ["id"] });
  expect(decideResellerAccess(seedUserId, { id: seedUserId })).toBe("allowed");
  expect(decideResellerAccess(seedUserId, { id: seedUserId, name: null })).toBe("allowed");
  expect(decideResellerAccess(seedUserId, { id: "22222222-2222-2222-2222-222222222222" })).toBe("unavailable");
  expect(decideResellerAccess(seedUserId, null)).toBe("forbidden");
  expect(inspectResellerAccess(seedUserId, { id: null })).toEqual({ decision: "unavailable", code: "ZOD_invalid_type", fields: ["id"] });
  expect(inspectResellerAccess(seedUserId, { id: "bad" })).toEqual({ decision: "unavailable", code: "ZOD_invalid_format", fields: ["id"] });
  expect(inspectResellerAccess(seedUserId, { data: { id: seedUserId } }).fields).toEqual(["id"]);
  expect(inspectResellerAccess(seedUserId, []).fields).toEqual(["response"]);
});

test("Feed accepts PostgreSQL seed identifiers while keeping malformed IDs rejected", () => {
  const raw = { ...campaignResponse(), id: "44444444-4444-4444-4444-111111111111", product_id: "33333333-3333-3333-3333-111111111111" };
  expect(parseCampaignFeed([raw])[0]).toMatchObject({ id: raw.id, productId: raw.product_id });
  for (const id of ["bad", "44444444444444444444111111111111", "44444444-4444-4444-4444-11111111111g", null]) {
    expect(() => parseCampaignFeed([{ ...raw, id }])).toThrow();
  }
});

test("development diagnostic formatting excludes values, arbitrary fields and raw errors", () => {
  expect(formatResellerDiagnostic("membership.validation", "ZOD_invalid_format", ["id"])).toBe(
    '[reseller-access] {"step":"membership.validation","code":"ZOD_invalid_format","fields":["id"]}',
  );
  expect(formatResellerDiagnostic("membership.query", "42501")).toContain('"code":"42501"');
  expect(formatResellerDiagnostic("feed.validation", "ZOD_invalid_type", ["products.category", "private-value", "user.email", "id", "id"])).toBe(
    '[reseller-access] {"step":"feed.validation","code":"ZOD_invalid_type","fields":["products.category","id"]}',
  );
  expect(formatResellerDiagnostic("auth", { message: "private-value", token: "private-value" }, ["private-value"])).toBe(
    '[reseller-access] {"step":"auth","code":"UNKNOWN_ERROR","fields":[]}',
  );
});

test("same-title campaigns retain distinct IDs; diagnostics detect an actual repeated ID without merging rows", () => {
  const title = "Du lịch 3 ngày ở Phong Nha Kẻ Bàng";
  const first = { ...campaignFixtures[0], name: title };
  const second = { ...first, id: otherUserId };
  const campaigns = [first, second];
  expect(inspectCampaignIdentity(campaigns, title)).toEqual({ duplicateIds: false, sameTitleRecords: "distinct" });
  expect(filterCampaigns(campaigns, { ...defaultCampaignFilters, search: "phong nha" }).map((campaign) => campaign.id)).toEqual([first.id, second.id]);
  expect(campaigns).toEqual([first, second]);
  expect(inspectCampaignIdentity([first, first], title)).toEqual({ duplicateIds: true, sameTitleRecords: "repeated" });
  expect(inspectCampaignIdentity([first], title)).toEqual({ duplicateIds: false, sameTitleRecords: "none" });
});

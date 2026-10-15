import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { campaignCreatedMessage, campaignFields, campaignLimits, validateCampaignInput } from "@/src/lib/merchant/campaign-form";
import { vietnamCampaignDates } from "@/src/lib/merchant/campaign-dates";
import { consumeCampaignCreated, rememberCampaignCreated } from "@/src/lib/merchant/campaign-receipt";
import { getConfirmedCampaignCreatePolicy } from "@/src/lib/merchant/campaign-policy";
import { createMerchantCampaignSource } from "@/src/lib/merchant/campaign-source";
import { loadMerchantCampaignForm, saveMerchantCampaign, type CampaignInsert, type MerchantCampaignSource } from "@/src/lib/merchant/campaign-service";
import { fixtureCreatePolicy, fixtureMerchantId, fixtureOtherMerchantId, fixtureMerchantSource, merchantProductFixtures, validCampaignFixture } from "./fixtures/merchant-campaigns";

const ok = (data: unknown) => ({ data, error: null, status: 200 });
const failed = (code: string, status: number) => ({ data: null, error: { code, message: "private SQL detail must not reach UI" }, status });

test("BE-confirmed active payload uses inclusive Vietnam wall-clock days independently of host timezone", async () => {
  expect(getConfirmedCampaignCreatePolicy()).toEqual({ initialStatus: "active", calendarDates: "inclusive-local-day", timeZone: "Asia/Ho_Chi_Minh" });
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Ho_Chi_Minh", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      const fixture = fixtureMerchantSource();
      expect(await loadMerchantCampaignForm(fixture.source, getConfirmedCampaignCreatePolicy())).toMatchObject({ status: "ready", canSave: true });
      const result = await saveMerchantCampaign(fixture.source, { ...validCampaignFixture, merchant_id: fixtureOtherMerchantId }, getConfirmedCampaignCreatePolicy());
      expect(result).toMatchObject({ status: "success", message: campaignCreatedMessage });
      expect(fixture.inserts).toEqual([{
        ...validCampaignFixture, merchant_id: fixtureMerchantId, commission_rate: 10.5,
        status: "active", start_date: "2028-02-29T00:00:00", end_date: "2028-03-02T23:59:59.999999",
      }]);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("Vietnam date boundaries preserve leap/year edges and reject invalid calendar input", () => {
  expect(vietnamCampaignDates("2028-02-29", "2028-02-29")).toEqual({ start_date: "2028-02-29T00:00:00", end_date: "2028-02-29T23:59:59.999999" });
  expect(vietnamCampaignDates("0001-01-01", "9999-12-31")).toEqual({ start_date: "0001-01-01T00:00:00", end_date: "9999-12-31T23:59:59.999999" });
  for (const day of ["2026-02-29", "2028-02-30", "0000-01-01", "10000-01-01", "2028-03-02T00:00:00Z"]) {
    expect(() => vietnamCampaignDates(day, "2028-03-02")).toThrow();
    expect(() => vietnamCampaignDates("2028-02-29", day)).toThrow();
  }
  expect(() => vietnamCampaignDates("2028-03-02", "2028-02-29")).toThrow("END_BEFORE_START");
});

test("one-time campaign receipts keep real and preview separate even without browser storage", () => {
  expect(consumeCampaignCreated(false)).toBe(false);
  expect(consumeCampaignCreated(true)).toBe(false);
  rememberCampaignCreated(true);
  expect(consumeCampaignCreated(false)).toBe(false);
  expect(consumeCampaignCreated(true)).toBe(true);
  expect(consumeCampaignCreated(true)).toBe(false);
  rememberCampaignCreated(false);
  expect(consumeCampaignCreated(false)).toBe(true);
  expect(consumeCampaignCreated(false)).toBe(false);
});

test("validates seed-shaped PostgreSQL UUID, decimal boundaries and same-day campaigns", () => {
  for (const commission_rate of ["5", "30", "10.5"]) {
    const parsed = validateCampaignInput({ ...validCampaignFixture, commission_rate, end_date: validCampaignFixture.start_date, name: "  Chiến dịch  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toMatchObject({ name: "Chiến dịch", commission_rate: Number(commission_rate) });
  }
});

for (const field of campaignFields) {
  test(`requires ${field} and returns a field-specific error`, () => {
    const result = validateCampaignInput({ ...validCampaignFixture, [field]: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors[field]).toBeTruthy();
  });
}

test("rejects impossible calendar days, out-of-order ranges and non-calendar timestamps", () => {
  for (const date of ["2026-02-29", "2028-02-30", "2026-04-31", "2026-13-01", "2026-00-01", "0000-01-01", "2026-1-01", "2026-10-15T00:00:00Z"]) {
    const result = validateCampaignInput({ ...validCampaignFixture, start_date: date });
    expect(result.success, date).toBe(false);
    if (!result.success) expect(result.fieldErrors.start_date).toBeTruthy();
  }
  const result = validateCampaignInput({ ...validCampaignFixture, end_date: "2028-02-28" });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.fieldErrors.end_date).toContain("trước");
});

test("rejects non-finite, non-decimal and out-of-range commission values", () => {
  for (const commission_rate of ["4.999", "30.0001", "-5", "Infinity", "NaN", "1e1", "", "0x10", "10,5"]) {
    expect(validateCampaignInput({ ...validCampaignFixture, commission_rate }).success, commission_rate).toBe(false);
  }
  expect(validateCampaignInput({ ...validCampaignFixture, commission_rate: Number.POSITIVE_INFINITY }).success).toBe(false);
});

test("bounds text lengths and refuses unsupported AI notes/status instead of dropping them", () => {
  for (const [field, limit] of Object.entries(campaignLimits)) {
    expect(validateCampaignInput({ ...validCampaignFixture, [field]: "x".repeat(limit + 1) }).success).toBe(false);
  }
  for (const extra of [{ ai_notes: "Do not lose these notes" }, { status: "active" }]) {
    const result = validateCampaignInput({ ...validCampaignFixture, ...extra });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toBeTruthy();
  }
  expect(validateCampaignInput({ ...validCampaignFixture, product_id: "not-a-uuid" }).success).toBe(false);
});

test("load and save require a fresh user and Merchant membership, ignoring user_metadata role", async () => {
  for (const overrides of [
    { getUser: async () => ok(null) },
    { getUser: async () => failed("bad_jwt", 401) },
    { getMerchant: async () => ok(null) },
    { getMerchant: async () => ok({ id: fixtureOtherMerchantId }) },
  ] satisfies Partial<MerchantCampaignSource>[]) {
    const fixture = fixtureMerchantSource(overrides);
    expect((await loadMerchantCampaignForm(fixture.source, fixtureCreatePolicy)).status).toBe("error");
    const result = await saveMerchantCampaign(fixture.source, validCampaignFixture, fixtureCreatePolicy);
    expect(result.status).toBe("error");
    expect(fixture.inserts).toEqual([]);
    expect(fixture.calls.some(call => call.name === "products" || call.name === "product")).toBe(false);
  }
});

test("owned-product loading paginates by rows returned and rejects rows from another Merchant", async () => {
  const offsets: number[] = [];
  const fixture = fixtureMerchantSource({ listProducts: async (id, offset) => {
    expect(id).toBe(fixtureMerchantId); offsets.push(offset);
    return ok(merchantProductFixtures.slice(offset, offset + 1));
  } });
  expect(await loadMerchantCampaignForm(fixture.source, null)).toEqual({
    status: "ready", canSave: false, products: merchantProductFixtures.map(({ id, name }) => ({ id, name })),
  });
  expect(offsets).toEqual([0, 1, 2]);
  const foreign = fixtureMerchantSource({ listProducts: async () => ok([{ ...merchantProductFixtures[0], merchant_id: fixtureOtherMerchantId }]) });
  expect(await loadMerchantCampaignForm(foreign.source, fixtureCreatePolicy)).toEqual({ status: "error", reason: "permission" });
});

test("distinguishes empty products, schema failure, permission and network errors without fixture fallback", async () => {
  const empty = fixtureMerchantSource({ listProducts: async () => ok([]) });
  expect(await loadMerchantCampaignForm(empty.source, null)).toEqual({ status: "ready", products: [], canSave: false });
  for (const [reply, reason] of [[ok({ invalid: true }), "schema"], [failed("42703", 400), "schema"], [failed("42501", 403), "permission"], [failed("NETWORK", 503), "network"]] as const) {
    const fixture = fixtureMerchantSource({ listProducts: async () => reply });
    expect(await loadMerchantCampaignForm(fixture.source, null)).toEqual({ status: "error", reason });
  }
});

test("rechecks product ownership at submit and prevents foreign/deleted products from being inserted", async () => {
  for (const product of [null, { ...merchantProductFixtures[0], merchant_id: fixtureOtherMerchantId }]) {
    const fixture = fixtureMerchantSource({ getProduct: async () => ok(product) });
    const result = await saveMerchantCampaign(fixture.source, validCampaignFixture, fixtureCreatePolicy);
    expect(result.status).toBe(product ? "error" : "invalid");
    expect(fixture.inserts).toEqual([]);
  }
});

test("absent policy still makes zero inserts even with valid input and forged policy/merchant IDs", async () => {
  const fixture = fixtureMerchantSource();
  const result = await saveMerchantCampaign(fixture.source, { ...validCampaignFixture, merchant_id: fixtureOtherMerchantId, role: "merchant", policy: fixtureCreatePolicy }, null);
  expect(result.status).toBe("blocked");
  expect(fixture.calls).toContainEqual({ name: "product", args: [fixtureMerchantId, validCampaignFixture.product_id] });
  expect(fixture.inserts).toEqual([]);
});

test("server validation refuses forged notes, missing products, invalid dates and commission before any insert", async () => {
  for (const input of [{ ...validCampaignFixture, product_id: "" }, { ...validCampaignFixture, ai_notes: "secret note" }, { ...validCampaignFixture, start_date: "2028-02-30" }, { ...validCampaignFixture, commission_rate: "31" }]) {
    const fixture = fixtureMerchantSource();
    expect((await saveMerchantCampaign(fixture.source, input, fixtureCreatePolicy)).status).toBe("invalid");
    expect(fixture.inserts).toEqual([]);
    expect(fixture.calls.some(call => call.name === "product")).toBe(false);
  }
});

test("confirmed fixture save maps campaigns.name and verified merchant with explicit policy and calendar boundaries", async () => {
  const fixture = fixtureMerchantSource();
  const result = await saveMerchantCampaign(fixture.source, { ...validCampaignFixture, merchant_id: fixtureOtherMerchantId, role: "reseller" }, fixtureCreatePolicy);
  expect(result.status).toBe("success");
  expect(fixture.inserts).toHaveLength(1);
  expect(fixture.inserts[0]).toEqual({
    ...validCampaignFixture, merchant_id: fixtureMerchantId, commission_rate: 10.5,
    status: "FIXTURE_REVIEWED", start_date: "2028-02-29T00:00:00", end_date: "2028-03-02T23:59:59.999999",
  });
});

test("save reports confirmed auth/permission/schema rejection and treats lost or malformed acknowledgements as uncertain", async () => {
  for (const [reply, status, reason] of [
    [failed("PGRST301", 401), "error", "session"], [failed("42501", 403), "error", "permission"],
    [failed("42703", 400), "error", "schema"], [failed("UPSTREAM", 503), "uncertain", undefined],
    [ok(null), "uncertain", undefined], [ok({ id: "bad-id" }), "uncertain", undefined],
  ] as const) {
    let inserts = 0;
    const fixture = fixtureMerchantSource({ insertCampaign: async () => { inserts++; return reply; } });
    const result = await saveMerchantCampaign(fixture.source, validCampaignFixture, fixtureCreatePolicy);
    expect(result.status).toBe(status);
    if (result.status === "error") expect(result.reason).toBe(reason);
    expect(result.message).not.toContain("private SQL");
    expect(inserts).toBe(1);
  }
  const fixture = fixtureMerchantSource({ insertCampaign: async () => { throw new TypeError("after commit"); } });
  expect((await saveMerchantCampaign(fixture.source, validCampaignFixture, fixtureCreatePolicy)).status).toBe("uncertain");
});

test("real SDK serializes ownership filters and minimum projections; POST retry is explicitly disabled", async () => {
  const requests: { url: URL; method: string; body: unknown }[] = [];
  const client = createClient("https://fixture.invalid", "fixture-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const method = init?.method || "GET";
      requests.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify(method === "POST" ? { code: "UPSTREAM", message: "lost" } : []), { status: method === "POST" ? 503 : 200, headers: { "Content-Type": "application/json" } });
    } },
  });
  const source = createMerchantCampaignSource(client);
  await source.getMerchant(fixtureMerchantId);
  await source.listProducts(fixtureMerchantId, 0);
  await source.getProduct(fixtureMerchantId, validCampaignFixture.product_id);
  const fixture = fixtureMerchantSource();
  await saveMerchantCampaign(fixture.source, validCampaignFixture, getConfirmedCampaignCreatePolicy());
  const payload: CampaignInsert = fixture.inserts[0];
  expect(payload.status).toBe("active");
  const result = await source.insertCampaign(payload);
  expect(result.status).toBe(503);
  expect(requests.filter(request => request.method === "POST")).toHaveLength(1);
  expect(requests[0].url.searchParams.get("id")).toBe(`eq.${fixtureMerchantId}`);
  for (const request of requests.slice(1, 3)) {
    expect(request.url.searchParams.get("merchant_id")).toBe(`eq.${fixtureMerchantId}`);
    expect(request.url.searchParams.get("select")).toBe("id,merchant_id,name");
  }
  expect(requests[2].url.searchParams.get("id")).toBe(`eq.${validCampaignFixture.product_id}`);
  expect(requests[3].body).toEqual(payload);
  expect(requests[3].url.searchParams.get("select")).toBe("id,merchant_id,product_id,name");
});

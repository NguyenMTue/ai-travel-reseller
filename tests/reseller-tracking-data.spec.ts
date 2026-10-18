import { expect, test } from "@playwright/test";
import { isLiveTrackingEnabled, parseTrackingResponse, postTrackingLink, requestLiveTrackingLink, trackingEndpoint } from "@/src/lib/reseller/tracking-link";
import { fixtureCampaignDetail as campaign } from "./fixtures/reseller-content-kit";
import { trackingFixtureOrigin as origin, trackingFixtureResponse, trackingFixtureUrl } from "./fixtures/reseller-tracking";
import { createTrackingSessionGuard, prepareCtaWithLink, linkMatchesScope, shouldInvalidateTrackingSession, trackingScopeKey, trackingUrlAudience } from "@/src/lib/reseller/tracking-cta";

const input = { campaign_id: campaign.id, product_id: campaign.product_id! };
const reply = (body: unknown, status = 201) => new Response(JSON.stringify(body), { status });

test("CTA replaces only exact placeholders in a copy; empty/missing placeholder/link never invent content", () => {
  const scope = { ...input, sessionKey: "reseller-a" };
  const link = { scope, shortUrl: trackingFixtureUrl };
  const cta = "  Mua: [LINK_MUA_VE]\nLần nữa: [LINK_MUA_VE] [link_mua_ve]  ";
  expect(prepareCtaWithLink(cta, link, scope)).toEqual({ status: "ready", value: `  Mua: ${trackingFixtureUrl}\nLần nữa: ${trackingFixtureUrl} [link_mua_ve]  ` });
  expect(cta).toBe("  Mua: [LINK_MUA_VE]\nLần nữa: [LINK_MUA_VE] [link_mua_ve]  ");
  expect(prepareCtaWithLink(null, link, scope).status).toBe("empty");
  expect(prepareCtaWithLink(" \n ", link, scope).status).toBe("empty");
  expect(prepareCtaWithLink("CTA gốc", link, scope).status).toBe("no-placeholder");
  expect(prepareCtaWithLink(cta, null, scope).status).toBe("no-link");
});

test("link scope rejects another campaign/product/session and absent identity; Auth lifecycle invalidates", () => {
  const scope = { ...input, sessionKey: "reseller-a" };
  const link = { scope, shortUrl: trackingFixtureUrl };
  expect(linkMatchesScope(link, scope)).toBe(true);
  for (const changed of [{ ...scope, campaign_id: "99999999-9999-9999-9999-999999999999" }, { ...scope, product_id: "88888888-8888-8888-8888-888888888888" }, { ...scope, sessionKey: "reseller-b" }, null]) {
    expect(linkMatchesScope(link, changed)).toBe(false);
    expect(prepareCtaWithLink("CTA [LINK_MUA_VE]", link, changed).status).toBe("no-link");
    if (changed) expect(trackingScopeKey(changed)).not.toBe(trackingScopeKey(scope));
  }
  expect(shouldInvalidateTrackingSession("INITIAL_SESSION", "reseller-a", "reseller-a")).toBe(false);
  for (const event of ["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED"]) expect(shouldInvalidateTrackingSession(event, "reseller-a", "reseller-a")).toBe(true);
  expect(shouldInvalidateTrackingSession("INITIAL_SESSION", undefined, "reseller-a")).toBe(true);
  expect(shouldInvalidateTrackingSession("INITIAL_SESSION", "reseller-b", "reseller-a")).toBe(true);
  const observer = createTrackingSessionGuard("reseller-a");
  expect(observer("SIGNED_IN", "reseller-a")).toBe(false); // SDK recovery, not a reload loop
  expect(observer("INITIAL_SESSION", "reseller-a")).toBe(false);
  expect(observer("SIGNED_IN", "reseller-a")).toBe(true); // later sign-in still clears
  expect(createTrackingSessionGuard("reseller-a")("SIGNED_IN", "reseller-b")).toBe(true);
});

test("local URLs are labeled explicitly; a nonlocal URL alone does not prove public checkout works", () => {
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000", "http://10.2.3.4", "http://192.168.1.5", "http://172.16.0.5", "http://preview.local"]) {
    const short = `${origin}/r/TESTlink`;
    const good = trackingFixtureResponse();
    expect(parseTrackingResponse({ ...good, data: { ...good.data, short_url: short } }, origin)).toBe(short);
    expect(trackingUrlAudience(short)).toBe("local");
  }
  expect(trackingUrlAudience(trackingFixtureUrl)).toBe("unverified-public");
});

test("live creation dispatches request with session credentials when enabled", async () => {
  expect(isLiveTrackingEnabled()).toBe(true);
  const originalFetch = globalThis.fetch;
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;
  let requests = 0;
  (globalThis as unknown as { window: { location: { origin: string } } }).window = { location: { origin } };
  globalThis.fetch = async () => { requests++; return reply(trackingFixtureResponse()); };
  try {
    const res = await requestLiveTrackingLink(input);
    expect(res.status).toBe("success");
    expect(requests).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  }
});

test("POST serializes only matching campaign and product, with session credentials and no retry", async () => {
  const calls: { url: unknown; init?: RequestInit }[] = [];
  const send: typeof fetch = async (url, init) => { calls.push({ url, init }); return reply(trackingFixtureResponse()); };
  const supplied = { ...input, reseller_id: "forged" };
  const result = await postTrackingLink(supplied, origin, send);
  expect(result).toEqual({ status: "success", shortUrl: trackingFixtureUrl });
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe(trackingEndpoint);
  expect(calls[0].init).toMatchObject({ method: "POST", credentials: "same-origin", redirect: "error" });
  expect(JSON.parse(String(calls[0].init?.body))).toEqual(input);
});

test("invalid or missing product/campaign UUID never dispatches", async () => {
  let calls = 0;
  const send: typeof fetch = async () => { calls++; return reply(trackingFixtureResponse()); };
  for (const value of [{ ...input, product_id: "" }, { ...input, campaign_id: "bad" }]) {
    expect((await postTrackingLink(value, origin, send)).status).toBe("invalid");
  }
  expect(calls).toBe(0);
});

test("nested response accepts existing links but rejects foreign, unsafe or mismatched URLs", () => {
  const good = trackingFixtureResponse();
  expect(parseTrackingResponse({ ...good, data: { ...good.data, is_existing: true } }, origin)).toBe(trackingFixtureUrl);
  for (const url of ["javascript:alert(1)", "//tracking.example.invalid/r/TESTlink", "https://other.invalid/r/TESTlink",
    `${origin}/r/othercode`, `${trackingFixtureUrl}?ref=other`, `${trackingFixtureUrl}#fragment`, ` ${trackingFixtureUrl}`, `${origin}\n/r/TESTlink`, "https://user:pass@tracking.example.invalid/r/TESTlink"]) {
    expect(() => parseTrackingResponse({ ...good, data: { ...good.data, short_url: url } }, origin)).toThrow();
  }
  for (const body of [{ short_url: trackingFixtureUrl }, { status: "success", data: {} }, { ...good, status: "error" }]) {
    expect(() => parseTrackingResponse(body, origin)).toThrow();
  }
});

test("auth/rejection errors are sanitized; ambiguous POST results lock retry instead of returning fake links", async () => {
  for (const [status, expected] of [[401, "session"], [403, "permission"], [400, "error"], [404, "error"], [422, "error"], [500, "uncertain"], [503, "uncertain"]] as const) {
    let calls = 0;
    const result = await postTrackingLink(input, origin, async () => { calls++; return reply({ error: "private backend details" }, status); });
    expect(result.status).toBe(expected);
    expect(JSON.stringify(result)).not.toContain("private backend details");
    expect(calls).toBe(1);
  }
  for (const send of [async () => { throw new TypeError("lost after commit"); }, async () => new Response("bad JSON", { status: 201 }), async () => reply({ status: "success", data: {} })]) {
    expect((await postTrackingLink(input, origin, send)).status).toBe("uncertain");
  }
});

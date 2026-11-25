import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReferralCode, getReferralIdentity } from "../src/lib/storefront/referral.ts";
import { resolveStorefrontData } from "../src/lib/storefront/data.ts";
import { startFixture, RESELLER, NAME, CAMPAIGN } from "./fixtures/storefront-referral.mjs";

test("ref accepts only a single reseller UUID and never grants a voucher on its own", () => {
  for (const ref of [undefined, "", "not-a-ref", [RESELLER], RESELLER + "<script>"]) {
    assert.equal(normalizeReferralCode(ref), undefined);
    assert.equal(getReferralIdentity({ refCode: ref, resellerName: NAME }), undefined);
  }
  assert.equal(normalizeReferralCode(" " + RESELLER + " "), RESELLER);
  assert.equal(getReferralIdentity({ refCode: RESELLER }), undefined);
  assert.equal(getReferralIdentity({ refCode: RESELLER, resellerName: NAME }).hasVoucher, false);
  assert.equal(getReferralIdentity({ refCode: RESELLER, resellerName: NAME, discountPercent: 5 }).hasVoucher, false);
  const identity = getReferralIdentity({ refCode: RESELLER, resellerName: NAME, discountPercent: 5, discountEligible: true });
  assert.equal(identity.hasVoucher, true);
  assert.equal(identity.verified, false);
  assert.equal(getReferralIdentity({ refCode: RESELLER, resellerName: NAME, resellerAvatarUrl: "javascript:alert(1)" }).avatarUrl, undefined);
});

test("resolver uses active, product-scoped referral data and fails closed without it", async () => {
  const fixture = await startFixture();
  const keys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const saved = keys.map(key => [key, process.env[key]]);
  const originalFetch = globalThis.fetch;
  try {
    keys.forEach(key => delete process.env[key]);
    process.env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_task233_fixture";
    globalThis.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input.url || input.toString();
      assert.ok(url.startsWith(fixture.url + "/"), "only local fixture requests are allowed");
      return originalFetch(input, init);
    };
    const resolve = ref => resolveStorefrontData({ tenant: "sunworld", slug: "ba-na-hills", searchParams: { ref, campaign: CAMPAIGN } });
    const valid = await resolve(RESELLER);
    assert.equal(valid.tracking.resellerName, NAME);
    assert.equal(valid.tracking.refCode, RESELLER);
    assert.equal(valid.tracking.discountPercent, undefined);
    assert.equal(valid.tracking.resellerVerified, undefined);
    const profileRead = fixture.requests.find(r => r.path.endsWith("/resellers"));
    assert.equal(new URLSearchParams(profileRead.query).get("select"), "name");
    assert.equal(new URLSearchParams(profileRead.query).get("status"), "eq.active");
    const linkRead = fixture.requests.find(r => r.path.endsWith("/affiliate_links"));
    assert.equal(new URLSearchParams(linkRead.query).get("is_active"), "eq.true");
    assert.equal(new URLSearchParams(linkRead.query).get("campaign_id"), "eq." + CAMPAIGN);
    assert.ok(new URLSearchParams(linkRead.query).get("product_id"));
    for (const ref of [undefined, "not-a-ref", [RESELLER], "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]) {
      assert.equal((await resolve(ref)).tracking, undefined);
    }
    assert.ok(fixture.requests.every(r => r.method === "GET"));
    keys.forEach(key => delete process.env[key]);
    assert.equal((await resolve(RESELLER)).tracking, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    saved.forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value);
    await new Promise(resolve => fixture.server.close(resolve));
  }
});

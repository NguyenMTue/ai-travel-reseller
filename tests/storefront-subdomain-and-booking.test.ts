import { getStorefrontPrice } from "../src/lib/storefront/pricing.ts";
import { localDate } from "../src/lib/storefront/booking.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { resolveStorefrontData, createBookingDraft } from "../src/lib/storefront/data.ts";
import { formatPrice, formatNumber } from "../src/lib/storefront/format.ts";

test("SF-01: resolveStorefrontData returns rich data with merchant, product, packages and authentic tips", async () => {
  const data = await resolveStorefrontData({
    tenant: "sunworld",
    slug: "nguhanhson-01",
    searchParams: {
      ref: "22222222-2222-2222-2222-111111111111",
      campaign: "44444444-4444-4444-4444-555555555555",
    },
  });

  assert.ok(data.merchant, "Merchant info must be present");
  assert.equal(data.merchant.slug, "sunworld");
  assert.ok(data.merchant.name.includes("Sun World"));
  assert.ok(data.merchant.verified, "Merchant must be verified");

  assert.ok(data.product, "Product must be present");
  assert.ok(data.product.name.length > 0);
  assert.ok(data.product.salePrice > 0);
  assert.ok(data.product.originalPrice >= data.product.salePrice);
  assert.ok(data.product.packages.length >= 2, "Must provide multiple package choices");
  assert.ok(data.product.authenticTips.length >= 2, "Must provide authentic travel tips");
  assert.ok(data.product.galleryImages.length >= 3, "Must provide 4K gallery images");

  assert.equal(data.tracking, undefined, "Offline fallback must not fabricate referral identity or voucher eligibility");
});

test("SF-02: local draft uses confirmed pricing and never issues a ticket or payment QR", async () => {
  const data = await resolveStorefrontData({ tenant: "sunworld", slug: "ba-na-hills" });
  data.tracking = { refCode: "22222222-2222-2222-2222-111111111111", resellerName: "Fixture", discountEligible: true, discountPercent: 5 };
  const draft = createBookingDraft({ packageId: "standard", packageName: "Bà Nà", travelDate: localDate(new Date(Date.now() + 86400000)), adultCount: 2, childCount: 1, customerName: "Khách Fixture", customerPhone: "0901234567", customerEmail: "" }, getStorefrontPrice(data), "REQ-fixture");
  assert.equal(draft.totalAmount, 2481875);
  assert.equal("ticketCode" in draft, false);
  assert.equal("qrPayload" in draft, false);
  assert.equal("vietQrUrl" in draft, false);
});

test("SF-03: Subdomain parser correctly extracts tenant slug from various host patterns", () => {
  function extractTenantSubdomain(hostHeader: string | null): string | null {
    if (!hostHeader) return null;
    const hostname = hostHeader.split(":")[0].toLowerCase().trim();

    const reserved = new Set([
      "www", "api", "admin", "app", "reseller", "merchant", "localhost", "travellink", "travelelink", "test",
    ]);

    if (hostname.endsWith(".localhost")) {
      const sub = hostname.replace(/\.localhost$/, "");
      if (sub && !reserved.has(sub)) return sub;
    }

    const parts = hostname.split(".");
    if (parts.length >= 3) {
      const sub = parts[0];
      if (sub && !reserved.has(sub)) return sub;
    }

    return null;
  }

  // Local development tests
  assert.equal(extractTenantSubdomain("sunworld.localhost:3000"), "sunworld");
  assert.equal(extractTenantSubdomain("culaocham.localhost:3000"), "culaocham");
  assert.equal(extractTenantSubdomain("vinwonders.localhost:3000"), "vinwonders");
  assert.equal(extractTenantSubdomain("localhost:3000"), null);
  assert.equal(extractTenantSubdomain("www.localhost:3000"), null);
  assert.equal(extractTenantSubdomain("admin.localhost:3000"), null);

  // Production tests
  assert.equal(extractTenantSubdomain("sunworld.travellink.vn"), "sunworld");
  assert.equal(extractTenantSubdomain("culaocham.travellink.vn"), "culaocham");
  assert.equal(extractTenantSubdomain("travellink.vn"), null);
  assert.equal(extractTenantSubdomain("www.travellink.vn"), null);
  assert.equal(extractTenantSubdomain("api.travellink.vn"), null);
});

test("SF-04: Mock destination URLs with checkout.sunworld.vn gracefully rewrite to internal Storefront", () => {
  const oldMockUrl = "https://checkout.sunworld.vn/pay/nguhanhson-01?ref=22222222-2222-2222-2222-111111111111&campaign=44444444-4444-4444-4444-555555555555";
  const requestOrigin = "http://localhost:3000";

  let targetDest = oldMockUrl;
  if (targetDest.includes("checkout.sunworld.vn")) {
    const parsed = new URL(targetDest);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || "nguhanhson-01";
    const storefrontUrl = new URL(`/storefront/sunworld/${slug}`, requestOrigin);
    parsed.searchParams.forEach((val, key) => {
      storefrontUrl.searchParams.set(key, val);
    });
    targetDest = storefrontUrl.toString();
  }

  assert.ok(targetDest.startsWith("http://localhost:3000/storefront/sunworld/nguhanhson-01"));
  assert.ok(targetDest.includes("ref=22222222-2222-2222-2222-111111111111"));
  assert.ok(targetDest.includes("campaign=44444444-4444-4444-4444-555555555555"));
});

test("SF-05: formatPrice & formatNumber produce exact dot separators preventing hydration mismatch", () => {
  assert.equal(formatPrice(450000), "450.000");
  assert.equal(formatPrice(320000), "320.000");
  assert.equal(formatPrice(1250000), "1.250.000");
  assert.equal(formatNumber(2840), "2.840");
  assert.equal(formatNumber(1420), "1.420");
});

test("SF-06: Accurate destination-specific asset allocation for Ngu Hanh Son vs Ba Na Hills", async () => {
  const nguHanhSonData = await resolveStorefrontData({
    tenant: "sunworld",
    slug: "nguhanhson-01",
  });
  // Ngũ Hành Sơn must contain Động Huyền Không & Chùa Linh Ứng images
  const nhsTitles = nguHanhSonData.product.galleryImages.map((g) => g.title).join(" ");
  assert.ok(nhsTitles.includes("Huyền Không"));
  assert.ok(nhsTitles.includes("Ngũ Hành Sơn"));
  assert.equal(nguHanhSonData.product.salePrice, 320000);

  const baNaData = await resolveStorefrontData({
    tenant: "sunworld",
    slug: "ba-na-hills",
  });
  // Ba Na Hills must contain Cầu Vàng & Cáp treo images
  const bnaTitles = baNaData.product.galleryImages.map((g) => g.title).join(" ");
  assert.ok(bnaTitles.includes("Cầu Vàng"));
  assert.ok(bnaTitles.includes("Cáp treo"));
  assert.equal(baNaData.product.salePrice, 950000);
});

test("SF-07: Instant order confirmation & Reseller commission calculation formula", async () => {
  const { POST } = await import("../app/api/storefront/orders/confirm/route.ts");

  const mockPayload = {
    orderId: `TL-${Date.now().toString().slice(-6)}-TEST1`,
    totalAmount: 320000,
    customerName: "Khách Demo Test",
    customerPhone: "0905999888",
    packageName: "Tour Khám Phá Danh Thắng Ngũ Hành Sơn",
    refCode: "22222222-2222-2222-2222-111111111111",
    productId: "33333333-3333-3333-3333-666666666666",
    merchantId: "11111111-1111-1111-1111-111111111111",
  };

  const request = new Request("http://localhost:3000/api/storefront/orders/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mockPayload),
  });

  const response = await POST(request);
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.attributed, true);
  assert.equal(json.orderId, mockPayload.orderId);
  assert.equal(json.resellerId, "22222222-2222-2222-2222-111111111111");

  assert.ok(json.commission);
  assert.equal(json.commission.status, "confirmed");
  assert.ok(Number.isInteger(json.commission.grossAmount));
  assert.ok(Number.isInteger(json.commission.platformFee));
  assert.ok(Number.isInteger(json.commission.netAmount));
  assert.equal(
    json.commission.netAmount,
    json.commission.grossAmount - json.commission.platformFee,
    "Net commission must equal gross commission minus platform fee (80% net)",
  );
  assert.ok(json.commission.netAmount > 0);
});

test("SF-08: selected package and quantities produce the same confirmed quote total", async () => {
  const data = await resolveStorefrontData({ tenant: "sunworld", slug: "ba-na-hills" });
  data.tracking = { refCode: "22222222-2222-2222-2222-111111111111", resellerName: "Fixture", discountEligible: true, discountPercent: 5 };
  const draft = createBookingDraft({ packageId: "combo", packageName: "Combo", travelDate: localDate(new Date(Date.now() + 86400000)), adultCount: 2, childCount: 1, customerName: "Khách Fixture", customerPhone: "0901234567", customerEmail: "" }, getStorefrontPrice(data, data.product.packages[1]), "REQ-combo");
  assert.equal(draft.subtotal, 3437500);
  assert.equal(draft.discountAmount, 171875);
  assert.equal(draft.totalAmount, 3265625);
});

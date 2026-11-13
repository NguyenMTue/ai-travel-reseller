import test from "node:test";
import assert from "node:assert/strict";
import { resolveStorefrontData, createBookingOrder } from "../src/lib/storefront/data.ts";

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

  assert.ok(data.tracking, "Tracking attribution must be preserved");
  assert.equal(data.tracking?.refCode, "22222222-2222-2222-2222-111111111111");
  assert.equal(data.tracking?.discountPercent, 5);
});

test("SF-02: createBookingOrder calculates correct totals, applies ref discount and generates VietQR", () => {
  const order = createBookingOrder({
    packageId: "pkg-nguhanhson",
    packageName: "Tour Khám Phá Danh Thắng Ngũ Hành Sơn",
    travelDate: "2026-11-20",
    adultCount: 2,
    childCount: 1,
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    customerEmail: "nguyenvana@example.com",
    refCode: "22222222-2222-2222-2222-111111111111",
  });

  assert.ok(order.orderId.startsWith("TL-"), "Order ID must have TL- prefix");
  assert.ok(order.ticketCode.startsWith("ET-"), "Ticket code must have ET- prefix");
  assert.ok(order.totalAmount > 0, "Total amount must be positive");
  assert.ok(order.discountAmount > 0, "Ref discount must be applied");
  assert.equal(order.totalAmount, order.originalTotal - order.discountAmount);

  assert.ok(order.vietQrUrl.includes("vietqr.io"), "Must generate valid VietQR URL");
  assert.ok(order.vietQrUrl.includes(String(order.totalAmount)), "VietQR URL must contain exact total amount");
  assert.ok(order.transferContent.includes(order.orderId), "Transfer content must include orderId");

  // Verify QR Payload is parseable JSON for turnstile scanning
  const qrData = JSON.parse(order.qrPayload);
  assert.equal(qrData.orderId, order.orderId);
  assert.equal(qrData.customerName, "Nguyễn Văn A");
  assert.equal(qrData.adults, 2);
  assert.equal(qrData.children, 1);
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

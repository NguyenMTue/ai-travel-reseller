import test from "node:test";
import assert from "node:assert/strict";
import { getStorefrontPrice } from "../src/lib/storefront/pricing.ts";

const ref = "22222222-2222-2222-2222-111111111111";
const product = { originalPrice: 1250000, salePrice: 950000 };
test("display prices require explicit, validated eligibility and use the selected package", () => {
  for (const tracking of [undefined, { refCode: "invalid" }, { refCode: ref, resellerName: "An" }, { refCode: ref, resellerName: "An", discountPercent: 5 }, { refCode: "invalid", resellerName: "An", discountEligible: true, discountPercent: 5 }]) {
    assert.equal(getStorefrontPrice({ product, tracking }).finalPrice, 950000);
  }
  const tracking = { refCode: ref, resellerName: "An", discountEligible: true, discountPercent: 5 };
  assert.equal(getStorefrontPrice({ product, tracking }).finalPrice, 902500);
  const selected = { name: "Combo", salePrice: 1250000, originalPrice: 1600000 };
  const price = getStorefrontPrice({ product, tracking }, selected);
  assert.equal(price.finalPrice, 1187500);
  assert.equal(price.salePrice, 1250000);
  assert.equal(price.originalPrice, 1600000);
  assert.equal(price.packageName, "Combo");
});

import type { StorefrontData, StorefrontPackage } from "./types.ts";
import { getReferralIdentity } from "./referral.ts";

// Display pricing only. Payment validation remains the responsibility of checkout/BE.
export function getStorefrontPrice(data: StorefrontData, selectedPackage?: StorefrontPackage) {
  const source = selectedPackage ?? data.product;
  const hasReferralDiscount = getReferralIdentity(data.tracking)?.hasVoucher === true;
  const discountAmount = hasReferralDiscount ? Math.round(source.salePrice * 0.05) : 0;
  return {
    originalPrice: source.originalPrice,
    salePrice: source.salePrice,
    finalPrice: Math.max(0, source.salePrice - discountAmount),
    hasReferralDiscount,
    packageName: selectedPackage?.name,
  };
}

export type StorefrontPrice = ReturnType<typeof getStorefrontPrice>;

export function getBookingTotals(price: StorefrontPrice, adults: number, children: number) {
  const adultPrice = price.salePrice;
  // Preserve the existing child fare rule until BE supplies an authoritative quote.
  const childPrice = Math.round(adultPrice * 0.75);
  const subtotal = adults * adultPrice + children * childPrice;
  const discountAmount = price.hasReferralDiscount ? Math.round(subtotal * 0.05) : 0;
  return { adultPrice, childPrice, subtotal, discountAmount, totalAmount: Math.max(0, subtotal - discountAmount) };
}

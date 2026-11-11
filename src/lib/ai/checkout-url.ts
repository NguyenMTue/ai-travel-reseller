export type AttributionContext = {
  reseller_id: string;
  campaign_id: string;
  product_id: string;
};

export function buildCheckoutUrl(
  paymentUrl: string | null | undefined,
  attribution: AttributionContext,
  bookingUrl?: string | null | undefined,
): string | null {
  const candidate = paymentUrl || bookingUrl;
  if (!candidate) {
    return null;
  }

  try {
    const checkoutUrl = new URL(candidate);

    if (!["http:", "https:"].includes(checkoutUrl.protocol)) {
      return null;
    }

    checkoutUrl.searchParams.set("ref", attribution.reseller_id);
    checkoutUrl.searchParams.set("campaign", attribution.campaign_id);
    checkoutUrl.searchParams.set("product", attribution.product_id);
    return checkoutUrl.toString();
  } catch {
    return null;
  }
}

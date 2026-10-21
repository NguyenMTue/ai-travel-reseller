export type AttributionContext = {
  reseller_id: string;
  campaign_id: string;
  product_id: string;
};

export function buildCheckoutUrl(
  paymentUrl: string | null,
  attribution: AttributionContext,
): string | null {
  if (!paymentUrl) {
    return null;
  }

  try {
    const checkoutUrl = new URL(paymentUrl);

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

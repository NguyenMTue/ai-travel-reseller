export type AttributionContext = {
  reseller_id: string;
  campaign_id: string;
  product_id: string;
};

export function appendVoucherParam(
  rawUrl: string | null | undefined,
  voucherCode?: string | null | undefined,
): string | null {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const cleanVoucher = voucherCode?.trim().toUpperCase();
    if (cleanVoucher) {
      parsed.searchParams.set("voucher", cleanVoucher);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function buildCheckoutUrl(
  paymentUrl: string | null | undefined,
  attribution: AttributionContext,
  bookingUrl?: string | null | undefined,
  voucherCode?: string | null | undefined,
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

    const cleanVoucher = voucherCode?.trim().toUpperCase();
    if (cleanVoucher) {
      checkoutUrl.searchParams.set("voucher", cleanVoucher);
    }

    return checkoutUrl.toString();
  } catch {
    return null;
  }
}

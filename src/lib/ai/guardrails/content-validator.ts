export const CONTENT_GUARDRAIL_FLAGS = {
  PRICE_MISMATCH: "PRICE_MISMATCH",
  UNCONFIRMED_PROMO_CODE: "UNCONFIRMED_PROMO_CODE",
  PROHIBITED_CLAIM: "PROHIBITED_CLAIM",
} as const;

export type ContentGuardrailFlag =
  (typeof CONTENT_GUARDRAIL_FLAGS)[keyof typeof CONTENT_GUARDRAIL_FLAGS];

export type VerifiedProductForGuardrails = {
  original_price?: number | null;
  sale_price?: number | null;
  confirmed_price_offer?: number[];
  confirmed_promo_codes?: string[];
  verified_facts?: string[];
};

export type ContentGuardrailResult = {
  isValid: boolean;
  flags: ContentGuardrailFlag[];
  recommended_status: "APPROVED" | "NEEDS_REVIEW";
};

const MONEY_PATTERN =
  /\b(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(triệu|tr|nghìn|ngàn|k|vnd|vnđ|đ|₫)(?=\s|[.,;:!?)]|$)/giu;
const PROMO_CODE_PATTERN = /\b(?:GIAM|SALE)\d{1,3}\b|\bFREE[A-Z0-9_-]*\b/giu;
const PROHIBITED_CLAIMS = [
  "miễn phí khách sạn",
  "bao ăn trọn đời",
  "hoàn tiền 100% vô điều kiện",
  "đảm bảo rẻ nhất",
  "chắc chắn còn vé",
];

function normalizeMoney(rawAmount: string, rawUnit: string): number {
  const unit = rawUnit.toLocaleLowerCase("vi-VN");

  if (unit === "triệu" || unit === "tr") {
    return Number(rawAmount.replace(",", ".")) * 1_000_000;
  }

  if (unit === "nghìn" || unit === "ngàn" || unit === "k") {
    return Number(rawAmount.replace(/[.\s]/g, "").replace(",", ".")) * 1_000;
  }

  return Number(rawAmount.replace(/[.\s]/g, "").replace(",", "."));
}

function extractMentionedPrices(text: string): number[] {
  return [...text.matchAll(MONEY_PATTERN)]
    .map((match) => normalizeMoney(match[1], match[2]))
    .filter(Number.isFinite);
}

function normalizePromoCode(value: string): string {
  return value.trim().toLocaleUpperCase("vi-VN");
}

export function validateContentGuardrails(
  generatedText: string,
  verifiedProduct: VerifiedProductForGuardrails,
): ContentGuardrailResult {
  const flags = new Set<ContentGuardrailFlag>();
  const allowedPrices = new Set(
    [
      verifiedProduct.original_price,
      verifiedProduct.sale_price,
      ...(verifiedProduct.confirmed_price_offer ?? []),
    ].filter((price): price is number =>
      Number.isFinite(price),
    ),
  );

  const hasMismatchedPrice = extractMentionedPrices(generatedText).some(
    (price) => !allowedPrices.has(price),
  );
  if (hasMismatchedPrice) {
    flags.add(CONTENT_GUARDRAIL_FLAGS.PRICE_MISMATCH);
  }

  const allowedPromoCodes = new Set(
    (verifiedProduct.confirmed_promo_codes ?? []).map(normalizePromoCode),
  );
  const hasUnconfirmedPromoCode = [...generatedText.matchAll(PROMO_CODE_PATTERN)]
    .map((match) => normalizePromoCode(match[0]))
    .some((code) => !allowedPromoCodes.has(code));
  if (hasUnconfirmedPromoCode) {
    flags.add(CONTENT_GUARDRAIL_FLAGS.UNCONFIRMED_PROMO_CODE);
  }

  const normalizedText = generatedText.toLocaleLowerCase("vi-VN");
  const verifiedFacts = (verifiedProduct.verified_facts ?? []).map((fact) =>
    fact.toLocaleLowerCase("vi-VN"),
  );
  const hasProhibitedClaim = PROHIBITED_CLAIMS.some(
    (claim) =>
      normalizedText.includes(claim) &&
      !verifiedFacts.some((fact) => fact.includes(claim)),
  );
  if (hasProhibitedClaim) {
    flags.add(CONTENT_GUARDRAIL_FLAGS.PROHIBITED_CLAIM);
  }

  const resultFlags = [...flags];
  const isValid = resultFlags.length === 0;

  return {
    isValid,
    flags: resultFlags,
    recommended_status: isValid ? "APPROVED" : "NEEDS_REVIEW",
  };
}

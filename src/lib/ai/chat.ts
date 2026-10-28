import {
  formatRetrievedContext,
  retrieveProductContext,
} from "@/src/lib/ai/retrieval";
import {
  generateSalesReply,
  type SalesConversationMessage,
  type SalesIntent,
} from "@/src/lib/ai/sales-agent";
import {
  buildCheckoutUrl,
  type AttributionContext,
} from "@/src/lib/ai/checkout-url";
import { createAdminClient } from "@/src/lib/supabase/admin";
import type { VerifiedSalesKnowledgeBase } from "./guardrails/sales-guardrails.ts";

export type { AttributionContext } from "@/src/lib/ai/checkout-url";

type AnswerProductChatInput = {
  message: string;
  conversationHistory: SalesConversationMessage[];
  attribution: AttributionContext;
};

export type ProductChatAnswer = {
  reply: string;
  intent_detected: SalesIntent;
  suggested_checkout_url: string | null;
};

export class InvalidAttributionError extends Error {
  constructor() {
    super("Attribution context does not match an available product");
    this.name = "InvalidAttributionError";
  }
}

async function loadProductAndCheckout(
  attribution: AttributionContext,
): Promise<{
  checkoutUrl: string | null;
  product: {
    id: string;
    merchant_id: string | null;
    name: string;
    description: string;
    original_price: number | null;
    sale_price: number;
    payment_url: string;
    booking_url: string | null;
  };
  campaign: {
    id: string;
    product_id: string | null;
    merchant_id: string | null;
    target_location: string | null;
  };
  merchant: {
    id: string;
    name: string;
    website: string | null;
    address: string | null;
  } | null;
}> {
  const supabase = createAdminClient();
  const [productResult, campaignResult, resellerResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, merchant_id, name, description, original_price, sale_price, payment_url, booking_url")
      .eq("id", attribution.product_id)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, merchant_id, product_id, target_location")
      .eq("id", attribution.campaign_id)
      .eq("product_id", attribution.product_id)
      .maybeSingle(),
    supabase
      .from("resellers")
      .select("id")
      .eq("id", attribution.reseller_id)
      .maybeSingle(),
  ]);

  const databaseError =
    productResult.error ?? campaignResult.error ?? resellerResult.error;

  if (databaseError) {
    throw new Error(`Cannot validate attribution: ${databaseError.message}`);
  }

  if (!productResult.data || !campaignResult.data || !resellerResult.data) {
    throw new InvalidAttributionError();
  }

  const product = productResult.data;
  const campaign = campaignResult.data;

  // Runtime validation đối với sale_price và payment_url
  if (product.sale_price === null || product.sale_price === undefined || product.sale_price <= 0) {
    throw new Error(`Product ${product.id} has invalid or non-positive sale_price: ${product.sale_price}`);
  }

  if (!product.payment_url || !product.payment_url.startsWith("http")) {
    throw new Error(`Product ${product.id} has invalid payment_url: ${product.payment_url}`);
  }

  // Load thông tin merchant nếu có
  const merchantId = product.merchant_id || campaign.merchant_id;
  let merchant: {
    id: string;
    name: string;
    website: string | null;
    address: string | null;
  } | null = null;

  if (merchantId) {
    const { data: merchantData } = await supabase
      .from("merchants")
      .select("id, name, website, address")
      .eq("id", merchantId)
      .maybeSingle();
    merchant = merchantData;
  }

  const checkoutUrl = buildCheckoutUrl(
    product.payment_url,
    attribution,
  );
  return {
    checkoutUrl,
    product,
    campaign,
    merchant,
  };
}

export async function answerProductChat({
  message,
  conversationHistory,
  attribution,
}: AnswerProductChatInput): Promise<ProductChatAnswer> {
  const { checkoutUrl, product, campaign, merchant } =
    await loadProductAndCheckout(attribution);
  const chunks = await retrieveProductContext(message, {
    productId: attribution.product_id,
  });

  // Tổng hợp domain chính thức từ checkout_url, booking_url và merchant_website
  const allowedDomains = new Set<string>();
  if (checkoutUrl) {
    try {
      allowedDomains.add(new URL(checkoutUrl).hostname.toLowerCase());
    } catch {}
  }
  if (product.booking_url) {
    try {
      allowedDomains.add(new URL(product.booking_url).hostname.toLowerCase());
    } catch {}
  }
  if (merchant?.website) {
    try {
      const fullWeb = merchant.website.startsWith("http")
        ? merchant.website
        : `https://${merchant.website}`;
      allowedDomains.add(new URL(fullWeb).hostname.toLowerCase());
    } catch {}
  }

  const verifiedFacts = chunks.map((chunk, index) => ({
    id: `fact_rag_${index + 1}`,
    text: chunk.content,
    category: "PRODUCT_RAG",
  }));

  const location = campaign.target_location || merchant?.address || undefined;

  const kb: VerifiedSalesKnowledgeBase = {
    product_id: product.id,
    product_name: product.name,
    original_price: product.original_price,
    sale_price: product.sale_price,
    location,
    inclusions: product.description ? [product.description] : [],
    // Không tự bịa chính sách hoàn hủy hay trẻ em khi DB không có
    cancellation_policy: undefined,
    child_policy: undefined,
    official_checkout_url: checkoutUrl ?? undefined,
    booking_url: product.booking_url ?? undefined,
    merchant_website: merchant?.website ?? undefined,
    official_domains: allowedDomains.size > 0 ? [...allowedDomains] : undefined,
    verified_facts: verifiedFacts.length > 0 ? verifiedFacts : undefined,
  };

  const result = await generateSalesReply({
    question: message,
    history: conversationHistory,
    context: formatRetrievedContext(chunks),
    checkoutAvailable: Boolean(checkoutUrl),
    knowledgeBase: kb,
  });

  return {
    reply: result.reply,
    intent_detected: result.intentDetected,
    suggested_checkout_url: result.purchaseIntent ? checkoutUrl : null,
  };
}

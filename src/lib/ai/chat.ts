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

async function loadCheckoutUrl(
  attribution: AttributionContext,
): Promise<string | null> {
  const supabase = createAdminClient();
  const [productResult, campaignResult, resellerResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, payment_url")
      .eq("id", attribution.product_id)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, product_id")
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

  return buildCheckoutUrl(productResult.data.payment_url, attribution);
}

export async function answerProductChat({
  message,
  conversationHistory,
  attribution,
}: AnswerProductChatInput): Promise<ProductChatAnswer> {
  const checkoutUrl = await loadCheckoutUrl(attribution);
  const chunks = await retrieveProductContext(message, {
    productId: attribution.product_id,
  });
  const result = await generateSalesReply({
    question: message,
    history: conversationHistory,
    context: formatRetrievedContext(chunks),
    checkoutAvailable: checkoutUrl !== null,
  });

  return {
    reply: result.reply,
    intent_detected: result.intentDetected,
    suggested_checkout_url: result.purchaseIntent ? checkoutUrl : null,
  };
}

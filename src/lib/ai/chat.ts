import {
  formatRetrievedContext,
  retrieveProductContext,
} from "@/src/lib/ai/retrieval";
import {
  generateSalesReply,
  type SalesConversationMessage,
} from "@/src/lib/ai/sales-agent";
import { createAdminClient } from "@/src/lib/supabase/admin";

export type AttributionContext = {
  reseller_id: string;
  campaign_id: string;
  product_id: string;
};

type AnswerProductChatInput = {
  message: string;
  conversationHistory: SalesConversationMessage[];
  attribution: AttributionContext;
};

export type ProductChatAnswer = {
  reply: string;
  suggested_checkout_url: string | null;
};

export class InvalidAttributionError extends Error {
  constructor() {
    super("Attribution context does not match an available product");
    this.name = "InvalidAttributionError";
  }
}

function buildCheckoutUrl(
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
    return checkoutUrl.toString();
  } catch {
    return null;
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
    suggested_checkout_url: result.purchaseIntent ? checkoutUrl : null,
  };
}

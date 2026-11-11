import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const DEFAULT_WEBHOOK_SECRET = "aitravel_partner_secret_2026";
const DEFAULT_COMMISSION_RATE_PERCENT = 15;
const PLATFORM_FEE_RATE = 0.2;

export const WEBHOOK_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const merchantOrderWebhookSchema = z.object({
  order_id: z.string().trim().min(1, "order_id không được để trống"),
  booking_reference: z
    .string()
    .trim()
    .min(1, "booking_reference không được để trống"),
  amount: z.coerce
    .number()
    .finite("amount phải là số hợp lệ")
    .positive("amount phải lớn hơn 0"),
  ref: z.string().trim().optional().nullable(),
  campaign_id: z
    .string()
    .trim()
    .regex(WEBHOOK_UUID_PATTERN, "campaign_id phải là UUID hợp lệ"),
  product_id: z
    .string()
    .trim()
    .regex(WEBHOOK_UUID_PATTERN, "product_id phải là UUID hợp lệ"),
  merchant_id: z
    .string()
    .trim()
    .regex(WEBHOOK_UUID_PATTERN, "merchant_id phải là UUID hợp lệ")
    .optional()
    .nullable(),
  customer_name: z.string().trim().optional().nullable(),
  customer_email: z.string().trim().optional().nullable(),
  customer_phone: z.string().trim().optional().nullable(),
  voucher: z.string().trim().optional().nullable(),
});

export type MerchantOrderWebhookInput = z.infer<
  typeof merchantOrderWebhookSchema
>;

export type CommissionSplit = {
  commission_rate: number;
  gross_commission: number;
  platform_fee: number;
  net_amount: number;
};

export type WebhookAuthResult = {
  valid: boolean;
  method: "hmac" | "bearer" | null;
};

export type ProcessOrderWebhookResult =
  | {
      ok: true;
      statusCode: 200;
      body: {
        success: true;
        duplicate?: boolean;
        order_id: string;
        external_order_id: string;
        booking_reference: string;
        commission_rate: number;
        gross_commission: number;
        platform_fee: number;
        reseller_commission: number;
        flag_self_purchase: boolean;
        status: "confirmed" | "pending";
      };
    }
  | {
      ok: false;
      statusCode: 400 | 404 | 500;
      error: string;
    };

export type WebhookDbQueryResult<T = Record<string, unknown>> = Promise<{
  data: T | null;
  error?: { message: string; code?: string } | null;
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookDbClient = { from: (table: string) => any };

export function getMerchantWebhookSecret(): string {
  return process.env.MERCHANT_WEBHOOK_SECRET?.trim() || DEFAULT_WEBHOOK_SECRET;
}

export function computeHmacSha256Hex(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function safeStringEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify inbound merchant webhook via HMAC SHA-256 (`x-signature`) or Bearer secret.
 */
export function verifyMerchantWebhookAuth(
  headers: Pick<Headers, "get">,
  rawBody: string,
  secret = getMerchantWebhookSecret(),
): WebhookAuthResult {
  const signatureHeader = headers.get("x-signature")?.trim();
  if (signatureHeader) {
    const normalizedSig = signatureHeader
      .replace(/^sha256=/i, "")
      .toLowerCase();
    const expectedSig = computeHmacSha256Hex(rawBody, secret).toLowerCase();
    if (safeStringEqual(normalizedSig, expectedSig)) {
      return { valid: true, method: "hmac" };
    }
  }

  const authHeader = headers.get("authorization")?.trim();
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1] && safeStringEqual(match[1].trim(), secret)) {
      return { valid: true, method: "bearer" };
    }
  }

  return { valid: false, method: null };
}

/**
 * Split commission 80/20 (Reseller 80%, Platform 20%), rounded to nearest integer VND.
 */
export function calculateCommissionSplit(
  amount: number,
  commissionRatePercent: number,
): CommissionSplit {
  const rate =
    Number.isFinite(commissionRatePercent) && commissionRatePercent > 0
      ? commissionRatePercent
      : DEFAULT_COMMISSION_RATE_PERCENT;
  const gross_commission = Math.round(amount * (rate / 100));
  const platform_fee = Math.round(gross_commission * PLATFORM_FEE_RATE);
  const net_amount = gross_commission - platform_fee;
  return {
    commission_rate: rate,
    gross_commission,
    platform_fee,
    net_amount,
  };
}

function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

function buildOrderNotes(input: MerchantOrderWebhookInput, refInvalid: boolean): string {
  const parts = [`External Order: ${input.order_id}`];
  if (input.customer_email) parts.push(`Email: ${input.customer_email}`);
  if (input.voucher) parts.push(`Voucher: ${input.voucher.toUpperCase()}`);
  if (refInvalid) parts.push("Flag: Invalid or missing reseller ref");
  return parts.join(" | ");
}

function formatDuplicateOrderResponse(
  existingOrder: {
    id: string;
    gross_commission: number | null;
    platform_fee: number | null;
    reseller_commission: number | null;
    commission_rate: number | null;
    flag_self_purchase: boolean | null;
    status: string | null;
  },
  input: MerchantOrderWebhookInput,
  fallbackRate = DEFAULT_COMMISSION_RATE_PERCENT,
): ProcessOrderWebhookResult {
  const flagged = Boolean(existingOrder.flag_self_purchase);
  const storedNet = Number(existingOrder.reseller_commission ?? 0);
  return {
    ok: true,
    statusCode: 200,
    body: {
      success: true,
      duplicate: true,
      order_id: existingOrder.id,
      external_order_id: input.order_id,
      booking_reference: input.booking_reference,
      commission_rate: Number(existingOrder.commission_rate ?? fallbackRate),
      gross_commission: Number(existingOrder.gross_commission ?? 0),
      platform_fee: Number(existingOrder.platform_fee ?? 0),
      reseller_commission: flagged ? 0 : storedNet,
      flag_self_purchase: flagged,
      status:
        existingOrder.status === "paid" || existingOrder.status === "confirmed"
          ? "confirmed"
          : "pending",
    },
  };
}

async function findExistingOrderByBookingRef(
  db: WebhookDbClient,
  merchantId: string,
  bookingReference: string,
) {
  const { data } = await db
    .from("orders")
    .select(
      "id, gross_commission, platform_fee, reseller_commission, commission_rate, flag_self_purchase, status",
    )
    .eq("merchant_id", merchantId)
    .eq("booking_reference", bookingReference)
    .maybeSingle();
  return data;
}

/**
 * Validate merchant order webhook payload, check fraud flags, and write `orders` + `commissions`.
 */
export async function processMerchantOrderWebhook(
  db: WebhookDbClient,
  input: MerchantOrderWebhookInput,
): Promise<ProcessOrderWebhookResult> {
  const [campaignRes, productRes] = await Promise.all([
    db
      .from("campaigns")
      .select("id, merchant_id, product_id, commission_rate")
      .eq("id", input.campaign_id)
      .maybeSingle(),
    db
      .from("products")
      .select("id, merchant_id, commission_rate")
      .eq("id", input.product_id)
      .maybeSingle(),
  ]);

  if (campaignRes.error) {
    return {
      ok: false,
      statusCode: 500,
      error: `Lỗi truy vấn chiến dịch: ${campaignRes.error.message}`,
    };
  }
  if (productRes.error) {
    return {
      ok: false,
      statusCode: 500,
      error: `Lỗi truy vấn sản phẩm: ${productRes.error.message}`,
    };
  }

  const campaign = campaignRes.data;
  const product = productRes.data;

  if (!campaign) {
    return { ok: false, statusCode: 404, error: "Không tìm thấy chiến dịch." };
  }
  if (!product) {
    return { ok: false, statusCode: 404, error: "Không tìm thấy sản phẩm." };
  }
  if (campaign.product_id && campaign.product_id !== product.id) {
    return {
      ok: false,
      statusCode: 400,
      error: "product_id không khớp với sản phẩm thuộc chiến dịch.",
    };
  }

  const merchantId: string | null =
    campaign.merchant_id || product.merchant_id || input.merchant_id || null;
  if (!merchantId) {
    return {
      ok: false,
      statusCode: 400,
      error: "Không xác định được merchant_id của đơn hàng.",
    };
  }

  // Idempotency guard against duplicate webhook deliveries.
  const existingOrder = await findExistingOrderByBookingRef(
    db,
    merchantId,
    input.booking_reference,
  );
  if (existingOrder) {
    return formatDuplicateOrderResponse(existingOrder, input);
  }

  const rawRef = input.ref?.trim() || "";
  const isValidRefUuid = WEBHOOK_UUID_PATTERN.test(rawRef);

  let validReseller: {
    id: string;
    email?: string | null;
    phone?: string | null;
  } | null = null;

  if (isValidRefUuid) {
    const { data: resellerData, error: resellerError } = await db
      .from("resellers")
      .select("id, email, phone")
      .eq("id", rawRef)
      .maybeSingle();

    if (resellerError) {
      return {
        ok: false,
        statusCode: 500,
        error: `Lỗi truy vấn cộng tác viên: ${resellerError.message}`,
      };
    }
    validReseller = resellerData ?? null;
  }

  const emailMatches = Boolean(
    validReseller?.email &&
      input.customer_email &&
      validReseller.email.trim().toLowerCase() ===
        input.customer_email.trim().toLowerCase(),
  );
  const resellerPhone = normalizePhone(validReseller?.phone);
  const customerPhone = normalizePhone(input.customer_phone);
  const phoneMatches =
    resellerPhone.length > 6 &&
    customerPhone.length > 6 &&
    resellerPhone === customerPhone;

  const refInvalid = !validReseller;
  const isSelfPurchase = refInvalid || emailMatches || phoneMatches;

  const rawRate =
    Number(campaign.commission_rate) > 0
      ? Number(campaign.commission_rate)
      : Number(product.commission_rate) > 0
        ? Number(product.commission_rate)
        : DEFAULT_COMMISSION_RATE_PERCENT;
  const split = calculateCommissionSplit(input.amount, rawRate);

  const orderStatus = isSelfPurchase ? "pending" : "paid";
  const commissionStatus: "confirmed" | "pending" = isSelfPurchase
    ? "pending"
    : "confirmed";
  const heldOrZero = isSelfPurchase ? 0 : split.net_amount;

  const orderInsertPayload = {
    merchant_id: merchantId,
    product_id: product.id,
    campaign_id: campaign.id,
    reseller_id: validReseller ? validReseller.id : null,
    amount: input.amount,
    commission_rate: split.commission_rate,
    gross_commission: split.gross_commission,
    platform_fee: split.platform_fee,
    reseller_commission: validReseller ? split.net_amount : 0,
    commission_amount: validReseller ? split.net_amount : 0,
    booking_reference: input.booking_reference,
    customer_name: input.customer_name || null,
    customer_phone: input.customer_phone || null,
    currency: "VND",
    status: orderStatus,
    flag_self_purchase: isSelfPurchase,
    paid_at: isSelfPurchase ? null : new Date().toISOString(),
    notes: buildOrderNotes(input, refInvalid),
  };

  const { data: insertedOrder, error: orderInsertError } = await db
    .from("orders")
    .insert(orderInsertPayload)
    .select("id")
    .single();

  if (orderInsertError) {
    // Handle concurrent replay hitting unique index (merchant_id, booking_reference).
    if (orderInsertError.code === "23505") {
      const raced = await findExistingOrderByBookingRef(
        db,
        merchantId,
        input.booking_reference,
      );
      if (raced) {
        return formatDuplicateOrderResponse(raced, input, split.commission_rate);
      }
    }

    return {
      ok: false,
      statusCode: 500,
      error: `Không thể ghi nhận đơn hàng: ${orderInsertError.message}`,
    };
  }

  if (validReseller) {
    const { error: commissionError } = await db.from("commissions").insert({
      order_id: insertedOrder.id,
      reseller_id: validReseller.id,
      merchant_id: merchantId,
      campaign_id: campaign.id,
      gross_amount: split.gross_commission,
      platform_fee: split.platform_fee,
      net_amount: split.net_amount,
      status: commissionStatus,
    });

    if (commissionError && commissionError.code !== "23505") {
      return {
        ok: false,
        statusCode: 500,
        error: `Đã tạo đơn hàng nhưng lỗi ghi sổ hoa hồng: ${commissionError.message}`,
      };
    }
  }

  return {
    ok: true,
    statusCode: 200,
    body: {
      success: true,
      order_id: insertedOrder.id,
      external_order_id: input.order_id,
      booking_reference: input.booking_reference,
      commission_rate: split.commission_rate,
      gross_commission: split.gross_commission,
      platform_fee: split.platform_fee,
      reseller_commission: heldOrZero,
      flag_self_purchase: isSelfPurchase,
      status: commissionStatus,
    },
  };
}

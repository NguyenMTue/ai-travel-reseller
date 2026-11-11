import { NextResponse } from "next/server";

import { createAdminClient } from "@/src/lib/supabase/admin";
import {
  merchantOrderWebhookSchema,
  processMerchantOrderWebhook,
  verifyMerchantWebhookAuth,
} from "@/src/lib/webhooks/merchant-order";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/merchant/order
 * Receive confirmed payment notifications from merchant booking gateways,
 * enforce HMAC/Bearer authentication and self-purchase checks, then split 80/20 commissions.
 */
export async function POST(request: Request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể đọc nội dung webhook." },
      { status: 400 },
    );
  }

  const auth = verifyMerchantWebhookAuth(request.headers, rawBody);
  if (!auth.valid) {
    return NextResponse.json(
      { success: false, error: "Xác thực chữ ký webhook không hợp lệ." },
      { status: 401 },
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Payload webhook không đúng định dạng JSON." },
      { status: 400 },
    );
  }

  const parsed = merchantOrderWebhookSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Dữ liệu đơn hàng webhook không hợp lệ.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const adminClient = createAdminClient();
    const outcome = await processMerchantOrderWebhook(adminClient, parsed.data);

    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, error: outcome.error },
        { status: outcome.statusCode },
      );
    }

    return NextResponse.json(outcome.body, { status: outcome.statusCode });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: `Lỗi xử lý webhook đơn hàng: ${message}` },
      { status: 500 },
    );
  }
}


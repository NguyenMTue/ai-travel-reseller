import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

// In-memory cache for fast status checks and demo resilience
const paidOrdersCache = new Set<string>();

export function markOrderAsPaidInCache(orderId: string) {
  paidOrdersCache.add(orderId);
  paidOrdersCache.add(orderId.trim().toUpperCase());
}

export function isOrderPaidInCache(orderId: string): boolean {
  return paidOrdersCache.has(orderId) || paidOrdersCache.has(orderId.trim().toUpperCase());
}

const ORDER_REF_REGEX = /\b(TL-[A-Za-z0-9_-]+|ET-[A-Za-z0-9_-]+)\b/i;

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "TravelLink VietQR Banking Webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    // 1. Verify Secret Token if configured
    const webhookSecret = process.env.VIETQR_WEBHOOK_SECRET;
    const authHeader = request.headers.get("authorization");
    const secureTokenHeader = request.headers.get("secure-token");

    if (webhookSecret) {
      const providedToken =
        secureTokenHeader ||
        (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader);

      if (providedToken !== webhookSecret) {
        return NextResponse.json(
          { success: false, error: "Unauthorized webhook secret" },
          { status: 401 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));

    // Extract list of transactions (Casso format vs Single transaction format)
    const transactions: Array<{ description?: string; amount?: number; orderId?: string }> = [];

    if (Array.isArray(body.data)) {
      // Casso format: { error: 0, data: [...] }
      for (const item of body.data) {
        transactions.push({
          description: item.description || item.memo || item.content || "",
          amount: Number(item.amount) || 0,
        });
      }
    } else if (body.transactions && Array.isArray(body.transactions)) {
      for (const item of body.transactions) {
        transactions.push({
          description: item.description || item.memo || item.content || "",
          amount: Number(item.amount) || 0,
        });
      }
    } else {
      // Single payload format
      transactions.push({
        description: body.description || body.memo || body.content || "",
        amount: Number(body.amount || body.totalAmount) || 0,
        orderId: body.orderId || body.order_id,
      });
    }

    const processedOrders: string[] = [];

    for (const tx of transactions) {
      let matchedRef = tx.orderId ? tx.orderId.trim() : null;

      if (!matchedRef && tx.description) {
        const match = tx.description.match(ORDER_REF_REGEX);
        if (match) {
          matchedRef = match[1];
        }
      }

      if (!matchedRef && tx.description) {
        // Fallback: check if description directly equals or contains an ID
        const parts = tx.description.split(/\s+/);
        for (const part of parts) {
          if (part.toUpperCase().startsWith("TL-") || part.toUpperCase().startsWith("ET-")) {
            matchedRef = part;
            break;
          }
        }
      }

      if (!matchedRef) continue;

      const normalizedRef = matchedRef.trim().toUpperCase();
      markOrderAsPaidInCache(normalizedRef);
      markOrderAsPaidInCache(matchedRef);
      processedOrders.push(matchedRef);

      // Attempt Database update
      try {
        const adminClient = createAdminClient();

        // Find order by booking_reference
        const { data: orderRow } = await adminClient
          .from("orders")
          .select("id, status, reseller_id, amount, commission_amount")
          .or(`booking_reference.eq.${matchedRef},booking_reference.eq.${normalizedRef}`)
          .maybeSingle();

        if (orderRow) {
          // Update order status to paid
          await adminClient
            .from("orders")
            .update({
              status: "paid",
            })
            .eq("id", orderRow.id);

          // If commission exists and reseller is assigned, credit wallet if not already done
          if (orderRow.reseller_id && Number(orderRow.commission_amount) > 0) {
            await adminClient
              .from("commissions")
              .update({ status: "available" })
              .eq("order_id", orderRow.id)
              .eq("status", "pending");
          }
        }
      } catch (dbErr) {
        console.warn("[VIETQR_WEBHOOK] DB update skipped or in offline mode:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xử lý ${processedOrders.length} đơn hàng thành công qua VietQR Webhook`,
      processedOrders,
    });
  } catch (err: any) {
    console.error("[VIETQR_WEBHOOK] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Lỗi xử lý webhook" },
      { status: 500 }
    );
  }
}

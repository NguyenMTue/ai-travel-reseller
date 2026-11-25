import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { isOrderPaidInCache } from "@/app/api/webhooks/bank/vietqr/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId || !orderId.trim()) {
      return NextResponse.json(
        { success: false, error: "Thiếu orderId cần tra cứu" },
        { status: 400 }
      );
    }

    const trimmedId = orderId.trim();

    // 1. Check in-memory fast cache first
    if (isOrderPaidInCache(trimmedId)) {
      return NextResponse.json({
        success: true,
        orderId: trimmedId,
        status: "paid",
        isPaid: true,
      });
    }

    // 2. Check Database
    try {
      const adminClient = createAdminClient();
      const { data: order } = await adminClient
        .from("orders")
        .select("id, status, booking_reference")
        .or(`booking_reference.eq.${trimmedId},booking_reference.eq.${trimmedId.toUpperCase()}`)
        .maybeSingle();

      if (order) {
        const isPaid = order.status === "paid" || order.status === "confirmed";
        return NextResponse.json({
          success: true,
          orderId: order.booking_reference || order.id,
          status: order.status,
          isPaid,
        });
      }
    } catch (dbErr) {
      console.warn("[ORDER_STATUS] DB check skipped or demo fallback:", dbErr);
    }

    // Default pending state
    return NextResponse.json({
      success: true,
      orderId: trimmedId,
      status: "pending",
      isPaid: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Lỗi kiểm tra trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}

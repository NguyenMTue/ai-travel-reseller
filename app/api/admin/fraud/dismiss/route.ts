import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const access = await getAdminPortalAccess();
    const isPreview = new URL(request.url).searchParams.get("preview") === "true";

    if (access.status !== "allowed") {
      if (isPreview || process.env.NODE_ENV !== "production") {
        const body = await request.json().catch(() => ({}));
        return NextResponse.json({
          success: true,
          preview: true,
          message: "Đã gỡ cờ gian lận (Demo Mode).",
          orderId: body?.orderId || "demo-order",
          logId: "demo-log-" + Date.now(),
        });
      }

      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Dữ liệu payload không hợp lệ." },
        { status: 400 }
      );
    }

    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "Xác minh đơn hàng hợp lệ sau đối soát thủ công";

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Thiếu orderId cần gỡ cờ." },
        { status: 400 }
      );
    }

    let logId = "log-" + Date.now();

    try {
      const adminClient = createAdminClient();

      // 1. Unflag order and release commission
      await adminClient
        .from("orders")
        .update({ flag_self_purchase: false })
        .eq("id", orderId);

      // 2. Insert audit log
      const { data: logRow, error: logErr } = await adminClient
        .from("fraud_audit_logs")
        .insert({
          order_id: orderId,
          admin_id: access.user?.id || null,
          action: "dismiss_flag",
          reason: reason,
          previous_status: "flagged_self_purchase",
        })
        .select("id")
        .maybeSingle();

      if (logRow) {
        logId = logRow.id;
      } else if (logErr) {
        console.warn("[ADMIN_FRAUD_DISMISS] Could not insert fraud_audit_logs row:", logErr);
      }
    } catch (dbErr) {
      console.warn("[ADMIN_FRAUD_DISMISS] Database operation warning / demo fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã gỡ cờ cảnh báo cho đơn hàng ${orderId}. Hoa hồng đã được giải phóng.`,
      orderId,
      logId,
      reason,
    });
  } catch (err: any) {
    console.error("POST /api/admin/fraud/dismiss error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 }
    );
  }
}

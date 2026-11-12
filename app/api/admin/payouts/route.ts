import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import {
  getAdminPayoutRequests,
  processAdminPayoutAction,
} from "@/src/lib/admin/admin-service";
import { fixtureAdminPayouts } from "@/src/lib/admin/admin-fixtures";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getAdminPortalAccess();
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") || "all";
    const isPreview = url.searchParams.get("preview") === "true";

    if (access.status !== "allowed") {
      if (isPreview || process.env.NODE_ENV !== "production") {
        const filtered =
          statusParam === "all"
            ? fixtureAdminPayouts
            : fixtureAdminPayouts.filter((p) => p.status === statusParam);
        return NextResponse.json({
          success: true,
          preview: true,
          data: filtered,
        });
      }

      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const items = await getAdminPayoutRequests(supabase, {
      status: statusParam,
    });

    return NextResponse.json(
      { success: true, data: items },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    console.error("GET /api/admin/payouts error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await getAdminPortalAccess();

    if (access.status !== "allowed") {
      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 },
      );
    }

    const payoutId = typeof body.payout_id === "string" ? body.payout_id.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const adminNotes = typeof body.admin_notes === "string" ? body.admin_notes.trim() : undefined;
    const transferReference =
      typeof body.transfer_reference === "string" ? body.transfer_reference.trim() : undefined;

    if (!payoutId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh yêu cầu rút tiền (payout_id)." },
        { status: 400 },
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Hành động chỉ chấp nhận 'approve' hoặc 'reject'." },
        { status: 400 },
      );
    }

    if (action === "reject" && (!adminNotes || adminNotes.length < 5)) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập lý do từ chối tối thiểu 5 ký tự để phản hồi cho Reseller.",
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const result = await processAdminPayoutAction(supabase, {
      payoutId,
      action,
      adminId: access.admin.id,
      adminNotes,
      transferReference,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message, code: result.code },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/payouts error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 },
    );
  }
}

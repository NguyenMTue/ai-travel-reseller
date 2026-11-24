import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { toggleAdminPartnerStatus } from "@/src/lib/admin/admin-service";

export const dynamic = "force-dynamic";

async function handleStatusUpdate(request: Request) {
  try {
    const access = await getAdminPortalAccess();
    const isPreview = new URL(request.url).searchParams.get("preview") === "true";

    if (access.status !== "allowed") {
      if (isPreview || process.env.NODE_ENV !== "production") {
        const body = await request.json().catch(() => ({}));
        const nextStatus = body?.status || "suspended";
        return NextResponse.json({
          success: true,
          preview: true,
          message: `Đã cập nhật trạng thái đối tác sang ${nextStatus === "active" ? "Đang hoạt động" : "Tạm khóa"} (Demo Mode).`,
          partnerId: body?.partnerId || body?.partner_id,
          status: nextStatus,
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
        { success: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    // Support both param namings
    const partnerId =
      typeof body.partnerId === "string"
        ? body.partnerId.trim()
        : typeof body.partner_id === "string"
        ? body.partner_id.trim()
        : "";

    const roleRaw = body.role || body.partner_type;
    const partnerType =
      roleRaw === "merchant" || roleRaw === "reseller" ? roleRaw : null;

    const status =
      body.status === "active" || body.status === "suspended" ? body.status : null;

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!partnerId || !partnerType || !status) {
      return NextResponse.json(
        { success: false, error: "Thiếu partnerId, role hoặc status hợp lệ." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const result = await toggleAdminPartnerStatus(
      supabase,
      partnerId,
      partnerType,
      status
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      partnerId,
      role: partnerType,
      status,
      notes,
    });
  } catch (err: any) {
    console.error("Error in /api/admin/partners/status:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleStatusUpdate(request);
}

export async function PATCH(request: Request) {
  return handleStatusUpdate(request);
}

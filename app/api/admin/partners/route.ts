import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import {
  getAdminPartners,
  toggleAdminPartnerStatus,
} from "@/src/lib/admin/admin-service";
import { fixtureAdminPartners } from "@/src/lib/admin/admin-fixtures";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getAdminPortalAccess();
    const isPreview = new URL(request.url).searchParams.get("preview") === "true";

    if (access.status !== "allowed") {
      if (isPreview || process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          success: true,
          preview: true,
          data: fixtureAdminPartners,
        });
      }

      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const partners = await getAdminPartners(supabase);

    return NextResponse.json(
      { success: true, data: partners },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    console.error("GET /api/admin/partners error:", err);
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

    const partnerId = typeof body.partner_id === "string" ? body.partner_id.trim() : "";
    const partnerType = body.partner_type === "merchant" || body.partner_type === "reseller" ? body.partner_type : null;
    const status = body.status === "active" || body.status === "suspended" ? body.status : null;

    if (!partnerId || !partnerType || !status) {
      return NextResponse.json(
        { success: false, error: "Thiếu partner_id, partner_type hoặc status hợp lệ." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const result = await toggleAdminPartnerStatus(
      supabase,
      partnerId,
      partnerType,
      status,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/partners error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 },
    );
  }
}

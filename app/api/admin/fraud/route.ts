import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { getAdminFraudActivities } from "@/src/lib/admin/admin-service";
import {
  fixtureAdminFlaggedOrders,
  fixtureAdminBotClicks,
} from "@/src/lib/admin/admin-fixtures";

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
          data: {
            flaggedOrders: fixtureAdminFlaggedOrders,
            botClicks: fixtureAdminBotClicks,
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 },
      );
    }

    const supabase = createAdminClient();

    const fraudData = await getAdminFraudActivities(supabase);

    return NextResponse.json(
      { success: true, data: fraudData },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    console.error("GET /api/admin/fraud error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 },
    );
  }
}

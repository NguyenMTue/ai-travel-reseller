import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { getAdminSystemOverview } from "@/src/lib/admin/admin-service";
import { fixtureAdminOverview } from "@/src/lib/admin/admin-fixtures";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getAdminPortalAccess();

    if (access.status !== "allowed") {
      const isPreview = new URL(request.url).searchParams.get("preview") === "true";
      if (isPreview || process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          success: true,
          preview: true,
          data: fixtureAdminOverview,
        });
      }

      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Super Admin." },
        { status: access.status === "unauthenticated" ? 401 : 403 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const overview = await getAdminSystemOverview(supabase);

    return NextResponse.json(
      { success: true, data: overview },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    console.error("GET /api/admin/overview catch:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || err) },
      { status: 500 },
    );
  }
}

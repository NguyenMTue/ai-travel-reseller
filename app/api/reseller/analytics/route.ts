import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range")?.trim().toLowerCase() || "7d";
    const days = rangeParam === "30d" ? 30 : 7;

    // 1. Xác định reseller_id từ session cookie (ưu tiên bảo mật)
    let sessionUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabaseAuth = createClient(cookieStore);
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();
      if (user?.id) {
        sessionUserId = user.id;
      }
    } catch {
      // Tiếp tục nếu không có cookie
    }

    const requestedResellerId =
      searchParams.get("reseller_id")?.trim() ||
      request.headers.get("x-reseller-id")?.trim() ||
      "";

    let resellerId = "";

    if (sessionUserId) {
      if (requestedResellerId && requestedResellerId !== sessionUserId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot view analytics for other resellers" },
          { status: 403 },
        );
      }
      resellerId = sessionUserId;
    } else if (
      process.env.NODE_ENV !== "production" &&
      requestedResellerId &&
      UUID_PATTERN.test(requestedResellerId)
    ) {
      // CHỈ cho phép query param / header khi chạy test nội bộ ngoài production
      resellerId = requestedResellerId;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Reseller session required",
        },
        { status: 401 },
      );
    }

    const adminClient = createAdminClient();

    // 2. Thực thi đồng thời 4 hàm Postgres RPC tốc độ cao
    const [overviewRes, timeseriesRes, topCampaignsRes, devicesRes] = await Promise.all([
      adminClient.rpc("get_reseller_overview_stats", { p_reseller_id: resellerId }),
      adminClient.rpc("get_reseller_click_timeseries", { p_reseller_id: resellerId, p_days: days }),
      adminClient.rpc("get_reseller_top_campaigns", { p_reseller_id: resellerId, p_limit: 5 }),
      adminClient.rpc("get_reseller_device_stats", { p_reseller_id: resellerId }),
    ]);

    // Kiểm tra lỗi nếu có RPC function thất bại
    if (overviewRes.error) {
      console.error("[API Reseller Analytics] Lỗi get_reseller_overview_stats:", overviewRes.error);
    }
    if (timeseriesRes.error) {
      console.error("[API Reseller Analytics] Lỗi get_reseller_click_timeseries:", timeseriesRes.error);
    }
    if (topCampaignsRes.error) {
      console.error("[API Reseller Analytics] Lỗi get_reseller_top_campaigns:", topCampaignsRes.error);
    }
    if (devicesRes.error) {
      console.error("[API Reseller Analytics] Lỗi get_reseller_device_stats:", devicesRes.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        reseller_id: resellerId,
        range: `${days}d`,
        overview: overviewRes.data || {
          total_links: 0,
          active_links: 0,
          total_clicks: 0,
          valid_clicks: 0,
          bot_clicks: 0,
          invalid_clicks: 0,
          bot_ratio_percentage: 0,
        },
        timeseries: timeseriesRes.data || [],
        top_campaigns: topCampaignsRes.data || [],
        device_breakdown: devicesRes.data || {
          total_valid_clicks: 0,
          devices: [],
          operating_systems: [],
          browsers: [],
        },
      },
    });
  } catch (error) {
    console.error("[API Reseller Analytics] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

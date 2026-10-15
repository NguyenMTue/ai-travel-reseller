import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    // 1. Xác định reseller_id từ session cookie, query param hoặc header
    let resellerId = searchParams.get("reseller_id")?.trim() || "";

    if (!resellerId) {
      try {
        const cookieStore = await cookies();
        const supabaseAuth = createClient(cookieStore);
        const {
          data: { user },
        } = await supabaseAuth.auth.getUser();
        if (user?.id) {
          resellerId = user.id;
        }
      } catch {
        // Tiếp tục nếu không có cookie
      }
    }

    if (!resellerId) {
      const headerResellerId = request.headers.get("x-reseller-id")?.trim();
      if (headerResellerId) {
        resellerId = headerResellerId;
      }
    }

    if (!resellerId || !UUID_PATTERN.test(resellerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Reseller session required or valid 'reseller_id' query param missing",
        },
        { status: 401 },
      );
    }

    const adminClient = createAdminClient();

    // 2. Truy vấn danh sách link tiếp thị của Reseller kèm thông tin chiến dịch & sản phẩm
    const { data: links, count, error } = await adminClient
      .from("affiliate_links")
      .select(
        `
        id,
        unique_code,
        short_url,
        destination_url,
        clicks_count,
        is_active,
        created_at,
        updated_at,
        campaign:campaigns (
          id,
          name,
          commission_rate,
          status
        ),
        product:products (
          id,
          name,
          category,
          original_price,
          sale_price,
          payment_url
        )
      `,
        { count: "exact" },
      )
      .eq("reseller_id", resellerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[API Reseller Links] Lỗi truy vấn database:", error);
      return NextResponse.json(
        { success: false, error: "Database error while fetching affiliate links" },
        { status: 500 },
      );
    }

    const totalCount = count ?? 0;

    return NextResponse.json({
      success: true,
      data: links || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[API Reseller Links] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

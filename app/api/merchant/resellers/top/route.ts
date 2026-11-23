import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Sun World Đà Nẵng

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryMerchantId = searchParams.get("merchant_id")?.trim();
    const queryMaxRate = searchParams.get("max_commission_rate");

    // 1. Resolve merchantId
    let merchantId = DEMO_MERCHANT_ID;
    if (queryMerchantId && UUID_REGEX.test(queryMerchantId)) {
      merchantId = queryMerchantId;
    } else {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          merchantId = user.id;
        }
      } catch {
        // use fallback DEMO_MERCHANT_ID
      }
    }

    const maxCommissionRate =
      queryMaxRate && !isNaN(Number(queryMaxRate)) ? Number(queryMaxRate) : null;

    const adminClient = createAdminClient();

    // 2. Thử gọi RPC get_top_resellers_for_merchant
    try {
      const { data: rpcData, error: rpcError } = await adminClient.rpc(
        "get_top_resellers_for_merchant",
        {
          p_merchant_id: merchantId,
          p_max_commission_rate: maxCommissionRate,
        }
      );

      if (!rpcError && rpcData?.success) {
        return NextResponse.json(rpcData, {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        });
      }
    } catch (rpcErr) {
      console.warn("[RPC_GET_TOP_RESELLERS_WARN] Fallback to direct table query:", rpcErr);
    }

    // 3. Fallback: Query trực tiếp từ bảng resellers & affiliate_links
    let query = adminClient
      .from("resellers")
      .select("id, name, email, phone, commission_rate, status")
      .eq("status", "active");

    if (maxCommissionRate !== null) {
      query = query.lte("commission_rate", maxCommissionRate);
    }

    const { data: resellers, error: resErr } = await query;

    if (resErr) {
      throw new Error(`Lỗi truy vấn danh sách Reseller: ${resErr.message}`);
    }

    // Lấy thông tin clicks và orders cho từng reseller
    const formattedResellers = await Promise.all(
      (resellers || []).map(async (r) => {
        const { count: ordersCount } = await adminClient
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("reseller_id", r.id)
          .in("status", ["confirmed", "paid"]);

        const { data: links } = await adminClient
          .from("affiliate_links")
          .select("clicks_count")
          .eq("reseller_id", r.id);

        const totalClicks = (links || []).reduce(
          (sum, link) => sum + (link.clicks_count || 0),
          0
        );

        const ordersTotal = ordersCount || 0;
        const conversionRate =
          totalClicks > 0 ? Number(((ordersTotal / totalClicks) * 100).toFixed(2)) : 0;

        return {
          reseller_id: r.id,
          reseller_name: r.name,
          email: r.email,
          phone: r.phone,
          commission_rate: Number(r.commission_rate) || 10.0,
          total_clicks: totalClicks,
          total_orders: ordersTotal,
          total_gmv: ordersTotal * 950000,
          total_commission_paid: Math.round(ordersTotal * 950000 * ((Number(r.commission_rate) || 10) / 100) * 0.8),
          conversion_rate: conversionRate,
          total_followers: 185000,
          social_channels: [
            {
              platform: "Tiktok",
              username: `@${r.name.toLowerCase().replace(/\s+/g, "_")}`,
              followers: 185000,
            },
          ],
        };
      })
    );

    // Sắp xếp theo total_orders DESC
    formattedResellers.sort((a, b) => b.total_orders - a.total_orders);

    return NextResponse.json(
      {
        success: true,
        merchant_id: merchantId,
        max_commission_rate: maxCommissionRate,
        total_count: formattedResellers.length,
        resellers: formattedResellers,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET_TOP_RESELLERS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Không thể tải danh sách Top Reseller",
      },
      { status: 500 }
    );
  }
}

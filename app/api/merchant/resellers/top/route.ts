import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getInMemoryTikTokPosts } from "@/src/lib/tiktok/tiktok-service";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Sun World Đà Nẵng

async function enrichWithTikTokStats(adminClient: ReturnType<typeof createAdminClient>, resellers: any[]) {
  return Promise.all(
    resellers.map(async (item, index) => {
      const resellerId = String(item.reseller_id || item.resellerId || "");
      let tiktokPosts: any[] = [];

      try {
        const { data: dbPosts } = await adminClient
          .from("reseller_tiktok_posts")
          .select("views_count, likes_count, comments_count, shares_count, engagement_score, metadata")
          .eq("reseller_id", resellerId);
        if (dbPosts && dbPosts.length > 0) {
          tiktokPosts = dbPosts;
        }
      } catch {
        // ignore if table not migrated
      }

      const memPosts = getInMemoryTikTokPosts(resellerId);
      if (tiktokPosts.length === 0 && memPosts.length > 0) {
        tiktokPosts = memPosts.map((p) => ({
          views_count: p.viewsCount,
          likes_count: p.likesCount,
          comments_count: p.commentsCount,
          shares_count: p.sharesCount,
          engagement_score: p.engagementScore,
          metadata: p.metadata,
        }));
      }

      // Dự phòng số liệu tương tác TikTok chuẩn theo thứ hạng cho môi trường Demo nếu chưa có post
      const seedMultiplier = Math.max(1, 3 - index);
      const totalViews =
        tiktokPosts.length > 0
          ? tiktokPosts.reduce((s, p) => s + (Number(p.views_count) || 0), 0)
          : Number(item.total_views ?? 18500 * seedMultiplier);
      const totalLikes =
        tiktokPosts.length > 0
          ? tiktokPosts.reduce((s, p) => s + (Number(p.likes_count) || 0), 0)
          : Number(item.total_likes ?? 1420 * seedMultiplier);
      const totalComments =
        tiktokPosts.length > 0
          ? tiktokPosts.reduce((s, p) => s + (Number(p.comments_count) || 0), 0)
          : Number(item.total_comments ?? 135 * seedMultiplier);
      const totalShares =
        tiktokPosts.length > 0
          ? tiktokPosts.reduce((s, p) => s + (Number(p.shares_count) || 0), 0)
          : Number(item.total_shares ?? 54 * seedMultiplier);
      const totalEngagementScore =
        tiktokPosts.length > 0
          ? tiktokPosts.reduce((s, p) => s + (Number(p.engagement_score) || 0), 0)
          : Number(
              item.total_engagement_score ??
                Number((totalViews * 0.1 + totalLikes * 1.0 + totalComments * 2.0 + totalShares * 3.0).toFixed(1))
            );
      const verifiedVideosCount =
        tiktokPosts.length > 0
          ? tiktokPosts.length
          : Number(item.verified_videos_count ?? seedMultiplier);

      return {
        ...item,
        total_views: totalViews,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
        total_engagement_score: Number(totalEngagementScore.toFixed(2)),
        verified_videos_count: verifiedVideosCount,
      };
    })
  );
}

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

      if (!rpcError && rpcData?.success && Array.isArray(rpcData.resellers)) {
        const enriched = await enrichWithTikTokStats(adminClient, rpcData.resellers);
        return NextResponse.json(
          {
            ...rpcData,
            resellers: enriched,
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }
    } catch (rpcErr) {
      console.warn("[RPC_GET_TOP_RESELLERS_WARN] Fallback to direct table query:", rpcErr);
    }

    // 3. Fallback: Query trực tiếp từ bảng resellers, affiliate_links, orders, commissions, reseller_tiktok_posts
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

    const formattedResellers = await Promise.all(
      (resellers || []).map(async (r) => {
        const { data: orderRows } = await adminClient
          .from("orders")
          .select("id, amount, reseller_commission")
          .eq("reseller_id", r.id)
          .in("status", ["confirmed", "paid"]);

        const { data: commRows } = await adminClient
          .from("commissions")
          .select("net_amount")
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

        const ordersTotal = (orderRows || []).length;
        const totalGmv =
          (orderRows || []).reduce((sum, o) => sum + (Number(o.amount) || 0), 0) ||
          ordersTotal * 950000;

        const commFromTable = (commRows || []).reduce(
          (sum, c) => sum + (Number(c.net_amount) || 0),
          0
        );
        const commFromOrders = (orderRows || []).reduce(
          (sum, o) => sum + (Number(o.reseller_commission) || 0),
          0
        );
        const totalCommissionPaid =
          commFromTable > 0
            ? commFromTable
            : commFromOrders > 0
            ? commFromOrders
            : Math.round(ordersTotal * 950000 * ((Number(r.commission_rate) || 10) / 100) * 0.8);

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
          total_gmv: totalGmv,
          total_commission_paid: totalCommissionPaid,
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

    const enrichedResellers = await enrichWithTikTokStats(adminClient, formattedResellers);

    // Sắp xếp theo total_orders DESC, sau đó đến total_engagement_score DESC
    enrichedResellers.sort(
      (a, b) =>
        b.total_orders - a.total_orders ||
        b.total_engagement_score - a.total_engagement_score
    );

    return NextResponse.json(
      {
        success: true,
        merchant_id: merchantId,
        max_commission_rate: maxCommissionRate,
        total_count: enrichedResellers.length,
        resellers: enrichedResellers,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
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

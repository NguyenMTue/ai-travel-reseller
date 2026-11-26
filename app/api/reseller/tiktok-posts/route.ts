import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import {
  getInMemoryTikTokPosts,
  isValidTikTokUrl,
  registerResellerTikTokPost,
  simulateTikTokPostActivity,
  verifyTikTokVideoContent,
} from "@/src/lib/tiktok/tiktok-service";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const DEMO_RESELLER_ID = "22222222-2222-2222-2222-111111111111"; // Travel Vlogger Danang

interface CachedGetResult {
  data: any;
  cachedAt: number;
}
const tiktokGetCache = new Map<string, CachedGetResult>();
const GET_CACHE_TTL_MS = 15 * 60 * 1000; // 15 phút (BE1-RESELL-02)

function invalidateResellerCache(resellerId: string) {
  for (const key of tiktokGetCache.keys()) {
    if (key.startsWith(`${resellerId}:`)) {
      tiktokGetCache.delete(key);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body.tiktokUrl || body.tiktok_url || body.url;

    if (!rawUrl || typeof rawUrl !== "string" || !isValidTikTokUrl(rawUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vui lòng cung cấp link video TikTok hợp lệ (dạng https://www.tiktok.com/@user/video/... hoặc https://vt.tiktok.com/...)",
        },
        { status: 400 }
      );
    }

    // Resolve resellerId
    let resellerId = DEMO_RESELLER_ID;
    const rawResellerId = body.resellerId || body.reseller_id;
    if (typeof rawResellerId === "string" && UUID_REGEX.test(rawResellerId.trim())) {
      resellerId = rawResellerId.trim();
    } else {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          resellerId = user.id;
        }
      } catch {
        // use fallback
      }
    }

    const rawCampaignId = body.campaignId || body.campaign_id;
    const campaignId =
      typeof rawCampaignId === "string" && UUID_REGEX.test(rawCampaignId.trim())
        ? rawCampaignId.trim()
        : null;

    const rawContentId = body.contentId || body.content_id;
    const contentId =
      typeof rawContentId === "string" && UUID_REGEX.test(rawContentId.trim())
        ? rawContentId.trim()
        : null;

    const result = await registerResellerTikTokPost({
      resellerId,
      campaignId,
      contentId,
      tiktokUrl: rawUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          verification: result.verification,
        },
        { status: 422 }
      );
    }

    invalidateResellerCache(resellerId);

    return NextResponse.json(
      {
        success: true,
        post: result.post,
        engagementScore: result.engagementScore,
        verification: result.verification,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[TIKTOK_POST_CREATE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Không thể phân tích link TikTok lúc này",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reseller/tiktok-posts
 * Giả lập tăng tương tác Viral hoặc Khách Click & Đặt Vé từ Video TikTok (Dev Mode Simulator)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    const action =
      body.action === "link_clicks_and_orders"
        ? "link_clicks_and_orders"
        : "viral_engagement";

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã bài đăng TikTok (postId) cần mô phỏng." },
        { status: 400 }
      );
    }

    let resellerId = DEMO_RESELLER_ID;
    const rawResellerId = body.resellerId || body.reseller_id;
    if (typeof rawResellerId === "string" && UUID_REGEX.test(rawResellerId.trim())) {
      resellerId = rawResellerId.trim();
    } else {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          resellerId = user.id;
        }
      } catch {
        // use fallback
      }
    }

    const rawCampaignId = body.campaignId || body.campaign_id;
    const campaignId =
      typeof rawCampaignId === "string" && UUID_REGEX.test(rawCampaignId.trim())
        ? rawCampaignId.trim()
        : null;

    const simResult = await simulateTikTokPostActivity({
      postId,
      resellerId,
      campaignId,
      action,
      viewsDelta: typeof body.viewsDelta === "number" ? body.viewsDelta : undefined,
      likesDelta: typeof body.likesDelta === "number" ? body.likesDelta : undefined,
      commentsDelta: typeof body.commentsDelta === "number" ? body.commentsDelta : undefined,
      sharesDelta: typeof body.sharesDelta === "number" ? body.sharesDelta : undefined,
      clicksDelta: typeof body.clicksDelta === "number" ? body.clicksDelta : undefined,
      ordersDelta: typeof body.ordersDelta === "number" ? body.ordersDelta : undefined,
    });

    if (!simResult.success) {
      return NextResponse.json(
        { success: false, error: simResult.error || "Không thể mô phỏng tương tác" },
        { status: 422 }
      );
    }

    invalidateResellerCache(resellerId);

    return NextResponse.json(
      {
        success: true,
        post: simResult.post,
        message: simResult.message,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[TIKTOK_POST_SIMULATE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Lỗi mô phỏng tương tác video TikTok",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResellerId = searchParams.get("reseller_id");
    const queryCampaignId = searchParams.get("campaign_id");

    let resellerId = DEMO_RESELLER_ID;
    if (queryResellerId && UUID_REGEX.test(queryResellerId.trim())) {
      resellerId = queryResellerId.trim();
    } else {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          resellerId = user.id;
        }
      } catch {
        // use fallback
      }
    }

    const cacheKey = `${resellerId}:${queryCampaignId || "all"}`;
    const cached = tiktokGetCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < GET_CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT", "Cache-Control": "private, no-store" },
      });
    }

    const adminClient = createAdminClient();

    // Lấy thống kê Clicks & Orders thực tế từ DB cho Reseller này
    let dbClicksTotal = 0;
    let dbOrdersTotal = 0;
    let dbCommissionTotal = 0;
    try {
      let linksQuery = adminClient
        .from("affiliate_links")
        .select("clicks_count")
        .eq("reseller_id", resellerId);
      if (queryCampaignId && UUID_REGEX.test(queryCampaignId.trim())) {
        linksQuery = linksQuery.eq("campaign_id", queryCampaignId.trim());
      }
      const { data: linkRows } = await linksQuery;
      dbClicksTotal = (linkRows || []).reduce(
        (sum, r) => sum + (Number(r.clicks_count) || 0),
        0
      );

      let ordersQuery = adminClient
        .from("orders")
        .select("id, reseller_commission")
        .eq("reseller_id", resellerId)
        .in("status", ["confirmed", "paid"]);
      if (queryCampaignId && UUID_REGEX.test(queryCampaignId.trim())) {
        ordersQuery = ordersQuery.eq("campaign_id", queryCampaignId.trim());
      }
      const { data: orderRows } = await ordersQuery;
      dbOrdersTotal = (orderRows || []).length;
      dbCommissionTotal = (orderRows || []).reduce(
        (sum, r) => sum + (Number(r.reseller_commission) || 0),
        0
      );
    } catch {
      // ignore
    }

    let query = adminClient
      .from("reseller_tiktok_posts")
      .select("*")
      .eq("reseller_id", resellerId)
      .order("created_at", { ascending: false });

    if (queryCampaignId && UUID_REGEX.test(queryCampaignId.trim())) {
      query = query.eq("campaign_id", queryCampaignId.trim());
    }

    const { data: rows, error } = await query;

    if (error) {
      console.warn("[TIKTOK_POST_GET_WARN] Fallback simulated rows:", error.message);
      const memoryRows = getInMemoryTikTokPosts(resellerId, queryCampaignId);
      const fallbackPosts =
        memoryRows.length > 0
          ? memoryRows
          : [
              {
                id: "mock_tt_1",
                reseller_id: resellerId,
                campaign_id: queryCampaignId || "44444444-4444-4444-4444-444444444444",
                tiktok_url:
                  "https://www.tiktok.com/@danang_traveler/video/732819283719?tl_sig=TL_444444",
                title: "Trải nghiệm Cầu Vàng Bà Nà Hills săn mây sáng sớm #TL_444444",
                views_count: 24500,
                likes_count: 1850,
                comments_count: 142,
                shares_count: 68,
                engagement_score: 4788.0,
                clicks_count: dbClicksTotal || 186,
                orders_count: dbOrdersTotal || 14,
                commission_earned: dbCommissionTotal || 1596000,
                verification: verifyTikTokVideoContent({
                  tiktokUrl:
                    "https://www.tiktok.com/@danang_traveler/video/732819283719?tl_sig=TL_444444",
                  campaignId: queryCampaignId || "44444444-4444-4444-4444-444444444444",
                }),
                status: "verified",
                created_at: new Date().toISOString(),
              },
            ];

      return NextResponse.json({
        success: true,
        reseller_id: resellerId,
        posts: fallbackPosts,
        summary: {
          total_posts: fallbackPosts.length,
          total_views: fallbackPosts.reduce((s, p: any) => s + Number(p.views_count ?? p.viewsCount ?? 0), 0),
          total_likes: fallbackPosts.reduce((s, p: any) => s + Number(p.likes_count ?? p.likesCount ?? 0), 0),
          total_comments: fallbackPosts.reduce((s, p: any) => s + Number(p.comments_count ?? p.commentsCount ?? 0), 0),
          total_shares: fallbackPosts.reduce((s, p: any) => s + Number(p.shares_count ?? p.sharesCount ?? 0), 0),
          total_engagement_score: fallbackPosts.reduce(
            (s, p: any) => s + Number(p.engagement_score ?? p.engagementScore ?? 0),
            0
          ),
          total_clicks: fallbackPosts.reduce((s, p: any) => s + Number(p.clicks_count ?? p.clicksCount ?? 0), 0),
          total_orders: fallbackPosts.reduce((s, p: any) => s + Number(p.orders_count ?? p.ordersCount ?? 0), 0),
          total_commission_earned: fallbackPosts.reduce(
            (s, p: any) => s + Number(p.commission_earned ?? p.commissionEarned ?? 0),
            0
          ),
        },
      });
    }

    const posts = (rows || []).map((p: any) => {
      const meta = p.metadata && typeof p.metadata === "object" ? p.metadata : {};
      const clicksCount = Number(meta.clicks_count ?? (dbClicksTotal || Math.max(15, Math.round((Number(p.views_count) || 1000) * 0.01))));
      const ordersCount = Number(meta.orders_count ?? (dbOrdersTotal || Math.max(1, Math.round(clicksCount * 0.08))));
      const commissionEarned = Number(meta.commission_earned ?? (dbCommissionTotal || ordersCount * 114000));
      const verification =
        meta.verification ||
        verifyTikTokVideoContent({
          tiktokUrl: p.tiktok_url || "",
          contentId: p.content_id,
          campaignId: p.campaign_id,
        });

      return {
        ...p,
        clicks_count: clicksCount,
        orders_count: ordersCount,
        commission_earned: commissionEarned,
        verification,
      };
    });

    const totalViews = posts.reduce((sum, p) => sum + (Number(p.views_count) || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (Number(p.likes_count) || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (Number(p.comments_count) || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (Number(p.shares_count) || 0), 0);
    const totalEngagement = posts.reduce(
      (sum, p) => sum + (Number(p.engagement_score) || 0),
      0
    );
    const totalClicks = posts.reduce((sum, p) => sum + (Number(p.clicks_count) || 0), 0);
    const totalOrders = posts.reduce((sum, p) => sum + (Number(p.orders_count) || 0), 0);
    const totalCommission = posts.reduce(
      (sum, p) => sum + (Number(p.commission_earned) || 0),
      0
    );

    const responsePayload = {
      success: true,
      reseller_id: resellerId,
      posts,
      summary: {
        total_posts: posts.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
        total_engagement_score: Number(totalEngagement.toFixed(2)),
        total_clicks: totalClicks,
        total_orders: totalOrders,
        total_commission_earned: totalCommission,
      },
    };

    tiktokGetCache.set(cacheKey, { data: responsePayload, cachedAt: Date.now() });

    return NextResponse.json(responsePayload, {
      headers: { "X-Cache": "MISS", "Cache-Control": "private, no-store" },
    });
  } catch (error: any) {
    console.error("[TIKTOK_POSTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi truy vấn danh sách bài đăng TikTok" },
      { status: 500 }
    );
  }
}

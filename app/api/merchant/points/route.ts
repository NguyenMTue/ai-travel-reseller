import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Sun World Đà Nẵng

/**
 * GET: Lấy thông tin ví điểm thưởng, hạng thành viên và quyền lợi của Merchant
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryMerchantId = searchParams.get("merchant_id");

    let merchantId = DEMO_MERCHANT_ID;
    if (queryMerchantId && UUID_REGEX.test(queryMerchantId.trim())) {
      merchantId = queryMerchantId.trim();
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
        // fallback
      }
    }

    const adminClient = createAdminClient();

    // 1. Thử gọi RPC get_merchant_points_summary
    try {
      const { data: rpcData, error: rpcError } = await adminClient.rpc(
        "get_merchant_points_summary",
        { p_merchant_id: merchantId }
      );

      if (!rpcError && rpcData) {
        return NextResponse.json(
          { success: true, ...rpcData },
          {
            status: 200,
            headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
          }
        );
      }
    } catch (rpcErr) {
      console.warn("[RPC_GET_MERCHANT_POINTS_WARN] Fallback table lookup:", rpcErr);
    }

    // 2. Fallback: Query trực tiếp từ bảng merchant_points
    const { data: row } = await adminClient
      .from("merchant_points")
      .select("*")
      .eq("merchant_id", merchantId)
      .maybeSingle();

    if (row) {
      return NextResponse.json({
        success: true,
        merchant_id: merchantId,
        points_balance: Number(row.points_balance) || 0,
        lifetime_points: Number(row.lifetime_points) || 0,
        tier: row.tier || "silver",
        platform_fee_discount_percent: Number(row.platform_fee_discount_percent) || 0.0,
        tier_benefits: {
          fee_discount: `${row.platform_fee_discount_percent || 0}%`,
          visibility_priority:
            row.tier === "diamond"
              ? "Top 1 Bảng Tin Reseller"
              : row.tier === "gold"
              ? "Ưu Tiên Đề Xuất Nổi Bật"
              : "Tiêu chuẩn",
          badge:
            row.tier === "diamond"
              ? "Đối Tác Kim Cương"
              : row.tier === "gold"
              ? "Đối Tác Vàng"
              : "Đối Tác Bạc",
        },
        history: row.history || [],
      });
    }

    // Default Silver nếu chưa có điểm
    return NextResponse.json({
      success: true,
      merchant_id: merchantId,
      points_balance: 0,
      lifetime_points: 0,
      tier: "silver",
      platform_fee_discount_percent: 0.0,
      tier_benefits: {
        fee_discount: "0%",
        visibility_priority: "Tiêu chuẩn",
        badge: "Thành viên Bạc",
      },
      history: [],
    });
  } catch (error: any) {
    console.error("[MERCHANT_POINTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể tải điểm thưởng của Merchant" },
      { status: 500 }
    );
  }
}

/**
 * POST: Tích điểm thưởng cho Merchant khi video review/chiến dịch đạt mốc tương tác
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    let merchantId = DEMO_MERCHANT_ID;
    const rawMerchantId = body.merchantId || body.merchant_id;
    if (typeof rawMerchantId === "string" && UUID_REGEX.test(rawMerchantId.trim())) {
      merchantId = rawMerchantId.trim();
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
        // Fallback DEMO_MERCHANT_ID
      }
    }

    const adminClient = createAdminClient();

    if (body.action === "redeem_discount") {
      const redeemPoints = Math.max(1, Math.floor(Number(body.points) || 50));
      const { data: currentRow, error: readErr } = await adminClient
        .from("merchant_points")
        .select("*")
        .eq("merchant_id", merchantId)
        .maybeSingle();

      if (readErr) {
        return NextResponse.json(
          { success: false, error: "Không thể đọc số dư điểm: " + readErr.message },
          { status: 500 }
        );
      }

      const currentBalance = Number(currentRow?.points_balance ?? 0);
      if (currentBalance < redeemPoints) {
        return NextResponse.json(
          { success: false, error: "Số dư điểm không đủ để quy đổi." },
          { status: 400 }
        );
      }

      const newBalance = currentBalance - redeemPoints;
      const prevHistory = Array.isArray(currentRow?.history) ? currentRow.history : [];
      const nextHistory = [
        {
          id: "redeem-" + Date.now(),
          points: -redeemPoints,
          type: "redeem_discount",
          description: `Đổi ${redeemPoints} điểm lấy ưu đãi giảm phí sàn`,
          created_at: new Date().toISOString(),
        },
        ...prevHistory,
      ].slice(0, 50);

      const { error: updateErr } = await adminClient
        .from("merchant_points")
        .update({
          points_balance: newBalance,
          history: nextHistory,
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", merchantId);

      if (updateErr) {
        return NextResponse.json(
          { success: false, error: "Lỗi cập nhật điểm thưởng: " + updateErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        merchant_id: merchantId,
        newBalance,
        points_balance: newBalance,
        message: `Đã đổi ${redeemPoints} điểm thành công.`,
      });
    }

    const rawContentId = body.contentId || body.content_id;
    const contentId =
      typeof rawContentId === "string" && UUID_REGEX.test(rawContentId.trim())
        ? rawContentId.trim()
        : null;

    const views = Math.max(0, Number(body.views || body.views_count) || 0);
    const likes = Math.max(0, Number(body.likes || body.likes_count) || 0);
    const comments = Math.max(0, Number(body.comments || body.comments_count) || 0);
    const shares = Math.max(0, Number(body.shares || body.shares_count) || 0);
    const reason = body.reason || "Video tự tạo đạt mốc tương tác cao";

    // 1. Thử gọi RPC award_merchant_video_points
    try {
      const { data: rpcData, error: rpcError } = await adminClient.rpc(
        "award_merchant_video_points",
        {
          p_merchant_id: merchantId,
          p_content_id: contentId,
          p_views: views,
          p_likes: likes,
          p_comments: comments,
          p_shares: shares,
          p_reason: reason,
        }
      );

      if (!rpcError && rpcData?.success) {
        return NextResponse.json(rpcData, { status: 200 });
      }
    } catch (rpcErr) {
      console.warn("[RPC_AWARD_MERCHANT_POINTS_WARN] Fallback in-memory:", rpcErr);
    }

    // 2. Fallback in-memory logic
    const pointsFromViews = Math.floor(views / 1000) * 10;
    const pointsFromLikes = Math.floor(likes / 100) * 15;
    const pointsFromComments = Math.floor(comments / 50) * 20;
    const pointsFromShares = Math.floor(shares / 20) * 25;
    let earnedPoints = pointsFromViews + pointsFromLikes + pointsFromComments + pointsFromShares;
    if (earnedPoints <= 0 && (views > 100 || likes > 10)) {
      earnedPoints = 10;
    }

    const newBalance = earnedPoints + 150;
    const tier = newBalance >= 2000 ? "diamond" : newBalance >= 500 ? "gold" : "silver";
    const discount = tier === "diamond" ? 3.0 : tier === "gold" ? 1.0 : 0.0;

    return NextResponse.json(
      {
        success: true,
        merchant_id: merchantId,
        earned_points: earnedPoints,
        points_balance: newBalance,
        lifetime_points: newBalance,
        tier,
        platform_fee_discount_percent: discount,
        message: `Đã cộng thành công ${earnedPoints} điểm thưởng cho đối tác.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MERCHANT_POINTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể tích điểm thưởng cho Merchant" },
      { status: 500 }
    );
  }
}

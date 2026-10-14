import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { parseUserAgent } from "@/src/lib/tracking/ua-parser";
import { checkClickRateLimit } from "@/src/lib/tracking/rate-limiter";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const cleanCode = typeof code === "string" ? code.trim() : "";

    if (!cleanCode) {
      return NextResponse.redirect(new URL("/?error=invalid_tracking_code", request.url), 302);
    }

    const adminClient = createAdminClient();

    // 1. Tìm thông tin link tiếp thị từ unique_code
    const { data: link, error } = await adminClient
      .from("affiliate_links")
      .select("id, destination_url, is_active, reseller_id, campaign_id, product_id")
      .eq("unique_code", cleanCode)
      .maybeSingle();

    if (error || !link || !link.is_active) {
      return NextResponse.redirect(
        new URL("/?error=link_not_found_or_inactive", request.url),
        302,
      );
    }

    // 2. Trích xuất thông tin Client & Phân tích User-Agent / Chống click tặc
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim().slice(0, 45)
      : (request.headers.get("x-real-ip")?.trim().slice(0, 45) || null);
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;

    // Phân tích User-Agent (Thiết bị, OS, Trình duyệt, Nhận diện Bot crawler)
    const uaInfo = parseUserAgent(userAgent);

    // Kiểm tra Rate Limiting (Cùng 1 IP bấm > 10 lần trong 1 phút thì đánh dấu không hợp lệ)
    const rateLimit = checkClickRateLimit(ipAddress, link.id);

    // 3. Ghi nhận bất đồng bộ lượt click vào bảng `clicks`
    // Sử dụng khối try/catch riêng để đảm bảo lỗi ghi click không bao giờ làm gián đoạn chuyển hướng của khách
    try {
      const { error: clickErr } = await adminClient.from("clicks").insert({
        link_id: link.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        device_type: uaInfo.deviceType,
        os: uaInfo.os,
        browser: uaInfo.browser,
        is_bot: uaInfo.isBot,
        bot_name: uaInfo.botName,
        is_valid: rateLimit.isValid,
        invalid_reason: rateLimit.invalidReason,
        metadata: {
          code: cleanCode,
          reseller_id: link.reseller_id,
          campaign_id: link.campaign_id,
          product_id: link.product_id,
          timestamp: new Date().toISOString(),
          parsed_ua: uaInfo,
          rate_limit_count: rateLimit.currentCount,
        },
      });

      if (clickErr) {
        console.warn(`[Tracking] Ghi nhận click thất bại cho code ${cleanCode}:`, clickErr.message);
      }
    } catch (insertError) {
      console.warn(`[Tracking] Exception khi ghi nhận click:`, insertError);
    }

    // 4. HTTP 302 Redirect an toàn đến trang thanh toán chính thức của Merchant
    // Lưu ý: Luôn luôn chuyển hướng 302 kể cả với Bot hoặc spam để bảo đảm OpenGraph Preview trên MXH không bị lỗi
    return NextResponse.redirect(link.destination_url, 302);
  } catch (error) {
    console.error("[Tracking] Lỗi router chuyển hướng:", error);
    return NextResponse.redirect(new URL("/?error=redirect_failed", request.url), 302);
  }
}

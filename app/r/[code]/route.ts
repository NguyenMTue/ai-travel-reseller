import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

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

    // The customer-facing route is public; database access remains server-only.
    const database = createAdminClient();

    // 1. Tìm thông tin link tiếp thị từ unique_code
    const { data: link, error } = await database
      .from("affiliate_links")
      .select("id, unique_code, destination_url, is_active")
      .eq("unique_code", cleanCode)
      .maybeSingle();

    if (error || !link || !link.is_active) {
      return NextResponse.redirect(
        new URL("/?error=link_not_found_or_inactive", request.url),
        302,
      );
    }

    // 2. Trích xuất thông tin Client từ HTTP Request
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim().slice(0, 45)
      : (request.headers.get("x-real-ip")?.trim().slice(0, 45) || null);
    const userAgent = request.headers.get("user-agent") || null;
    const referer = request.headers.get("referer") || null;

    // 3. Ghi nhận bất đồng bộ lượt click vào bảng `clicks`
    // Sử dụng khối try/catch riêng để đảm bảo lỗi ghi click không bao giờ làm gián đoạn chuyển hướng của khách
    try {
      const { error: clickErr } = await database.from("clicks").insert({
        link_id: link.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        metadata: {
          code: cleanCode,
          timestamp: new Date().toISOString(),
        },
      });

      if (clickErr) {
        console.warn(`[Tracking] Ghi nhận click thất bại cho code ${cleanCode}:`, clickErr.message);
      }
    } catch (insertError) {
      console.warn(`[Tracking] Exception khi ghi nhận click:`, insertError);
    }

    // 4. HTTP 302 Redirect an toàn đến trang thanh toán chính thức của Merchant
    return NextResponse.redirect(link.destination_url, 302);
  } catch (error) {
    console.error("[Tracking] Lỗi router chuyển hướng:", error);
    return NextResponse.redirect(new URL("/?error=redirect_failed", request.url), 302);
  }
}

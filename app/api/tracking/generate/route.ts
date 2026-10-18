import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

type GenerateTrackingLinkBody = {
  reseller_id?: unknown;
  campaign_id?: unknown;
  product_id?: unknown;
};

function generateUniqueCode(length = 8): string {
  // Sinh mã định danh ngẫu nhiên URL-safe không chứa ký tự dễ nhầm lẫn
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

function appendTrackingParams(rawUrl: string, resellerId: string, campaignId: string): string {
  try {
    const urlObj = new URL(rawUrl);
    urlObj.searchParams.set("ref", resellerId);
    urlObj.searchParams.set("campaign", campaignId);
    urlObj.searchParams.set("utm_source", "reseller_affiliate");
    urlObj.searchParams.set("utm_medium", "travelelink");
    urlObj.searchParams.set("utm_campaign", campaignId);
    return urlObj.toString();
  } catch {
    // Fallback nếu rawUrl là đường dẫn tương đối
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}ref=${encodeURIComponent(resellerId)}&campaign=${encodeURIComponent(campaignId)}&utm_source=reseller_affiliate`;
  }
}

function getBaseUrl(request: Request): string {
  // 1. Ưu tiên biến môi trường chính thức của dự án (Public Domain)
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  // 2. Khi chạy sau Reverse Proxy (Vercel, Cloudflare, Nginx), xác thực và chuẩn hóa host chống Header Injection
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    const rawHost = forwardedHost.split(",")[0].trim();
    if (/^[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(rawHost)) {
      return `${forwardedProto}://${rawHost}`;
    }
  }

  // 3. Fallback an toàn cho môi trường dev local
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function POST(request: Request) {
  try {
    let body: GenerateTrackingLinkBody;
    try {
      body = (await request.json()) as GenerateTrackingLinkBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const campaignId =
      typeof body.campaign_id === "string" ? body.campaign_id.trim() : "";
    const productId =
      typeof body.product_id === "string" ? body.product_id.trim() : "";

    if (!UUID_PATTERN.test(campaignId)) {
      return NextResponse.json(
        { error: "campaign_id must be a valid UUID" },
        { status: 400 },
      );
    }

    if (!UUID_PATTERN.test(productId)) {
      return NextResponse.json(
        { error: "product_id must be a valid UUID" },
        { status: 400 },
      );
    }

    // Xác định reseller_id từ Supabase session hoặc từ request body (cho test/dev)
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
      // Tiếp tục nếu không đọc được cookies
    }

    const requestedResellerId =
      typeof body.reseller_id === "string" ? body.reseller_id.trim() : "";

    let resellerId = "";

    if (sessionUserId) {
      // Bảo vệ chống IDOR: Nếu đã đăng nhập, không cho phép sinh link mạo danh reseller khác
      if (requestedResellerId && requestedResellerId !== sessionUserId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot generate tracking links for other resellers" },
          { status: 403 },
        );
      }
      resellerId = sessionUserId;
    } else if (
      process.env.NODE_ENV !== "production" &&
      requestedResellerId &&
      UUID_PATTERN.test(requestedResellerId)
    ) {
      // CHỈ cho phép truyền body.reseller_id khi chạy script test nội bộ / dev runner ngoài production
      resellerId = requestedResellerId;
    } else {
      // Trên Production hoặc khi chưa đăng nhập, lập tức chặn lại và báo lỗi 401
      return NextResponse.json(
        { error: "Unauthorized: Please sign in as a reseller to continue" },
        { status: 401 },
      );
    }

    if (!UUID_PATTERN.test(resellerId)) {
      return NextResponse.json(
        { error: "reseller_id must be a valid UUID" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // 1. Kiểm tra tài khoản Reseller hợp lệ và đang hoạt động
    const { data: reseller, error: resErr } = await adminClient
      .from("resellers")
      .select("id, status")
      .eq("id", resellerId)
      .maybeSingle();

    if (resErr || !reseller) {
      return NextResponse.json(
        { error: `Reseller account not found with id: ${resellerId}` },
        { status: 404 },
      );
    }

    if (reseller.status && reseller.status !== "active" && reseller.status !== "approved") {
      return NextResponse.json(
        { error: `Reseller account is not active (current status: ${reseller.status})` },
        { status: 403 },
      );
    }

    // 2. Kiểm tra Campaign tồn tại và đang active
    const { data: campaign, error: campErr } = await adminClient
      .from("campaigns")
      .select("id, merchant_id, product_id, status")
      .eq("id", campaignId)
      .maybeSingle();

    if (campErr || !campaign) {
      return NextResponse.json(
        { error: `Campaign not found with id: ${campaignId}` },
        { status: 404 },
      );
    }

    if (campaign.status !== "active") {
      return NextResponse.json(
        { error: `Campaign is not active (current status: ${campaign.status})` },
        { status: 400 },
      );
    }

    // 3. Ràng buộc toàn vẹn: Campaign phải đúng với Product cung cấp
    if (campaign.product_id !== productId) {
      return NextResponse.json(
        { error: "The provided product_id does not match the campaign specification" },
        { status: 400 },
      );
    }

    // 4. Kiểm tra Product tồn tại và đang active
    const { data: product, error: prodErr } = await adminClient
      .from("products")
      .select("id, name, payment_url, booking_url, status")
      .eq("id", productId)
      .maybeSingle();

    if (prodErr || !product) {
      return NextResponse.json(
        { error: `Product not found with id: ${productId}` },
        { status: 404 },
      );
    }

    if (product.status !== "active") {
      return NextResponse.json(
        { error: `Product is not active (current status: ${product.status})` },
        { status: 400 },
      );
    }

    // 5. Kiểm tra Idempotent & trạng thái link cũ
    const { data: existingLink } = await adminClient
      .from("affiliate_links")
      .select("*")
      .eq("reseller_id", resellerId)
      .eq("campaign_id", campaignId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingLink) {
      if (!existingLink.is_active) {
        return NextResponse.json(
          { error: "This affiliate link was previously generated but has been deactivated" },
          { status: 400 },
        );
      }

      const baseUrl = getBaseUrl(request);
      const currentShortUrl = `${baseUrl}/r/${existingLink.unique_code}`;

      // Tự động đồng bộ short_url mới trong DB nếu trước đó lưu localhost/domain khác
      if (existingLink.short_url !== currentShortUrl) {
        adminClient
          .from("affiliate_links")
          .update({ short_url: currentShortUrl, updated_at: new Date().toISOString() })
          .eq("id", existingLink.id)
          .then();
      }

      return NextResponse.json({
        status: "success",
        data: {
          id: existingLink.id,
          unique_code: existingLink.unique_code,
          short_url: currentShortUrl,
          destination_url: existingLink.destination_url,
          clicks_count: existingLink.clicks_count,
          created_at: existingLink.created_at,
          is_existing: true,
        },
      });
    }

    // 6. Xác định Destination URL (Bắt buộc phải có URL thanh toán/đặt chỗ chính thức hợp lệ)
    const targetUrl = product.payment_url?.trim() || product.booking_url?.trim();
    if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
      return NextResponse.json(
        { error: "Product does not have a valid official payment or booking URL configured" },
        { status: 400 },
      );
    }

    const destinationUrl = appendTrackingParams(targetUrl, resellerId, campaignId);

    // 7. Sinh unique_code đảm bảo không trùng
    let uniqueCode = generateUniqueCode(8);
    let attempts = 0;
    while (attempts < 5) {
      const { data: duplicate } = await adminClient
        .from("affiliate_links")
        .select("id")
        .eq("unique_code", uniqueCode)
        .maybeSingle();

      if (!duplicate) break;
      uniqueCode = generateUniqueCode(8);
      attempts++;
    }

    // 8. Tạo URL rút gọn chuẩn domain public
    const baseUrl = getBaseUrl(request);
    const shortUrl = `${baseUrl}/r/${uniqueCode}`;

    // 9. Lưu vào bảng affiliate_links
    const { data: newLink, error: insertErr } = await adminClient
      .from("affiliate_links")
      .insert({
        reseller_id: resellerId,
        campaign_id: campaignId,
        product_id: productId,
        unique_code: uniqueCode,
        short_url: shortUrl,
        destination_url: destinationUrl,
        clicks_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (insertErr || !newLink) {
      return NextResponse.json(
        { error: `Failed to create affiliate link: ${insertErr?.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        status: "success",
        data: {
          id: newLink.id,
          unique_code: newLink.unique_code,
          short_url: newLink.short_url,
          destination_url: newLink.destination_url,
          clicks_count: newLink.clicks_count,
          created_at: newLink.created_at,
          is_existing: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 },
    );
  }
}

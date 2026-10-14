import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/src/lib/supabase/server";
import { resolveUserRole } from "@/src/lib/role-auth";

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

    // Danh tính người nhận link phải lấy từ session đã xác thực, không tin ID do client gửi.
    const cookieStore = await cookies();
    const supabaseAuth = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const role = await resolveUserRole(supabaseAuth, user.id);
    if (role !== "reseller") {
      return NextResponse.json({ error: "Only resellers can generate tracking links" }, { status: 403 });
    }
    if (body.reseller_id && body.reseller_id !== user.id) {
      return NextResponse.json(
        { error: "reseller_id does not match the signed-in user" },
        { status: 403 },
      );
    }
    const resellerId = user.id;

    // Use the authenticated client so Supabase RLS enforces the reseller's ownership.
    const database = supabaseAuth;

    // 1. Kiểm tra tồn tại của Campaign và Product
    const { data: campaign, error: campErr } = await database
      .from("campaigns")
      .select("id, merchant_id, product_id, status")
      .eq("id", campaignId)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json(
        { error: `Campaign not found with id: ${campaignId}` },
        { status: 404 },
      );
    }

    if (campaign.product_id !== productId || campaign.status?.toLowerCase() !== "active") {
      return NextResponse.json(
        { error: "Campaign is inactive or does not contain this product" },
        { status: 400 },
      );
    }

    const { data: product, error: prodErr } = await database
      .from("products")
      .select("id, name, payment_url, booking_url, status")
      .eq("id", productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json(
        { error: `Product not found with id: ${productId}` },
        { status: 404 },
      );
    }

    // 2. Kiểm tra Idempotent: Nếu Reseller đã có link cho Campaign + Product này thì trả về link cũ
    const { data: existingLink } = await database
      .from("affiliate_links")
      .select("*")
      .eq("reseller_id", resellerId)
      .eq("campaign_id", campaignId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json({
        status: "success",
        data: {
          id: existingLink.id,
          unique_code: existingLink.unique_code,
          short_url: existingLink.short_url,
          destination_url: existingLink.destination_url,
          clicks_count: existingLink.clicks_count,
          created_at: existingLink.created_at,
          is_existing: true,
        },
      });
    }

    // 3. Xác định Destination URL (Ưu tiên payment_url, fallback sang booking_url)
    const targetUrl = product.payment_url?.trim() || product.booking_url?.trim();
    if (!targetUrl) {
      return NextResponse.json(
        { error: "Product is missing a payment or booking URL" },
        { status: 422 },
      );
    }

    const destinationUrl = appendTrackingParams(targetUrl, resellerId, campaignId);

    // 4. Sinh unique_code đảm bảo không trùng
    let uniqueCode = generateUniqueCode(8);
    let attempts = 0;
    while (attempts < 5) {
      const { data: duplicate } = await database
        .from("affiliate_links")
        .select("id")
        .eq("unique_code", uniqueCode)
        .maybeSingle();

      if (!duplicate) break;
      uniqueCode = generateUniqueCode(8);
      attempts++;
    }

    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const shortUrl = `${origin}/r/${uniqueCode}`;

    // 5. Lưu vào bảng affiliate_links
    const { data: newLink, error: insertErr } = await database
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

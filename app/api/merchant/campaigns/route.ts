import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let merchantId = user?.id;

    if (!merchantId && process.env.NODE_ENV !== "production") {
      merchantId =
        request.headers.get("x-merchant-id")?.trim() ||
        new URL(request.url).searchParams.get("merchant_id")?.trim() ||
        undefined;
    }

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu xác thực tài khoản Merchant hợp lệ." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(
        "id, name, merchant_id, product_id, status, commission_rate, start_date, end_date, target_location, products:product_id (id, name, sale_price, original_price)"
      )
      .eq("merchant_id", merchantId)
      .order("id", { ascending: false });

    if (error) {
      console.error("GET /api/merchant/campaigns query error:", error);
      return NextResponse.json(
        { success: false, error: "Lỗi truy vấn chiến dịch: " + error.message },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: (campaigns || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          productId: c.product_id,
          commissionRate: c.commission_rate != null ? Number(c.commission_rate) : null,
          startDate: c.start_date,
          endDate: c.end_date,
          status: c.status,
          targetLocation: c.target_location,
          productName: c.products?.name ?? "Sản phẩm chiến dịch",
          productSalePrice: c.products?.sale_price != null ? Number(c.products.sale_price) : null,
          productOriginalPrice: c.products?.original_price != null ? Number(c.products.original_price) : null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err: any) {
    console.error("GET /api/merchant/campaigns catch error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + err?.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let merchantId = user?.id;

    if (!merchantId && process.env.NODE_ENV !== "production") {
      merchantId =
        request.headers.get("x-merchant-id")?.trim() ||
        new URL(request.url).searchParams.get("merchant_id")?.trim() ||
        undefined;
    }

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu xác thực tài khoản Merchant hợp lệ." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const campaignId = typeof body.campaign_id === "string" ? body.campaign_id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh chiến dịch (campaign_id)." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (status !== "active" && status !== "paused") {
      return NextResponse.json(
        { success: false, error: "Trạng thái chỉ chấp nhận 'active' hoặc 'paused'." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // 1. Kiểm tra quyền sở hữu chiến dịch của Merchant
    const { data: campaign, error: checkError } = await supabase
      .from("campaigns")
      .select("id, merchant_id, name, status")
      .eq("id", campaignId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: "Lỗi kiểm tra quyền sở hữu chiến dịch: " + checkError.message },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy chiến dịch yêu cầu." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (campaign.merchant_id !== merchantId) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền cập nhật chiến dịch này." },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // 2. Cập nhật trạng thái chiến dịch
    const { data: updated, error: updateError } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId)
      .eq("merchant_id", merchantId)
      .select("id, name, status, commission_rate")
      .single();

    if (updateError) {
      console.error("PATCH /api/merchant/campaigns update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Cập nhật trạng thái thất bại: " + updateError.message },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Đã cập nhật trạng thái chiến dịch thành '${status}'.`,
        data: updated,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err: any) {
    console.error("PATCH /api/merchant/campaigns catch error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + err?.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

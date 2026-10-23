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
        "id, name, merchant_id, product_id, status, target_location, products:product_id (id, name, sale_price, original_price)"
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
          status: c.status,
          targetLocation: c.target_location,
          productName: c.products?.name ?? "Sản phẩm chiến dịch",
          productSalePrice: c.products?.sale_price ?? null,
          productOriginalPrice: c.products?.original_price ?? null,
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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  getMerchantProductList,
  createMerchantProduct,
  updateMerchantProduct,
} from "@/src/lib/merchant/product-service";

export const dynamic = "force-dynamic";

async function resolveMerchantId(request: Request): Promise<{
  merchantId: string | null;
  supabase: ReturnType<typeof createClient>;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let merchantId = user?.id || null;

  if (!merchantId && process.env.NODE_ENV !== "production") {
    merchantId =
      request.headers.get("x-merchant-id")?.trim() ||
      new URL(request.url).searchParams.get("merchant_id")?.trim() ||
      null;
  }

  return { merchantId, supabase };
}

/**
 * GET /api/merchant/products
 * Lấy danh sách sản phẩm tour thuộc quyền quản lý của Merchant
 */
export async function GET(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu xác thực tài khoản Merchant hợp lệ." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const result = await getMerchantProductList(supabase as any, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống: " + (err?.message || String(err)) },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

/**
 * POST /api/merchant/products
 * Tạo mới một tour / sản phẩm du lịch cho Merchant
 */
export async function POST(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu xác thực tài khoản Merchant để tạo sản phẩm." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Dữ liệu gửi lên không đúng định dạng JSON." },
        { status: 400 },
      );
    }

    const result = await createMerchantProduct(supabase as any, merchantId, body);

    if (!result.success) {
      const statusCode = result.code === "VALIDATION_ERROR" ? 400 : 500;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tạo sản phẩm du lịch thành công.",
        data: result.data,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi tạo sản phẩm: " + (err?.message || String(err)) },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/merchant/products
 * Cập nhật thông tin hoặc trạng thái (active / draft) của sản phẩm
 */
export async function PATCH(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu xác thực tài khoản Merchant hợp lệ." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Dữ liệu cập nhật không đúng định dạng JSON." },
        { status: 400 },
      );
    }

    const result = await updateMerchantProduct(supabase as any, merchantId, body);

    if (!result.success) {
      const statusCode =
        result.code === "NOT_FOUND_OR_FORBIDDEN"
          ? 403
          : result.code === "VALIDATION_ERROR"
            ? 400
            : 500;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cập nhật sản phẩm thành công.",
        data: result.data,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Lỗi cập nhật sản phẩm: " + (err?.message || String(err)) },
      { status: 500 },
    );
  }
}

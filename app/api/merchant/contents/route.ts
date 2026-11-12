import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  getMerchantContentsList,
  updateMerchantContentApproval,
} from "@/src/lib/merchant/content-approval-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/merchant/contents
 * Lấy danh sách nội dung AI theo các chiến dịch của Merchant
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let merchantId = user?.id;

    if (!merchantId && process.env.NODE_ENV !== "production") {
      merchantId =
        request.headers.get("x-merchant-id")?.trim() ||
        new URL(request.url).searchParams.get("merchant_id")?.trim() ||
        undefined;
    }

    if (authError || !merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant để xem nội dung AI.",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
        }
      );
    }

    // 2. Parse query parameters
    const url = new URL(request.url);
    const campaign_id = url.searchParams.get("campaign_id") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const persona = url.searchParams.get("persona") || undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

    const result = await getMerchantContentsList(supabase, merchantId, {
      campaign_id,
      status,
      persona,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Không thể tải danh sách nội dung lúc này.",
          code: "FETCH_CONTENTS_ERROR",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("[MERCHANT_CONTENTS_GET_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi tải danh sách nội dung AI.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/merchant/contents
 * Phê duyệt, từ chối hoặc chỉnh sửa nội dung AI của chiến dịch
 */
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let merchantId = user?.id;

    if (!merchantId && process.env.NODE_ENV !== "production") {
      merchantId =
        request.headers.get("x-merchant-id")?.trim() ||
        new URL(request.url).searchParams.get("merchant_id")?.trim() ||
        undefined;
    }

    if (authError || !merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant để phê duyệt nội dung.",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
        }
      );
    }

    // 2. Parse body và cập nhật phê duyệt
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu yêu cầu phê duyệt không hợp lệ.",
          code: "INVALID_BODY",
        },
        { status: 400 }
      );
    }

    const result = await updateMerchantContentApproval(supabase, merchantId, body);

    if (!result.success) {
      const statusCode =
        result.code === "FORBIDDEN"
          ? 403
          : result.code === "NOT_FOUND" || result.code === "CAMPAIGN_NOT_FOUND"
          ? 404
          : result.code === "VALIDATION_ERROR"
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cập nhật trạng thái phê duyệt nội dung thành công.",
        data: result.data,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("[MERCHANT_CONTENTS_PATCH_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi xử lý phê duyệt nội dung.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

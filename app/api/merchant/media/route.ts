import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  createMediaReferenceSchema,
  mediaQuerySchema,
  UUID_PATTERN,
} from "@/src/lib/merchant/media-schema";
import {
  listMediaReferences,
  createMediaReference,
  deleteMediaReference,
} from "@/src/lib/merchant/media-service";

/**
 * Hàm trợ giúp xác thực phiên Merchant an toàn
 */
async function resolveMerchantId(request: Request): Promise<{
  merchantId: string | null;
  supabase: ReturnType<typeof createClient>;
  isSession: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Kiểm tra session cookie chuẩn
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      // Xác nhận user tồn tại trong bảng merchants
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (merchant?.id) {
        return { merchantId: merchant.id, supabase, isSession: true };
      }
    }
  } catch {
    // Không có cookie session hợp lệ
  }

  // 2. Chế độ phát triển / Kiểm thử tự động ngoài production: cho phép x-merchant-id header
  if (process.env.NODE_ENV !== "production") {
    const headerId = request.headers.get("x-merchant-id")?.trim();
    if (headerId && UUID_PATTERN.test(headerId)) {
      return { merchantId: headerId, supabase, isSession: false };
    }

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("merchant_id")?.trim();
    if (queryId && UUID_PATTERN.test(queryId)) {
      return { merchantId: queryId, supabase, isSession: false };
    }
  }

  return { merchantId: null, supabase, isSession: false };
}

/**
 * GET /api/merchant/media
 * Lấy danh sách video mẫu phục vụ Merchant Video Library & AI Video Engine
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { merchantId, supabase } = await resolveMerchantId(request);

    // Parse tham số lọc và phân trang
    const queryParams = {
      merchantId: searchParams.get("merchant_id") || merchantId || undefined,
      platform: searchParams.get("platform") || undefined,
      tag: searchParams.get("tag") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    };

    const parsedQuery = mediaQuerySchema.safeParse(queryParams);
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Tham số truy vấn không hợp lệ",
          details: parsedQuery.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await listMediaReferences(supabase, parsedQuery.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data.items,
        pagination: result.data.pagination,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Lỗi máy chủ nội bộ",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/merchant/media
 * Thêm một video mẫu mới vào thư viện Media của Merchant
 */
export async function POST(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant để tải lên video mẫu",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu JSON không hợp lệ hoặc rỗng",
          code: "INVALID_JSON",
        },
        { status: 400 },
      );
    }

    const parsedInput = createMediaReferenceSchema.safeParse(bodyJson);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu video mẫu không hợp lệ",
          details: parsedInput.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const createResult = await createMediaReference(supabase, merchantId, parsedInput.data);

    if (!createResult.success) {
      return NextResponse.json(
        { success: false, error: createResult.error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Đã thêm video mẫu vào thư viện thành công",
        data: createResult.data,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Lỗi máy chủ nội bộ",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/merchant/media?id=[media_id]
 * Xóa một video mẫu khỏi thư viện của Merchant
 */
export async function DELETE(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id")?.trim();

    if (!mediaId || !UUID_PATTERN.test(mediaId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID video mẫu không hợp lệ hoặc thiếu tham số ?id=",
        },
        { status: 400 },
      );
    }

    const deleteResult = await deleteMediaReference(supabase, merchantId, mediaId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, error: deleteResult.error },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Đã xóa video mẫu khỏi thư viện thành công",
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Lỗi máy chủ nội bộ",
      },
      { status: 500 },
    );
  }
}

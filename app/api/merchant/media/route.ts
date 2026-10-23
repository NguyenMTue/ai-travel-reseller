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

type MerchantAccessResult =
  | { status: "allowed"; merchantId: string; supabase: ReturnType<typeof createClient>; isSession: boolean }
  | { status: "unauthenticated"; supabase: ReturnType<typeof createClient> }
  | { status: "forbidden"; supabase: ReturnType<typeof createClient> };

/**
 * Hàm trợ giúp xác thực phiên Merchant an toàn
 */
async function resolveMerchantAccess(request: Request): Promise<MerchantAccessResult> {
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
        return { status: "allowed", merchantId: merchant.id, supabase, isSession: true };
      }
      return { status: "forbidden", supabase };
    }
  } catch {
    // Không có cookie session hợp lệ
  }

  // 2. Chế độ phát triển / Kiểm thử tự động ngoài production: cho phép x-merchant-id header
  if (process.env.NODE_ENV !== "production") {
    const headerId = request.headers.get("x-merchant-id")?.trim();
    if (headerId && UUID_PATTERN.test(headerId)) {
      return { status: "allowed", merchantId: headerId, supabase, isSession: false };
    }
  }

  return { status: "unauthenticated", supabase };
}

/**
 * GET /api/merchant/media
 * Lấy danh sách video mẫu phục vụ Merchant Video Library & AI Video Engine
 * Quyền: Bắt buộc tài khoản Merchant. Chỉ truy cập media thuộc sở hữu của Merchant đó.
 */
export async function GET(request: Request) {
  try {
    const access = await resolveMerchantAccess(request);

    if (access.status === "unauthenticated") {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant để truy cập thư viện media",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    if (access.status === "forbidden") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không có quyền truy cập thư viện media của Merchant",
          code: "FORBIDDEN",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    const { merchantId, supabase } = access;
    const { searchParams } = new URL(request.url);

    // Chặn truy cập chéo / giả mạo Merchant: nếu client gửi merchant_id khác với phiên đang đăng nhập
    const queryMerchantId = searchParams.get("merchant_id")?.trim();
    if (queryMerchantId && queryMerchantId !== merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Không được phép truy cập thư viện media của Merchant khác",
          code: "FORBIDDEN",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    // Parse tham số lọc và phân trang (merchantId luôn cố định là merchantId đã xác thực)
    const queryParams = {
      merchantId,
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
        {
          status: 400,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    const result = await listMediaReferences(supabase, parsedQuery.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
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
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  }
}

/**
 * POST /api/merchant/media
 * Thêm một video mẫu mới vào thư viện Media của Merchant
 */
export async function POST(request: Request) {
  try {
    const access = await resolveMerchantAccess(request);

    if (access.status === "unauthenticated") {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant để tải lên video mẫu",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (access.status === "forbidden") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không có quyền Merchant",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { merchantId, supabase } = access;

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
    const access = await resolveMerchantAccess(request);

    if (access.status === "unauthenticated") {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản Merchant",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (access.status === "forbidden") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không có quyền Merchant",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { merchantId, supabase } = access;

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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  UUID_PATTERN,
  videoGenerateRequestSchema,
} from "@/src/lib/merchant/video-generate-schema";
import { generateMerchantCampaignVideo } from "@/src/lib/merchant/video-generate-service";

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
    // Bỏ qua lỗi cookie session
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
 * POST /api/merchant/video/generate
 * Khởi tạo và tổng hợp kịch bản/video AI chuẩn 9:16 cho chiến dịch Merchant
 */
export async function POST(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yêu cầu xác thực tài khoản Merchant hợp lệ để thực hiện tạo video.",
        },
        { status: 401 }
      );
    }

    // 1. Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu gửi lên không đúng định dạng JSON.",
        },
        { status: 400 }
      );
    }

    // 2. Validate request qua Zod Schema
    const parsed = videoGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: "Tham số yêu cầu không hợp lệ.",
          details: formattedErrors,
        },
        { status: 400 }
      );
    }

    // 3. Gọi Service Layer xử lý
    const result = await generateMerchantCampaignVideo(
      supabase,
      merchantId,
      parsed.data
    );

    // 4. Xử lý các nhánh kết quả
    if (!result.success) {
      if (result.errorType === "BLOCKED") {
        // Bị chặn bởi Fail-Fast Gate: trả về HTTP 422 Unprocessable Entity
        return NextResponse.json(result.blockedData, { status: 422 });
      }

      if (result.errorType === "NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        );
      }

      if (result.errorType === "FORBIDDEN") {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // 5. Trả về HTTP 201 Created khi tổng hợp video thành công
    return NextResponse.json(
      {
        success: true,
        message: "Khởi tạo và tổng hợp video chiến dịch thành công.",
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /api/merchant/video/generate Internal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống trong quá trình tổng hợp video: " + error?.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/merchant/video/generate
 * Tra cứu tiến độ hoặc thông tin video đã tạo theo content_id
 */
export async function GET(request: Request) {
  try {
    const { merchantId, supabase } = await resolveMerchantId(request);

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu xác thực tài khoản Merchant hợp lệ.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("content_id");

    if (!contentId || !UUID_PATTERN.test(contentId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tham số content_id là bắt buộc và phải là định dạng UUID.",
        },
        { status: 400 }
      );
    }

    const { data: content, error } = await supabase
      .from("contents")
      .select("id, campaign_id, product_id, video_url, status, hook, script, caption, cta, created_at")
      .eq("id", contentId)
      .maybeSingle();

    if (error || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy nội dung video với content_id tương ứng.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi tra cứu thông tin video: " + error?.message,
      },
      { status: 500 }
    );
  }
}

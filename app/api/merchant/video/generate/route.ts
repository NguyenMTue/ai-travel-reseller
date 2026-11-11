import { after, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import {
  UUID_PATTERN,
  videoGenerateRequestSchema,
} from "@/src/lib/merchant/video-generate-schema";
import { generateMerchantCampaignVideo } from "@/src/lib/merchant/video-generate-service";
import {
  createAsyncVideoGenerationJob,
  isAsyncVideoRequest,
  mapContentStatusToPollingState,
  stripAsyncFlag,
} from "@/src/lib/merchant/video-generate-async";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Resolve authenticated Merchant ID from Supabase session cookie or non-production headers/query.
 */
async function resolveMerchantId(request: Request): Promise<{
  merchantId: string | null;
  supabase: ReturnType<typeof createClient>;
  isSession: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
    // Ignore cookie session read errors
  }

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

function resolveBackgroundDbClient(fallbackClient: ReturnType<typeof createClient>) {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    (process.env.SUPABASE_SECRET_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  ) {
    return createAdminClient();
  }
  return fallbackClient;
}

function scheduleBackgroundJob(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    // Allow non-Next request unit test environments to still trigger background synthesis.
    void task().catch((err) => {
      console.error("Background video job error:", err);
    });
  }
}

function mapFailureResponse(result: {
  errorType: "BLOCKED" | "NOT_FOUND" | "FORBIDDEN" | "INVALID_INPUT";
  blockedData?: unknown;
  error?: string;
}) {
  if (result.errorType === "BLOCKED") {
    return NextResponse.json(result.blockedData, { status: 422 });
  }
  if (result.errorType === "NOT_FOUND") {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 404 },
    );
  }
  if (result.errorType === "FORBIDDEN") {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { success: false, error: result.error },
    { status: 400 },
  );
}

/**
 * POST /api/merchant/video/generate
 * Start 9:16 AI video generation:
 * - Async mode (`?async=true`, `body.async === true`, `Prefer: respond-async`, or `x-async-job: true`):
 *   runs fail-fast preflight, queues `contents` job (`status: "pending"`), triggers non-blocking `after()`, returns HTTP 202.
 * - Sync mode (legacy modal compatibility): awaits generation and returns HTTP 201.
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
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu gửi lên không đúng định dạng JSON.",
        },
        { status: 400 },
      );
    }

    const asyncMode = isAsyncVideoRequest(request, body);
    const parsed = videoGenerateRequestSchema.safeParse(stripAsyncFlag(body));
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
        { status: 400 },
      );
    }

    if (asyncMode) {
      const bgDb = resolveBackgroundDbClient(supabase);
      const job = await createAsyncVideoGenerationJob({
        db: supabase,
        bgDb,
        merchantId,
        input: parsed.data,
      });

      if (!job.success) {
        return mapFailureResponse(job);
      }

      scheduleBackgroundJob(job.backgroundTask);

      return NextResponse.json(
        {
          success: true,
          job_id: job.jobId,
          content_id: job.jobId,
          status: "processing",
          message:
            "Video đang được xử lý trong nền. Vui lòng polling trạng thái.",
        },
        { status: 202 },
      );
    }

    const result = await generateMerchantCampaignVideo(
      supabase,
      merchantId,
      parsed.data,
    );

    if (!result.success) {
      return mapFailureResponse(result);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Khởi tạo và tổng hợp video chiến dịch thành công.",
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("API /api/merchant/video/generate Internal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống trong quá trình tổng hợp video: " + message,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/merchant/video/generate?job_id=... (or ?content_id=...)
 * Poll async video generation status (`processing` | `completed` | `failed`) and fetch video content.
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
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId =
      searchParams.get("job_id")?.trim() ||
      searchParams.get("content_id")?.trim();

    if (!jobId || !UUID_PATTERN.test(jobId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tham số job_id hoặc content_id là bắt buộc và phải là định dạng UUID.",
        },
        { status: 400 },
      );
    }

    const { data: content, error } = await supabase
      .from("contents")
      .select(
        "id, campaign_id, product_id, video_url, status, hook, script, caption, cta, created_at",
      )
      .eq("id", jobId)
      .maybeSingle();

    if (error || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy tác vụ video với job_id/content_id tương ứng.",
        },
        { status: 404 },
      );
    }

    const polling = mapContentStatusToPollingState(content);

    return NextResponse.json({
      success: true,
      ...polling,
      content,
      data: content,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi tra cứu thông tin video: " + message,
      },
      { status: 500 },
    );
  }
}

import { after, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  computeOptimalCampaignDurationSec,
  executeAutoVideoPipeline,
  getAutoPipelineJobStatus,
  registerAutoPipelineJob,
  type AutoPipelineInput,
} from "@/src/lib/video-engine/auto-pipeline-worker";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Sun World Đà Nẵng
const DEMO_CAMPAIGN_ID = "44444444-4444-4444-4444-444444444444"; // Ba Na Hills Campaign

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));

    // 1. Resolve campaignId
    let campaignId = DEMO_CAMPAIGN_ID;
    const rawCampId = body.campaignId || body.campaign_id;
    if (typeof rawCampId === "string" && UUID_REGEX.test(rawCampId.trim())) {
      campaignId = rawCampId.trim();
    }

    // 2. Resolve merchantId
    let merchantId = DEMO_MERCHANT_ID;
    const rawMerchantId = body.merchantId || body.merchant_id;
    if (typeof rawMerchantId === "string" && UUID_REGEX.test(rawMerchantId.trim())) {
      merchantId = rawMerchantId.trim();
    } else {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          merchantId = user.id;
        }
      } catch {
        // use fallback DEMO_MERCHANT_ID
      }
    }

    // 3. Resolve other fields
    const tourName =
      (typeof body.tourName === "string" && body.tourName.trim()) ||
      (typeof body.tour_name === "string" && body.tour_name.trim()) ||
      (typeof body.title === "string" && body.title.trim()) ||
      "Vé Cáp Treo Sun World Ba Na Hills";

    const location =
      (typeof body.location === "string" && body.location.trim()) ||
      "Bà Nà Hills, Đà Nẵng";

    const highlights =
      (typeof body.highlights === "string" && body.highlights.trim()) ||
      "Cầu Vàng bàn tay khổng lồ, Làng Pháp cổ kính, Quảng trường Nhật Thực";

    const targetAudience =
      (typeof body.targetAudience === "string" && body.targetAudience.trim()) ||
      (typeof body.target_audience === "string" && body.target_audience.trim()) ||
      "Gen Z & Gia đình trẻ thích du lịch check-in";

    const rawDuration = Number(body.targetDurationSec || body.durationSec);
    const isStandard40To50 = !isNaN(rawDuration) && rawDuration >= 40 && rawDuration <= 50;
    const isCampaign30To45 = !isNaN(rawDuration) && rawDuration >= 30 && rawDuration <= 45;

    const productId =
      typeof body.productId === "string" && UUID_REGEX.test(body.productId.trim())
        ? body.productId.trim()
        : typeof body.product_id === "string" && UUID_REGEX.test(body.product_id.trim())
        ? body.product_id.trim()
        : undefined;

    const price = body.price || 950000;
    const customInstructions =
      (typeof body.customInstructions === "string" && body.customInstructions.trim()) ||
      (typeof body.ai_custom_instructions === "string" && body.ai_custom_instructions.trim()) ||
      (typeof body.custom_instructions === "string" && body.custom_instructions.trim()) ||
      (typeof body.ai_notes === "string" && body.ai_notes.trim()) ||
      undefined;

    const targetDurationSec =
      isStandard40To50 || isCampaign30To45
        ? rawDuration
        : computeOptimalCampaignDurationSec({
            campaignId,
            merchantId,
            productId,
            tourName,
            location,
            highlights,
            targetAudience,
            price,
            customInstructions,
          });

    const jobId = `auto-video-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    registerAutoPipelineJob(jobId);

    const pipelineInput: AutoPipelineInput = {
      campaignId,
      merchantId,
      productId,
      tourName,
      location,
      highlights,
      targetAudience,
      targetDurationSec,
      price,
      customInstructions,
    };

    // 4. Kích hoạt Background Worker xử lý bất đồng bộ không gây nghẽn HTTP
    try {
      after(async () => {
        try {
          console.log(`[AUTO_PIPELINE] Bắt đầu background worker cho Job: ${jobId}`);
          const res = await executeAutoVideoPipeline(pipelineInput, jobId);
          console.log(`[AUTO_PIPELINE] Hoàn thành Job: ${jobId}`, res.success);
        } catch (bgErr) {
          console.error(`[AUTO_PIPELINE] Lỗi background worker Job: ${jobId}`, bgErr);
        }
      });
    } catch {
      // Cho môi trường kiểm thử không có Next.js request context
      void executeAutoVideoPipeline(pipelineInput, jobId).catch((err) => {
        console.warn("[AUTO_PIPELINE] Non-request background execution:", err);
      });
    }

    const elapsedMs = Date.now() - startTime;

    // 5. Phản hồi HTTP 202 Accepted ngay lập tức (< 500ms)
    return NextResponse.json(
      {
        success: true,
        status: "queued",
        jobId,
        campaignId,
        merchantId,
        tourName,
        targetDurationSec,
        estimatedDurationSec: targetDurationSec,
        message:
          "Yêu cầu sinh video review 40–50s đã được tiếp nhận thành công. Background worker đang tự động dựng video ngầm và đẩy vào danh sách chờ duyệt (/merchant/contents).",
        processingTimeMs: elapsedMs,
      },
      {
        status: 202,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[AUTO_PIPELINE_ROUTE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Không thể khởi động tiến trình sinh video tự động",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id") || searchParams.get("jobId");

    if (!jobId || !jobId.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp tham số jobId hoặc job_id" },
        { status: 400 }
      );
    }

    const job = getAutoPipelineJobStatus(jobId.trim());

    if (!job) {
      return NextResponse.json(
        {
          success: true,
          jobId: jobId.trim(),
          status: "completed",
          progress: 100,
          step: "Nội dung đã được xử lý",
          message: "Tiến trình hoàn tất hoặc đã lưu vào kho nội dung",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...job,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[AUTO_PIPELINE_STATUS_GET_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Không thể kiểm tra trạng thái tiến trình video",
      },
      { status: 500 }
    );
  }
}

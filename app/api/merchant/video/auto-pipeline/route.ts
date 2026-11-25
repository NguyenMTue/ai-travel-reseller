import { after, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import {
  executeAutoVideoPipeline,
  fetchMerchantMediaReferences,
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

    // 2. Resolve merchantId & authenticated Supabase client
    let merchantId = DEMO_MERCHANT_ID;
    let authSupabase: any = null;
    const rawMerchantId = body.merchantId || body.merchant_id;
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        authSupabase = supabase;
        merchantId = user.id;
      }
    } catch {
      // use fallback
    }
    if (typeof rawMerchantId === "string" && UUID_REGEX.test(rawMerchantId.trim())) {
      merchantId = rawMerchantId.trim();
    }

    const dbClient = authSupabase || createAdminClient();

    // 3. Hydrate grounded data from DB (campaigns + products + merchant) when available
    let dbCampaign: any = null;
    let dbMerchant: any = null;
    try {
      const { data: cRow } = await dbClient
        .from("campaigns")
        .select(
          "id, merchant_id, product_id, name, start_date, end_date, target_location, target_audience, ai_custom_instructions, products:product_id (name, description, highlights, original_price, sale_price)"
        )
        .eq("id", campaignId)
        .maybeSingle();
      dbCampaign = cRow;

      const resolvedMerchantId = dbCampaign?.merchant_id || merchantId;
      const { data: mRow } = await dbClient
        .from("merchants")
        .select("id, phone, logo, logo_url")
        .eq("id", resolvedMerchantId)
        .maybeSingle();
      dbMerchant = mRow;
    } catch {
      // ignore if offline/unit test
    }

    const dbProduct = dbCampaign
      ? Array.isArray(dbCampaign.products)
        ? dbCampaign.products[0]
        : dbCampaign.products
      : null;

    if (dbCampaign?.merchant_id && merchantId === DEMO_MERCHANT_ID) {
      merchantId = dbCampaign.merchant_id;
    }

    // 4. Resolve other fields (prefer explicit request payload -> DB grounded -> fallback)
    const tourName =
      (typeof body.tourName === "string" && body.tourName.trim()) ||
      (typeof body.tour_name === "string" && body.tour_name.trim()) ||
      (typeof body.title === "string" && body.title.trim()) ||
      dbProduct?.name ||
      dbCampaign?.name ||
      "Vé Cáp Treo Sun World Ba Na Hills";

    const location =
      (typeof body.location === "string" && body.location.trim()) ||
      dbCampaign?.target_location ||
      "Bà Nà Hills, Đà Nẵng";

    const dbHighlights =
      Array.isArray(dbProduct?.highlights) && dbProduct.highlights.length > 0
        ? dbProduct.highlights
        : null;
    const highlights =
      body.highlights ||
      dbHighlights ||
      dbProduct?.description ||
      "Cầu Vàng bàn tay khổng lồ, Làng Pháp cổ kính, Quảng trường Nhật Thực";

    const targetAudience =
      (typeof body.targetAudience === "string" && body.targetAudience.trim()) ||
      (typeof body.target_audience === "string" && body.target_audience.trim()) ||
      dbCampaign?.target_audience ||
      "Gen Z & Gia đình trẻ thích du lịch check-in";

    const rawDuration = Number(body.targetDurationSec || body.durationSec);
    const targetDurationSec =
      !isNaN(rawDuration) && rawDuration >= 40 && rawDuration <= 50
        ? Math.round(rawDuration)
        : 45;

    const productId =
      typeof body.productId === "string" && UUID_REGEX.test(body.productId.trim())
        ? body.productId.trim()
        : typeof body.product_id === "string" && UUID_REGEX.test(body.product_id.trim())
        ? body.product_id.trim()
        : dbCampaign?.product_id || undefined;

    const price = body.price ?? dbProduct?.sale_price ?? 950000;
    const originalPrice = body.originalPrice ?? dbProduct?.original_price ?? null;
    const formatDateVn = (iso?: string | null) => {
      if (!iso) return null;
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? null : `${d.getDate()}/${d.getMonth() + 1}`;
    };
    const startFmt = formatDateVn(dbCampaign?.start_date);
    const endFmt = formatDateVn(dbCampaign?.end_date);
    const campaignPeriod = startFmt && endFmt ? `${startFmt} - ${endFmt}` : null;
    const contactPhone = dbMerchant?.phone || null;
    const logoUrl = dbMerchant?.logo_url || dbMerchant?.logo || null;

    const customInstructions =
      (typeof body.customInstructions === "string" && body.customInstructions.trim()) ||
      (typeof body.ai_custom_instructions === "string" && body.ai_custom_instructions.trim()) ||
      (typeof body.custom_instructions === "string" && body.custom_instructions.trim()) ||
      (typeof body.ai_notes === "string" && body.ai_notes.trim()) ||
      dbCampaign?.ai_custom_instructions ||
      undefined;

    // 4b. Kiểm tra số lượng ảnh tối thiểu theo biến môi trường MIN_IMAGES (mặc định 1)
    const rawMediaIds = body.mediaReferenceIds || body.media_reference_ids;
    const mediaReferenceIds = Array.isArray(rawMediaIds)
      ? rawMediaIds.filter((id: unknown): id is string => typeof id === "string" && UUID_REGEX.test(id.trim()))
      : undefined;

    const minImages = Math.max(0, Number(process.env.MIN_IMAGES ?? 1));
    let mediaPool = await fetchMerchantMediaReferences(merchantId, mediaReferenceIds, dbClient);
    if (mediaPool.length === 0 && dbCampaign?.merchant_id && dbCampaign.merchant_id !== merchantId) {
      mediaPool = await fetchMerchantMediaReferences(dbCampaign.merchant_id, mediaReferenceIds, dbClient);
    }
    const warnings: string[] = [];

    if (mediaPool.length < minImages) {
      return NextResponse.json(
        {
          success: false,
          code: "INSUFFICIENT_MEDIA",
          error: `Tour hiện có ${mediaPool.length} ảnh/media trong thư viện. Cần tối thiểu ${minImages} ảnh để tạo video.`,
        },
        { status: 400 }
      );
    }

    if (mediaPool.length <= 3) {
      warnings.push(
        `Tour mới có ${mediaPool.length} ảnh/media; video sẽ tái sử dụng góc crop để đủ 7 cảnh (khuyến nghị >= 4 ảnh).`
      );
    }

    const pipelineInput: AutoPipelineInput = {
      campaignId,
      merchantId,
      productId,
      mediaReferenceIds,
      tourName,
      location,
      highlights,
      targetAudience,
      targetDurationSec,
      price,
      originalPrice,
      campaignPeriod,
      contactPhone,
      logoUrl,
      customInstructions,
    };

    // 5. Đẩy job vào bảng `public.video_jobs` (Queue)
    let jobId = `auto-video-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const { data: jobRow } = await dbClient
        .from("video_jobs")
        .insert({
          campaign_id: campaignId,
          merchant_id: merchantId,
          product_id: productId || null,
          status: "queued",
          progress: 10,
          step: "Đã đưa vào hàng đợi dựng video 40-50s",
          input_payload: pipelineInput,
          warnings,
        })
        .select("id")
        .maybeSingle();
      if (jobRow?.id) {
        jobId = jobRow.id;
      }
    } catch (queueErr) {
      console.warn("[AUTO_PIPELINE] Could not insert video_jobs row, using memory jobId:", queueErr);
    }

    registerAutoPipelineJob(jobId);

    // 6. Kích hoạt Worker (nếu không chạy chế độ external worker riêng)
    if (process.env.VIDEO_WORKER_MODE !== "external") {
      try {
        after(async () => {
          try {
            console.log(`[AUTO_PIPELINE] Bắt đầu background worker cho Job: ${jobId}`);
            const res = await executeAutoVideoPipeline(pipelineInput, jobId, dbClient);
            console.log(`[AUTO_PIPELINE] Hoàn thành Job: ${jobId}`, res.success);
          } catch (bgErr) {
            console.error(`[AUTO_PIPELINE] Lỗi background worker Job: ${jobId}`, bgErr);
          }
        });
      } catch {
        void executeAutoVideoPipeline(pipelineInput, jobId, dbClient).catch((err) => {
          console.warn("[AUTO_PIPELINE] Non-request background execution:", err);
        });
      }
    }

    const elapsedMs = Date.now() - startTime;

    // 7. Phản hồi HTTP 202 Accepted ngay lập tức (< 500ms)
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
        warnings,
        message:
          "Yêu cầu sinh video review 40–50s đã được đưa vào hàng đợi. Hệ thống đang dựng video ngầm và đẩy vào danh sách chờ duyệt (/merchant/contents).",
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

    const trimmedJobId = jobId.trim();

    // 1. Check DB video_jobs first if UUID
    if (UUID_REGEX.test(trimmedJobId)) {
      try {
        let client: any = null;
        try {
          const cookieStore = await cookies();
          const sb = createClient(cookieStore);
          const {
            data: { user },
          } = await sb.auth.getUser();
          if (user?.id) client = sb;
        } catch {}
        if (!client) client = createAdminClient();
        const { data: row } = await client
          .from("video_jobs")
          .select("*")
          .eq("id", trimmedJobId)
          .maybeSingle();
        if (row) {
          return NextResponse.json({
            success: true,
            job: {
              jobId: row.id,
              status: row.status === "done" ? "completed" : row.status === "running" ? "processing" : row.status,
              progress: row.progress,
              step: row.step,
              contentId: row.content_id,
              videoUrl: row.video_url,
              durationSec: row.duration_sec,
              warnings: row.warnings,
              error: row.error,
              updatedAt: row.updated_at,
            },
          });
        }
      } catch {
        // fallback to in-memory
      }
    }

    const job = getAutoPipelineJobStatus(trimmedJobId);

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

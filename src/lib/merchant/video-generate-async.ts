import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types.ts";
import { calculateMinRequiredAssets } from "../video-engine/types.ts";
import {
  generateMerchantCampaignVideo,
  type GenerateVideoServiceResult,
} from "./video-generate-service.ts";
import type {
  VideoGenerateBlockedResponse,
  VideoGenerateRequestInput,
} from "./video-generate-schema.ts";

export type PollingJobStatus = "processing" | "completed" | "failed";

export type VideoPollingPayload = {
  job_id: string;
  status: PollingJobStatus;
  progress: number;
  video_url: string | null;
  error?: string;
};

export type AsyncVideoJobPreflightResult =
  | {
      success: true;
      jobId: string;
      backgroundTask: () => Promise<void>;
    }
  | {
      success: false;
      errorType: "NOT_FOUND" | "FORBIDDEN" | "INVALID_INPUT";
      error: string;
    }
  | {
      success: false;
      errorType: "BLOCKED";
      blockedData: VideoGenerateBlockedResponse;
    };

export type RunVideoGeneratorFn = (
  client: SupabaseClient<Database>,
  merchantId: string,
  input: VideoGenerateRequestInput,
) => Promise<GenerateVideoServiceResult>;

export type AsyncVideoDbClient =
  | SupabaseClient<Database>
  | {
      from: (table: string) => unknown;
    };

type AsyncDbError = { message: string } | null;
type AsyncDbResult<T> = Promise<{ data: T | null; error: AsyncDbError }>;

interface AsyncCampaignTable {
  select: (cols: string) => {
    eq: (col: string, val: string) => {
      maybeSingle: () => AsyncDbResult<{
        id: string;
        merchant_id: string | null;
        product_id: string | null;
        name?: string | null;
      }>;
    };
  };
}

interface AsyncProductTable {
  select: (cols: string) => {
    eq: (col: string, val: string) => {
      maybeSingle: () => AsyncDbResult<{
        id: string;
        sale_price: number | null;
      }>;
    };
  };
}

interface AsyncMediaTable {
  select: (cols: string) => {
    eq: (col: string, val: string) => {
      in: (col: string, vals: string[]) => AsyncDbResult<Array<{ id: string }>>;
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => {
        limit: (n: number) => AsyncDbResult<Array<{ id: string }>>;
      };
    };
  };
}

interface AsyncContentsTable {
  insert: (row: Record<string, unknown>) => {
    select: (cols: string) => {
      single: () => AsyncDbResult<{ id: string }>;
    };
  };
  update: (patch: Record<string, unknown>) => {
    eq: (col: string, val: string) => Promise<unknown>;
  };
  delete: () => {
    eq: (col: string, val: string) => Promise<unknown>;
  };
}

interface InternalAsyncDb {
  from(table: "campaigns"): AsyncCampaignTable;
  from(table: "products"): AsyncProductTable;
  from(table: "media_references"): AsyncMediaTable;
  from(table: "contents"): AsyncContentsTable;
}

/**
 * Determine whether the incoming POST request explicitly opts into async job polling (HTTP 202).
 */
export function isAsyncVideoRequest(request: Request, body: unknown): boolean {
  const { searchParams } = new URL(request.url);
  const asyncQuery = searchParams.get("async")?.trim().toLowerCase();
  const modeQuery = searchParams.get("mode")?.trim().toLowerCase();

  if (asyncQuery === "true" || asyncQuery === "1" || modeQuery === "async") {
    return true;
  }

  const preferHeader = request.headers.get("prefer")?.toLowerCase() || "";
  if (preferHeader.includes("respond-async")) {
    return true;
  }

  const asyncHeader = request.headers.get("x-async-job")?.trim().toLowerCase();
  if (asyncHeader === "true" || asyncHeader === "1") {
    return true;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    (body as Record<string, unknown>).async === true
  ) {
    return true;
  }

  return false;
}

/**
 * Strip async control flags before strict Zod schema validation.
 */
export function stripAsyncFlag(body: unknown): unknown {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return body;
  }
  const clone = { ...(body as Record<string, unknown>) };
  delete clone.async;
  return clone;
}

/**
 * Normalize DB content record status values to polling contract statuses.
 */
export function mapContentStatusToPollingState(content: {
  id: string;
  status?: string | null;
  video_url?: string | null;
  script?: string | null;
}): VideoPollingPayload {
  const rawStatus = (content.status || "").trim().toLowerCase();

  if (rawStatus === "failed" || rawStatus === "error") {
    return {
      job_id: content.id,
      status: "failed",
      progress: 0,
      video_url: null,
      error: content.script || "Quá trình tổng hợp video thất bại.",
    };
  }

  if (
    rawStatus === "ready" ||
    rawStatus === "published" ||
    rawStatus === "completed"
  ) {
    return {
      job_id: content.id,
      status: "completed",
      progress: 100,
      video_url: content.video_url ?? null,
    };
  }

  if (rawStatus === "pending" || rawStatus === "processing") {
    return {
      job_id: content.id,
      status: "processing",
      progress: 50,
      video_url: null,
    };
  }

  return {
    job_id: content.id,
    status: content.video_url ? "completed" : "processing",
    progress: content.video_url ? 100 : 50,
    video_url: content.video_url ?? null,
  };
}

/**
 * Validate campaign/product ownership & fail-fast resource thresholds upfront,
 * insert a `pending` row in `contents`, and return a non-blocking background runner.
 */
export async function createAsyncVideoGenerationJob({
  db,
  bgDb = db,
  merchantId,
  input,
  runGenerator = generateMerchantCampaignVideo as RunVideoGeneratorFn,
}: {
  db: AsyncVideoDbClient;
  bgDb?: AsyncVideoDbClient;
  merchantId: string;
  input: VideoGenerateRequestInput;
  runGenerator?: RunVideoGeneratorFn;
}): Promise<AsyncVideoJobPreflightResult> {
  const queryDb = db as unknown as InternalAsyncDb;
  const queryBgDb = bgDb as unknown as InternalAsyncDb;

  const { data: campaign, error: campaignError } = await queryDb
    .from("campaigns")
    .select("id, merchant_id, product_id, name")
    .eq("id", input.campaign_id)
    .maybeSingle();

  if (campaignError || !campaign) {
    return {
      success: false,
      errorType: "NOT_FOUND",
      error: "Không tìm thấy chiến dịch tương ứng.",
    };
  }

  if (campaign.merchant_id && campaign.merchant_id !== merchantId) {
    return {
      success: false,
      errorType: "FORBIDDEN",
      error: "Bạn không có quyền quản lý chiến dịch này.",
    };
  }

  if (campaign.product_id && campaign.product_id !== input.product_id) {
    return {
      success: false,
      errorType: "INVALID_INPUT",
      error: "Sản phẩm không khớp với sản phẩm đã đăng ký trong chiến dịch.",
    };
  }

  const { data: product, error: productError } = await queryDb
    .from("products")
    .select("id, sale_price")
    .eq("id", input.product_id)
    .maybeSingle();

  if (productError || !product) {
    return {
      success: false,
      errorType: "NOT_FOUND",
      error: "Không tìm thấy sản phẩm du lịch tương ứng.",
    };
  }

  const minRequired = calculateMinRequiredAssets(input.target_duration_sec || 28);
  let assetCount = 0;

  if (input.media_reference_ids && input.media_reference_ids.length > 0) {
    const { data: selectedRows, error: mediaErr } = await queryDb
      .from("media_references")
      .select("id")
      .eq("merchant_id", merchantId)
      .in("id", input.media_reference_ids);

    if (mediaErr) {
      return {
        success: false,
        errorType: "INVALID_INPUT",
        error: `Lỗi truy vấn thư viện video mẫu: ${mediaErr.message}`,
      };
    }

    const selectedSet = new Set((selectedRows || []).map((r) => r.id));
    assetCount = selectedSet.size;

    if (assetCount < minRequired) {
      const { data: extraRows } = await queryDb
        .from("media_references")
        .select("id")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(20);

      for (const row of extraRows || []) {
        if (!selectedSet.has(row.id)) {
          selectedSet.add(row.id);
          if (selectedSet.size >= minRequired) break;
        }
      }
      assetCount = selectedSet.size;
    }
  } else {
    const { data: defaultRows, error: mediaErr } = await queryDb
      .from("media_references")
      .select("id")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (mediaErr) {
      return {
        success: false,
        errorType: "INVALID_INPUT",
        error: `Lỗi truy vấn thư viện video mẫu: ${mediaErr.message}`,
      };
    }
    assetCount = (defaultRows || []).length;
  }

  const missingInputs: VideoGenerateBlockedResponse["missing_or_invalid_inputs"] = [];
  if (assetCount < minRequired) {
    missingInputs.push({
      field: "media_assets",
      reason: `Chiến dịch yêu cầu video ${input.target_duration_sec}s cần tối thiểu ${minRequired} ảnh/clip thật, hiện có ${assetCount} tài nguyên.`,
      required_action: `Vui lòng tải lên thêm ít nhất ${minRequired - assetCount} ảnh chụp thật hoặc clip quay thực tế.`,
    });
  }
  if (!input.authentic_tips || input.authentic_tips.length === 0) {
    missingInputs.push({
      field: "authentic_tips",
      reason: "Thiếu danh sách mẹo và lưu ý thực tế tại điểm đến.",
      required_action: "Bổ sung ít nhất 1 kinh nghiệm/lưu ý thực tế.",
    });
  }
  if ((Number(product.sale_price) || 0) <= 0) {
    missingInputs.push({
      field: "sale_price",
      reason: "Giá bán sản phẩm không hợp lệ (phải là số dương).",
      required_action: "Cung cấp giá bán chính xác từ cơ sở dữ liệu Merchant.",
    });
  }

  if (missingInputs.length > 0) {
    return {
      success: false,
      errorType: "BLOCKED",
      blockedData: {
        success: false,
        status: "BLOCKED_MISSING_INPUT",
        error_summary: "Thiếu dữ liệu thực tế đạt chuẩn trước khi khởi tạo job tạo video.",
        missing_or_invalid_inputs: missingInputs,
      },
    };
  }

  const { data: pendingJob, error: insertError } = await queryDb
    .from("contents")
    .insert({
      campaign_id: input.campaign_id,
      product_id: input.product_id,
      persona: input.persona,
      status: "pending",
      hook: null,
      script: null,
      caption: null,
      cta: null,
      video_url: null,
      tracking_url: `https://travellink.vn/r/c_${input.campaign_id.slice(0, 8)}`,
    })
    .select("id")
    .single();

  if (insertError || !pendingJob?.id) {
    return {
      success: false,
      errorType: "INVALID_INPUT",
      error: `Không thể khởi tạo tác vụ xử lý video: ${insertError?.message || "Unknown error"}`,
    };
  }

  const jobId: string = pendingJob.id;

  const backgroundTask = async () => {
    try {
      const result = await runGenerator(
        bgDb as SupabaseClient<Database>,
        merchantId,
        input,
      );
      if (result.success) {
        await queryBgDb
          .from("contents")
          .update({
            status: "ready",
            video_url: result.data.video_url,
            hook: result.data.hook,
            script: result.data.script,
            caption: result.data.caption,
            cta: result.data.cta,
          })
          .eq("id", jobId);

        if (result.data.content_id && result.data.content_id !== jobId) {
          await queryBgDb.from("contents").delete().eq("id", result.data.content_id);
        }
      } else {
        const failureReason =
          result.errorType === "BLOCKED"
            ? result.blockedData.error_summary
            : result.error;
        await queryBgDb
          .from("contents")
          .update({ status: "failed", script: failureReason })
          .eq("id", jobId);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown background error";
      await queryBgDb
        .from("contents")
        .update({ status: "failed", script: message })
        .eq("id", jobId);
    }
  };

  return {
    success: true,
    jobId,
    backgroundTask,
  };
}

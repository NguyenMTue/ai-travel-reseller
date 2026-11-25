/**
 * Standalone Video Render Worker (chạy trên máy RTX 3060 hoặc VPS riêng)
 * Poll bảng `public.video_jobs` mỗi 5 giây, nhận job `queued` và dựng video FFmpeg 40-50s.
 *
 * Chạy: node --env-file=.env.local --experimental-strip-types scripts/video-worker.ts
 */

import { createAdminClient } from "../src/lib/supabase/admin.ts";
import {
  executeAutoVideoPipeline,
  type AutoPipelineInput,
} from "../src/lib/video-engine/auto-pipeline-worker.ts";

const POLL_INTERVAL_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollAndProcessOnce(): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data: job, error } = await adminClient
    .from("video_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[VIDEO_WORKER] Query error:", error.message);
    return false;
  }

  if (!job) return false;

  // Claim job atomically
  const { data: claimed, error: claimErr } = await adminClient
    .from("video_jobs")
    .update({
      status: "running",
      progress: 15,
      step: "Worker đã nhận job",
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();

  if (claimErr || !claimed) {
    return false;
  }

  console.log(`[VIDEO_WORKER] Processing job ${job.id} (campaign ${job.campaign_id})...`);
  const payload: AutoPipelineInput = {
    campaignId: job.campaign_id,
    merchantId: job.merchant_id,
    productId: job.product_id || undefined,
    ...(job.input_payload && typeof job.input_payload === "object" ? job.input_payload : {}),
  };

  try {
    const result = await executeAutoVideoPipeline(payload, job.id);
    console.log(
      `[VIDEO_WORKER] Job ${job.id} done: success=${result.success}, duration=${result.durationSec}s, url=${result.videoUrl}`
    );
  } catch (err: any) {
    console.error(`[VIDEO_WORKER] Job ${job.id} failed:`, err?.message || err);
  }

  return true;
}

async function main() {
  console.log("[VIDEO_WORKER] Started polling public.video_jobs every 5s...");
  while (true) {
    try {
      const processed = await pollAndProcessOnce();
      if (!processed) {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (err) {
      console.error("[VIDEO_WORKER] Loop error:", err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

main();

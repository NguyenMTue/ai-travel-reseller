import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateAutoReviewScript,
  type AutoPipelineInput,
} from "../src/lib/video-engine/auto-pipeline-worker.ts";

console.log("===============================================================================");
console.log("🧪 BE1 WEEK 6 HIGH-PRIORITY TASKS VERIFICATION SUITE");
console.log("Date: 17/11/2026 | Author: Nguyen Minh Tue (BE1 Lead & PM)");
console.log("Tasks: BE1-W6-01 (Auto Video Pipeline 40-50s), BE1-W6-02 (Top Reseller Budget RPC), BE1-W6-05 (Storefront Checkout)");
console.log("===============================================================================\n");

test("BE1-W6-01: Auto-Pipeline Endpoint & Worker Specification", async () => {
  const routePath = resolve("app/api/merchant/video/auto-pipeline/route.ts");
  const workerPath = resolve("src/lib/video-engine/auto-pipeline-worker.ts");

  assert.ok(existsSync(routePath), "app/api/merchant/video/auto-pipeline/route.ts must exist");
  assert.ok(existsSync(workerPath), "src/lib/video-engine/auto-pipeline-worker.ts must exist");

  const routeContent = readFileSync(routePath, "utf-8");
  // 1. Must use after() from next/server for non-blocking execution
  assert.match(
    routeContent,
    /import\s*\{[^}]*after[^}]*\}\s*from\s*["']next\/server["']/,
    "Route must import after from next/server"
  );

  // 2. Must respond with HTTP 202 Accepted
  assert.match(
    routeContent,
    /status:\s*202/,
    "Route must return HTTP status 202 Accepted"
  );

  // 3. Must accept duration 40-50s
  assert.match(
    routeContent,
    />=\s*40\s*&&\s*rawDuration\s*<=\s*50/,
    "Route must validate targetDurationSec between 40s and 50s"
  );

  const workerContent = readFileSync(workerPath, "utf-8");
  // 4. Worker must insert record with status = 'pending'
  assert.match(
    workerContent,
    /status:\s*["']pending["']/,
    "Worker must insert contents with status = 'pending' for merchant review"
  );

  // 5. Worker must upload to campaign-videos bucket
  assert.match(
    workerContent,
    /from\(["']campaign-videos["']\)/,
    "Worker must upload to campaign-videos Supabase storage bucket"
  );
});

test("BE1-W6-01: 4-Scene 40–50s Review Script Generation Logic", async () => {
  const input: AutoPipelineInput = {
    campaignId: "44444444-4444-4444-4444-444444444444",
    merchantId: "11111111-1111-1111-1111-111111111111",
    tourName: "Vé Cáp Treo Sun World Ba Na Hills",
    location: "Bà Nà Hills, Đà Nẵng",
    highlights: "Cầu Vàng, Làng Pháp, Cáp treo đạt kỷ lục thế giới",
    price: 950000,
    targetDurationSec: 46,
  };

  const script = await generateAutoReviewScript(input);

  // 1. Duration must be between 40s and 50s
  assert.ok(
    script.targetDurationSec >= 40 && script.targetDurationSec <= 50,
    `Duration must be 40-50s, got ${script.targetDurationSec}`
  );

  // 2. Must have exactly 4 scenes
  assert.equal(script.scenes.length, 4, "Must have exactly 4 scenes");

  // 3. Verify roles
  const roles = script.scenes.map((s) => s.role);
  assert.deepEqual(
    roles,
    ["HOOK", "EXPERIENCE", "PRICING_AND_QR", "CTA"],
    "Scenes must follow Hook -> Experience -> Pricing & QR -> CTA"
  );

  // 4. Verify scene durations sum close to target
  const sumDuration = script.scenes.reduce((acc, s) => acc + s.durationSec, 0);
  assert.ok(
    sumDuration >= 40 && sumDuration <= 50,
    `Sum of scene durations must be 40-50s, got ${sumDuration}`
  );

  // 5. Verify voiceover text presence
  for (const scene of script.scenes) {
    assert.ok(scene.voiceoverText.length > 10, `Scene ${scene.sceneNumber} voiceover must be present`);
    assert.ok(scene.overlayText.length > 3, `Scene ${scene.sceneNumber} overlay text must be present`);
  }
});

test("BE1-W6-02: Top Reseller RPC & Budget Matching", async () => {
  const migrationPath = resolve("supabase/migrations/20261117100000_get_top_resellers_for_merchant.sql");
  const apiRoutePath = resolve("app/api/merchant/resellers/top/route.ts");

  assert.ok(existsSync(migrationPath), "Migration file must exist");
  assert.ok(existsSync(apiRoutePath), "API route app/api/merchant/resellers/top/route.ts must exist");

  const migrationContent = readFileSync(migrationPath, "utf-8");
  // 1. RPC function name
  assert.match(
    migrationContent,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_top_resellers_for_merchant/,
    "Migration must create get_top_resellers_for_merchant RPC"
  );

  // 2. Budget filter argument
  assert.match(
    migrationContent,
    /p_max_commission_rate\s+numeric/,
    "RPC must accept p_max_commission_rate argument"
  );

  // 3. Conversion rate calculation
  assert.match(
    migrationContent,
    /conversion_rate/,
    "RPC must compute conversion_rate"
  );

  const apiContent = readFileSync(apiRoutePath, "utf-8");
  // 4. API must call RPC or provide robust fallback
  assert.match(
    apiContent,
    /get_top_resellers_for_merchant/,
    "API route must invoke get_top_resellers_for_merchant"
  );
  assert.match(
    apiContent,
    /max_commission_rate/,
    "API route must parse max_commission_rate query parameter"
  );
});

test("BE1-W6-05: Storefront Order Confirmation & Commission Credit", async () => {
  const confirmRoutePath = resolve("app/api/storefront/orders/confirm/route.ts");
  assert.ok(existsSync(confirmRoutePath), "app/api/storefront/orders/confirm/route.ts must exist");

  const content = readFileSync(confirmRoutePath, "utf-8");

  // 1. Must handle duplicate order safely
  assert.match(
    content,
    /duplicate:\s*true/,
    "Route must handle duplicate orders idempotently"
  );

  // 2. Must return eTicket object with QR payload
  assert.match(
    content,
    /qrPayload:\s*`TRAVEL_LINK_ETICKET:\$\{bookingReference\}:\$\{ticketCode\}:\$\{orderAmount\}`/,
    "Route must return eTicket with QR payload"
  );

  // 3. Must calculate net reseller commission (80%)
  assert.match(
    content,
    /resellerCommission\s*=\s*grossCommission\s*-\s*platformFee/,
    "Route must calculate 80% net commission to reseller"
  );
});

test("Python LLM Service: generate_review_script_45s Sub-task 2", async () => {
  const pyPath = resolve("services/llm-service/content_generator.py");
  assert.ok(existsSync(pyPath), "services/llm-service/content_generator.py must exist");

  const content = readFileSync(pyPath, "utf-8");
  assert.match(
    content,
    /def\s+generate_review_script_45s/,
    "content_generator.py must define generate_review_script_45s"
  );
  assert.match(
    content,
    /40–50s|40-50s|cấu trúc 4 phân cảnh/i,
    "content_generator.py must mention 40-50s TikTok review"
  );
});

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { GoogleGenAI } from "@google/genai";

import {
  buildContentFactoryPrompt,
} from "../src/lib/ai/prompts/content-factory.ts";
import {
  campaignContentOutputSchema,
  geminiCampaignContentJsonSchema,
  type ContentPersona,
} from "../src/lib/ai/schemas/content-schema.ts";
import { validateContentGuardrails } from "../src/lib/ai/guardrails/content-validator.ts";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required for the live content test");
}

const model = process.env.GEMINI_CONTENT_MODEL?.trim() || "gemini-3.5-flash-lite";
const requestedRuns = Number(process.env.BE2_LIVE_RUNS ?? "4");
const runCount = Number.isInteger(requestedRuns)
  ? Math.min(Math.max(requestedRuns, 1), 10)
  : 4;
const client = new GoogleGenAI({ apiKey });
const capturedRuns: Array<{
  run: number;
  product: string;
  persona: ContentPersona;
  guardrail_status: "APPROVED" | "NEEDS_REVIEW";
  guardrail_flags: string[];
  output: unknown;
}> = [];

const products = [
  {
    testId: "ba-na-hills",
    name: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
    description:
      "Vé trọn gói vào cổng, cáp treo khứ hồi Bà Nà Hills, tham quan Cầu Vàng, Làng Pháp và buffet trưa hơn 100 món tại nhà hàng Arapang hoặc Beer Plaza.",
    category: "Vé tham quan & Ẩm thực",
    original_price: 1_250_000,
    sale_price: 1_150_000,
    campaign_name: "Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills",
    target_audience: "Gia đình có trẻ nhỏ, nhóm bạn trẻ",
    target_location: "Đà Nẵng, Hà Nội, TP.HCM",
    verified_facts: [
      "Bao gồm vé vào cổng và cáp treo khứ hồi",
      "Bao gồm tham quan Cầu Vàng và Làng Pháp",
      "Bao gồm buffet trưa hơn 100 món tại Arapang hoặc Beer Plaza",
    ],
    confirmed_offers: ["Giá bán chính thức 1.150.000 VND"],
  },
  {
    testId: "vinwonders-nam-hoi-an",
    name: "Vé VinWonders Nam Hội An",
    description: "Vé vào cửa khu vui chơi VinWonders Nam Hội An.",
    category: "Vé vui chơi",
    original_price: 600_000,
    sale_price: 510_000,
    campaign_name: "Khám phá Nam Hội An 2026",
    target_audience: "Gia đình có trẻ nhỏ và nhóm bạn",
    target_location: "Quảng Nam, Đà Nẵng",
    verified_facts: [
      "Bao gồm vé vào cửa VinWonders Nam Hội An",
      "Không bao gồm chi phí ăn uống",
    ],
    confirmed_offers: ["Giá bán chính thức 510.000 VND"],
  },
];

// Keep the first four runs backward-compatible while eight runs cover the
// complete 2-products x 4-personas acceptance matrix without duplicates.
const acceptanceMatrix = [
  { productIndex: 0, persona: "local_guide" },
  { productIndex: 1, persona: "family" },
  { productIndex: 0, persona: "foodie" },
  { productIndex: 1, persona: "budget_traveler" },
  { productIndex: 0, persona: "family" },
  { productIndex: 1, persona: "local_guide" },
  { productIndex: 0, persona: "budget_traveler" },
  { productIndex: 1, persona: "foodie" },
] satisfies Array<{ productIndex: number; persona: ContentPersona }>;

for (let index = 0; index < runCount; index += 1) {
  const matrixEntry = acceptanceMatrix[index % acceptanceMatrix.length];
  const persona = matrixEntry.persona;
  const product = products[matrixEntry.productIndex];
  const prompt = buildContentFactoryPrompt(persona, product);
  const interaction = await client.interactions.create({
    model,
    system_instruction: `${prompt.system}\nCURRENT_DATE: 2026-10-13`,
    input: prompt.user,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: geminiCampaignContentJsonSchema as Record<string, unknown>,
    },
    generation_config: {
      max_output_tokens: 12_000,
      temperature: 0.6,
    },
  });

  assert.ok(interaction.output_text, `Run ${index + 1} returned no text`);
  const output = campaignContentOutputSchema.parse(
    JSON.parse(interaction.output_text),
  );
  assert.equal(output.persona, persona);

  const generatedText = JSON.stringify(output);
  const guardrailResult = validateContentGuardrails(generatedText, {
    original_price: product.original_price,
    sale_price: product.sale_price,
    confirmed_promo_codes: [],
    verified_facts: product.verified_facts,
  });
  capturedRuns.push({
    run: index + 1,
    product: product.testId,
    persona,
    guardrail_status: guardrailResult.recommended_status,
    guardrail_flags: guardrailResult.flags,
    output,
  });

  process.stdout.write(
    `run=${index + 1} product=${product.testId} persona=${persona} status=${guardrailResult.recommended_status}${guardrailResult.flags.length > 0 ? ` flags=${guardrailResult.flags.join(",")}` : ""}\n`,
  );
}

const reportPath = process.env.BE2_LIVE_REPORT_PATH?.trim();
if (reportPath) {
  const resolvedReportPath = path.resolve(reportPath);
  await fs.mkdir(path.dirname(resolvedReportPath), { recursive: true });
  await fs.writeFile(
    resolvedReportPath,
    `${JSON.stringify({
      generated_at: new Date().toISOString(),
      model,
      run_count: capturedRuns.length,
      note: "Direct Gemini validation only; this is not n8n or Supabase execution evidence.",
      runs: capturedRuns,
    }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`report=${resolvedReportPath}\n`);
}

const reviewRuns = capturedRuns.filter(
  (run) => run.guardrail_status !== "APPROVED",
);
assert.equal(
  reviewRuns.length,
  0,
  `${reviewRuns.length}/${capturedRuns.length} live outputs require review: ${reviewRuns.map((run) => `${run.product}/${run.persona}[${run.guardrail_flags.join(",")}]`).join("; ")}`,
);

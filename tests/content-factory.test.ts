import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  campaignContentJsonSchema,
  campaignContentOutputSchema,
  geminiCampaignContentJsonSchema,
  parseCampaignContentOutput,
} from "../src/lib/ai/schemas/content-schema.ts";
import {
  buildContentFactoryPrompt,
  CONTENT_PERSONAS,
} from "../src/lib/ai/prompts/content-factory.ts";
import {
  CONTENT_GUARDRAIL_FLAGS,
  validateContentGuardrails,
} from "../src/lib/ai/guardrails/content-validator.ts";

const validOutput = {
  persona: "local_guide" as const,
  hooks: Array.from(
    { length: 10 },
    (_, index) => `Khám phá trải nghiệm miền Trung đáng nhớ số ${index + 1}`,
  ),
  scripts: Array.from({ length: 5 }, (_, index) => ({
    title: `Hành trình trải nghiệm địa phương số ${index + 1}`,
    duration: 30 + index,
    scenes: [
      "Mở đầu bằng toàn cảnh điểm đến và tên trải nghiệm.",
      "Giới thiệu các quyền lợi đã được merchant xác nhận.",
      "Kết thúc bằng lời mời xem thông tin đặt dịch vụ.",
    ],
  })),
  captions: Array.from(
    { length: 5 },
    (_, index) =>
      `Một hành trình miền Trung đáng lưu lại cho chuyến đi số ${index + 1}. #DuLichMienTrung`,
  ),
  ctas: Array.from(
    { length: 5 },
    () => "Xem thông tin chính thức và đặt dịch vụ tại [LINK_MUA_VE]",
  ),
};

const verifiedProduct = {
  original_price: 1_250_000,
  sale_price: 1_150_000,
  confirmed_price_offer: [],
  confirmed_promo_codes: [],
  verified_facts: ["Bao gồm buffet trưa"],
};

const promptProduct = {
  name: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
  description: "Vé trọn gói vào cổng, cáp treo và buffet trưa.",
  category: "Vé tham quan & Ẩm thực",
  original_price: 1_250_000,
  sale_price: 1_150_000,
  campaign_name: "Chiến dịch Hè 2026",
  target_audience: "Gia đình và nhóm bạn trẻ",
  target_location: "Đà Nẵng",
  verified_facts: ["Bao gồm buffet trưa"],
  confirmed_offers: [],
};

test("all four persona prompts preserve the shared safety boundary", () => {
  const prompts = Object.keys(CONTENT_PERSONAS).map((persona) =>
    buildContentFactoryPrompt(
      persona as keyof typeof CONTENT_PERSONAS,
      promptProduct,
    ),
  );

  assert.equal(prompts.length, 4);
  assert.equal(new Set(prompts.map((prompt) => prompt.system)).size, 4);
  for (const prompt of prompts) {
    assert.match(prompt.system, /Không bịa giá/);
    assert.match(prompt.system, /\[LINK_MUA_VE\]/);
    assert.match(prompt.user, /<VERIFIED_PRODUCT_DATA>/);
  }
});

test("portable JSON schema stays in sync with the Zod schema", () => {
  const handoffSchema = JSON.parse(
    readFileSync(
      new URL("../docs/be2/content-factory.schema.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(handoffSchema, campaignContentJsonSchema);
});

test("Gemini provider schema excludes unsupported string constraints", () => {
  const serializedSchema = JSON.stringify(geminiCampaignContentJsonSchema);
  assert.doesNotMatch(serializedSchema, /\$schema|minLength|maxLength|pattern/);
  assert.match(serializedSchema, /minItems|maxItems|additionalProperties/);
});

test("structured output enforces the exact 10/5/5/5 contract", () => {
  assert.equal(campaignContentOutputSchema.parse(validOutput).hooks.length, 10);
  assert.throws(() =>
    campaignContentOutputSchema.parse({
      ...validOutput,
      hooks: validOutput.hooks.slice(0, 9),
    }),
  );
});

test("parser removes JSON markdown fences", () => {
  const parsed = parseCampaignContentOutput(
    `\n\`\`\`json\n${JSON.stringify(validOutput)}\n\`\`\`\n`,
  );
  assert.deepEqual(parsed, validOutput);
});

test("guardrails approve confirmed prices", () => {
  const result = validateContentGuardrails(
    "Giá niêm yết 1.250.000đ, giá bán chính thức 1.150.000đ.",
    verifiedProduct,
  );
  assert.deepEqual(result, {
    isValid: true,
    flags: [],
    recommended_status: "APPROVED",
  });
});

const invalidCases = [
  {
    name: "wrong price",
    text: "Chỉ còn 999.000đ cho vé hôm nay.",
    flag: CONTENT_GUARDRAIL_FLAGS.PRICE_MISMATCH,
  },
  {
    name: "invented GIAM code",
    text: "Nhập mã GIAM50 để nhận ưu đãi.",
    flag: CONTENT_GUARDRAIL_FLAGS.UNCONFIRMED_PROMO_CODE,
  },
  {
    name: "invented SALE code",
    text: "Dùng SALE20 khi thanh toán.",
    flag: CONTENT_GUARDRAIL_FLAGS.UNCONFIRMED_PROMO_CODE,
  },
  {
    name: "free hotel claim",
    text: "Đặt vé ngay để được miễn phí khách sạn.",
    flag: CONTENT_GUARDRAIL_FLAGS.PROHIBITED_CLAIM,
  },
  {
    name: "lifetime meals claim",
    text: "Gói đặc biệt bao ăn trọn đời.",
    flag: CONTENT_GUARDRAIL_FLAGS.PROHIBITED_CLAIM,
  },
] as const;

for (const invalidCase of invalidCases) {
  test(`guardrails reject ${invalidCase.name}`, () => {
    const result = validateContentGuardrails(
      invalidCase.text,
      verifiedProduct,
    );
    assert.equal(result.isValid, false);
    assert.equal(result.recommended_status, "NEEDS_REVIEW");
    assert.ok(result.flags.includes(invalidCase.flag));
  });
}

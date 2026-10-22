import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  campaignContentJsonSchema,
  campaignContentOutputSchema,
  captionSchema,
  geminiCampaignContentJsonSchema,
  hasValidHashtag,
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
import {
  mapCampaignContentToRows,
  toPersistenceStatus,
} from "../src/lib/ai/content-persistence.ts";
import { mapCampaignContentToBatchPayload } from "../src/lib/ai/content-batch.ts";

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

const vinWondersPromptProduct = {
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

test("Bà Nà Hills and VinWonders prompts keep product data outside the system instruction", () => {
  for (const product of [promptProduct, vinWondersPromptProduct]) {
    const prompt = buildContentFactoryPrompt("family", product);
    assert.equal(prompt.system.includes(product.name), false);
    assert.equal(prompt.user.includes(product.name), true);
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

test("structured output rejects common n8n parser contract violations", () => {
  assert.throws(() => campaignContentOutputSchema.parse({
    ...validOutput,
    scripts: validOutput.scripts.map((script) => script.title),
  }));
  assert.throws(() => campaignContentOutputSchema.parse({
    ...validOutput,
    captions: validOutput.captions.map(() =>
      "Một caption đủ dài nhưng không chứa hashtag bắt buộc"
    ),
  }));
  assert.throws(() => campaignContentOutputSchema.parse({
    ...validOutput,
    ctas: validOutput.ctas.map(() =>
      "Xem thông tin chính thức và đặt dịch vụ ngay hôm nay"
    ),
  }));
  assert.throws(() => campaignContentOutputSchema.parse({
    ...validOutput,
    variants: [],
  }));
});

test("hashtag validation accepts unicode letters and numbers in vietnamese and english", () => {
  const validTags = ["#DaNang", "#VinWonders2026", "#ĐàNẵng", "#Du_Lịch_2026"];
  for (const tag of validTags) {
    assert.equal(hasValidHashtag(`Khám phá hành trình tuyệt vời cùng gia đình ${tag}`), true);
    assert.doesNotThrow(() =>
      captionSchema.parse(
        `Khám phá hành trình trải nghiệm tuyệt vời cùng gia đình ngay hôm nay ${tag}`,
      ),
    );
  }
});

test("hashtag validation rejects symbols-only, lone hash, or missing hashtag", () => {
  const invalidCaptions = [
    "Một caption đủ dài hơn bốn mươi ký tự nhưng chỉ chứa hashtag ký hiệu #!",
    "Một caption đủ dài hơn bốn mươi ký tự nhưng chỉ chứa hashtag gạch nối #---",
    "Một caption đủ dài hơn bốn mươi ký tự nhưng chỉ chứa hashtag emoji #💥",
    "Một caption đủ dài hơn bốn mươi ký tự nhưng có dấu thăng đứng một mình # ở giữa",
    "Một caption đủ dài hơn bốn mươi ký tự nhưng kết thúc bằng dấu thăng #",
    "Một caption đủ dài hơn bốn mươi ký tự nhưng hoàn toàn không có hashtag nào cả",
  ];

  for (const caption of invalidCaptions) {
    assert.equal(hasValidHashtag(caption), false);
    assert.throws(
      () => captionSchema.parse(caption),
      /Caption must include at least one relevant hashtag|Caption hashtag must contain at least one letter or number/,
    );
  }

  assert.throws(() =>
    campaignContentOutputSchema.parse({
      ...validOutput,
      captions: validOutput.captions.map(
        () => "Khám phá hành trình trải nghiệm tuyệt vời cùng gia đình ngay hôm nay #---",
      ),
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

test("persistence mapping creates five complete rows and five hook-only rows", () => {
  const rows = mapCampaignContentToRows(
    validOutput,
    { isValid: true, flags: [], recommended_status: "APPROVED" },
    {
      campaign_id: "44444444-4444-4444-4444-444444444444",
      product_id: "33333333-3333-3333-3333-333333333333",
      reseller_id: null,
    },
  );

  assert.equal(rows.length, 10);
  assert.ok(
    rows.slice(0, 5).every((row) =>
      row.script !== null && row.caption !== null && row.cta !== null
    ),
  );
  assert.ok(
    rows.slice(5).every((row) =>
      row.script === null && row.caption === null && row.cta === null
    ),
  );
  assert.equal(new Set(rows.map((row) => row.hook)).size, 10);
  assert.equal(rows[0].status, "approved");
  assert.equal(rows[0].reseller_id, null);
  assert.match(rows[0].script ?? "", /Thời lượng: 30 giây/);
});

test("n8n batch payload covers all personas without cycling assets", () => {
  for (const persona of Object.keys(CONTENT_PERSONAS)) {
    const payload = mapCampaignContentToBatchPayload(
      {
        ...validOutput,
        persona: persona as keyof typeof CONTENT_PERSONAS,
      },
      "44444444-4444-4444-4444-444444444444",
    );

    assert.equal(payload.records.length, 10);
    assert.ok(payload.records.slice(0, 5).every((record) =>
      record.script !== null &&
      record.caption !== null &&
      record.cta !== null
    ));
    assert.ok(payload.records.slice(5).every((record) =>
      record.script === null &&
      record.caption === null &&
      record.cta === null
    ));
    assert.deepEqual(Object.keys(payload.records[0]).sort(), [
      "caption",
      "cta",
      "hook",
      "persona",
      "script",
    ]);
  }
});

test("n8n batch payload rejects an invalid campaign id", () => {
  assert.throws(
    () => mapCampaignContentToBatchPayload(validOutput, "not-a-uuid"),
  );
});

test("persistence status is lowercase and rejects inconsistent guardrail results", () => {
  assert.equal(
    toPersistenceStatus({
      isValid: false,
      flags: [CONTENT_GUARDRAIL_FLAGS.PRICE_MISMATCH],
      recommended_status: "NEEDS_REVIEW",
    }),
    "needs_review",
  );
  assert.throws(
    () => toPersistenceStatus({
      isValid: true,
      flags: [],
      recommended_status: "NEEDS_REVIEW",
    }),
    /Inconsistent content guardrail result/,
  );
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
  {
    name: "unverified official discount claim",
    text: "Nhận vé chính hãng với giá ưu đãi mới nhất.",
    flag: CONTENT_GUARDRAIL_FLAGS.PROHIBITED_CLAIM,
  },
  {
    name: "unverified queue claim",
    text: "Đặt vé trước để không phải xếp hàng mua vé.",
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

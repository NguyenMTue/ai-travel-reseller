import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { describe } from "node:test";

import {
  campaignVideoScriptSchema,
} from "../src/lib/ai/schemas/video-schema.ts";
import {
  FORBIDDEN_CLAIMS_BANA,
  FORBIDDEN_CLAIMS_HOIAN,
  validateContinuousTimeline,
  validateVerifiedFactsCatalog,
  validateVideoScriptArtifact,
} from "../src/lib/video-engine/grounding-validator.ts";

const banaScriptPath = new URL(
  "../docs/be2/samples/video-script.sample.json",
  import.meta.url
);
const hoianScriptPath = new URL(
  "../docs/be2/samples/video-script-hoian.sample.json",
  import.meta.url
);
const factsCatalogPath = new URL(
  "../docs/be2/samples/video-verified-facts-w4.json",
  import.meta.url
);

const banaScript = JSON.parse(readFileSync(banaScriptPath, "utf8"));
const hoianScript = JSON.parse(readFileSync(hoianScriptPath, "utf8"));
const factsCatalog = JSON.parse(readFileSync(factsCatalogPath, "utf8"));

describe("TASK-162: Deterministic Grounding Validator & Artifact Regression Suite", () => {
  // Test 1: Bà Nà script conforms to Zod schema
  test("1. Bà Nà script conforms to campaignVideoScriptSchema", () => {
    const parsed = campaignVideoScriptSchema.safeParse(banaScript);
    assert.ok(parsed.success, `Bà Nà script failed schema: ${parsed.error?.message}`);
    assert.equal(parsed.data.scenes.length, 14);
    assert.equal(parsed.data.format, "9:16");
    assert.equal(parsed.data.duration_seconds, 30);
  });

  // Test 2: Hội An script conforms to Zod schema
  test("2. Hội An script conforms to campaignVideoScriptSchema", () => {
    const parsed = campaignVideoScriptSchema.safeParse(hoianScript);
    assert.ok(parsed.success, `Hội An script failed schema: ${parsed.error?.message}`);
    assert.equal(parsed.data.scenes.length, 14);
    assert.equal(parsed.data.format, "9:16");
    assert.equal(parsed.data.duration_seconds, 30);
  });

  // Test 3: Verified-facts catalog is structurally valid and non-empty
  test("3. Verified-facts catalog passes validation with unique IDs and non-empty fields", () => {
    const result = validateVerifiedFactsCatalog(factsCatalog);
    assert.ok(result.isValid, `Catalog validation failed: ${JSON.stringify(result.issues)}`);
    assert.ok(result.facts.length >= 16, `Expected at least 16 facts, got ${result.facts.length}`);

    // Verify all fields are populated
    for (const fact of result.facts) {
      assert.ok(fact.id.length > 0, `Fact has empty id`);
      assert.ok(fact.product_id.length > 0, `Fact ${fact.id} has empty product_id`);
      assert.ok(fact.text.length > 0, `Fact ${fact.id} has empty text`);
      assert.ok(fact.category.length > 0, `Fact ${fact.id} has empty category`);
      assert.ok(fact.source_file.length > 0, `Fact ${fact.id} has empty source_file`);
      assert.ok(fact.source_locator.length > 0, `Fact ${fact.id} has empty source_locator`);
      assert.ok(fact.source_excerpt.length > 0, `Fact ${fact.id} has empty source_excerpt`);
    }
  });

  // Test 4: Bà Nà script fact refs all exist in catalog and belong to Bà Nà Hills
  test("4. Bà Nà script fact refs strictly exist in catalog and match product ID", () => {
    const result = validateVideoScriptArtifact(banaScript, factsCatalog, {
      forbiddenTerms: FORBIDDEN_CLAIMS_BANA,
      expectedProductId: "33333333-3333-3333-3333-333333333333",
    });

    assert.ok(
      result.isValid,
      `Bà Nà script validation failed issues: ${JSON.stringify(result.issues, null, 2)}`
    );
    assert.equal(result.checkedScenesCount, 14);
    assert.ok(result.referencedFactIds.length >= 14);

    // Verify no orphan refs
    for (const scene of banaScript.scenes) {
      assert.ok(scene.verified_fact_refs.length > 0);
    }
  });

  // Test 5: Hội An script fact refs all exist in catalog and belong to Nam Hội An
  test("5. Hội An script fact refs strictly exist in catalog and match product ID", () => {
    const result = validateVideoScriptArtifact(hoianScript, factsCatalog, {
      forbiddenTerms: FORBIDDEN_CLAIMS_HOIAN,
      expectedProductId: "33333333-3333-3333-3333-111111111111",
    });

    assert.ok(
      result.isValid,
      `Hội An script validation failed issues: ${JSON.stringify(result.issues, null, 2)}`
    );
    assert.equal(result.checkedScenesCount, 14);
    assert.ok(result.referencedFactIds.length >= 14);

    // Verify no orphan refs
    for (const scene of hoianScript.scenes) {
      assert.ok(scene.verified_fact_refs.length > 0);
    }
  });

  // Test 6: Fact IDs uniqueness is strictly enforced
  test("6. Duplicate fact IDs in catalog are detected and blocked", () => {
    const duplicateCatalog = {
      facts: [
        {
          id: "fact_dup",
          product_id: "33333333-3333-3333-3333-333333333333",
          text: "Fact A",
          category: "inclusion",
          source_file: "supabase/seed.sql",
          source_locator: "line 1",
          source_excerpt: "A",
        },
        {
          id: "fact_dup",
          product_id: "33333333-3333-3333-3333-333333333333",
          text: "Fact B",
          category: "inclusion",
          source_file: "supabase/seed.sql",
          source_locator: "line 2",
          source_excerpt: "B",
        },
      ],
    };

    const res = validateVerifiedFactsCatalog(duplicateCatalog);
    assert.equal(res.isValid, false);
    assert.ok(res.issues.some((i) => i.code === "DUPLICATE_FACT_ID"));
  });

  // Test 7: Unknown fact reference in script is blocked
  test("7. Script referencing unknown fact ID is blocked", () => {
    const tamperedScript = JSON.parse(JSON.stringify(banaScript));
    tamperedScript.scenes[2].verified_fact_refs = ["fact_non_existent_999"];

    const res = validateVideoScriptArtifact(tamperedScript, factsCatalog);
    assert.equal(res.isValid, false);
    assert.ok(res.issues.some((i) => i.code === "UNKNOWN_FACT_REF"));
  });

  // Test 8: Missing or empty catalog is blocked
  test("8. Missing or empty catalog is blocked", () => {
    const emptyCat = { facts: [] };
    const resEmpty = validateVideoScriptArtifact(banaScript, emptyCat);
    assert.equal(resEmpty.isValid, false);
    assert.ok(resEmpty.issues.some((i) => i.code === "EMPTY_CATALOG"));

    const nullCat = null;
    const resNull = validateVideoScriptArtifact(banaScript, nullCat);
    assert.equal(resNull.isValid, false);
    assert.ok(resNull.issues.some((i) => i.code === "INVALID_CATALOG_STRUCTURE"));
  });

  // Test 9: Forbidden claims in Bà Nà are detected
  test("9. Forbidden claims in Bà Nà Hills script are detected", () => {
    const forbiddenPhrasesToTest = [
      "kiệt tác nổi tiếng thế giới",
      "lâu đài đá cổ kính tráng lệ",
      "nhà thờ Gothic",
      "phong vị châu Âu",
      "tự do tham quan các điểm đến",
      "ngàn hoa",
      "biển mây chiều tà",
      "đỉnh núi Chúa",
      "Hầm rượu Debay",
    ];

    for (const phrase of forbiddenPhrasesToTest) {
      const tampered = JSON.parse(JSON.stringify(banaScript));
      tampered.scenes[0].narration = `Tham quan với ${phrase}.`;

      const res = validateVideoScriptArtifact(tampered, factsCatalog, {
        forbiddenTerms: FORBIDDEN_CLAIMS_BANA,
      });

      assert.equal(
        res.isValid,
        false,
        `Expected phrase '${phrase}' to be caught as forbidden`
      );
      assert.ok(
        res.issues.some((i) => i.code === "FORBIDDEN_CLAIM_DETECTED"),
        `Expected FORBIDDEN_CLAIM_DETECTED for '${phrase}'`
      );
    }
  });

  // Test 10: Forbidden claims in Nam Hội An are detected
  test("10. Forbidden claims in Nam Hội An script are detected", () => {
    const forbiddenPhrasesToTest = [
      "động vật hoang dã",
      "bán hoang dã",
      "kiến trúc giao thoa Đông Tây",
      "làng nghề truyền thống ba miền",
      "đã bao gồm trong vé",
      "bể tạo sóng",
      "làn trượt",
      "hoàng hôn",
      "gia đình",
      "laser",
      "tia nước",
      "sân khấu mặt hồ",
      "vé trọn gói",
    ];

    for (const phrase of forbiddenPhrasesToTest) {
      const tampered = JSON.parse(JSON.stringify(hoianScript));
      tampered.scenes[1].narration = `Trải nghiệm có ${phrase}.`;

      const res = validateVideoScriptArtifact(tampered, factsCatalog, {
        forbiddenTerms: FORBIDDEN_CLAIMS_HOIAN,
      });

      assert.equal(
        res.isValid,
        false,
        `Expected phrase '${phrase}' to be caught as forbidden in Hoi An`
      );
      assert.ok(
        res.issues.some((i) => i.code === "FORBIDDEN_CLAIM_DETECTED"),
        `Expected FORBIDDEN_CLAIM_DETECTED for '${phrase}'`
      );
    }
  });

  // Test 11: Missing [LINK_MUA_VE] CTA placeholder is blocked
  test("11. Missing CTA placeholder [LINK_MUA_VE] fails validation", () => {
    const tampered = JSON.parse(JSON.stringify(banaScript));
    tampered.cta.on_screen_text = "Đặt vé ngay hôm nay";

    const res = validateVideoScriptArtifact(tampered, factsCatalog);
    assert.equal(res.isValid, false);
    assert.ok(res.issues.some((i) => i.code === "MISSING_CTA_PLACEHOLDER"));
  });

  // Test 12: Broken timeline (discontinuity or invalid duration) is blocked
  test("12. Broken timeline (gap, overlap, non-zero start, wrong total) fails validation", () => {
    // Gap between scenes
    const brokenScenes = JSON.parse(JSON.stringify(banaScript.scenes));
    brokenScenes[2].start_seconds = 5.0; // scene 1 ends at 4.4, gap of 0.6s
    const issuesGap = validateContinuousTimeline(brokenScenes);
    assert.ok(issuesGap.some((i) => i.code === "TIMELINE_DISCONTINUITY"));

    // Overlap
    const overlapScenes = JSON.parse(JSON.stringify(banaScript.scenes));
    overlapScenes[2].start_seconds = 3.5; // scene 1 ends at 4.4, overlap
    const issuesOverlap = validateContinuousTimeline(overlapScenes);
    assert.ok(issuesOverlap.some((i) => i.code === "TIMELINE_DISCONTINUITY"));

    // Non-zero start
    const nonZeroScenes = JSON.parse(JSON.stringify(banaScript.scenes));
    nonZeroScenes[0].start_seconds = 1.0;
    const issuesNonZero = validateContinuousTimeline(nonZeroScenes);
    assert.ok(issuesNonZero.some((i) => i.code === "TIMELINE_START_NON_ZERO"));

    // Wrong total duration
    const wrongTotalScenes = JSON.parse(JSON.stringify(banaScript.scenes));
    wrongTotalScenes[13].end_seconds = 35.0;
    const issuesDuration = validateContinuousTimeline(wrongTotalScenes, 30);
    assert.ok(issuesDuration.some((i) => i.code === "TIMELINE_DURATION_MISMATCH"));
  });
});

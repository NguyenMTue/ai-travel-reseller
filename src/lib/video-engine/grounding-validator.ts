import {
  campaignVideoScriptSchema,
  type CampaignVideoScript,
} from "../ai/schemas/video-schema.ts";

/**
 * LIMITATION NOTE (Grounding Verification Boundary):
 * This deterministic validator enforces schema conformance, structural timeline continuity,
 * forbidden phrase scanning, CTA placeholder integrity, and exact fact-reference existence in the
 * verified-facts catalog (Lớp 1 Schema & Lớp 2 Fact-Reference Integrity).
 *
 * It does NOT replace human semantic entailment or certified Natural Language Inference (NLI).
 * True semantic entailment between visual_prompt/narration and source_excerpt must be verified
 * via systematic audit (see docs/be2/video-grounding-audit-w4.md) to prevent nuanced hallucination.
 */

export interface VerifiedFactItem {
  id: string;
  product_id: string;
  text: string;
  category: "price" | "inclusion" | "landmark" | "cta" | string;
  source_file: string;
  source_locator: string;
  source_excerpt: string;
}

export interface VerifiedFactsCatalog {
  catalog_version?: string;
  description?: string;
  facts: VerifiedFactItem[];
  products?: Array<{
    product_id: string;
    product_name?: string;
    merchant_name?: string;
    facts: VerifiedFactItem[];
  }>;
}

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
  sceneIndex?: number;
}

export interface ScriptValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  checkedScenesCount: number;
  referencedFactIds: string[];
}

export const FORBIDDEN_CLAIMS_BANA = [
  "kiệt tác nổi tiếng thế giới",
  "lâu đài đá cổ kính tráng lệ",
  "nhà thờ Gothic",
  "nhà thờ gothic",
  "phong vị châu Âu",
  "phong vị châu âu",
  "tự do tham quan các điểm đến",
  "ngàn hoa",
  "biển mây chiều tà",
  "đỉnh núi Chúa",
  "đỉnh núi chúa",
  "núi Chúa",
  "núi chúa",
  "thông tin ưu đãi",
  "Hầm rượu Debay",
  "hầm rượu debay",
  "Hầm rượu cổ Debay",
  "hầm rượu cổ debay",
  "Hầm rượu",
  "hầm rượu",
  "Debay",
  "debay",
];

export const FORBIDDEN_CLAIMS_HOIAN = [
  "động vật hoang dã",
  "động vật sống hai bên bờ",
  "bán hoang dã",
  "bến thuyền",
  "dòng sông",
  "kiến trúc giao thoa Đông Tây",
  "kiến trúc giao thoa Đông–Tây",
  "kiến trúc Đông Tây",
  "kiến trúc Đông–Tây",
  "Đông–Tây",
  "Đông Tây",
  "đông tây",
  "làng nghề truyền thống ba miền",
  "làng nghề ba miền",
  "ba miền",
  "đã bao gồm trong vé",
  "bể tạo sóng",
  "làn trượt nước",
  "làn trượt",
  "hoàng hôn lãng mạn bên sông",
  "hoàng hôn bên sông",
  "hoàng hôn",
  "gia đình",
  "trải nghiệm cả ngày",
  "cả ngày",
  "laser",
  "tia nước",
  "âm nhạc",
  "sân khấu mặt hồ",
  "vé trọn gói",
  "trọn gói",
];

/**
 * Validates the structure and content integrity of a verified-facts catalog.
 */
export function validateVerifiedFactsCatalog(rawCatalog: unknown): {
  isValid: boolean;
  issues: ValidationIssue[];
  facts: VerifiedFactItem[];
} {
  const issues: ValidationIssue[] = [];

  if (!rawCatalog || typeof rawCatalog !== "object") {
    return {
      isValid: false,
      issues: [
        {
          code: "INVALID_CATALOG_STRUCTURE",
          message: "Catalog must be a non-null object",
        },
      ],
      facts: [],
    };
  }

  const catalogObj = rawCatalog as Record<string, unknown>;
  const factsArray = Array.isArray(catalogObj.facts)
    ? (catalogObj.facts as unknown[])
    : Array.isArray(rawCatalog)
    ? (rawCatalog as unknown[])
    : null;

  if (!factsArray) {
    return {
      isValid: false,
      issues: [
        {
          code: "MISSING_FACTS_ARRAY",
          message: "Catalog must contain a 'facts' array",
        },
      ],
      facts: [],
    };
  }

  if (factsArray.length === 0) {
    return {
      isValid: false,
      issues: [
        {
          code: "EMPTY_CATALOG",
          message: "Verified facts catalog is empty (0 facts)",
        },
      ],
      facts: [],
    };
  }

  const facts: VerifiedFactItem[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < factsArray.length; i++) {
    const item = factsArray[i];
    if (!item || typeof item !== "object") {
      issues.push({
        code: "INVALID_FACT_ITEM",
        message: `Fact at index ${i} is not a valid object`,
      });
      continue;
    }

    const fact = item as Record<string, unknown>;
    const id = typeof fact.id === "string" ? fact.id.trim() : "";
    const productId =
      typeof fact.product_id === "string" ? fact.product_id.trim() : "";
    const text = typeof fact.text === "string" ? fact.text.trim() : "";
    const category =
      typeof fact.category === "string" ? fact.category.trim() : "";
    const sourceFile =
      typeof fact.source_file === "string" ? fact.source_file.trim() : "";
    const sourceLocator =
      typeof fact.source_locator === "string" ? fact.source_locator.trim() : "";
    const sourceExcerpt =
      typeof fact.source_excerpt === "string" ? fact.source_excerpt.trim() : "";

    if (!id) {
      issues.push({
        code: "EMPTY_FACT_ID",
        message: `Fact at index ${i} has empty 'id'`,
      });
    } else if (seenIds.has(id)) {
      issues.push({
        code: "DUPLICATE_FACT_ID",
        message: `Duplicate fact id detected: '${id}' at index ${i}`,
      });
    } else {
      seenIds.add(id);
    }

    if (!productId) {
      issues.push({
        code: "EMPTY_PRODUCT_ID",
        message: `Fact '${id || i}' has empty 'product_id'`,
      });
    }
    if (!text) {
      issues.push({
        code: "EMPTY_FACT_TEXT",
        message: `Fact '${id || i}' has empty 'text'`,
      });
    }
    if (!category) {
      issues.push({
        code: "EMPTY_FACT_CATEGORY",
        message: `Fact '${id || i}' has empty 'category'`,
      });
    }
    if (!sourceFile) {
      issues.push({
        code: "EMPTY_SOURCE_FILE",
        message: `Fact '${id || i}' has empty 'source_file'`,
      });
    }
    if (!sourceLocator) {
      issues.push({
        code: "EMPTY_SOURCE_LOCATOR",
        message: `Fact '${id || i}' has empty 'source_locator'`,
      });
    }
    if (!sourceExcerpt) {
      issues.push({
        code: "EMPTY_SOURCE_EXCERPT",
        message: `Fact '${id || i}' has empty 'source_excerpt'`,
      });
    }

    facts.push({
      id,
      product_id: productId,
      text,
      category,
      source_file: sourceFile,
      source_locator: sourceLocator,
      source_excerpt: sourceExcerpt,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    facts,
  };
}

/**
 * Validates continuous timeline across all scenes.
 */
export function validateContinuousTimeline(
  scenes: Array<{
    index: number;
    start_seconds: number;
    end_seconds: number;
  }>,
  expectedTotalDuration = 30
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (scenes.length === 0) {
    issues.push({
      code: "EMPTY_SCENES",
      message: "No scenes provided to check timeline",
    });
    return issues;
  }

  if (Math.abs(scenes[0].start_seconds - 0) > 0.05) {
    issues.push({
      code: "TIMELINE_START_NON_ZERO",
      message: `First scene start_seconds must be 0, found ${scenes[0].start_seconds}`,
      sceneIndex: scenes[0].index,
    });
  }

  for (let i = 1; i < scenes.length; i++) {
    const prev = scenes[i - 1];
    const curr = scenes[i];

    if (Math.abs(curr.start_seconds - prev.end_seconds) > 0.05) {
      issues.push({
        code: "TIMELINE_DISCONTINUITY",
        message: `Discontinuity between scene ${prev.index} (ends at ${prev.end_seconds}) and scene ${curr.index} (starts at ${curr.start_seconds})`,
        sceneIndex: curr.index,
      });
    }

    if (curr.end_seconds <= curr.start_seconds) {
      issues.push({
        code: "INVALID_SCENE_DURATION",
        message: `Scene ${curr.index} has end_seconds (${curr.end_seconds}) <= start_seconds (${curr.start_seconds})`,
        sceneIndex: curr.index,
      });
    }
  }

  const lastScene = scenes[scenes.length - 1];
  if (Math.abs(lastScene.end_seconds - expectedTotalDuration) > 0.05) {
    issues.push({
      code: "TIMELINE_DURATION_MISMATCH",
      message: `Final scene end_seconds (${lastScene.end_seconds}) does not match expected total duration (${expectedTotalDuration})`,
      sceneIndex: lastScene.index,
    });
  }

  return issues;
}

export interface ScriptValidationOptions {
  forbiddenTerms?: string[];
  expectedProductId?: string;
  expectedSceneCount?: number;
  expectedTotalDuration?: number;
}

/**
 * Deterministic validator for campaign video script artifacts.
 * Performs multi-layer cross-validation against the verified-facts catalog.
 */
export function validateVideoScriptArtifact(
  rawScript: unknown,
  rawCatalog: unknown,
  options: ScriptValidationOptions = {}
): ScriptValidationResult {
  const issues: ValidationIssue[] = [];
  const referencedFactIds: string[] = [];
  const expectedSceneCount = options.expectedSceneCount ?? 14;
  const expectedTotalDuration = options.expectedTotalDuration ?? 30;

  // 1. Validate catalog
  const catalogResult = validateVerifiedFactsCatalog(rawCatalog);
  if (!catalogResult.isValid) {
    for (const catIssue of catalogResult.issues) {
      issues.push(catIssue);
    }
    return {
      isValid: false,
      issues,
      checkedScenesCount: 0,
      referencedFactIds: [],
    };
  }

  const catalogFactMap = new Map<string, VerifiedFactItem>();
  for (const f of catalogResult.facts) {
    catalogFactMap.set(f.id, f);
  }

  const rawScriptObj = (rawScript && typeof rawScript === "object") ? (rawScript as Record<string, unknown>) : null;
  const rawCta = rawScriptObj?.cta && typeof rawScriptObj.cta === "object" ? (rawScriptObj.cta as Record<string, unknown>) : null;
  const rawCtaText = typeof rawCta?.on_screen_text === "string" ? rawCta.on_screen_text : "";
  if (!rawCtaText.includes("[LINK_MUA_VE]")) {
    issues.push({
      code: "MISSING_CTA_PLACEHOLDER",
      message: "CTA on_screen_text must contain '[LINK_MUA_VE]'",
      field: "cta.on_screen_text",
    });
  }

  // 2. Validate script against Zod schema
  const zodParsed = campaignVideoScriptSchema.safeParse(rawScript);
  if (!zodParsed.success) {
    for (const err of zodParsed.error.issues) {
      issues.push({
        code: "SCHEMA_VALIDATION_ERROR",
        message: `${err.path.join(".")}: ${err.message}`,
        field: err.path.join("."),
      });
    }
    return {
      isValid: false,
      issues,
      checkedScenesCount: 0,
      referencedFactIds: [],
    };
  }

  const script: CampaignVideoScript = zodParsed.data;

  // 3. Exact scene count check
  if (script.scenes.length !== expectedSceneCount) {
    issues.push({
      code: "INVALID_SCENE_COUNT",
      message: `Script has ${script.scenes.length} scenes, expected exactly ${expectedSceneCount}`,
    });
  }

  // 4. Continuous timeline check
  const timelineIssues = validateContinuousTimeline(
    script.scenes,
    expectedTotalDuration
  );
  issues.push(...timelineIssues);

  // 5. CTA placeholder check
  const ctaText = script.cta?.on_screen_text ?? "";
  if (!ctaText.includes("[LINK_MUA_VE]")) {
    issues.push({
      code: "MISSING_CTA_PLACEHOLDER",
      message: "CTA on_screen_text must contain '[LINK_MUA_VE]'",
      field: "cta.on_screen_text",
    });
  }

  // 6. Foreign / Fabricated URL check
  const urlPattern = /https?:\/\/[^\s]+/i;
  if (urlPattern.test(ctaText)) {
    issues.push({
      code: "FOREIGN_URL_DETECTED",
      message: "CTA on_screen_text contains foreign URL instead of placeholder",
      field: "cta.on_screen_text",
    });
  }
  if (urlPattern.test(script.cta?.spoken_text ?? "")) {
    issues.push({
      code: "FOREIGN_URL_DETECTED",
      message: "CTA spoken_text contains foreign URL",
      field: "cta.spoken_text",
    });
  }

  // 7. Fact references & forbidden claim checks per scene
  const forbiddenTerms = options.forbiddenTerms ?? [];

  for (const scene of script.scenes) {
    // Check foreign URL in narration or on_screen_text
    if (scene.narration && urlPattern.test(scene.narration)) {
      issues.push({
        code: "FOREIGN_URL_DETECTED",
        message: `Scene ${scene.index} narration contains foreign URL`,
        sceneIndex: scene.index,
      });
    }
    if (scene.on_screen_text && urlPattern.test(scene.on_screen_text)) {
      issues.push({
        code: "FOREIGN_URL_DETECTED",
        message: `Scene ${scene.index} on_screen_text contains foreign URL`,
        sceneIndex: scene.index,
      });
    }

    // Fact references existence and orphan check
    if (
      !scene.verified_fact_refs ||
      scene.verified_fact_refs.length === 0
    ) {
      issues.push({
        code: "ORPHAN_SCENE_NO_FACT_REFS",
        message: `Scene ${scene.index} does not have any verified fact reference`,
        sceneIndex: scene.index,
      });
    } else {
      for (const refId of scene.verified_fact_refs) {
        referencedFactIds.push(refId);
        const fact = catalogFactMap.get(refId);
        if (!fact) {
          issues.push({
            code: "UNKNOWN_FACT_REF",
            message: `Scene ${scene.index} references unknown fact '${refId}' not in catalog`,
            sceneIndex: scene.index,
          });
        } else if (
          options.expectedProductId &&
          fact.product_id !== options.expectedProductId
        ) {
          issues.push({
            code: "CROSS_PRODUCT_FACT_REF",
            message: `Scene ${scene.index} references fact '${refId}' belonging to product '${fact.product_id}', expected '${options.expectedProductId}'`,
            sceneIndex: scene.index,
          });
        }
      }
    }

    // Scan for forbidden claims in narration, visual_prompt, on_screen_text
    const textPool = [
      scene.visual_prompt ?? "",
      scene.narration ?? "",
      scene.on_screen_text ?? "",
    ].join(" ").toLowerCase();

    for (const term of forbiddenTerms) {
      if (textPool.includes(term.toLowerCase())) {
        issues.push({
          code: "FORBIDDEN_CLAIM_DETECTED",
          message: `Scene ${scene.index} contains forbidden claim/phrase: '${term}'`,
          sceneIndex: scene.index,
        });
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    checkedScenesCount: script.scenes.length,
    referencedFactIds,
  };
}

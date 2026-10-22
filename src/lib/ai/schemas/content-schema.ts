import { z } from "zod";

export const contentPersonaSchema = z.enum([
  "local_guide",
  "family",
  "foodie",
  "budget_traveler",
]);

export type ContentPersona = z.infer<typeof contentPersonaSchema>;

export const campaignScriptSchema = z.object({
  title: z.string().trim().min(10).max(120),
  duration: z.number().int().min(30).max(45),
  scenes: z.array(z.string().trim().min(10).max(500)).min(3).max(8),
});

export type CampaignScript = z.infer<typeof campaignScriptSchema>;

export function hasValidHashtag(value: string): boolean {
  const hashtags = value.match(/#[^\s#]+/g);
  return Boolean(hashtags && hashtags.some((tag) => /[\p{L}\p{N}]/u.test(tag)));
}

export const captionSchema = z
  .string()
  .trim()
  .min(40)
  .max(2_200)
  .regex(/#[^\s#]+/, {
    message: "Caption must include at least one relevant hashtag",
  })
  .refine(
    (value) => hasValidHashtag(value),
    {
      message: "Caption hashtag must contain at least one letter or number",
    },
  );

const ctaSchema = z
  .string()
  .trim()
  .min(15)
  .max(300)
  .regex(/\[LINK_MUA_VE\]/, {
    message: "CTA must include the [LINK_MUA_VE] placeholder",
  });

export const campaignContentOutputSchema = z
  .object({
    persona: contentPersonaSchema,
    hooks: z.array(z.string().trim().min(20).max(100)).length(10),
    scripts: z.array(campaignScriptSchema).length(5),
    captions: z.array(captionSchema).length(5),
    ctas: z.array(ctaSchema).length(5),
  })
  .strict();

export type CampaignContentOutput = z.infer<
  typeof campaignContentOutputSchema
>;

export const campaignContentJsonSchema = z.toJSONSchema(
  campaignContentOutputSchema,
);

const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set([
  "$schema",
  "minLength",
  "maxLength",
  "pattern",
]);

export function toGeminiJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toGeminiJsonSchema);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key))
        .map(([key, child]) => [
          key,
          toGeminiJsonSchema(child),
        ]),
    );
  }

  return value;
}

/**
 * Gemini structured output accepts only a subset of JSON Schema. Always run
 * the full Zod parser after receiving a provider-valid response.
 */
export const geminiCampaignContentJsonSchema =
  toGeminiJsonSchema(campaignContentJsonSchema);

export function stripJsonMarkdownFence(value: string): string {
  const trimmed = value.trim().replace(/^\uFEFF/, "");
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const withoutFence = fencedMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return withoutFence.slice(firstBrace, lastBrace + 1);
  }

  return withoutFence;
}

export function parseCampaignContentOutput(
  value: string | unknown,
): CampaignContentOutput {
  const parsed =
    typeof value === "string"
      ? JSON.parse(stripJsonMarkdownFence(value))
      : value;

  return campaignContentOutputSchema.parse(parsed);
}

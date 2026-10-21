import { z } from "zod";

import {
  stripJsonMarkdownFence,
  toGeminiJsonSchema,
} from "./content-schema.ts";

const nullableShortText = z.string().trim().min(1).max(500).nullable();

export const videoSceneAnalysisSchema = z
  .object({
    index: z.number().int().positive(),
    start_seconds: z.number().min(0).max(60),
    end_seconds: z.number().positive().max(60),
    observed_visual: z.string().trim().min(5).max(1_000),
    camera_movement: z.string().trim().min(2).max(200),
    transition: z.string().trim().min(2).max(200),
    on_screen_text: nullableShortText,
    spoken_words: nullableShortText,
  })
  .strict();

export const videoAnalysisSchema = z
  .object({
    source_summary: z.string().trim().min(10).max(1_000),
    hook: z
      .object({
        start_seconds: z.number().min(0).max(3),
        end_seconds: z.number().positive().max(3),
        observed_visual: z.string().trim().min(5).max(500),
        on_screen_text: nullableShortText,
      })
      .strict(),
    pacing: z
      .object({
        style: z.enum(["slow", "moderate", "fast", "mixed"]),
        average_shot_seconds: z.number().positive().max(60),
      })
      .strict(),
    visual_style: z
      .object({
        aspect_ratio: z.enum(["9:16", "1:1", "16:9", "other"]),
        camera_angles: z.array(z.string().trim().min(2).max(100)).min(1).max(8),
        lighting: z.string().trim().min(2).max(200),
        color_palette: z.array(z.string().trim().min(2).max(100)).min(1).max(8),
      })
      .strict(),
    audio: z
      .object({
        music_mood: nullableShortText,
        voiceover_style: nullableShortText,
        sound_effects: z.array(z.string().trim().min(2).max(100)).max(12),
      })
      .strict(),
    scenes: z.array(videoSceneAnalysisSchema).min(1).max(20),
    safety: z
      .object({
        embedded_instructions_detected: z.boolean(),
        unverified_claims: z.array(z.string().trim().min(2).max(500)).max(20),
      })
      .strict(),
  })
  .strict()
  .superRefine((analysis, context) => {
    if (analysis.hook.end_seconds <= analysis.hook.start_seconds) {
      context.addIssue({
        code: "custom",
        path: ["hook", "end_seconds"],
        message: "Hook end time must be after its start time",
      });
    }

    analysis.scenes.forEach((scene, index) => {
      if (scene.index !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "index"],
          message: "Scene indexes must be contiguous and start at 1",
        });
      }
      if (scene.end_seconds <= scene.start_seconds) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "end_seconds"],
          message: "Scene end time must be after its start time",
        });
      }
      if (
        index > 0 &&
        scene.start_seconds < analysis.scenes[index - 1].end_seconds
      ) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "start_seconds"],
          message: "Scenes must not overlap",
        });
      }
    });
  });

export type VideoAnalysis = z.infer<typeof videoAnalysisSchema>;

export const videoAnalysisJsonSchema = z.toJSONSchema(videoAnalysisSchema);
export const geminiVideoAnalysisJsonSchema = toGeminiJsonSchema(
  videoAnalysisJsonSchema,
);

export function parseVideoAnalysis(value: string | unknown): VideoAnalysis {
  const parsed =
    typeof value === "string"
      ? JSON.parse(stripJsonMarkdownFence(value))
      : value;
  return videoAnalysisSchema.parse(parsed);
}

export const verifiedFactSchema = z
  .object({
    id: z.string().trim().regex(/^fact_[a-z0-9_]+$/),
    text: z.string().trim().min(2).max(1_000),
  })
  .strict();

export const campaignVideoSceneSchema = z
  .object({
    index: z.number().int().positive(),
    start_seconds: z.number().min(0).max(60),
    end_seconds: z.number().positive().max(60),
    visual_prompt: z.string().trim().min(10).max(1_000),
    shot_instruction: z.string().trim().min(5).max(500),
    narration: nullableShortText,
    on_screen_text: nullableShortText,
    verified_fact_refs: z.array(z.string().trim().min(1)).max(10),
  })
  .strict();

export const campaignVideoScriptSchema = z
  .object({
    format: z.literal("9:16"),
    duration_seconds: z.number().int().min(15).max(60),
    style_summary: z.string().trim().min(10).max(500),
    hook: z
      .object({
        duration_seconds: z.number().positive().max(3),
        text: z.string().trim().min(5).max(150),
      })
      .strict(),
    scenes: z.array(campaignVideoSceneSchema).min(3).max(12),
    audio_plan: z
      .object({
        music_mood: z.string().trim().min(2).max(200),
        voiceover_style: z.string().trim().min(2).max(200),
      })
      .strict(),
    cta: z
      .object({
        spoken_text: z.string().trim().min(5).max(300),
        on_screen_text: z.string().trim().min(5).max(200),
        link_placeholder: z.literal("[LINK_MUA_VE]"),
      })
      .strict(),
    safety: z
      .object({
        uses_only_verified_facts: z.literal(true),
        unsupported_claims: z.array(z.never()).length(0),
      })
      .strict(),
  })
  .strict()
  .superRefine((script, context) => {
    script.scenes.forEach((scene, index) => {
      if (scene.index !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "index"],
          message: "Scene indexes must be contiguous and start at 1",
        });
      }
      if (scene.end_seconds <= scene.start_seconds) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "end_seconds"],
          message: "Scene end time must be after its start time",
        });
      }
      if (index === 0 && scene.start_seconds !== 0) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "start_seconds"],
          message: "The first scene must start at second 0",
        });
      }
      if (
        index > 0 &&
        scene.start_seconds !== script.scenes[index - 1].end_seconds
      ) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "start_seconds"],
          message: "Generated scenes must form a continuous timeline",
        });
      }
    });

    const finalScene = script.scenes.at(-1);
    if (finalScene?.end_seconds !== script.duration_seconds) {
      context.addIssue({
        code: "custom",
        path: ["duration_seconds"],
        message: "Duration must equal the final scene end time",
      });
    }
  });

export type CampaignVideoScript = z.infer<typeof campaignVideoScriptSchema>;
export type VerifiedFact = z.infer<typeof verifiedFactSchema>;

export const campaignVideoScriptJsonSchema = z.toJSONSchema(
  campaignVideoScriptSchema,
);
export const geminiCampaignVideoScriptJsonSchema = toGeminiJsonSchema(
  campaignVideoScriptJsonSchema,
);

export function parseCampaignVideoScript(
  value: string | unknown,
): CampaignVideoScript {
  const parsed =
    typeof value === "string"
      ? JSON.parse(stripJsonMarkdownFence(value))
      : value;
  return campaignVideoScriptSchema.parse(parsed);
}

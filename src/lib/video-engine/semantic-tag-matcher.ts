import type { TikTokReviewScene } from "./tiktok-review-script";

export interface MediaAsset {
  id: string;
  name: string;
  type: "video" | "image";
  tags: string[];
  url: string;
  duration?: number;
  description?: string;
}

export interface MatchedSceneAsset {
  sceneNumber: number;
  role: string;
  duration: number;
  voiceover: string;
  visualTag: string;
  matchedAsset: {
    id: string;
    name: string;
    type: "video" | "image";
    url: string;
    score: number;
  } | null;
}

const ROLE_DEFAULT_TAGS: Record<string, string[]> = {
  hook: ["scenic", "aerial", "drone", "overview", "highlight", "breathtaking", "checkin"],
  experience: ["activity", "attraction", "ride", "explore", "cable_car", "landscape", "vlog"],
  pricing: ["pricing", "overview", "entrance", "ticket", "gate", "landmark", "park"],
  cta: ["logo", "action", "booking", "summary", "invitation", "cta"],
};

function normalizeToken(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
}

function extractKeywords(text: string): Set<string> {
  const norm = normalizeToken(text);
  const words = norm.split(/\s+/);
  const stopwords = new Set([
    "là", "và", "của", "cho", "với", "ở", "trong", "tại", "những", "các", "một", "được", "này", "đến",
  ]);
  return new Set(words.filter((w) => w.length > 2 && !stopwords.has(w)));
}

export function calculateAssetMatchScore(
  scene: TikTokReviewScene,
  asset: MediaAsset
): number {
  const visualTag = normalizeToken(scene.visualTag);
  const role = scene.role.toLowerCase();
  const voiceover = scene.voiceover;

  const assetName = normalizeToken(asset.name);
  const assetDesc = normalizeToken(asset.description || "");
  const assetTags = (asset.tags || []).map(normalizeToken);
  const isVideo = asset.type === "video" || asset.url.endsWith(".mp4") || asset.url.endsWith(".mov");

  let score = 0.0;

  // 1. Direct Visual Tag Match
  const sceneTagTokens = new Set(visualTag.split(/[\s_]+/));
  for (const tag of assetTags) {
    const assetTagTokens = new Set(tag.split(/[\s_]+/));
    let hasOverlap = false;
    for (const t of sceneTagTokens) {
      if (assetTagTokens.has(t)) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) {
      score += 0.5;
      break;
    }
    if (visualTag && (visualTag.includes(tag) || tag.includes(visualTag))) {
      score += 0.45;
      break;
    }
  }

  // 2. Role alignment
  const preferredTags = ROLE_DEFAULT_TAGS[role] || [];
  for (const prTag of preferredTags) {
    if (assetTags.some((t) => t.includes(prTag)) || assetName.includes(prTag)) {
      score += 0.25;
      break;
    }
  }

  // 3. Voiceover keyword overlap
  const voiceWords = extractKeywords(voiceover);
  const assetWords = extractKeywords(`${assetName} ${assetDesc}`);
  let overlapCount = 0;
  for (const w of voiceWords) {
    if (assetWords.has(w)) overlapCount++;
  }
  if (overlapCount > 0) {
    score += Math.min(0.3, overlapCount * 0.1);
  }

  // 4. Video Priority Bonus (+0.2)
  if (isVideo) {
    score += 0.2;
  }

  return Math.round(score * 1000) / 1000;
}

export function matchScenesToBrollAssets(
  scenes: TikTokReviewScene[],
  mediaLibrary: MediaAsset[],
  defaultAsset?: MediaAsset
): MatchedSceneAsset[] {
  if (mediaLibrary.length === 0 && !defaultAsset) {
    throw new Error("Media library cannot be empty without a default asset.");
  }

  const usedAssetIds = new Set<string>();
  const matchedScenes: MatchedSceneAsset[] = [];

  for (const scene of scenes) {
    const scoredAssets = mediaLibrary.map((asset) => {
      let score = calculateAssetMatchScore(scene, asset);
      if (usedAssetIds.has(asset.id)) {
        score *= 0.6; // Avoid duplicate reuse if alternative exists
      }
      return { asset, score };
    });

    scoredAssets.sort((a, b) => b.score - a.score);

    const best = scoredAssets[0];
    let selectedAsset: MediaAsset | undefined = best?.asset;
    let finalScore = best?.score ?? 0.0;

    if (finalScore < 0.15 && defaultAsset) {
      selectedAsset = defaultAsset;
      finalScore = 0.1;
    }

    if (selectedAsset) {
      usedAssetIds.add(selectedAsset.id);
    }

    matchedScenes.push({
      sceneNumber: scene.sceneNumber,
      role: scene.role,
      duration: scene.duration,
      voiceover: scene.voiceover,
      visualTag: scene.visualTag,
      matchedAsset: selectedAsset
        ? {
            id: selectedAsset.id,
            name: selectedAsset.name,
            type: selectedAsset.type,
            url: selectedAsset.url,
            score: finalScore,
          }
        : null,
    });
  }

  return matchedScenes;
}


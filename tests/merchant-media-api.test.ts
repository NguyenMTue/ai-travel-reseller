import assert from "node:assert/strict";
import test from "node:test";

import {
  createMediaReferenceSchema,
  mediaQuerySchema,
  MEDIA_PLATFORMS,
} from "../src/lib/merchant/media-schema.ts";

test("createMediaReferenceSchema validates valid inputs and defaults", () => {
  // Case 1: Minimum valid payload
  const validMin = {
    title: "Video review Bà Nà Hills cực chill",
    videoUrl: "https://storage.travellink.ai/campaign-videos/bana-hills-sample.mp4",
  };
  const parsed1 = createMediaReferenceSchema.parse(validMin);
  assert.equal(parsed1.title, "Video review Bà Nà Hills cực chill");
  assert.equal(parsed1.platform, "upload");
  assert.deepEqual(parsed1.styleTags, []);
  assert.deepEqual(parsed1.analysisMetadata, {});
  assert.equal(parsed1.thumbnailUrl, null);
  assert.equal(parsed1.duration, null);

  // Case 2: Full valid payload with platform and style tags
  const validFull = {
    title: "Khám phá Hội An về đêm",
    videoUrl: "https://www.tiktok.com/@danangtravel/video/1234567890",
    thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg",
    platform: "tiktok",
    duration: 45,
    styleTags: ["culture", "nightlife", "food"],
    analysisMetadata: { hookRating: 9.5, pacing: "fast" },
  };
  const parsed2 = createMediaReferenceSchema.parse(validFull);
  assert.equal(parsed2.platform, "tiktok");
  assert.equal(parsed2.duration, 45);
  assert.equal(parsed2.styleTags.length, 3);
  assert.equal(parsed2.analysisMetadata.hookRating, 9.5);
});

test("createMediaReferenceSchema accepts all valid platform enum values", () => {
  for (const platform of MEDIA_PLATFORMS) {
    const payload = {
      title: `Video demo trên ${platform}`,
      videoUrl: "https://example.com/video.mp4",
      platform,
    };
    const parsed = createMediaReferenceSchema.parse(payload);
    assert.equal(parsed.platform, platform);
  }
});

test("createMediaReferenceSchema rejects invalid payloads", () => {
  // Empty title
  assert.throws(
    () =>
      createMediaReferenceSchema.parse({
        title: "",
        videoUrl: "https://example.com/video.mp4",
      }),
    /Tiêu đề video mẫu không được để trống/
  );

  // Invalid video URL
  assert.throws(
    () =>
      createMediaReferenceSchema.parse({
        title: "Video hợp lệ",
        videoUrl: "not-a-valid-url",
      }),
    /URL hợp lệ/
  );

  // Invalid platform
  assert.throws(
    () =>
      createMediaReferenceSchema.parse({
        title: "Video hợp lệ",
        videoUrl: "https://example.com/video.mp4",
        platform: "vimeo",
      }),
    /upload/
  );

  // Negative duration
  assert.throws(
    () =>
      createMediaReferenceSchema.parse({
        title: "Video hợp lệ",
        videoUrl: "https://example.com/video.mp4",
        duration: -10,
      }),
    /Thời lượng video phải lớn hơn 0/
  );

  // Exceeds max 20 style tags
  const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
  assert.throws(
    () =>
      createMediaReferenceSchema.parse({
        title: "Video hợp lệ",
        videoUrl: "https://example.com/video.mp4",
        styleTags: tooManyTags,
      }),
    /Tối đa 20 thẻ phong cách/
  );
});

test("mediaQuerySchema validates query params and clamps limits", () => {
  // Default values
  const defaultQuery = mediaQuerySchema.parse({});
  assert.equal(defaultQuery.page, 1);
  assert.equal(defaultQuery.limit, 20);

  // Custom valid params
  const customQuery = mediaQuerySchema.parse({
    merchantId: "11111111-2222-3333-4444-555555555555",
    platform: "reels",
    tag: "adventure",
    search: "Bà Nà",
    page: "3",
    limit: "50",
  });
  assert.equal(customQuery.merchantId, "11111111-2222-3333-4444-555555555555");
  assert.equal(customQuery.platform, "reels");
  assert.equal(customQuery.tag, "adventure");
  assert.equal(customQuery.search, "Bà Nà");
  assert.equal(customQuery.page, 3);
  assert.equal(customQuery.limit, 50);

  // Rejects invalid UUID for merchantId
  assert.throws(
    () =>
      mediaQuerySchema.parse({
        merchantId: "invalid-uuid-format",
      }),
    /Merchant ID không đúng định dạng UUID/
  );

  // Rejects limit over 100
  assert.throws(
    () =>
      mediaQuerySchema.parse({
        limit: "150",
      }),
    /100/
  );
});

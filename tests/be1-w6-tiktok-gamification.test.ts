import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  calculateEngagementScore,
  isValidTikTokUrl,
  extractTikTokVideoId,
  extractTikTokUsername,
  scrapeTikTokEngagement,
  generateContentFingerprintTag,
  buildDemoTikTokUrl,
  verifyTikTokVideoContent,
} from "../src/lib/tiktok/tiktok-service.ts";

console.log("===============================================================================");
console.log("🧪 BE1 WEEK 6: TIKTOK ENGAGEMENT & MERCHANT GAMIFICATION TEST SUITE");
console.log("Date: 17/11/2026 | Author: Nguyen Minh Tue (BE1 Lead & PM)");
console.log("Tasks: BE1-W6-03 (TikTok Scraper & Metrics), BE1-W6-04 (Merchant Gamification Points)");
console.log("===============================================================================\n");

test("BE1-W6-03: TikTok URL Validation & Metadata Extraction", () => {
  const validUrl1 = "https://www.tiktok.com/@danang_travel/video/732819283719283";
  const validUrl2 = "https://vt.tiktok.com/ZS2x9qLmK/";
  const invalidUrl = "https://facebook.com/watch?v=123";

  assert.equal(isValidTikTokUrl(validUrl1), true, "Standard TikTok URL must be valid");
  assert.equal(isValidTikTokUrl(validUrl2), true, "Shortened vt.tiktok.com URL must be valid");
  assert.equal(isValidTikTokUrl(invalidUrl), false, "Non-TikTok URL must be invalid");

  assert.equal(extractTikTokVideoId(validUrl1), "732819283719283", "Video ID must be extracted correctly");
  assert.equal(extractTikTokVideoId(validUrl2), "ZS2x9qLmK", "Short video code must be extracted");
  assert.equal(extractTikTokUsername(validUrl1), "@danang_travel", "Username must be extracted");
});

test("BE1-W6-03: Engagement Score Formula Accuracy", () => {
  // Công thức: Views * 0.1 + Likes * 1.0 + Comments * 2.0 + Shares * 3.0
  const views = 10000;
  const likes = 800;
  const comments = 50;
  const shares = 30;

  // 10000 * 0.1 = 1000
  // 800 * 1.0 = 800
  // 50 * 2.0 = 100
  // 30 * 3.0 = 90
  // Total = 1990
  const score = calculateEngagementScore(views, likes, comments, shares);
  assert.equal(score, 1990, "Engagement score must equal 1990");
});

test("BE1-W6-03: TikTok Post Registration Endpoint & DB Schema", () => {
  const routePath = resolve("app/api/reseller/tiktok-posts/route.ts");
  const migrationPath = resolve("supabase/migrations/20261117140000_tiktok_analytics_and_merchant_points.sql");

  assert.ok(existsSync(routePath), "app/api/reseller/tiktok-posts/route.ts must exist");
  assert.ok(existsSync(migrationPath), "Migration file must exist");

  const routeContent = readFileSync(routePath, "utf-8");
  assert.match(
    routeContent,
    /registerResellerTikTokPost/,
    "Route must invoke registerResellerTikTokPost"
  );
  assert.match(
    routeContent,
    /reseller_tiktok_posts/,
    "Route must query reseller_tiktok_posts table"
  );

  const migrationContent = readFileSync(migrationPath, "utf-8");
  assert.match(
    migrationContent,
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.reseller_tiktok_posts/,
    "Migration must create reseller_tiktok_posts table"
  );
  assert.match(
    migrationContent,
    /calculate_tiktok_engagement_score/,
    "Migration must create calculate_tiktok_engagement_score function"
  );
  assert.match(
    migrationContent,
    /uq_reseller_tiktok_url/,
    "Migration must enforce unique constraint on reseller_id and tiktok_url"
  );
});

test("BE1-W6-04: Merchant Gamification Points Stored Procedure & Tiers", () => {
  const migrationPath = resolve("supabase/migrations/20261117140000_tiktok_analytics_and_merchant_points.sql");
  const pointsRoutePath = resolve("app/api/merchant/points/route.ts");

  assert.ok(existsSync(migrationPath), "Migration file must exist");
  assert.ok(existsSync(pointsRoutePath), "app/api/merchant/points/route.ts must exist");

  const migrationContent = readFileSync(migrationPath, "utf-8");
  assert.match(
    migrationContent,
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.merchant_points/,
    "Migration must create merchant_points table"
  );
  assert.match(
    migrationContent,
    /award_merchant_video_points/,
    "Migration must create award_merchant_video_points function"
  );
  assert.match(
    migrationContent,
    /get_merchant_points_summary/,
    "Migration must create get_merchant_points_summary function"
  );
  assert.match(
    migrationContent,
    /diamond[\s\S]*gold[\s\S]*silver/,
    "Migration must support diamond, gold, silver tiers"
  );

  const routeContent = readFileSync(pointsRoutePath, "utf-8");
  assert.match(
    routeContent,
    /award_merchant_video_points/,
    "Route POST must invoke award_merchant_video_points RPC"
  );
  assert.match(
    routeContent,
    /get_merchant_points_summary/,
    "Route GET must invoke get_merchant_points_summary RPC"
  );
});

test("Python LLM Service: fetch_tiktok_metrics Function", () => {
  const pyPath = resolve("services/llm-service/tiktok_publisher.py");
  assert.ok(existsSync(pyPath), "services/llm-service/tiktok_publisher.py must exist");

  const content = readFileSync(pyPath, "utf-8");
  assert.match(
    content,
    /def\s+fetch_tiktok_metrics/,
    "tiktok_publisher.py must define fetch_tiktok_metrics"
  );
  assert.match(
    content,
    /views\s*\*\s*0\.1\s*\+\s*likes\s*\*\s*1\.0/,
    "tiktok_publisher.py must compute engagement score formula"
  );
});

test("BE1-W6-03+: 3-Layer AI Content Verification & Dev Sandbox Demo URLs", () => {
  const contentId = "a1b2c3d4-1111-2222-3333-444444444444";
  const campaignId = "44444444-4444-4444-4444-444444444444";

  const tag = generateContentFingerprintTag(contentId, campaignId);
  assert.equal(tag, "#TL_A1B2C3");

  const matchedDemoUrl = buildDemoTikTokUrl({
    contentId,
    campaignId,
    mode: "matched",
  });
  assert.equal(isValidTikTokUrl(matchedDemoUrl), true, "Matched demo URL must be a valid TikTok URL");

  const matchedVerification = verifyTikTokVideoContent({
    tiktokUrl: matchedDemoUrl,
    contentId,
    campaignId,
    matchedContentHook: "Khám phá Cầu Vàng Bà Nà Hills",
  });
  assert.equal(matchedVerification.verified, true);
  assert.ok(matchedVerification.matchScore >= 95);
  assert.equal(matchedVerification.checks.fingerprintMatched, true);
  assert.equal(matchedVerification.checks.visualEndCardMatched, true);

  const mismatchedDemoUrl = buildDemoTikTokUrl({
    contentId,
    campaignId,
    mode: "mismatched",
  });
  assert.equal(isValidTikTokUrl(mismatchedDemoUrl), true);

  const mismatchedVerification = verifyTikTokVideoContent({
    tiktokUrl: mismatchedDemoUrl,
    contentId,
    campaignId,
  });
  assert.equal(mismatchedVerification.verified, false);
  assert.ok(mismatchedVerification.matchScore < 70);
  assert.equal(mismatchedVerification.checks.fingerprintMatched, false);
});

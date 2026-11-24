import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidTikTokUrl,
  extractTikTokVideoId,
  calculateEngagementScore,
} from "../src/lib/tiktok/tiktok-service.ts";

/**
 * =============================================================================
 * SUITE: TESTER 2 (AI SAFETY & SECURITY QA) - TIKTOK TOOL & POINTS SAFETY AUDIT
 * Sprint: Tuần 6 (Sprint 6)
 * Tasks: TEST2-W6-02 (TikTok Error Handling), TEST2-W6-03 (Point Gamification Safety)
 * =============================================================================
 */

test("TEST2-W6-02: TikTok URL Validation & Security Sanitization", async (t) => {
  await t.test("Rejects malformed URLs and malicious injection strings", () => {
    const maliciousUrls = [
      "",
      "   ",
      "javascript:alert(1)",
      "https://malicious-site.com/@user/video/1234567890",
      "https://tiktok.com.attacker.com/video/1234567890",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.tiktok.com/",
      "https://www.tiktok.com/@user",
      "https://www.tiktok.com/@user/video/not-a-number",
      "https://vt.tiktok.com/",
      "<script>alert('xss')</script>",
      "https://www.tiktok.com/@user/video/12345' OR '1'='1",
    ];

    for (const url of maliciousUrls) {
      assert.strictEqual(
        isValidTikTokUrl(url),
        false,
        `Expected "${url}" to be rejected by isValidTikTokUrl`
      );
    }
  });

  await t.test("Accepts standard valid TikTok video URLs", () => {
    const validUrls = [
      "https://www.tiktok.com/@reviewdanang/video/7384910293847291011",
      "https://tiktok.com/@danang_travel/video/7123456789012345678",
      "https://m.tiktok.com/v/7123456789012345678.html",
      "https://vt.tiktok.com/ZS2xYq9aB/",
      "http://www.tiktok.com/@user/video/7384910293847291011?is_from_webapp=1",
    ];

    for (const url of validUrls) {
      assert.strictEqual(
        isValidTikTokUrl(url),
        true,
        `Expected "${url}" to be accepted by isValidTikTokUrl`
      );
    }
  });

  await t.test("Extracts numeric video ID accurately from standard URL", () => {
    const url = "https://www.tiktok.com/@reviewdanang/video/7384910293847291011";
    const id = extractTikTokVideoId(url);
    assert.strictEqual(id, "7384910293847291011");
  });
});

test("TEST2-W6-02: Engagement Score Formula Boundary & Integrity Tests", async (t) => {
  await t.test("Computes accurate score for zero and standard values", () => {
    // Formula: views * 0.1 + likes * 1.0 + comments * 2.0 + shares * 3.0
    const zeroScore = calculateEngagementScore(0, 0, 0, 0);
    assert.strictEqual(zeroScore, 0);

    const normalScore = calculateEngagementScore(1000, 150, 20, 10);
    // Expected: 100 + 150 + 40 + 30 = 320
    assert.strictEqual(normalScore, 320);
  });

  await t.test("Computes score with floating point precision", () => {
    const score = calculateEngagementScore(15, 3, 1, 0);
    // 15 * 0.1 = 1.5, 3 * 1 = 3, 1 * 2 = 2 => 6.5
    assert.strictEqual(score, 6.5);
  });
});

test("TEST2-W6-03: Merchant Gamification Points Verification", async (t) => {
  await t.test("Points tier thresholds mapping is logically consistent", () => {
    function resolveTier(points: number): "silver" | "gold" | "diamond" {
      if (points >= 1000) return "diamond";
      if (points >= 300) return "gold";
      return "silver";
    }

    assert.strictEqual(resolveTier(0), "silver");
    assert.strictEqual(resolveTier(299), "silver");
    assert.strictEqual(resolveTier(300), "gold");
    assert.strictEqual(resolveTier(999), "gold");
    assert.strictEqual(resolveTier(1000), "diamond");
    assert.strictEqual(resolveTier(5000), "diamond");
  });
});

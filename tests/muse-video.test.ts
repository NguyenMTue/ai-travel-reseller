import assert from "node:assert/strict";
import test from "node:test";
import {
  checkMuse2ApiHealth,
  generateMuseVideoClip,
  getMuse2ApiConfig,
  isMuse2ApiConfigured,
} from "../src/lib/ai/muse-video.ts";

test("Suite: MUSE2API - Cấu hình biến môi trường và nhận diện trạng thái", async (t) => {
  await t.test("isMuse2ApiConfigured() trả về false khi không có key", () => {
    const originalKey = process.env.MUSE2API_KEY;
    delete process.env.MUSE2API_KEY;
    try {
      assert.strictEqual(isMuse2ApiConfigured(), false);
    } finally {
      process.env.MUSE2API_KEY = originalKey;
    }
  });

  await t.test("isMuse2ApiConfigured() trả về true khi key hợp lệ", () => {
    const originalKey = process.env.MUSE2API_KEY;
    process.env.MUSE2API_KEY = "aitravel_test_key_123";
    try {
      assert.strictEqual(isMuse2ApiConfigured(), true);
    } finally {
      process.env.MUSE2API_KEY = originalKey;
    }
  });

  await t.test("getMuse2ApiConfig() chuẩn hóa baseUrl và các tham số mặc định", () => {
    const originalKey = process.env.MUSE2API_KEY;
    const originalBase = process.env.MUSE2API_BASE_URL;
    process.env.MUSE2API_KEY = "test_key_xyz";
    process.env.MUSE2API_BASE_URL = "http://localhost:18610///";

    try {
      const config = getMuse2ApiConfig();
      assert(config !== null);
      assert.strictEqual(config.apiKey, "test_key_xyz");
      assert.strictEqual(config.baseUrl, "http://localhost:18610");
      assert.strictEqual(config.model, "muse-video");
      assert.strictEqual(config.timeoutMs, 180000);
    } finally {
      process.env.MUSE2API_KEY = originalKey;
      process.env.MUSE2API_BASE_URL = originalBase;
    }
  });
});

test("Suite: MUSE2API - Luồng tạo tác vụ và thăm dò (Task Polling) mô phỏng", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.MUSE2API_KEY;
  const originalBase = process.env.MUSE2API_BASE_URL;

  process.env.MUSE2API_KEY = "aitravel_mock_key";
  process.env.MUSE2API_BASE_URL = "http://mock-muse.local";

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  t.after(() => {
    process.env.MUSE2API_KEY = originalKey;
    process.env.MUSE2API_BASE_URL = originalBase;
  });

  await t.test("generateMuseVideoClip() hoàn tất tác vụ thành công và trả về videoBuffer", async () => {
    let pollCount = 0;
    const mockFakeMp4 = Buffer.from(new Uint8Array(2048).fill(42));

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/v1/videos") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        assert.strictEqual(body.model, "muse-video");
        assert.strictEqual(body.aspect_ratio, "9:16");
        assert(body.prompt.includes("Golden Bridge"));
        assert(body.image.startsWith("data:image/jpeg;base64,"));

        return new Response(
          JSON.stringify({
            id: "task_mock_123",
            task_id: "task_mock_123",
            status: "queued",
            progress: 10,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/videos/task_mock_123")) {
        pollCount++;
        if (pollCount === 1) {
          return new Response(
            JSON.stringify({
              id: "task_mock_123",
              status: "processing",
              progress: 45,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            id: "task_mock_123",
            status: "completed",
            progress: 100,
            url: "/v1/media/sample_mock_video.mp4",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/media/sample_mock_video.mp4")) {
        return new Response(mockFakeMp4, {
          status: 200,
          headers: { "Content-Type": "video/mp4" },
        });
      }

      throw new Error("Unhandled mock fetch URL: " + url);
    };

    const dummyStartImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

    const result = await generateMuseVideoClip({
      prompt: "Cinematic drone forward shot of Golden Bridge, Da Nang, 9:16",
      startImageBuffer: dummyStartImage,
      durationSeconds: 6,
      aspectRatio: "9:16",
    });

    assert(result.videoBuffer instanceof Buffer);
    assert.strictEqual(result.videoBuffer.length, 2048);
    assert.strictEqual(result.durationSeconds, 6);
    assert.strictEqual(result.cost.is_live_call, true);
    assert(result.cost.model_name.includes("muse-video"));
    assert.strictEqual(result.cost.cost_vnd, 0);
  });

  await t.test("generateMuseVideoClip() ném lỗi khi tác vụ upstream bị failed", async () => {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/v1/videos") && init?.method === "POST") {
        return new Response(
          JSON.stringify({ id: "task_fail_456", status: "queued" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/v1/videos/task_fail_456")) {
        return new Response(
          JSON.stringify({
            id: "task_fail_456",
            status: "failed",
            error: "Tài khoản Muse AI tạm thời quá tải",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      throw new Error("Unhandled mock fetch URL: " + url);
    };

    await assert.rejects(
      async () => {
        await generateMuseVideoClip({
          prompt: "Test failing prompt",
          startImageBuffer: Buffer.from([0xff, 0xd8, 0xff]),
        });
      },
      /Tài khoản Muse AI tạm thời quá tải/
    );
  });

  await t.test("checkMuse2ApiHealth() kiểm tra kết nối /v1/models thành công", async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/v1/models")) {
        return new Response(
          JSON.stringify({
            object: "list",
            data: [{ id: "muse-video" }, { id: "muse-image" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error("Unhandled URL: " + url);
    };

    const health = await checkMuse2ApiHealth();
    assert.strictEqual(health.ok, true);
    assert(health.models?.includes("muse-video"));
  });

  await t.test("generateMuseVideoClip() tự động nhúng voiceoverScript và ambientSounds vào prompt gửi Muse AI", async () => {
    let capturedPrompt = "";
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/videos") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        capturedPrompt = body.prompt;
        return new Response(
          JSON.stringify({
            id: "task_voice_789",
            status: "queued",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/videos/task_voice_789")) {
        return new Response(
          JSON.stringify({
            id: "task_voice_789",
            status: "completed",
            url: "http://mock-muse.local/v1/media/voice_sample.mp4",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/media/voice_sample.mp4")) {
        return new Response(Buffer.from(new Uint8Array(2048).fill(99)), {
          status: 200,
          headers: { "Content-Type": "video/mp4" },
        });
      }
      throw new Error("Unhandled URL: " + url);
    };

    const res = await generateMuseVideoClip({
      prompt: "Cinematic drone flying over Bana Hills",
      startImageBuffer: Buffer.from([0xff, 0xd8, 0xff]),
      voiceoverScript: "Bí kíp săn mây vắng người tại Đà Nẵng cực chill!",
      ambientSounds: ["tiếng gió rừng nguyên sinh", "tiếng cáp treo vận hành"],
    });

    assert(capturedPrompt.includes("Cinematic drone flying over Bana Hills"));
    assert(capturedPrompt.includes("Audio & Voiceover Narration: Professional, warm, engaging Vietnamese travel host says: \"Bí kíp săn mây vắng người tại Đà Nẵng cực chill!\""));
    assert(capturedPrompt.includes("Synchronized ambient soundscape: tiếng gió rừng nguyên sinh, tiếng cáp treo vận hành"));
    assert.strictEqual(res.durationSeconds, 6);
    assert.strictEqual(res.cost.cost_usd, 0);
  });
});

test("Suite: End-Card phủ mờ hiển thị thông tin tour & Loại bỏ hoàn toàn Gemini Omni", async (t) => {
  const {
    createBlurredTourInfoClip,
    composeChainedOmniVideo,
  } = await import("../src/lib/video-engine/ffmpeg-compositor.ts");
  const { generateGeminiOmniHeroVideo } = await import("../src/lib/ai/gemini-omni-video.ts");

  // Giả lập một buffer ảnh JPEG hợp lệ (1x1 pixel)
  const dummyJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);

  await t.test("createBlurredTourInfoClip() tạo thành công video clip End-Card phủ mờ thông tin tour", async () => {
    const endCardBuffer = await createBlurredTourInfoClip({
      imageBuffer: dummyJpegBuffer,
      durationSec: 2.0,
      info: {
        productName: "Tour Khám Phá Bà Nà Hills - Cầu Vàng",
        location: "Đà Nẵng",
        salePrice: 950000,
        originalPrice: 1200000,
        highlights: [
          "Trọn gói cáp treo khứ hồi đạt nhiều kỷ lục",
          "Check-in Cầu Vàng hùng vĩ và Làng Pháp",
          "Vào cổng ưu tiên, không cần xếp hàng",
        ],
        ctaText: "Bình luận nhận ngay vé ưu đãi hôm nay!",
        hotline: "1900 8888",
        merchantName: "Sun World Ba Na Hills",
      },
    });

    assert(endCardBuffer instanceof Buffer);
    assert(endCardBuffer.length > 5000, "Clip End-Card phải là file MP4 hợp lệ có kích thước > 5KB");
  });

  await t.test("generateGeminiOmniHeroVideo() không gọi Gemini Omni 1.1, báo cáo 0đ (Muse AI)", async () => {
    const heroResult = await generateGeminiOmniHeroVideo({
      prompt: "Cinematic drone shot",
      startImageBuffer: dummyJpegBuffer,
      endImageBuffer: dummyJpegBuffer,
      durationSeconds: 2,
    });

    assert(heroResult.videoBuffer instanceof Buffer);
    assert.strictEqual(heroResult.cost.cost_usd, 0, "Chi phí phải là 0đ khi loại bỏ Gemini Omni");
    assert(
      heroResult.cost.model_name.includes("muse-video"),
      "Mô hình sử dụng phải thuộc Muse AI"
    );
  });
});

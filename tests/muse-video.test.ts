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
});

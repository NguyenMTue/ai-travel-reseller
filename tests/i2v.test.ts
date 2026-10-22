import assert from "node:assert/strict";
import test from "node:test";

import {
  generateImageToVideo,
  getI2VConfig,
  isEligibleForI2V,
  resolveActiveProvider,
  type I2VConfig,
  type I2VRequest,
} from "../src/lib/ai/i2v.ts";

// ============================================================================
// SUITE 1: SELECTIVE ROUTING (MỤC TIÊU CHỐNG BIẾN DẠNG AI & GIỮ TÍNH CHÂN THỰC)
// ============================================================================

test("Suite 1: isEligibleForI2V chỉ cho phép AERIAL_WIDE và SCENIC_MEDIUM", () => {
  assert.equal(isEligibleForI2V("AERIAL_WIDE"), true);
  assert.equal(isEligibleForI2V("aerial_wide"), true);
  assert.equal(isEligibleForI2V("SCENIC_MEDIUM"), true);
  assert.equal(isEligibleForI2V("scenic_medium"), true);

  // Món ăn và góc người review bị từ chối chuyển sang pixel generative AI
  assert.equal(isEligibleForI2V("CLOSEUP_FOOD"), false);
  assert.equal(isEligibleForI2V("closeup_food"), false);
  assert.equal(isEligibleForI2V("HUMAN_POV"), false);
  assert.equal(isEligibleForI2V("human_pov"), false);
  assert.equal(isEligibleForI2V(undefined), false);
  assert.equal(isEligibleForI2V(""), false);
});

test("Suite 1: Ảnh món ăn (CLOSEUP_FOOD) tự động định tuyến sang Ken Burns Food Zoom an toàn", async () => {
  const req: I2VRequest = {
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    shotType: "CLOSEUP_FOOD",
    prompt: "Buffet Bà Nà Hills 100 món",
  };

  const result = await generateImageToVideo(req);

  assert.equal(result.success, true);
  assert.equal(result.mode, "KEN_BURNS");
  assert.equal(result.provider, "selective_routing");
  assert.equal(result.motionType, "FOOD_FOCUS_ZOOM");
  assert.ok(result.fallbackReason?.includes("Ken Burns"));
});

test("Suite 1: Ảnh góc nhìn du khách (HUMAN_POV) giữ nguyên chất lượng thật qua Ken Burns", async () => {
  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/alpine-coaster.jpg",
    shotType: "HUMAN_POV",
  };

  const result = await generateImageToVideo(req);

  assert.equal(result.success, true);
  assert.equal(result.mode, "KEN_BURNS");
  assert.equal(result.provider, "selective_routing");
  assert.equal(result.motionType, "HANDHELD_POV_KEN_BURNS");
});

// ============================================================================
// SUITE 2: PROVIDER RESOLUTION THEO THỨ TỰ ƯU TIÊN
// ============================================================================

test("Suite 2: Ưu tiên webhook n8n cao nhất khi có cấu hình", () => {
  const config = getI2VConfig({
    n8nWebhookUrl: "https://n8n.internal.travellink.vn/webhook/i2v-gen",
    replicateApiToken: "r8_test_token_12345",
    falKey: "fal_key_67890",
  });

  const provider = resolveActiveProvider(config);
  assert.equal(provider, "n8n");
});

test("Suite 2: Chuyển sang Replicate SVD khi không có n8n webhook", () => {
  const config = getI2VConfig({
    n8nWebhookUrl: "",
    replicateApiToken: "r8_test_token_12345",
    falKey: "fal_key_67890",
  });

  const provider = resolveActiveProvider(config);
  assert.equal(provider, "replicate");
});

test("Suite 2: Chuyển sang fal.ai khi không có n8n và Replicate", () => {
  const config = getI2VConfig({
    n8nWebhookUrl: "",
    replicateApiToken: "",
    falKey: "fal_key_67890",
  });

  const provider = resolveActiveProvider(config);
  assert.equal(provider, "fal");
});

test("Suite 2: Fallback an toàn khi không có bất kỳ API key nào", () => {
  const config = getI2VConfig({
    n8nWebhookUrl: "",
    replicateApiToken: "",
    falKey: "",
  });

  const provider = resolveActiveProvider(config);
  assert.equal(provider, "fallback");
});

// ============================================================================
// SUITE 3: GỌI THÀNH CÔNG N8N, REPLICATE SVD, FAL.AI
// ============================================================================

test("Suite 3: Thực thi n8n Webhook thành công khi n8n trả về video URL", async () => {
  let calledUrl = "";
  let payloadBody: any = null;

  const mockFetch: typeof fetch = async (url, init) => {
    calledUrl = String(url);
    payloadBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        success: true,
        video_url: "https://storage.travellink.vn/campaign-videos/n8n-drone-result.mp4",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/golden-bridge.png",
    shotType: "AERIAL_WIDE",
    prompt: "Drone truck left across Golden Bridge",
    motion: "DRONE_TRUCK_LEFT",
  };

  const result = await generateImageToVideo(req, {
    n8nWebhookUrl: "https://n8n.travellink.vn/webhook/test-i2v",
    fetchFn: mockFetch,
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "GENERATIVE_VIDEO");
  assert.equal(result.provider, "n8n");
  assert.equal(
    result.videoUrl,
    "https://storage.travellink.vn/campaign-videos/n8n-drone-result.mp4"
  );
  assert.equal(calledUrl, "https://n8n.travellink.vn/webhook/test-i2v");
  assert.equal(payloadBody.motion, "DRONE_TRUCK_LEFT");
  assert.equal(payloadBody.shot_type, "AERIAL_WIDE");
});

test("Suite 3: Thực thi Replicate SVD thành công khi có REPLICATE_API_TOKEN", async () => {
  let authHeader = "";

  const mockFetch: typeof fetch = async (_url, init) => {
    authHeader = String(init?.headers ? (init.headers as any).Authorization : "");
    return new Response(
      JSON.stringify({
        id: "pred_svd_12345",
        status: "succeeded",
        output: "https://replicate.delivery/pbxt/svd-danang-cable-car.mp4",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/cable-car.png",
    shotType: "AERIAL_WIDE",
    motion: "DRONE_TRUCK_LEFT",
  };

  const result = await generateImageToVideo(req, {
    n8nWebhookUrl: "",
    replicateApiToken: "r8_secret_svd_token",
    fetchFn: mockFetch,
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "GENERATIVE_VIDEO");
  assert.equal(result.provider, "replicate");
  assert.equal(
    result.videoUrl,
    "https://replicate.delivery/pbxt/svd-danang-cable-car.mp4"
  );
  assert.equal(authHeader, "Bearer r8_secret_svd_token");
});

test("Suite 3: Thực thi fal.ai thành công khi cấu hình FAL_KEY", async () => {
  let authHeader = "";

  const mockFetch: typeof fetch = async (_url, init) => {
    authHeader = String(init?.headers ? (init.headers as any).Authorization : "");
    return new Response(
      JSON.stringify({
        video: {
          url: "https://fal.media/files/kling-banahills-moon-castle.mp4",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const req: I2VRequest = {
    imageUrl: "https://images.unsplash.com/photo-moon-castle",
    shotType: "SCENIC_MEDIUM",
  };

  const result = await generateImageToVideo(req, {
    n8nWebhookUrl: "",
    replicateApiToken: "",
    falKey: "fal_key_mock_999",
    fetchFn: mockFetch,
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "GENERATIVE_VIDEO");
  assert.equal(result.provider, "fal");
  assert.equal(
    result.videoUrl,
    "https://fal.media/files/kling-banahills-moon-castle.mp4"
  );
  assert.equal(authHeader, "Key fal_key_mock_999");
});

// ============================================================================
// SUITE 4: CƠ CHẾ FALLBACK AN TOÀN (FAIL-SAFE GUARANTEE)
// ============================================================================

test("Suite 4: Tự động fallback sang URL video mẫu đã tạo sẵn khi không có API key", async () => {
  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/golden-bridge.png",
    shotType: "AERIAL_WIDE",
    motion: "DRONE_TRUCK_LEFT",
  };

  const result = await generateImageToVideo(req, {
    n8nWebhookUrl: "",
    replicateApiToken: "",
    falKey: "",
    preRenderedClips: {
      AERIAL_WIDE:
        "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-remediated-1792641971328.mp4",
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "PRE_RENDERED_CLIP");
  assert.equal(result.provider, "pre_rendered_fallback");
  assert.equal(
    result.videoUrl,
    "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-remediated-1792641971328.mp4"
  );
  assert.ok(result.fallbackReason?.includes("Không có API token"));
});

test("Suite 4: Tự động fallback khi API n8n hoặc Replicate bị lỗi 500 / Network Error", async () => {
  const mockFailingFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({ error: "Upstream AI Model Rate Limit Exceeded" }),
      { status: 500 }
    );
  };

  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/golden-bridge.png",
    shotType: "AERIAL_WIDE",
  };

  const result = await generateImageToVideo(req, {
    n8nWebhookUrl: "https://n8n.broken.example.com",
    fetchFn: mockFailingFetch,
    preRenderedClips: {
      AERIAL_WIDE:
        "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-remediated-1792641971328.mp4",
    },
  });

  // Không bao giờ ném Exception làm gãy quy trình render
  assert.equal(result.success, true);
  assert.equal(result.mode, "PRE_RENDERED_CLIP");
  assert.equal(result.provider, "pre_rendered_fallback");
  assert.ok(result.videoUrl?.length! > 0);
  assert.ok(result.fallbackReason?.includes("500"));
});

test("Suite 4: Tự động fallback về hiệu ứng Ken Burns cũ nếu không có video clip mẫu", async () => {
  const mockNetworkCrashFetch: typeof fetch = async () => {
    throw new Error("ETIMEDOUT: Connection to AI GPU cluster timed out");
  };

  const req: I2VRequest = {
    imageUrl: "https://img.cnt.traveloka.com/french-village.png",
    shotType: "SCENIC_MEDIUM",
  };

  const result = await generateImageToVideo(req, {
    replicateApiToken: "r8_token_timeout",
    preRenderedClips: {}, // Rỗng không có clip mẫu
    fetchFn: mockNetworkCrashFetch,
  });

  assert.equal(result.success, true);
  assert.equal(result.mode, "KEN_BURNS");
  assert.equal(result.provider, "ken_burns_fallback");
  assert.equal(result.motionType, "KEN_BURNS_PUSH_IN");
  assert.ok(result.fallbackReason?.includes("ETIMEDOUT"));
});

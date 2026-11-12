import { createRequire } from "node:module";

export interface WebhookDispatchResult {
  delivered: boolean;
  skipped?: boolean;
  statusCode?: number;
  reason?: string;
  error?: string;
}

type AfterCallback = () => void | Promise<void>;
let nextAfter: ((cb: AfterCallback) => void) | null = null;

try {
  const req = createRequire(import.meta.url);
  const nextServer = req("next/server.js");
  if (typeof nextServer.after === "function") {
    nextAfter = nextServer.after;
  }
} catch {
  // Ignored if next/server.js is not resolvable via createRequire
}

/**
 * Điều phối tác vụ bất đồng bộ không gây nghẽn (non-blocking) luồng phản hồi người dùng.
 * Tận dụng `after()` của Next.js nếu đang trong ngữ cảnh request,
 * hoặc chuyển tiếp microtask an toàn nếu chạy trong ngữ cảnh scripts / testing.
 */
export function runNonBlocking(task: () => Promise<unknown>): void {
  let scheduledWithAfter = false;

  if (nextAfter) {
    try {
      nextAfter(async () => {
        try {
          await task();
        } catch (err: any) {
          console.error(
            "[Automation Webhook Background Task Error]:",
            err?.message || err,
          );
        }
      });
      scheduledWithAfter = true;
    } catch {
      // after() ném ngoại lệ nếu gọi bên ngoài request lifecycle (ví dụ trong testing/CLI)
      scheduledWithAfter = false;
    }
  }

  if (!scheduledWithAfter) {
    // Ngữ cảnh ngoài request (như CLI, unit tests hoặc worker), chạy background promise
    void Promise.resolve()
      .then(task)
      .catch((err: any) => {
        console.error(
          "[Automation Webhook Fallback Task Error]:",
          err?.message || err,
        );
      });
  }
}

/**
 * Bắn webhook khi có Chiến dịch mới sang n8n Workflow để tự động sinh Content Kit cho 4 Persona
 */
export async function dispatchCampaignWebhook(
  campaignId: string,
  campaignRecord?: Record<string, unknown>,
): Promise<WebhookDispatchResult> {
  const webhookUrl =
    process.env.N8N_CAMPAIGN_CONTENT_WEBHOOK_URL?.trim() ||
    process.env.N8N_WEBHOOK_URL?.trim();

  const token = process.env.N8N_WEBHOOK_TOKEN?.trim();

  const payload = {
    type: "INSERT",
    table: "campaigns",
    schema: "public",
    record: {
      id: campaignId,
      ...(campaignRecord || {}),
    },
    old_record: null,
  };

  if (!webhookUrl) {
    return {
      delivered: false,
      skipped: true,
      reason: "N8N_CAMPAIGN_CONTENT_WEBHOOK_URL is not configured",
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["X-Webhook-Token"] = token;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[Automation Webhook] n8n campaign webhook returned ${response.status}: ${errorText.slice(0, 200)}`,
      );
      return {
        delivered: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
      };
    }

    return {
      delivered: true,
      statusCode: response.status,
    };
  } catch (err: any) {
    console.error(
      "[Automation Webhook] Failed to dispatch campaign webhook to n8n:",
      err?.message || err,
    );
    return {
      delivered: false,
      error: err?.message || String(err),
    };
  }
}

/**
 * Bắn webhook sang API nội bộ `/api/embeddings/sync` để đồng bộ vector embeddings khi sản phẩm thay đổi
 */
export async function dispatchProductEmbeddingWebhook(
  productId: string,
  productRecord?: Record<string, unknown>,
  eventType: "INSERT" | "UPDATE" | "DELETE" = "UPDATE",
): Promise<WebhookDispatchResult> {
  const appBaseUrl =
    process.env.INTERNAL_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://127.0.0.1:3000";

  const secret = process.env.EMBEDDINGS_GENERATION_SECRET?.trim();

  const payload = {
    type: eventType,
    table: "products",
    schema: "public",
    record:
      eventType === "DELETE"
        ? null
        : {
            id: productId,
            ...(productRecord || {}),
          },
    old_record:
      eventType === "DELETE"
        ? {
            id: productId,
            ...(productRecord || {}),
          }
        : null,
  };

  if (!secret) {
    return {
      delivered: false,
      skipped: true,
      reason: "EMBEDDINGS_GENERATION_SECRET is not configured",
    };
  }

  const endpointUrl = `${appBaseUrl.replace(/\/+$/, "")}/api/embeddings/sync`;

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "X-Embeddings-Secret": secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[Automation Webhook] embeddings sync returned ${response.status}: ${errorText.slice(0, 200)}`,
      );
      return {
        delivered: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
      };
    }

    return {
      delivered: true,
      statusCode: response.status,
    };
  } catch (err: any) {
    console.error(
      "[Automation Webhook] Failed to dispatch embedding sync webhook:",
      err?.message || err,
    );
    return {
      delivered: false,
      error: err?.message || String(err),
    };
  }
}

/**
 * Kích hoạt sinh Content Kit tự động (Non-blocking)
 */
export function triggerCampaignContentGeneration(
  campaignId: string,
  campaignRecord?: Record<string, unknown>,
): void {
  runNonBlocking(() => dispatchCampaignWebhook(campaignId, campaignRecord));
}

/**
 * Kích hoạt đồng bộ Embeddings tự động (Non-blocking)
 */
export function triggerProductEmbeddingSync(
  productId: string,
  productRecord?: Record<string, unknown>,
  eventType: "INSERT" | "UPDATE" | "DELETE" = "UPDATE",
): void {
  runNonBlocking(() =>
    dispatchProductEmbeddingWebhook(productId, productRecord, eventType),
  );
}

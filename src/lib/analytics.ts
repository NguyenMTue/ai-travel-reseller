import { createAnalyticsClient } from "./analytics-client";

const analytics = createAnalyticsClient({
  projectToken: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
}, async () => (await import("posthog-js")).default);

export const initializeAnalytics = analytics.initialize;

export type FunnelAttribution = {
  campaign_id: string;
  product_id: string;
  reseller_id: string;
};

export function captureChatFunnelEvent(
  event: "chat_opened" | "chat_message_sent" | "checkout_clicked",
  attribution: FunnelAttribution | null,
  properties: Record<string, string | number | boolean> = {},
): void {
  analytics.capture(event, {
    ...properties,
    has_attribution: attribution !== null,
    ...(attribution ?? {}),
  });
}
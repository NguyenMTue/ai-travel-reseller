import posthog from "posthog-js";

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
  if (!posthog.__loaded) return;

  posthog.capture(event, {
    ...properties,
    has_attribution: attribution !== null,
    ...(attribution ?? {}),
  });
}

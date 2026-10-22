export type Attribution = { reseller_id: string; campaign_id: string; product_id: string };
export type ChatInput = {
  message: string;
  conversation_history: { role: "user" | "assistant"; content: string }[];
  attribution_context: Attribution;
};
export type ChatReply = { reply: string; suggested_checkout_url?: unknown };
export type ChatTransport = (input: ChatInput, signal: AbortSignal) => Promise<ChatReply>;

// The deployed endpoint returns one JSON response, not an event stream.
export const requestChat: ChatTransport = async (input, signal) => {
  const response = await fetch("/api/chat", {
    method: "POST", credentials: "same-origin", redirect: "error",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal,
  });
  if (!response.ok) throw new Error(response.status === 404
    ? "Liên kết sản phẩm không còn hợp lệ. Vui lòng xin lại liên kết từ cộng tác viên."
    : "Trợ lý chưa thể trả lời lúc này. Vui lòng thử lại.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("reply" in data) || typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("Phản hồi chưa hợp lệ. Vui lòng thử lại.");
  }
  return { reply: data.reply, suggested_checkout_url: "suggested_checkout_url" in data ? data.suggested_checkout_url : null };
};

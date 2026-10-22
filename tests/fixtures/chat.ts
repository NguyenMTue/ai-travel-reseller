import type { Attribution, ChatTransport } from "../../src/lib/chat/transport";
export type ChatScenario = "success" | "error" | "timeout" | "slow" | "long";
export const chatAttribution: Attribution = {
  reseller_id: "22222222-2222-4222-8222-222222222222",
  campaign_id: "11111111-1111-4111-8111-111111111111",
  product_id: "33333333-3333-4333-8333-333333333333",
};
export function chatFixture(scenario: ChatScenario, onRequest: () => void): ChatTransport {
  return async (_input, signal) => {
    onRequest();
    // Slow deliberately ignores abort to prove that stale context responses are dropped.
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, scenario === "slow" ? 2500 : 500);
      if (scenario !== "slow") signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
    });
    if (scenario === "error") throw new Error("Mô phỏng lỗi dịch vụ. Tin nhắn chưa được trả lời; bạn có thể sửa rồi tự gửi lại.");
    if (scenario === "timeout") throw new DOMException("Mô phỏng hết thời gian chờ", "AbortError");
    return { reply: scenario === "long"
      ? ("Mô phỏng nội dung dài, không phải tư vấn AI thật.\nHãy kiểm tra chính sách do doanh nghiệp cung cấp. <script>alert('fixture')</script>\n\n").repeat(18)
      : "Mô phỏng: Em có thể hỗ trợ anh/chị tìm hiểu thông tin đã được doanh nghiệp xác nhận.\nĐây là phản hồi fixture, không phải kết quả AI thật.", suggested_checkout_url: null };
  };
}

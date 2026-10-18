"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
type Message = {
  role: "user" | "assistant";
  content: string;
  checkout?: string | null;
};
export type Attribution = {
  reseller_id: string;
  campaign_id: string;
  product_id: string;
};
const prompts = [
  "Tôi muốn tìm hiểu về sản phẩm",
  "Chính sách hủy và hoàn tiền thế nào?",
  "Làm sao để đặt dịch vụ chính thức?",
];
function safeCheckout(raw: unknown) {
  try {
    const u = new URL(String(raw));
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
export function ChatPanel({
  attribution,
}: {
  attribution: Attribution | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(text: string) {
    const question = text.trim();
    if (!question || busy.current) return;
    if (question.length > 2000) {
      setError("Câu hỏi tối đa 2.000 ký tự.");
      return;
    }
    busy.current = true;
    setError("");
    setPending(true);
    setInput("");
    const history = messages
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    if (!attribution) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Đây là bản xem trước giao diện, chưa gọi AI. Để được tư vấn về giá, chính sách và đặt dịch vụ, vui lòng mở liên kết sản phẩm do cộng tác viên cung cấp. Tôi chưa có dữ liệu sản phẩm được xác nhận để trả lời câu hỏi này.",
        },
      ]);
      setPending(false);
      busy.current = false;
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 45000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          conversation_history: history,
          attribution_context: attribution,
        }),
        signal: abort.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "Liên kết sản phẩm không còn hợp lệ. Vui lòng xin lại liên kết từ cộng tác viên."
            : "Trợ lý chưa thể trả lời lúc này. Vui lòng thử lại.",
        );
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim())
        throw new Error("Phản hồi chưa hợp lệ. Vui lòng thử lại.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          checkout: safeCheckout(data.suggested_checkout_url),
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "AbortError"
          ? e.message
          : "Kết nối quá thời gian chờ. Vui lòng thử lại.",
      );
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      clearTimeout(timeout);
      setPending(false);
      busy.current = false;
    }
  }
  return (
    <div className="chat-layout">
      <aside className="chat-aside">
        <p className="eyebrow">TRỢ LÝ DU LỊCH</p>
        <h1>
          Một câu hỏi.
          <br />
          <em>Mở ra hành trình.</em>
        </h1>
        <p>
          Tìm hiểu trải nghiệm, chính sách và cách đặt dịch vụ từ thông tin
          doanh nghiệp cung cấp.
        </p>
        <div className="chat-assurance">
          <ShieldCheck />
          <h3>Thông tin có căn cứ</h3>
          <p>Trợ lý chỉ tư vấn từ dữ liệu được doanh nghiệp duyệt.</p>
        </div>
        <div className="chat-assurance">
          <ArrowUpRight />
          <h3>Thanh toán chính thức</h3>
          <p>
            Bạn đặt và thanh toán trực tiếp với doanh nghiệp cung cấp dịch vụ.
          </p>
        </div>
        <div className="chat-mode">
          <span className="dot" />
          {attribution
            ? "Đã nhận ngữ cảnh từ liên kết sản phẩm"
            : "Đang xem thử giao diện · Chưa kết nối AI"}
        </div>
      </aside>
      <section className="chat-window" aria-label="Trò chuyện với trợ lý AI">
        <header className="chat-header">
          <span className="chat-avatar">
            <Sparkles />
          </span>
          <div>
            <strong>TravelLink Assistant</strong>
            <small>
              {attribution ? "Tư vấn theo sản phẩm" : "Bản xem trước giao diện"}
            </small>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending || messages.length === 0}
            aria-label="Cuộc trò chuyện mới"
            onClick={() => {
              setMessages([]);
              setError("");
              setInput("");
            }}
          >
            <Plus />
          </Button>
        </header>
        <div
          className="chat-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <span className="welcome-icon">
                <MessageCircle />
              </span>
              <p className="eyebrow">XIN CHÀO, BẠN ƠI!</p>
              <h2>Bạn muốn khám phá điều gì?</h2>
              <p>
                {attribution
                  ? "Hãy hỏi tôi về trải nghiệm bạn đang quan tâm."
                  : "Thử gửi một câu hỏi để khám phá giao diện trò chuyện."}
              </p>
              <div className="chat-prompts">
                {prompts.map((p) => (
                  <button key={p} onClick={() => send(p)}>
                    {p}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`message message-${m.role}`}>
                <span className="message-label">
                  {m.role === "user" ? "Bạn" : "TravelLink Assistant"}
                </span>
                <p>{m.content}</p>
                {m.checkout && (
                  <a
                    className="checkout-link"
                    href={m.checkout}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Đến trang thanh toán của doanh nghiệp ↗
                    <small>{new URL(m.checkout).hostname}</small>
                  </a>
                )}
              </div>
            ))
          )}
          {pending && (
            <p className="typing" role="status">
              Trợ lý đang trả lời<span>…</span>
            </p>
          )}
          <div ref={bottom} />
        </div>
        <div className="chat-compose">
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label className="sr-only" htmlFor="chat-message">
              Tin nhắn cho trợ lý AI
            </label>
            <textarea
              id="chat-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Bạn muốn hỏi điều gì?"
              disabled={pending}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Gửi tin nhắn"
              disabled={!input.trim() || pending}
            >
              <ArrowUp />
            </Button>
          </form>
          <p>
            AI có thể mắc lỗi. Vui lòng xác nhận thông tin với doanh nghiệp.
          </p>
        </div>
      </section>
    </div>
  );
}

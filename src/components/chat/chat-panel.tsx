"use client";
import { useEffect, useRef, useState } from "react";
import { captureChatFunnelEvent } from "@/src/lib/analytics";
import {
  ArrowUp,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { requestChat, type ChatTransport, type Attribution } from "@/src/lib/chat/transport";
export type { Attribution } from "@/src/lib/chat/transport";
type Message = {
  role: "user" | "assistant";
  content: string;
  checkout?: string | null;
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
  transport = requestChat,
  preview = false,
  active = true,
}: {
  attribution: Attribution | null;
  transport?: ChatTransport;
  preview?: boolean;
  active?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const mounted = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const trackedChatOpen = useRef(false);
  useEffect(() => {
    if (follow.current && scroll.current) scroll.current.scrollTo({ top: scroll.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [messages, pending]);
  useEffect(() => {
    if (!active || preview || trackedChatOpen.current) return;
    trackedChatOpen.current = true;
    captureChatFunnelEvent("chat_opened", attribution, {
      page: "chat",
    });
  }, [attribution, preview, active]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  async function send(text: string) {
    const question = text.trim();
    if (!question || busy.current) return;
    if (!navigator.onLine) { setInput(question); setError("Bạn đang ngoại tuyến. Tin nhắn chưa gửi; hãy kết nối lại rồi tự gửi khi sẵn sàng."); return; }
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
    if (!preview) captureChatFunnelEvent("chat_message_sent", attribution, {
      message_length: question.length,
      message_number: messages.filter((message) => message.role === "user").length + 1,
    });
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    follow.current = true;
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
      const data = await transport({
          message: question,
          conversation_history: history,
          attribution_context: attribution,
        }, abort.signal);
      if (!mounted.current) return;
      if (abort.signal.aborted) throw new DOMException("Timeout", "AbortError");
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
      if (!mounted.current) return;
      setError(
        e instanceof Error && e.name !== "AbortError"
          ? e.message
          : "Kết nối quá thời gian chờ. Vui lòng thử lại.",
      );
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setPending(false);
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
              {preview ? "Mô phỏng · Không kết nối AI" : attribution ? "Tư vấn theo sản phẩm" : "Bản xem trước giao diện"}
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
          ref={scroll}
          onScroll={() => { const el = scroll.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 72; }}
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
                    onClick={() =>
                      !preview && m.checkout && captureChatFunnelEvent("checkout_clicked", attribution, {
                        checkout_domain: new URL(m.checkout).hostname,
                      })
                    }
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

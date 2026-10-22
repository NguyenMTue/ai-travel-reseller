"use client";
import { useMemo, useState } from "react";
import { MobileChatSheet } from "@/src/components/chat/mobile-chat-sheet";
import { chatAttribution, chatFixture, type ChatScenario } from "@/tests/fixtures/chat";

export function ChatPreview() {
  const [scenario, setScenario] = useState<ChatScenario>("success");
  const [context, setContext] = useState(1);
  const [session, setSession] = useState(1);
  const [requests, setRequests] = useState(0);
  const transport = useMemo(() => chatFixture(scenario, () => setRequests(n => n + 1)), [scenario]);
  return <main id="main-content" className="container chat-page">
    <section aria-label="Điều khiển mô phỏng" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary p-4">
      <strong className="w-full">Mô phỏng · Chờ UI/UX review · Không gọi AI, Tracking hoặc tạo đơn</strong>
      <label>Trạng thái <select className="rounded border border-border bg-background p-2" aria-label="Trạng thái mô phỏng" value={scenario} onChange={e => setScenario(e.target.value as ChatScenario)}>
        <option value="success">Thành công</option><option value="error">Lỗi</option><option value="timeout">Timeout</option><option value="slow">Phản hồi chậm</option><option value="long">Nội dung dài</option>
      </select></label>
      <button className="rounded border border-primary p-2" onClick={() => setContext(n => n + 1)}>Đổi campaign/product</button>
      <button className="rounded border border-primary p-2" onClick={() => setSession(n => n + 1)}>Đổi phiên</button>
      <output aria-label="Số request mô phỏng">{requests}</output>
      <span>Ngữ cảnh {context} · Phiên {session}</span>
    </section>
    <MobileChatSheet attribution={{ ...chatAttribution, campaign_id: context % 2 ? chatAttribution.campaign_id : "55555555-5555-4555-8555-555555555555", product_id: context % 2 ? chatAttribution.product_id : "44444444-4444-4444-8444-444444444444" }}
      sessionKey={`fixture-${session}`} transport={transport} preview />
  </main>;
}

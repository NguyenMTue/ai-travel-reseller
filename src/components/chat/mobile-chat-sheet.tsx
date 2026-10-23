"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Maximize2, Minimize2, X } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import type { Attribution, ChatTransport } from "@/src/lib/chat/transport";
import styles from "./mobile-chat-sheet.module.css";

export function MobileChatSheet({ attribution, sessionKey = "customer", transport, preview = false }: {
  attribution: Attribution | null; sessionKey?: string; transport?: ChatTransport; preview?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const restoreScroll = useRef<(() => void) | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const context = JSON.stringify([sessionKey, attribution?.reseller_id, attribution?.campaign_id, attribution?.product_id]);
  function release() { restoreScroll.current?.(); restoreScroll.current = null; }
  useEffect(() => {
    const el = dialog.current!;
    const media = window.matchMedia("(min-width: 768px)");
    function resize() {
      const viewport = window.visualViewport;
      el.style.setProperty("--chat-viewport", `${viewport?.height ?? window.innerHeight}px`);
      el.style.setProperty("--chat-top", `${viewport?.offsetTop ?? 0}px`);
    }
    function changeLayout() {
      release();
      if (el.open) el.close();
      if (media.matches) el.show();
      setActive(media.matches);
      setReady(true);
      resize();
    }
    changeLayout();
    media.addEventListener("change", changeLayout);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      media.removeEventListener("change", changeLayout);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      release();
    };
  }, []);
  function open() {
    const el = dialog.current;
    if (!el || el.open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    restoreScroll.current = () => { document.body.style.overflow = previous; };
    el.showModal();
    setActive(true);
    closeButton.current?.focus();
  }
  return <div className={styles.host}>
    <div className={styles.invitation}>
      <p className="eyebrow">TRỢ LÝ DU LỊCH BẢN ĐỊA</p>
      <h1>Một câu hỏi.<br /><em>Mở ra hành trình.</em></h1>
      <p>Tìm hiểu trải nghiệm và chính sách từ thông tin doanh nghiệp cung cấp. Bạn chủ động bắt đầu cuộc trò chuyện.</p>
      <button ref={launcher} className={styles.launcher} disabled={!ready} onClick={open}><MessageCircle size={22} /> Hỏi TravelLink Assistant</button>
      <small>{preview ? "Mô phỏng · Không gọi AI hoặc tạo đơn" : "Chỉ gửi khi bạn bấm Gửi tin nhắn"}</small>
    </div>
    <dialog ref={dialog} className={styles.sheet} data-expanded={expanded} aria-label="Trợ lý du lịch TravelLink"
      onKeyDown={event => {
        const el = dialog.current;
        if (!el?.matches(":modal") || event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
        const controls = Array.from(el.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])"))
          .filter(control => control.offsetParent !== null);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first || !last) return;
        const current = document.activeElement;
        if (event.shiftKey && (current === first || !controls.includes(current as HTMLElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (current === last || !controls.includes(current as HTMLElement))) {
          event.preventDefault(); first.focus();
        }
      }}
      onClose={() => { release(); const wide = window.matchMedia("(min-width: 768px)").matches; setActive(wide); if (!wide) launcher.current?.focus(); }}>
      <div className={styles.controls}>
        <span>Cuộc trò chuyện của bạn</span>
        <button aria-label={expanded ? "Thu gọn trò chuyện" : "Mở rộng trò chuyện"} aria-pressed={expanded}
          onClick={() => setExpanded(value => !value)}>{expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
        <button ref={closeButton} aria-label="Đóng trò chuyện" onClick={() => dialog.current?.close()}><X size={22} /></button>
      </div>
      <ChatPanel key={context} attribution={attribution} transport={transport} preview={preview} active={active} />
    </dialog>
  </div>;
}

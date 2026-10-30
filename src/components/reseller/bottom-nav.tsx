"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Compass, QrCode, Sparkles, Wallet, X } from "lucide-react";
import styles from "./bottom-nav.module.css";
import mobileStyles from "@/src/components/mobile-dialog.module.css";
import { useDialogViewport } from "@/src/components/use-dialog-viewport";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  let frame = 0;
  const observer = new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; callback(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
function snapshot() {
  return `${window.location.hash}|${!!document.getElementById("reseller-content-kit")}|${!!document.getElementById("reseller-tracking")}`;
}
const subscribeHydration = () => () => {};

export function ResellerBottomNav({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [hash, hasContent, hasTracking] = useSyncExternalStore(subscribe, snapshot, () => "|false|false").split("|");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [notice, setNotice] = useState("content");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogViewport(dialog, noticeOpen);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const feedPath = preview ? "/preview/reseller" : "/reseller/campaigns";
  const walletPath = preview ? "/preview/reseller/wallet" : "/reseller/wallet";
  const inDetail = pathname.startsWith(`${preview ? "/preview/reseller" : "/reseller"}/campaigns/`);
  const contentReady = inDetail && hasContent === "true";
  const trackingReady = inDetail && hasTracking === "true";
  const active = pathname === walletPath || pathname.startsWith(`${walletPath}/`) ? "wallet"
    : contentReady && hash === "#reseller-content-kit" ? "content"
    : trackingReady && hash === "#reseller-tracking" ? "tracking" : "discover";

  useEffect(() => {
    if (!noticeOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const documentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = documentOverflow; };
  }, [noticeOpen]);

  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    function measure() {
      frame = 0;
      const editable = document.activeElement?.matches('input:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
      setKeyboardOpen(!!editable && !!viewport && window.innerHeight - viewport.height > 150);
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    viewport?.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, []);

  const items = [
    { key: "discover", label: "Khám phá", icon: Compass, href: feedPath, hint: "Chiến dịch" },
    { key: "content", label: "Nội dung AI", icon: Sparkles, href: contentReady ? "#reseller-content-kit" : undefined, hint: contentReady ? "Content Kit" : "Mở chiến dịch" },
    { key: "tracking", label: "Link & QR", icon: QrCode, href: trackingReady ? "#reseller-tracking" : undefined, hint: trackingReady ? "Theo chiến dịch" : "Mở chiến dịch" },
    { key: "wallet", label: "Ví hoa hồng", icon: Wallet, href: walletPath, hint: "Hoa hồng" },
  ];

  return <>
    <nav aria-label="Điều hướng nhanh Cộng tác viên" aria-busy={!hydrated} className={styles.nav} hidden={keyboardOpen}>
      <div className={styles.items}>
        {items.map(({ key, label, icon: Icon, href, hint }) => {
          const selected = active === key;
          const contents = <>
            <span className={styles.icon}><Icon size={22} strokeWidth={1.75} aria-hidden="true" /></span>
            <span className={styles.label}>{label}</span>
            <span className={styles.hint}>{hint}</span>
          </>;
          const className = `${styles.item} ${selected ? styles.active : ""}`;
          if (href) return key === "discover" || key === "wallet"
            ? <Link key={key} href={href} prefetch={key === "wallet" ? false : undefined} className={className} aria-current={selected ? "page" : undefined}>{contents}</Link>
            : <a key={key} href={href} className={className} aria-current={selected ? "location" : undefined}
              onClick={(event) => {
                const target = document.getElementById(href.slice(1));
                if (!target) return;
                event.preventDefault();
                if (window.location.hash !== href) window.history.pushState(null, "", href);
                window.dispatchEvent(new HashChangeEvent("hashchange"));
                target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
                target.focus({ preventScroll: true });
              }}>{contents}</a>;
          return <button key={key} type="button" disabled={!hydrated} className={className} aria-haspopup="dialog"
            aria-label={`${label} — ${hint}`} onClick={(event) => {
              opener.current = event.currentTarget;
              setNotice(key);
              setNoticeOpen(true);
              dialog.current?.showModal();
              title.current?.focus();
            }}>{contents}</button>;
        })}
      </div>
    </nav>
    <dialog ref={dialog} className={`${styles.dialog} ${mobileStyles.surface}`} aria-labelledby="reseller-nav-notice" aria-describedby="reseller-nav-help"
      onClose={() => { setNoticeOpen(false); opener.current?.focus(); }}>
      <div className={styles.dialogHeader}>
        <h2 id="reseller-nav-notice" ref={title} tabIndex={-1}>Chọn chiến dịch trước</h2>
        <button type="button" className={styles.close} aria-label="Đóng hướng dẫn" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
      </div>
      <p id="reseller-nav-help">{`Mở chi tiết một chiến dịch trong mục Khám phá để ${notice === "tracking" ? "tạo link tiếp thị và xem QR đúng sản phẩm" : "xem Content Kit và nội dung AI của chiến dịch đó"}.`}</p>
      <button type="button" className={styles.confirm} onClick={() => dialog.current?.close()}>Đã hiểu</button>
    </dialog>
  </>;
}

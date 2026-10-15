"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { requestLiveTrackingLink, trackingBlockedMessage, isLiveTrackingEnabled, type TrackingInput, type TrackingRequest, type TrackingResult } from "@/src/lib/reseller/tracking-link";
import { TrackingQr } from "./tracking-qr";
import styles from "./tracking-link.module.css";
import { useTrackingScope } from "./tracking-scope";
import { trackingUrlAudience } from "@/src/lib/reseller/tracking-cta";

type ModalProps = {
  input: TrackingInput | null; request?: TrackingRequest; preview?: boolean; blocked?: boolean;
};
export function TrackingLinkModal(props: ModalProps) {
  const { invalidated } = useTrackingScope();
  return <TrackingLinkDialog key={invalidated ? "invalidated" : "current"} {...props} input={invalidated ? null : props.input} />;
}
function TrackingLinkDialog({ input, request = requestLiveTrackingLink, preview = false, blocked = false }: ModalProps) {
  const { acceptLink } = useTrackingScope();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const manual = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [pending, setPending] = useState(false);
  const [copy, setCopy] = useState<"idle" | "pending" | "success" | "error">("idle");
  const inFlight = useRef(false);
  const copying = useRef(false);
  const allowed = !blocked && (preview || isLiveTrackingEnabled());
  const locked = result?.status === "success" || result?.status === "uncertain" || result?.status === "session";

  async function create() {
    if (inFlight.current || locked || !input || !allowed) return;
    inFlight.current = true;
    setPending(true);
    setResult(null);
    try {
      const received = await request(input);
      setResult(received);
      if (received.status === "success") acceptLink(input, received.shortUrl);
    }
    catch { setResult({ status: "uncertain", message: "Chưa xác định được kết quả tạo link. Không gửi lại; vui lòng nhờ nhóm hỗ trợ kiểm tra." }); }
    finally { inFlight.current = false; setPending(false); }
  }

  async function copyLink() {
    if (copying.current || result?.status !== "success") return;
    copying.current = true;
    setCopy("pending");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(result.shortUrl);
      setCopy("success");
    } catch { setCopy("error"); }
    finally { copying.current = false; }
  }

  return <section className="mt-6" aria-label="Link tiếp thị">
    <Button ref={opener} onClick={() => { dialog.current?.showModal(); heading.current?.focus(); }}>Tạo link</Button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="tracking-title" aria-describedby="tracking-help"
      onClose={() => opener.current?.focus()}
      onKeyDown={event => {
        if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )).filter(element => element.offsetParent !== null);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (active === last || !controls.includes(active as HTMLElement))) {
          event.preventDefault(); first.focus();
        }
      }}>
      <div className={styles.body}>
        <div className={styles.header}>
          <h2 id="tracking-title" ref={heading} tabIndex={-1} className={styles.title}>Link tiếp thị & QR</h2>
          <Button variant="outline" className={styles.close} aria-label="Đóng cửa sổ tạo link" onClick={() => dialog.current?.close()}>×</Button>
        </div>
        <p id="tracking-help" className={styles.hint}>Tạo link cho chiến dịch đang xem. QR và nút Copy sử dụng cùng một link được trả về.</p>
        {preview && <p className={styles.message}>BẢN MÔ PHỎNG — link và QR chỉ phục vụ kiểm thử, không dùng để bán hàng.</p>}
        {!allowed && <p className={styles.message} role="status">{trackingBlockedMessage}</p>}
        {!input && <p className={styles.message}>Chưa có sản phẩm hợp lệ liên kết với chiến dịch để tạo link.</p>}
        {pending && <p role="status" className={styles.message}>Đang tạo link…</p>}
        {result && result.status !== "success" && <div className={styles.message} role="alert">
          <p>{result.message}</p>
          {result.status === "session" && <Link href={`/login?next=${encodeURIComponent(`/reseller/campaigns/${input?.campaign_id ?? ""}`)}`}>Đăng nhập lại ↗</Link>}
        </div>}
        {result?.status === "success" && <div>
          <p role="status" className={styles.message}>{preview ? "Đã nhận kết quả mô phỏng." : "Đã nhận link tiếp thị."}</p>
          <label htmlFor="tracking-url" className={styles.label}>Link tiếp thị{preview ? " mô phỏng" : ""}</label>
          <textarea ref={manual} id="tracking-url" value={result.shortUrl} readOnly rows={3} className={styles.url} />
          {trackingUrlAudience(result.shortUrl) === "local" && <p role="note" className={styles.message}>Link localhost/mạng nội bộ chỉ dùng kiểm thử local, chưa dùng để chia sẻ công khai. Không tự đổi domain của link đã lưu.</p>}
          <TrackingQr url={result.shortUrl} />
          <p className={styles.hint}>QR mã hóa đúng link phía trên. Nội dung trong Content Kit vẫn giữ nguyên; hãy kiểm tra link trước khi sử dụng.</p>
          <div className={styles.actions}><Button onClick={copyLink} disabled={copy === "pending"}>{copy === "pending" ? "Đang sao chép link…" : "Copy link"}</Button></div>
          <p role="status" aria-live="polite" className={styles.hint}>{copy === "success" ? "Đã sao chép link." : ""}</p>
          {copy === "error" && <div className={styles.message} role="alert">
            <p>Không thể sao chép link. Chọn nội dung rồi dùng Ctrl+C hoặc lệnh Sao chép của thiết bị.</p>
            <Button variant="outline" onClick={() => { manual.current?.focus(); manual.current?.select(); }}>Chọn link để sao chép thủ công</Button>
          </div>}
        </div>}
        <div className={styles.actions}>
          <Button onClick={create} disabled={!allowed || !input || pending || locked}>{pending ? "Đang tạo…" : "Tạo link tiếp thị"}</Button>
          <Button variant="outline" onClick={() => dialog.current?.close()}>Đóng</Button>
        </div>
      </div>
    </dialog>
  </section>;
}

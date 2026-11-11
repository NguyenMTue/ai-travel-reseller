"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { requestLiveTrackingLink, trackingBlockedMessage, isLiveTrackingEnabled, type TrackingInput, type TrackingRequest, type TrackingResult } from "@/src/lib/reseller/tracking-link";
import { TrackingQr } from "./tracking-qr";
import styles from "./tracking-link.module.css";
import { useTrackingScope } from "./tracking-scope";
import { trackingUrlAudience, generateVoucherCode } from "@/src/lib/reseller/tracking-cta";
import { ShareActions } from "./share-actions";
import type { PosterDetails } from "@/src/lib/reseller/canvas-qr";

type ModalTab = "all" | "link" | "qr" | "voucher";
type CopyState = "idle" | "pending" | "success" | "error";

type ModalProps = {
  input: TrackingInput | null; request?: TrackingRequest; preview?: boolean; blocked?: boolean;
  posterDetails?: PosterDetails;
};
export function TrackingLinkModal(props: ModalProps) {
  const { invalidated, scope } = useTrackingScope();
  return <TrackingLinkDialog key={JSON.stringify([invalidated, props.input?.campaign_id, props.input?.product_id, scope?.sessionKey])} {...props} input={invalidated ? null : props.input} />;
}
function TrackingLinkDialog({ input, request = requestLiveTrackingLink, preview = false, blocked = false, posterDetails }: ModalProps) {
  const { acceptLink, scope } = useTrackingScope();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const manual = useRef<HTMLTextAreaElement>(null);
  const voucherManual = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [pending, setPending] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("all");
  const [copy, setCopy] = useState<CopyState>("idle");
  const [voucherCopy, setVoucherCopy] = useState<CopyState>("idle");
  const inFlight = useRef(false);
  const copying = useRef(false);
  const voucherCopying = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const allowed = !blocked && (preview || isLiveTrackingEnabled());
  const locked = result?.status === "success" || result?.status === "uncertain" || result?.status === "session";

  const shortCodeFromResult = result?.status === "success" ? result.shortUrl.split("/").pop() : undefined;
  const voucherCode = generateVoucherCode(
    posterDetails?.campaignName ?? input?.campaign_id ?? "Tour",
    scope?.sessionKey ?? shortCodeFromResult ?? input?.campaign_id ?? "TL",
  );

  async function create() {
    if (inFlight.current || locked || !input || !allowed) return;
    inFlight.current = true;
    setPending(true);
    setResult(null);
    setActiveTab("all");
    try {
      const received = await request(input);
      if (!mounted.current) return;
      setResult(received);
      if (received.status === "success") acceptLink(input, received.shortUrl);
    }
    catch { if (mounted.current) setResult({ status: "uncertain", message: "Chưa xác định được kết quả tạo link. Không gửi lại; vui lòng nhờ nhóm hỗ trợ kiểm tra." }); }
    finally { inFlight.current = false; if (mounted.current) setPending(false); }
  }

  async function performCopy(
    value: string,
    lockRef: { current: boolean },
    setCopyState: (state: CopyState) => void,
  ) {
    if (lockRef.current || result?.status !== "success") return;
    lockRef.current = true;
    setCopyState("pending");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (mounted.current) setCopyState("success");
    } catch {
      if (mounted.current) setCopyState("error");
    } finally {
      lockRef.current = false;
    }
  }

  function copyLink() {
    if (result?.status !== "success") return;
    return performCopy(result.shortUrl, copying, setCopy);
  }

  function copyVoucher() {
    return performCopy(voucherCode, voucherCopying, setVoucherCopy);
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
          <div role="tablist" aria-label="Tài nguyên phân phối" className={styles.tabs}>
            <button type="button" role="tab" aria-selected={activeTab === "all" || activeTab === "link"}
              className={`${styles.tab} ${activeTab === "all" || activeTab === "link" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(prev => prev === "link" ? "all" : "link")}>Link</button>
            <button type="button" role="tab" aria-selected={activeTab === "qr"}
              className={`${styles.tab} ${activeTab === "qr" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(prev => prev === "qr" ? "all" : "qr")}>QR</button>
            <button type="button" role="tab" aria-selected={activeTab === "voucher"}
              className={`${styles.tab} ${activeTab === "voucher" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(prev => prev === "voucher" ? "all" : "voucher")}>Mã Voucher</button>
          </div>
          {(activeTab === "all" || activeTab === "link") && <div role="tabpanel" aria-label="Đường dẫn tiếp thị">
            <label htmlFor="tracking-url" className={styles.label}>Link tiếp thị{preview ? " mô phỏng" : ""}</label>
            <textarea ref={manual} id="tracking-url" value={result.shortUrl} readOnly rows={3} className={styles.url} />
            {trackingUrlAudience(result.shortUrl) === "local" && <p role="note" className={styles.message}>Link localhost/mạng nội bộ chỉ dùng kiểm thử local, chưa dùng để chia sẻ công khai. Không tự đổi domain của link đã lưu.</p>}
            <div className={styles.actions}><Button onClick={copyLink} disabled={copy === "pending"}>{copy === "pending" ? "Đang sao chép link…" : "Copy link"}</Button></div>
            <p role="status" aria-live="polite" className={styles.hint}>{copy === "success" ? "Đã sao chép link." : ""}</p>
            {copy === "error" && <div className={styles.message} role="alert">
              <p>Không thể sao chép link. Chọn nội dung rồi dùng Ctrl+C hoặc lệnh Sao chép của thiết bị.</p>
              <Button variant="outline" onClick={() => { manual.current?.focus(); manual.current?.select(); }}>Chọn link để sao chép thủ công</Button>
            </div>}
          </div>}
          {(activeTab === "all" || activeTab === "qr") && <div role="tabpanel" aria-label="Ảnh mã QR">
            <TrackingQr url={result.shortUrl} />
            <p className={styles.hint}>QR mã hóa đúng link phía trên. Nội dung trong Content Kit vẫn giữ nguyên; hãy kiểm tra link trước khi sử dụng.</p>
          </div>}
          {(activeTab === "all" || activeTab === "voucher") && <div className={styles.voucherPanel} role="tabpanel" aria-label="Ưu đãi trực tiếp">
            <label htmlFor="tracking-voucher" className={styles.label}>Mã Voucher</label>
            <input ref={voucherManual} id="tracking-voucher" name="voucher_code" data-testid="unique-voucher-code" value={voucherCode} readOnly className={styles.voucherCode} />
            <p className={styles.hint}>Chia sẻ mã này khi Livestream hoặc tư vấn Offline để khách nhập khi thanh toán.</p>
            <div className={styles.actions}>
              <Button type="button" data-testid="copy-voucher-btn" onClick={copyVoucher} disabled={voucherCopy === "pending"}>{voucherCopy === "pending" ? "Đang sao chép mã…" : "Copy Mã Voucher"}</Button>
            </div>
            <p role="status" aria-live="polite" className={styles.hint}>{voucherCopy === "success" ? "Đã sao chép mã voucher." : ""}</p>
            {voucherCopy === "error" && <div className={styles.message} role="alert">
              <p>Không thể sao chép mã voucher. Chọn mã rồi dùng Ctrl+C hoặc lệnh Sao chép của thiết bị.</p>
              <Button type="button" variant="outline" onClick={() => { voucherManual.current?.focus(); voucherManual.current?.select(); }}>Chọn mã để sao chép thủ công</Button>
            </div>}
          </div>}
          <ShareActions url={result.shortUrl} details={posterDetails} preview={preview} />
        </div>}
        <div className={styles.actions}>
          <Button onClick={create} disabled={!allowed || !input || pending || locked}>{pending ? "Đang tạo…" : "Tạo link tiếp thị"}</Button>
          <Button variant="outline" onClick={() => dialog.current?.close()}>Đóng</Button>
        </div>
      </div>
    </dialog>
  </section>;
}

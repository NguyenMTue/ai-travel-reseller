"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Share2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { createQrPoster, type PosterDetails, type PosterResult } from "@/src/lib/reseller/canvas-qr";
import { shareData, shareMessage, trackingShareData } from "@/src/lib/reseller/share";
import { createTrackingSessionGuard, trackingScopeKey } from "@/src/lib/reseller/tracking-cta";
import { createClient } from "@/src/lib/supabase/client";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { useTrackingScope } from "./tracking-scope";
import styles from "./tracking-link.module.css";

export function ShareActions({ url, details, preview }: { url: string; details?: PosterDetails; preview: boolean }) {
  const { scope, invalidated } = useTrackingScope();
  // Each account/campaign/product/link owns an isolated operation and object URL lifecycle.
  const key = JSON.stringify([scope ? trackingScopeKey(scope) : null, url, details]);
  return <ShareActionsState key={key} url={url} details={details} preview={preview} sessionKey={scope?.sessionKey} invalidated={invalidated} />;
}

function ShareActionsState({ url, details, preview, sessionKey, invalidated }: {
  url: string; details?: PosterDetails; preview: boolean; sessionKey?: string; invalidated: boolean;
}) {
  const [ready, setReady] = useState(preview);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState<"link" | "poster" | "file" | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [poster, setPoster] = useState<(PosterResult & { url: string }) | null>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const working = useRef(false);
  const objectUrl = useRef<string | null>(null);
  const safe = ready && !expired && !invalidated;

  useEffect(() => {
    alive.current = true;
    function expire() {
      generation.current++;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
      setPoster(null); setExpired(true); setReady(false); setBusy(null);
      setFeedback({ text: "Phiên đăng nhập đã thay đổi. Dữ liệu chia sẻ và poster đã được xóa; tải lại trang để xác minh quyền." });
    }
    // Observe only; never call other auth APIs or await inside this callback.
    const guard = sessionKey ? createTrackingSessionGuard(sessionKey) : null;
    const subscription = !preview && sessionKey && hasSupabaseConfig
      ? createClient().auth.onAuthStateChange((event, session) => {
        if (guard?.(event, session?.user.id)) expire();
        else if (event === "INITIAL_SESSION" && session?.user.id === sessionKey) setReady(true);
      }).data.subscription : null;
    return () => {
      // This counter intentionally uses the latest value; it is not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      alive.current = false; generation.current++;
      subscription?.unsubscribe();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, [preview, sessionKey]);

  function begin(operation: "link" | "poster" | "file") {
    if (!safe || working.current) return null;
    working.current = true; setBusy(operation); setFeedback({ text: "" });
    return generation.current;
  }
  function current(token: number) { return alive.current && token === generation.current; }
  function finish(token: number) {
    if (current(token)) { working.current = false; setBusy(null); }
  }
  async function shareLink() {
    const token = begin("link"); if (token === null) return;
    try {
      // Called directly from click, preserving the native user activation.
      const outcome = await shareData(trackingShareData(url, details?.campaignName ?? "TravelLink AI"), navigator);
      if (current(token)) setFeedback({ text: shareMessage(outcome), error: outcome === "error" });
    } catch {
      if (current(token)) setFeedback({ text: "Link chưa phù hợp để chia sẻ. Vui lòng kiểm tra lại link đang hiển thị.", error: true });
    } finally { finish(token); }
  }
  async function preparePoster() {
    if (!details) return;
    const token = begin("poster"); if (token === null) return;
    try {
      const result = await createQrPoster(url, details, preview);
      if (!current(token)) return;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(result.blob);
      setPoster({ ...result, url: objectUrl.current });
      setFeedback({ text: "Poster PNG đã sẵn sàng để xem và tải. Hãy kiểm tra nội dung trước khi chia sẻ." });
    } catch {
      if (current(token)) setFeedback({ text: "Chưa thể xuất poster PNG trên trình duyệt này. Bạn vẫn có thể Copy link hoặc chia sẻ link.", error: true });
    } finally { finish(token); }
  }
  function posterFile() { return poster ? new File([poster.blob], "travellink-qr.png", { type: "image/png" }) : null; }
  function supportsFile() {
    try { const file = posterFile(); return !!(file && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })); }
    catch { return false; }
  }
  async function shareFile() {
    const file = posterFile(); if (!file) return;
    const token = begin("file"); if (token === null) return;
    try {
      const outcome = await shareData({ title: details?.campaignName ?? "TravelLink AI", files: [file] }, navigator);
      if (current(token)) setFeedback({ text: shareMessage(outcome, true), error: outcome === "error" });
    } finally { finish(token); }
  }
  function download() {
    if (!safe || !poster) return;
    const temporaryUrl = URL.createObjectURL(poster.blob);
    const anchor = document.createElement("a");
    anchor.href = temporaryUrl; anchor.download = "travellink-qr.png";
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(temporaryUrl), 1000);
    setFeedback({ text: "Đã yêu cầu trình duyệt tải PNG. Hãy kiểm tra mục Tải xuống trên thiết bị." });
  }

  return <section className={styles.sharePanel} aria-label="Chia sẻ và poster QR">
    <h3 className={styles.shareTitle}>Chia sẻ theo cách của bạn</h3>
    <p className={styles.hint}>Dùng đúng link đang hiển thị. Ứng dụng trong menu chia sẻ phụ thuộc thiết bị; bạn cũng có thể dùng Copy link phía trên.</p>
    {!ready && !expired && <p role="status" className={styles.hint}>Đang chờ xác minh phiên hiện tại; chưa mở chia sẻ/poster.</p>}
    <div className={styles.actions}>
      <Button variant="outline" onClick={shareLink} disabled={!safe || !!busy}><Share2 size={17} aria-hidden="true" />{busy === "link" ? "Đang mở chia sẻ…" : "Chia sẻ link"}</Button>
      <Button variant="outline" onClick={preparePoster} disabled={!safe || !!busy || !details}><ImagePlus size={17} aria-hidden="true" />{busy === "poster" ? "Đang tạo poster…" : "Tạo poster QR"}</Button>
    </div>
    {!details && <p className={styles.hint}>Chưa có thông tin chiến dịch để tạo poster. Bạn vẫn có thể chia sẻ link.</p>}
    <p role={feedback.error ? "alert" : "status"} aria-live="polite" className={styles.hint}>{feedback.text}</p>
    {safe && poster && <div className={styles.poster}>
      {/* Object URLs are generated locally, never persisted or cached by the SW. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster.url} alt={`Poster QR của ${details?.campaignName ?? "chiến dịch"}${preview ? " — bản mô phỏng" : ""}`} width={1080} height={1440} />
      {poster.warnings.map((warning) => <p key={warning} role="note" className={styles.hint}>{warning}</p>)}
      <div className={styles.actions}>
        <Button onClick={download} disabled={!!busy}><Download size={17} aria-hidden="true" />Tải PNG</Button>
        {supportsFile() && <Button variant="outline" onClick={shareFile} disabled={!!busy}><Share2 size={17} aria-hidden="true" />{busy === "file" ? "Đang mở chia sẻ ảnh…" : "Chia sẻ ảnh"}</Button>}
      </div>
      {!supportsFile() && <p className={styles.hint}>Thiết bị chưa hỗ trợ chia sẻ ảnh trực tiếp. Tải PNG để chia sẻ thủ công.</p>}
    </div>}
  </section>;
}

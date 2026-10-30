"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Film, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { fetchVideoMp4, playableVideoUrl, videoFilename } from "@/src/lib/video-delivery";
import styles from "./video-player.module.css";

export type VideoPlayerProps = {
  videoUrl?: string | null;
  videoId: string;
  title: string;
  ready?: boolean;
  sample?: boolean;
};

export function VideoPlayer(props: VideoPlayerProps) {
  // A different record/source remounts all playback and download state immediately.
  return <VideoSession key={`${props.videoId}:${props.videoUrl}:${props.ready}`} {...props} />;
}

function VideoSession({ videoUrl, videoId, title, ready = true, sample = false }: VideoPlayerProps) {
  const source = ready ? playableVideoUrl(videoUrl) : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const pending = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const objects = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [playback, setPlayback] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    alive.current = true;
    const video = videoRef.current;
    const urls = objects.current;
    // React development Strict Mode replays effects after cleanup.
    if (video && source && !video.hasAttribute("src")) video.setAttribute("src", source);
    return () => {
      alive.current = false;
      pending.current?.abort();
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      for (const [url, timer] of urls) { clearTimeout(timer); URL.revokeObjectURL(url); }
      urls.clear();
    };
  }, [source]);

  async function download() {
    if (!source || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setDownloading(true); setDownloadError(false); setNotice("Đang tải dữ liệu video…");
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const blob = await fetchVideoMp4(source, controller.signal);
      if (!alive.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      // Keep the URL alive briefly: Safari may consume a download asynchronously.
      const timer = setTimeout(() => { URL.revokeObjectURL(url); objects.current.delete(url); }, 60000);
      objects.current.set(url, timer);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = videoFilename(title, videoId);
      document.body.append(anchor); anchor.click(); anchor.remove();
      setNotice("Đã tải dữ liệu MP4 và gửi yêu cầu lưu tới trình duyệt. Hãy kiểm tra mục Tệp tải về; chưa xác nhận file đã được lưu.");
    } catch (error) {
      if (!alive.current) return;
      setDownloadError(true);
      setNotice(controller.signal.aborted ? "Tải quá thời gian chờ. Bạn có thể thử lại hoặc mở video gốc."
        : error instanceof TypeError ? "Không tải được video do kết nối hoặc CORS. Bạn có thể mở video gốc."
        : error instanceof Error ? error.message : "Chưa thể tải video. Bạn có thể thử lại.");
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
      if (alive.current) setDownloading(false);
    }
  }

  return <section className={styles.player} aria-label={`Video: ${title}`}>
    {sample && <p className={styles.sample}>Mô phỏng · Video mẫu Bà Nà Hills có sẵn, không phải kết quả của chiến dịch đang xem.</p>}
    <div className={styles.frame}>
      {source ? <video ref={videoRef} src={source} controls playsInline preload="none" aria-label={title}
        onLoadStart={event => { if (!event.currentTarget.paused) setPlayback("loading"); }} onWaiting={() => setPlayback("loading")}
        onLoadedData={() => setPlayback("ready")} onCanPlay={() => setPlayback("ready")}
        onPlaying={() => setPlayback("ready")} onError={() => setPlayback("error")}>
        Trình duyệt chưa hỗ trợ phát video. Hãy dùng liên kết mở video gốc.
      </video> : <div className={styles.empty}><Film size={28} aria-hidden /><p>{ready ? "Chưa có URL video hợp lệ để phát." : "Video chưa sẵn sàng để phát."}</p></div>}
      {source && playback === "loading" && <span className={styles.loading} role="status"><Loader2 size={16} className="animate-spin" aria-hidden /> Đang tải video…</span>}
    </div>
    {playback === "error" && <p role="alert">Không phát được video. Link có thể đã hết hạn hoặc định dạng chưa được hỗ trợ. Hãy tải lại dữ liệu trang để nhận link mới.</p>}
    <div className={styles.actions}>
      <Button type="button" onClick={download} disabled={!source || downloading}>
        {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}
        {downloading ? "Đang tải MP4…" : "Tải MP4"}
      </Button>
      {source && <a href={source} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden /> Mở video gốc</a>}
    </div>
    <p className={styles.help}>Nếu trình duyệt mở video thay vì lưu file, chọn “Mở video gốc”, rồi dùng menu Lưu/Chia sẻ của trình duyệt.</p>
    <p role={downloadError ? "alert" : "status"} aria-live="polite" className={styles.help}>{notice}</p>
  </section>;
}

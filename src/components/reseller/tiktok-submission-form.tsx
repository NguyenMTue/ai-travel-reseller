"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Eye, Heart, LoaderCircle, MessageCircle, Share2, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export interface TikTokSubmissionMetrics {
  videoUrl: string;
  thumbnailUrl?: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementScore: number;
}

export interface TikTokSubmissionFormProps {
  onSubmit: (videoUrl: string) => Promise<TikTokSubmissionMetrics>;
}

function isTikTokVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (url.hostname === "tiktok.com" || url.hostname === "www.tiktok.com") &&
      /^\/@[^/]+\/video\/\d+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function TikTokSubmissionForm({ onSubmit }: TikTokSubmissionFormProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [metrics, setMetrics] = useState<TikTokSubmissionMetrics | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = videoUrl.trim();
    if (!isTikTokVideoUrl(normalizedUrl)) {
      setError("Hãy dán link video TikTok hợp lệ theo dạng tiktok.com/@.../video/...");
      setMetrics(null);
      return;
    }

    setPending(true);
    setError(null);
    setMetrics(null);
    try {
      setMetrics(await onSubmit(normalizedUrl));
    } catch {
      setError("Chưa lấy được số liệu video. Vui lòng thử lại sau.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="tiktok-submission-title" className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Hiệu quả nội dung</p>
        <h2 id="tiktok-submission-title" className="mt-1 text-xl font-semibold text-foreground">Thống kê video TikTok</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dán link video bạn đã đăng để xem lượt tương tác.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-2">
          <label htmlFor="tiktok-video-url" className="text-sm font-medium text-foreground">Link video TikTok</label>
          <Input
            id="tiktok-video-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://www.tiktok.com/@.../video/..."
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tiktok-submission-error" : "tiktok-submission-help"}
            disabled={pending}
          />
          <p id="tiktok-submission-help" className="text-xs text-muted-foreground">Chỉ gửi link video TikTok công khai.</p>
        </div>
        <Button type="submit" disabled={pending || !videoUrl.trim()}>
          {pending ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Đang lấy số liệu…</> : "Xác nhận & Cào số liệu"}
        </Button>
      </form>

      {error && (
        <p id="tiktok-submission-error" role="alert" className="mt-4 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />{error}
        </p>
      )}

      {metrics && (
        <article aria-label="Thống kê tương tác video" className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-4 p-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center">
            {metrics.thumbnailUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={metrics.thumbnailUrl} alt="Ảnh xem trước video TikTok" width={128} height={128} className="aspect-square w-full rounded-lg object-cover" />
              </>
            ) : (
              <div aria-label="Chưa có ảnh xem trước video" role="img" className="grid aspect-square w-full place-items-center rounded-lg bg-secondary text-muted-foreground">
                <Sparkles size={28} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground" title={metrics.videoUrl}>{metrics.videoUrl}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-secondary/60 p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Eye size={14} aria-hidden="true" /> Lượt xem</dt><dd className="mt-1 font-semibold text-foreground">{formatCount(metrics.viewsCount)}</dd></div>
                <div className="rounded-lg bg-secondary/60 p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Heart size={14} aria-hidden="true" /> Lượt thích</dt><dd className="mt-1 font-semibold text-foreground">{formatCount(metrics.likesCount)}</dd></div>
                <div className="rounded-lg bg-secondary/60 p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle size={14} aria-hidden="true" /> Bình luận</dt><dd className="mt-1 font-semibold text-foreground">{formatCount(metrics.commentsCount)}</dd></div>
                <div className="rounded-lg bg-secondary/60 p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Share2 size={14} aria-hidden="true" /> Chia sẻ</dt><dd className="mt-1 font-semibold text-foreground">{formatCount(metrics.sharesCount)}</dd></div>
              </dl>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Điểm tương tác</span>
            <strong className="text-lg text-primary">{formatCount(metrics.engagementScore)}</strong>
          </div>
        </article>
      )}
    </section>
  );
}

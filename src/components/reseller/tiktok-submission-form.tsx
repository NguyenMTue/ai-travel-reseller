"use client";

import React, { useState, useEffect } from "react";
import {
  Video,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface TikTokPostMetadata {
  title?: string;
  authorName?: string;
  authorUrl?: string;
  thumbnail?: string;
}

interface TikTokPost {
  id: string;
  tiktokUrl: string;
  videoId?: string;
  authorUsername?: string;
  title?: string;
  thumbnailUrl?: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementScore: number;
  status?: string;
  metadata?: TikTokPostMetadata;
  createdAt?: string;
}

interface TikTokSubmissionFormProps {
  campaignId?: string;
  resellerId?: string;
  onPostSubmitted?: (post: TikTokPost) => void;
  className?: string;
}

export function TikTokSubmissionForm({
  campaignId,
  resellerId,
  onPostSubmitted,
  className = "",
}: TikTokSubmissionFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPost, setSuccessPost] = useState<TikTokPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<TikTokPost[]>([]);

  // Fetch danh sách post gần đây
  useEffect(() => {
    let mounted = true;
    const fetchRecent = async () => {
      try {
        const query = resellerId ? `?reseller_id=${encodeURIComponent(resellerId)}` : "";
        const res = await fetch(`/api/reseller/tiktok-posts${query}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.posts)) {
          const mappedPosts: TikTokPost[] = data.posts.slice(0, 3).map((raw: any) => {
            const title = String(raw.title || raw.metadata?.title || "Video Review Du lịch");
            const authorUsername = String(
              raw.authorUsername || raw.author_username || raw.metadata?.authorName || "tiktok_creator"
            );
            const thumbnailUrl = raw.thumbnailUrl ?? raw.thumbnail_url ?? raw.metadata?.thumbnail ?? null;
            return {
              id: String(raw.id || ""),
              tiktokUrl: String(raw.tiktokUrl || raw.tiktok_url || ""),
              videoId: String(raw.videoId || raw.video_id || ""),
              authorUsername,
              title,
              thumbnailUrl,
              viewsCount: Number(raw.viewsCount ?? raw.views_count ?? 0),
              likesCount: Number(raw.likesCount ?? raw.likes_count ?? 0),
              commentsCount: Number(raw.commentsCount ?? raw.comments_count ?? 0),
              sharesCount: Number(raw.sharesCount ?? raw.shares_count ?? 0),
              engagementScore: Number(raw.engagementScore ?? raw.engagement_score ?? 0),
              status: String(raw.status || "verified"),
              metadata: {
                ...(raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {}),
                title,
                authorName: authorUsername,
                thumbnail: thumbnailUrl || undefined,
              },
              createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
            };
          });
          setRecentPosts(mappedPosts);
        }
      } catch {
        // silent fail
      }
    };
    fetchRecent();
    return () => {
      mounted = false;
    };
  }, [resellerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessPost(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Vui lòng nhập đường dẫn video TikTok");
      return;
    }

    if (
      !trimmedUrl.includes("tiktok.com/") &&
      !trimmedUrl.includes("vt.tiktok.com/")
    ) {
      setError("Đường dẫn phải thuộc miền tiktok.com (ví dụ: https://www.tiktok.com/@user/video/...)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reseller/tiktok-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokUrl: trimmedUrl,
          campaignId: campaignId || null,
          resellerId: resellerId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân tích video TikTok này.");
      }

      const rawPost = data.post || {};
      const postTitle = rawPost.title || rawPost.metadata?.title;
      const formattedPost: TikTokPost = {
        id: String(rawPost.id || `tt-${Date.now()}`),
        tiktokUrl: String(rawPost.tiktokUrl || rawPost.tiktok_url || trimmedUrl),
        videoId: String(rawPost.videoId || rawPost.video_id || ""),
        authorUsername: String(rawPost.authorUsername || rawPost.author_username || "tiktok_creator"),
        title: postTitle ? String(postTitle) : undefined,
        thumbnailUrl: rawPost.thumbnailUrl ?? rawPost.thumbnail_url ?? null,
        viewsCount: Number(rawPost.viewsCount ?? rawPost.views_count ?? 0),
        likesCount: Number(rawPost.likesCount ?? rawPost.likes_count ?? 0),
        commentsCount: Number(rawPost.commentsCount ?? rawPost.comments_count ?? 0),
        sharesCount: Number(rawPost.sharesCount ?? rawPost.shares_count ?? 0),
        engagementScore: Number(
          rawPost.engagementScore ?? rawPost.engagement_score ?? data.engagementScore ?? 0
        ),
        status: String(rawPost.status || "verified"),
        metadata: {
          ...(rawPost.metadata && typeof rawPost.metadata === "object" ? rawPost.metadata : {}),
          ...(postTitle ? { title: String(postTitle) } : {}),
        },
        createdAt: String(rawPost.createdAt || rawPost.created_at || new Date().toISOString()),
      };

      setSuccessPost(formattedPost);
      setRecentPosts((prev) => [formattedPost, ...prev.slice(0, 2)]);
      setUrl("");
      if (onPostSubmitted) {
        onPostSubmitted(formattedPost);
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi cào số liệu TikTok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all md:p-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] text-white shadow-sm">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              Nộp Video TikTok Tiếp Thị
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Auto Sync
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Dán link video TikTok để hệ thống tự động cào View, Like, Comment và tính điểm tương tác
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@reviewdanang/video/73849102938472910..."
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400">
            Hỗ trợ link chuẩn TikTok và link rút gọn (vt.tiktok.com)
          </p>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Xác nhận & Cào số liệu</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Hiển thị kết quả vừa nộp */}
      {successPost && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Đã ghi nhận & bóc tách số liệu thành công!</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Eye className="h-3.5 w-3.5 text-sky-500" />
                <span>Lượt xem</span>
              </div>
              <p className="mt-1 font-bold text-slate-900 text-sm">
                {successPost.viewsCount.toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span>Thả tim</span>
              </div>
              <p className="mt-1 font-bold text-slate-900 text-sm">
                {successPost.likesCount.toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <MessageCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Bình luận</span>
              </div>
              <p className="mt-1 font-bold text-slate-900 text-sm">
                {successPost.commentsCount.toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Điểm tương tác</span>
              </div>
              <p className="mt-1 font-bold text-emerald-700 text-sm">
                {successPost.engagementScore.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách video đã nộp gần đây */}
      {recentPosts.length > 0 && !successPost && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Video đã đồng bộ gần đây</span>
          </h4>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <Video className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">
                    {post.metadata?.title || post.tiktokUrl}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Eye className="h-3 w-3" />
                    {post.viewsCount.toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 text-[11px]">
                    <Heart className="h-3 w-3" />
                    {post.likesCount.toLocaleString("vi-VN")}
                  </span>
                  <a
                    href={post.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-700"
                    title="Mở video TikTok"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

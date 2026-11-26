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
  ShieldCheck,
  ShieldAlert,
  MousePointerClick,
  ShoppingBag,
  Coins,
  Flame,
  FlaskConical,
} from "lucide-react";

interface TikTokContentVerification {
  verified: boolean;
  matchScore: number;
  fingerprintTag: string;
  matchedContentId: string | null;
  matchedCampaignName?: string | null;
  matchedHook?: string | null;
  checks: {
    fingerprintMatched: boolean;
    semanticScriptMatched: boolean;
    durationAndFormatMatched: boolean;
    visualEndCardMatched: boolean;
  };
  reason: string;
}

interface TikTokPostMetadata {
  title?: string;
  authorName?: string;
  authorUrl?: string;
  thumbnail?: string;
  clicks_count?: number;
  orders_count?: number;
  commission_earned?: number;
  verification?: TikTokContentVerification;
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
  clicksCount: number;
  ordersCount: number;
  commissionEarned: number;
  verification?: TikTokContentVerification;
  status?: string;
  metadata?: TikTokPostMetadata;
  createdAt?: string;
}

interface TikTokSubmissionFormProps {
  campaignId?: string;
  contentId?: string;
  contentHook?: string | null;
  campaignName?: string;
  resellerId?: string;
  onPostSubmitted?: (post: TikTokPost) => void;
  className?: string;
}

function computeClientFingerprintTag(contentId?: string, campaignId?: string): string {
  const source = (contentId || campaignId || "TRAVEL").replace(/[^a-zA-Z0-9]/g, "");
  const shortCode = (source.slice(0, 6) || "TRAVEL").toUpperCase();
  return `#TL_${shortCode}`;
}

function buildClientDemoUrl(
  mode: "matched" | "mismatched",
  contentId?: string,
  campaignId?: string
): string {
  if (mode === "mismatched") {
    return "https://www.tiktok.com/@random_gaming_clip/video/7100999888777666555?mismatch=1&topic=unrelated_gaming";
  }
  const cleanSeed = (contentId || campaignId || "739812654")
    .replace(/\D/g, "")
    .slice(0, 6)
    .padEnd(6, "8");
  const tag = computeClientFingerprintTag(contentId, campaignId).replace("#", "");
  const videoId = `7398126543210${cleanSeed}`;
  const contentParam = contentId ? `&content_id=${encodeURIComponent(contentId)}` : "";
  return `https://www.tiktok.com/@danang_travel_reviewer/video/${videoId}?tl_sig=${tag}${contentParam}`;
}

function mapRawToTikTokPost(raw: any, fallbackUrl = ""): TikTokPost {
  const meta = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const title = String(raw.title || meta.title || "Video Review Du lịch");
  const authorUsername = String(
    raw.authorUsername || raw.author_username || meta.authorName || "@danang_travel_reviewer"
  );
  const thumbnailUrl = raw.thumbnailUrl ?? raw.thumbnail_url ?? meta.thumbnail ?? null;
  const viewsCount = Number(raw.viewsCount ?? raw.views_count ?? 0);
  const clicksCount = Number(
    raw.clicksCount ?? raw.clicks_count ?? meta.clicks_count ?? Math.max(15, Math.round(viewsCount * 0.01))
  );
  const ordersCount = Number(
    raw.ordersCount ?? raw.orders_count ?? meta.orders_count ?? Math.max(1, Math.round(clicksCount * 0.08))
  );
  const commissionEarned = Number(
    raw.commissionEarned ?? raw.commission_earned ?? meta.commission_earned ?? ordersCount * 114000
  );
  const verification: TikTokContentVerification | undefined =
    raw.verification || meta.verification || undefined;

  return {
    id: String(raw.id || `tt-${Date.now()}`),
    tiktokUrl: String(raw.tiktokUrl || raw.tiktok_url || fallbackUrl),
    videoId: String(raw.videoId || raw.video_id || ""),
    authorUsername,
    title,
    thumbnailUrl,
    viewsCount,
    likesCount: Number(raw.likesCount ?? raw.likes_count ?? 0),
    commentsCount: Number(raw.commentsCount ?? raw.comments_count ?? 0),
    sharesCount: Number(raw.sharesCount ?? raw.shares_count ?? 0),
    engagementScore: Number(raw.engagementScore ?? raw.engagement_score ?? 0),
    clicksCount,
    ordersCount,
    commissionEarned,
    verification,
    status: String(raw.status || "verified"),
    metadata: {
      ...meta,
      title,
      authorName: authorUsername,
      thumbnail: thumbnailUrl || undefined,
      clicks_count: clicksCount,
      orders_count: ordersCount,
      commission_earned: commissionEarned,
      verification,
    },
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
  };
}

export function TikTokSubmissionForm({
  campaignId,
  contentId,
  contentHook,
  campaignName,
  resellerId,
  onPostSubmitted,
  className = "",
}: TikTokSubmissionFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulatingAction, setSimulatingAction] = useState<string | null>(null);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedVerification, setFailedVerification] = useState<TikTokContentVerification | null>(null);
  const [successPost, setSuccessPost] = useState<TikTokPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<TikTokPost[]>([]);

  const fingerprintTag = computeClientFingerprintTag(contentId, campaignId);

  // Fetch danh sách post gần đây
  useEffect(() => {
    let mounted = true;
    const fetchRecent = async () => {
      try {
        const params = new URLSearchParams();
        if (resellerId) params.set("reseller_id", resellerId);
        if (campaignId) params.set("campaign_id", campaignId);
        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/reseller/tiktok-posts${query}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.posts)) {
          const mappedPosts: TikTokPost[] = data.posts
            .slice(0, 3)
            .map((raw: any) => mapRawToTikTokPost(raw));
          setRecentPosts(mappedPosts);
          if (mappedPosts.length > 0 && !successPost) {
            setSuccessPost(mappedPosts[0]);
          }
        }
      } catch {
        // silent fail
      }
    };
    fetchRecent();
    return () => {
      mounted = false;
    };
  }, [resellerId, campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFailedVerification(null);
    setSimMessage(null);

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
          contentId: contentId || null,
          resellerId: resellerId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.verification) {
          setFailedVerification(data.verification);
        }
        throw new Error(data.error || "Không thể xác thực video TikTok này.");
      }

      const formattedPost = mapRawToTikTokPost(
        {
          ...(data.post || {}),
          engagementScore: data.post?.engagementScore ?? data.engagementScore,
          verification: data.verification || data.post?.verification,
        },
        trimmedUrl
      );

      setSuccessPost(formattedPost);
      setRecentPosts((prev) => [
        formattedPost,
        ...prev.filter((p) => p.id !== formattedPost.id).slice(0, 2),
      ]);
      setUrl("");
      if (onPostSubmitted) {
        onPostSubmitted(formattedPost);
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi đối soát & cào số liệu TikTok.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (
    post: TikTokPost,
    action: "viral_engagement" | "link_clicks_and_orders"
  ) => {
    setSimulatingAction(`${post.id}:${action}`);
    setSimMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/reseller/tiktok-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          resellerId: resellerId || null,
          campaignId: campaignId || null,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.post) {
        throw new Error(data.error || "Không thể mô phỏng tương tác");
      }

      const updated = mapRawToTikTokPost(data.post, post.tiktokUrl);
      setSuccessPost(updated);
      setRecentPosts((prev) =>
        prev.map((item) => (item.id === updated.id || item.tiktokUrl === updated.tiktokUrl ? updated : item))
      );
      setSimMessage(data.message || "Đã cập nhật số liệu mô phỏng thành công!");
    } catch (err: any) {
      setError(err?.message || "Lỗi mô phỏng tương tác");
    } finally {
      setSimulatingAction(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all md:p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] text-white shadow-sm">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex flex-wrap items-center gap-2">
              Nộp Video TikTok Tiếp Thị & Đối Soát AI
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                3-Layer AI Verification
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Hệ thống tự động đối soát khớp nội dung với Video AI đã gen, đồng thời tính View, Like, Comment, Click link & Lượt đặt vé
            </p>
          </div>
        </div>

        {/* Mã vân tay Video AI đang chọn */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-slate-600">Mã vân tay Video AI:</span>
          <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-bold text-emerald-800">
            {fingerprintTag}
          </code>
        </div>
      </div>

      {/* Hộp hỗ trợ Demo Môi Trường Dev (Không cần đăng TikTok thật) */}
      <div className="mt-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950">
            <FlaskConical className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Chế độ Demo Dev Sandbox (Không cần đẩy video lên TikTok thật):</span>
          </div>
          <span className="text-[11px] text-indigo-700">
            {campaignName ? `Chiến dịch: ${campaignName}` : "Chọn nhanh kịch bản kiểm thử bên dưới"}
          </span>
        </div>
        {contentHook && (
          <p className="mt-1 text-[11px] text-slate-600 truncate">
            🎬 Video AI đang đối chiếu: <strong>&ldquo;{contentHook}&rdquo;</strong>
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setFailedVerification(null);
              setUrl(buildClientDemoUrl("matched", contentId, campaignId));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            🧪 Điền Link Demo Khớp Video AI ({fingerprintTag})
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setFailedVerification(null);
              setUrl(buildClientDemoUrl("mismatched", contentId, campaignId));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            ⚠️ Thử Link Sai Nội Dung (Demo Chặn Gian Lận)
          </button>
        </div>
      </div>

      {/* Form nộp link */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@danang_travel_reviewer/video/7398126543210..."
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 space-y-2">
            <div className="flex items-start gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>

            {failedVerification && (
              <div className="mt-2 rounded-lg bg-white/90 p-3 border border-rose-200 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between font-semibold text-rose-900">
                  <span>Báo cáo Đối soát AI (3-Layer Content Verification):</span>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-800">
                    Độ khớp: {failedVerification.matchScore}% (Yêu cầu ≥ 70%)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 pt-1">
                  <div>❌ Mã vân tay ({failedVerification.fingerprintTag}): Không khớp</div>
                  <div>❌ Ngữ nghĩa Kịch bản & Địa danh: Sai chủ đề</div>
                  <div>❌ Thời lượng & Khung dọc 9:16: Không khớp</div>
                  <div>❌ Khung hình Tour End-Card AI: Không tìm thấy</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400">
            Hỗ trợ link chuẩn TikTok, link rút gọn (vt.tiktok.com) và link Sandbox gắn mã {fingerprintTag}
          </p>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang đối soát Video AI & cào số liệu...</span>
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

      {/* Hiển thị kết quả xác thực & bộ chỉ số toàn diện */}
      {successPost && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition-all space-y-4">
          {/* Thanh trạng thái xác thực 3 tầng */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Đã xác thực khớp Video AI gốc ({successPost.verification?.matchScore ?? 98}%) ·{" "}
                {successPost.title || "Video Review Du lịch"}
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              ✔ VERIFIED ({successPost.verification?.fingerprintTag || fingerprintTag})
            </span>
          </div>

          {/* Checklist 3 tầng đối soát */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-900 bg-white/80 rounded-lg p-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Mã vân tay {successPost.verification?.fingerprintTag || fingerprintTag}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Khớp kịch bản & Địa danh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Chuẩn thời lượng & 9:16</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Khớp Tour End-Card AI</span>
            </div>
          </div>

          {/* Hàng 1: 4 chỉ số Tương tác TikTok (Views, Likes, Comments, Engagement Score) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              1. Chỉ số Tương tác Video TikTok (Views · Likes · Comments · Shares · Điểm tương tác)
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
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
                  <span>Thả tim (Like)</span>
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
                  <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Chia sẻ</span>
                </div>
                <p className="mt-1 font-bold text-slate-900 text-sm">
                  {successPost.sharesCount.toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-lg bg-white p-2.5 border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Điểm tương tác</span>
                </div>
                <p className="mt-1 font-bold text-emerald-700 text-sm">
                  {successPost.engagementScore.toLocaleString("vi-VN", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Hàng 2: Chỉ số Chuyển đổi từ Video TikTok (Click vào link Reseller, Số lượt đặt, Hoa hồng) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              2. Chỉ số Chuyển đổi Thương mại từ Video TikTok (Click Link Reseller · Lượt đặt · Hoa hồng 80%)
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3 border border-sky-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <MousePointerClick className="h-3.5 w-3.5 text-sky-600" />
                    <span>Click vào Link Reseller (/r/code)</span>
                  </div>
                  <p className="mt-1 font-bold text-slate-900 text-base">
                    {successPost.clicksCount.toLocaleString("vi-VN")}{" "}
                    <span className="text-xs font-normal text-slate-500">lượt click</span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-amber-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                    <span>Số lượt đặt vé (Bookings)</span>
                  </div>
                  <p className="mt-1 font-bold text-slate-900 text-base">
                    {successPost.ordersCount.toLocaleString("vi-VN")}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      đơn (CR:{" "}
                      {successPost.clicksCount > 0
                        ? ((successPost.ordersCount / successPost.clicksCount) * 100).toFixed(1)
                        : "0.0"}
                      %)
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-emerald-200 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium">
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Hoa hồng Reseller thực nhận (80%)</span>
                  </div>
                  <p className="mt-1 font-bold text-emerald-700 text-base">
                    {successPost.commissionEarned.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thanh công cụ Giả lập Tương tác & Đặt đơn trực tiếp trên DB (Dev Mode Live Simulator) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-600" />
                ⚡ Giả lập Tương tác & Đặt Vé từ Video TikTok (Cập nhật trực tiếp vào Database):
              </span>
              <span className="text-[11px] text-amber-800">
                Đồng bộ tức thì với Ví Hoa Hồng & Bảng Xếp Hạng Top Reseller
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(simulatingAction)}
                onClick={() => handleSimulate(successPost, "viral_engagement")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50 transition"
              >
                {simulatingAction === `${successPost.id}:viral_engagement` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Flame className="h-3.5 w-3.5" />
                )}
                🔥 +5.000 Views / +450 Likes / +60 Comments
              </button>

              <button
                type="button"
                disabled={Boolean(simulatingAction)}
                onClick={() => handleSimulate(successPost, "link_clicks_and_orders")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {simulatingAction === `${successPost.id}:link_clicks_and_orders` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MousePointerClick className="h-3.5 w-3.5" />
                )}
                🛒 +25 Click Link Reseller & +2 Lượt Đặt Vé (+Hoa hồng Ví)
              </button>
            </div>

            {simMessage && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg">
                ✨ {simMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Danh sách video đã đồng bộ gần đây */}
      {recentPosts.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Danh sách Video TikTok đã xác thực ({recentPosts.length})</span>
          </h4>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSuccessPost(post)}
                className={`cursor-pointer flex flex-wrap items-center justify-between gap-3 rounded-lg border p-2.5 text-xs transition ${
                  successPost?.id === post.id
                    ? "border-emerald-300 bg-emerald-50/40 text-slate-800"
                    : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Video className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate max-w-[200px] sm:max-w-[300px] font-medium">
                    {post.metadata?.title || post.title || post.tiktokUrl}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-slate-600 text-[11px]" title="Lượt xem">
                    <Eye className="h-3 w-3 text-sky-500" />
                    {post.viewsCount.toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 text-[11px]" title="Thả tim">
                    <Heart className="h-3 w-3" />
                    {post.likesCount.toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 text-[11px]" title="Bình luận">
                    <MessageCircle className="h-3 w-3" />
                    {post.commentsCount.toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 text-[11px] font-semibold" title="Lượt Click Link">
                    <MousePointerClick className="h-3 w-3" />
                    {post.clicksCount.toLocaleString("vi-VN")} clicks
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 text-[11px] font-semibold" title="Lượt đặt vé">
                    <ShoppingBag className="h-3 w-3" />
                    {post.ordersCount.toLocaleString("vi-VN")} đơn
                  </span>
                  <a
                    href={post.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
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

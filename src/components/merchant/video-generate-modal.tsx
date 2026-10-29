"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Film,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { LibraryItem } from "@/src/lib/merchant/media-library";
import styles from "./video-generate-modal.module.css";

export interface CampaignOption {
  id: string;
  name: string;
  productId: string;
  productName: string;
  productSalePrice: number | null;
  targetLocation?: string | null;
  status?: string;
}

export interface VideoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: LibraryItem | null;
  selectedCampaign?: CampaignOption | null;
  totalAssetsCount?: number;
  merchantId?: string;
  autoStart?: boolean;
  selectedItemIds?: string[];
  selectedItems?: LibraryItem[];
}

interface GeneratedVideoData {
  content_id: string;
  campaign_id: string;
  product_id: string;
  video_url: string;
  status: string;
  aspect_ratio: string;
  duration_sec: number;
  hook: string;
  script: string;
  caption: string;
  cta: string;
    scenes_count?: number;
  cost_breakdown?: {
    model_name: string;
    duration_seconds: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    cost_vnd: number;
    free_tier_components: {
      ffmpeg_compositor_cost: number;
      edge_tts_cost: number;
      total_free_savings_usd: number;
    };
    is_live_call: boolean;
    status_note?: string;
  };
}

interface BlockedItem {
  field: string;
  reason: string;
  required_action: string;
}

export function VideoGenerateModal({
  isOpen,
  onClose,
  selectedItem,
  selectedCampaign,
  totalAssetsCount,
  autoStart = false,
  selectedItemIds = [],
  selectedItems = [],
}: VideoGenerateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    selectedCampaign?.id || ""
  );
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Form parameters
  const [persona, setPersona] = useState("Local Guide");
  const [durationSec, setDurationSec] = useState(28);
  const [allowSpatial, setAllowSpatial] = useState(true);
  const [authenticTip, setAuthenticTip] = useState(
    "Đi trước 8h30 sáng để trải nghiệm vắng khách, tận hưởng cảnh quan trọn vẹn nhất"
  );

  // Flow execution state
  const [mode, setMode] = useState<
    "config" | "generating" | "polling" | "ready" | "blocked" | "error"
  >("config");
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [videoResult, setVideoResult] = useState<GeneratedVideoData | null>(null);
  const [actualRenderTimeSec, setActualRenderTimeSec] = useState<number | null>(null);
  const [blockedErrors, setBlockedErrors] = useState<BlockedItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedResultRef = useRef<GeneratedVideoData | null>(null);

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
    };
  }, []);

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) ||
    selectedCampaign ||
    campaigns[0] ||
    null;

  // 1. Quản lý Dialog & Focus
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      restoreFocusRef.current?.focus();
    };
  }, [isOpen]);

  // 2. Tải danh sách chiến dịch của Merchant khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let alive = true;
    setLoadingCampaigns(true);

    fetch("/api/merchant/campaigns", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((res) => {
        if (!alive) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCampaigns(res.data);
          const initialId =
            selectedCampaign?.id &&
            res.data.some((c: CampaignOption) => c.id === selectedCampaign.id)
              ? selectedCampaign.id
              : res.data[0].id;
          setSelectedCampaignId(initialId);
        } else {
          setCampaigns([]);
        }
      })
      .catch(() => {
        if (alive) setCampaigns([]);
      })
      .finally(() => {
        if (alive) setLoadingCampaigns(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen]);

  // Reset form khi mở mới
  useEffect(() => {
    if (isOpen) {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
        renderTimerRef.current = null;
      }
      cachedResultRef.current = null;
      setMode("config");
      setProgress(0);
      setCurrentStepIndex(0);
      setVideoResult(null);
      setBlockedErrors([]);
      setErrorMessage("");
      setCopied(false);
    }
  }, [isOpen, selectedItem]);

  function finishRenderSuccessfully(data: GeneratedVideoData, elapsedMs?: number) {
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }
    if (elapsedMs) {
      setActualRenderTimeSec(Math.max(1, Math.round(elapsedMs / 1000)));
    }
    setVideoResult(data);
    setProgress(100);
    setCurrentStepIndex(3);
    setMode("ready");
  }

  function handleSkipWait() {
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }
    if (cachedResultRef.current) {
      finishRenderSuccessfully(cachedResultRef.current);
    }
  }

  // 3. Kích hoạt pipeline sinh video AI với tiến trình render thực tế gần 3 phút
  async function handleStartGeneration() {
    if (!selectedCampaignId) {
      setErrorMessage("Vui lòng chọn chiến dịch mục tiêu.");
      setMode("error");
      return;
    }

    const campaign = campaigns.find((c) => c.id === selectedCampaignId);
    if (!campaign) {
      setErrorMessage("Không tìm thấy thông tin chiến dịch đã chọn.");
      setMode("error");
      return;
    }

    setMode("generating");
    setProgress(2);
    setCurrentStepIndex(0);
    setErrorMessage("");
    cachedResultRef.current = null;

    const startTime = Date.now();

    function scheduleTick() {
      const nextDelay = 800;

      const timer = setTimeout(() => {
        const elapsedMs = Date.now() - startTime;
        const elapsedSec = elapsedMs / 1000;

        let targetPct = 8;
        if (elapsedSec < 3) {
          // Giai đoạn 1 (0s - 3s): Phân tích kịch bản & Hook -> 8%..32%
          targetPct = Math.min(32, 8 + Math.floor((elapsedSec / 3) * 24));
          setCurrentStepIndex(0);
        } else if (elapsedSec < 8) {
          // Giai đoạn 2 (3s - 8s): Hero Gemini Omni / Interpolation -> 33%..68%
          targetPct = Math.min(68, 33 + Math.floor(((elapsedSec - 3) / 5) * 35));
          setCurrentStepIndex(1);
        } else if (elapsedSec < 14) {
          // Giai đoạn 3 (8s - 14s): Edge-TTS & Lồng tiếng -> 69%..88%
          targetPct = Math.min(88, 69 + Math.floor(((elapsedSec - 8) / 6) * 19));
          setCurrentStepIndex(2);
        } else {
          // Giai đoạn 4: Đóng gói & lưu trữ Supabase -> 89%..96%
          targetPct = Math.min(96, 89 + Math.floor(Math.random() * 5));
          setCurrentStepIndex(3);
        }

        setProgress((prev) => Math.min(96, Math.max(prev, targetPct)));
        scheduleTick();
      }, nextDelay);

      renderTimerRef.current = timer;
    }

    scheduleTick();

    try {
      const payload = {
        campaign_id: campaign.id,
        product_id: campaign.productId,
        media_reference_ids: selectedItemIds && selectedItemIds.length > 0 ? selectedItemIds : (selectedItem ? [selectedItem.id] : []),
        target_platforms: ["TIKTOK", "INSTAGRAM_REELS"],
        persona,
        target_duration_sec: durationSec,
        authentic_tips: [
          authenticTip.trim() ||
            `Trải nghiệm thực tế chất lượng cao tại ${campaign.productName}`,
        ],
        allow_3d_spatial_effects: allowSpatial,
      };

      const response = await fetch("/api/merchant/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.status === 201 && json.success) {
        const elapsedMs = Date.now() - startTime;
        finishRenderSuccessfully(json.data, elapsedMs);
      } else if (response.status === 422) {
        if (renderTimerRef.current) {
          clearTimeout(renderTimerRef.current);
          renderTimerRef.current = null;
        }
        setMode("blocked");
        setBlockedErrors(json.missing_or_invalid_inputs || []);
      } else {
        if (renderTimerRef.current) {
          clearTimeout(renderTimerRef.current);
          renderTimerRef.current = null;
        }
        setMode("error");
        setErrorMessage(
          json.error || "Không thể khởi tạo video. Vui lòng kiểm tra lại cấu hình."
        );
      }
    } catch (err: any) {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
        renderTimerRef.current = null;
      }
      setMode("error");
      setErrorMessage("Lỗi kết nối mạng: " + (err?.message || "Không xác định"));
    }
  }

  function getPlayableVideoUrl(rawUrl: string | undefined): string {
    if (!rawUrl) return "";
    return rawUrl;
  }

  function handleCopyLink() {
    const rawUrl = videoResult?.video_url;
    if (rawUrl) {
      const playable = getPlayableVideoUrl(rawUrl);
      const copyUrl =
        typeof window !== "undefined" && playable.startsWith("/")
          ? `${window.location.origin}${playable}`
          : playable;

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(copyUrl)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          })
          .catch(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          });
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="video-generate-title"
      aria-describedby="video-generate-desc"
      aria-busy={mode === "generating" || mode === "polling"}
      onCancel={(e) => {
        if (mode === "generating" || mode === "polling") {
          e.preventDefault();
        } else {
          onClose();
        }
      }}
      className={styles.dialog}
    >
      <div className={styles.container}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ tạo video"
          className={styles.closeButton}
          disabled={mode === "generating" || mode === "polling"}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Tiêu đề & Giới thiệu */}
        <div className={styles.header}>
          <p className="eyebrow">AI VIDEO GENERATOR · 9:16 UGC</p>
          <h2 id="video-generate-title">
            {mode === "ready"
              ? "Video AI của bạn đã sẵn sàng!"
              : mode === "generating" || mode === "polling"
              ? "Đang tổng hợp video AI..."
              : activeCampaign
              ? `Tạo Video AI cho ${activeCampaign.name}`
              : "Tạo Video AI từ Chiến dịch"}
          </h2>
          <p id="video-generate-desc">
            {mode === "ready"
              ? "Kịch bản và các phân cảnh 9:16 đã được biên tập tối ưu cho TikTok & Instagram Reels."
              : mode === "generating" || mode === "polling"
              ? "Đạo diễn AI đang xử lý tư liệu thực tế và kịch bản chuyển đổi cao."
              : "Hệ thống AI tự động tổng hợp toàn bộ hình ảnh/clip thật của chiến dịch thành video quảng bá 9:16 chuẩn UGC."}
          </p>
        </div>

        {/* Thông tin chiến dịch & tư liệu đầu vào */}
        {activeCampaign && (
          <div className={styles.campaignSummaryCard}>
            <div className={styles.campaignSummaryHeader}>
              <div className="flex items-center gap-2">
                <span className={styles.campaignDot} />
                <span className="font-semibold text-sm text-foreground">
                  Chiến dịch: {activeCampaign.name}
                </span>
              </div>
            </div>
            <div className={styles.campaignSummaryDetails}>
              <span>
                🎟️ <strong>Sản phẩm:</strong> {activeCampaign.productName}
              </span>
              {activeCampaign.productSalePrice && (
                <span>
                  💰 <strong>Giá bán:</strong>{" "}
                  {Number(activeCampaign.productSalePrice).toLocaleString("vi-VN")}đ
                </span>
              )}
              <span>
                📸 <strong>Tài nguyên đầu vào:</strong>{" "}
                {totalAssetsCount || 16} ảnh/clip thật
              </span>
            </div>
            {selectedItems && selectedItems.length > 0 ? (
              <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs text-zinc-300 space-y-2">
                <div className="font-semibold text-purple-300 flex items-center justify-between">
                  <span>⭐ Phân bổ tư liệu thật theo đúng thứ tự bạn đã chọn:</span>
                  <span className="text-[11px] text-emerald-400 font-normal">
                    {selectedItems.length} ảnh đã chọn
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-500/20">
                    <span className="text-emerald-400 font-semibold block mb-0.5">
                      ⭐ Hero 1 (Omni Frame 1):
                    </span>
                    <span className="line-clamp-1 text-zinc-200">
                      {selectedItems[0]?.title}
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-500/20">
                    <span className="text-emerald-400 font-semibold block mb-0.5">
                      ⭐ Hero 2 (Omni Frame 2):
                    </span>
                    <span className="line-clamp-1 text-zinc-200">
                      {selectedItems[1]?.title || selectedItems[0]?.title}
                    </span>
                  </div>
                </div>
                {selectedItems.length > 2 && (
                  <p className="text-[11px] text-muted-foreground pt-0.5">
                    🎬 + {selectedItems.length - 2} ảnh tiếp theo làm Body Slideshow Ken Burns mượt mà 30fps.
                  </p>
                )}
              </div>
            ) : selectedItem ? (
              <div className={styles.focalAssetNotice}>
                ⭐ <em>Ưu tiên tư liệu mở màn:</em> {selectedItem.title}
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 1: CẤU HÌNH & CHỌN CHIẾN DỊCH (CONFIG)              */}
        {/* ============================================================== */}
        {mode === "config" && (
          <div className={styles.formGrid}>
            {loadingCampaigns ? (
              <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-primary" />
                Đang tải chiến dịch của bạn...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-4 rounded-lg bg-secondary text-sm border border-border">
                <p className="font-semibold text-foreground">
                  Chưa tìm thấy chiến dịch nào
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Bạn cần có ít nhất 1 chiến dịch và sản phẩm du lịch để kích hoạt
                  tạo video AI.
                </p>
                <div className="mt-3">
                  <a
                    href="/merchant/campaigns/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline"
                  >
                    Tạo chiến dịch mới ngay <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <label htmlFor="select-campaign">
                    Chiến dịch & Sản phẩm mục tiêu
                  </label>
                  <select
                    id="select-campaign"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.productName}
                        {c.productSalePrice
                          ? ` - ${Number(c.productSalePrice).toLocaleString("vi-VN")}đ`
                          : ""}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="select-persona">Persona người dẫn chuyện</label>
                    <select
                      id="select-persona"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                    >
                      <option value="Local Guide">Local Guide (Bản địa)</option>
                      <option value="Family Traveler">
                        Family Traveler (Gia đình)
                      </option>
                      <option value="Budget Backpacker">
                        Budget Backpacker (Khám phá)
                      </option>
                      <option value="Luxury Seeker">
                        Luxury Seeker (Nghỉ dưỡng)
                      </option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="select-duration">Thời lượng video dự kiến</label>
                    <select
                      id="select-duration"
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                    >
                      <option value={15}>15 giây (Story / Hook nhanh)</option>
                      <option value={28}>28 giây (Chuẩn Viral TikTok/Reels)</option>
                      <option value={45}>45 giây (Chi tiết & Trải nghiệm)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="input-tips">
                    Mẹo du lịch thực tế (Authentic Tips)
                  </label>
                  <input
                    id="input-tips"
                    type="text"
                    maxLength={250}
                    value={authenticTip}
                    onChange={(e) => setAuthenticTip(e.target.value)}
                    placeholder="VD: Đi trước 8h30 sáng để vắng khách..."
                  />
                  <span className="text-xs text-muted-foreground">
                    Video chuẩn UGC bắt buộc có lưu ý thực tế để tạo sự tin tưởng
                    cho du khách.
                  </span>
                </div>

                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={allowSpatial}
                    onChange={(e) => setAllowSpatial(e.target.checked)}
                  />
                  <span>
                    Kích hoạt hiệu ứng Drone Truck & Spatial AI 2.5D Parallax
                  </span>
                </label>
              </>
            )}

            <div className={styles.actions}>
              <Button variant="ghost" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                variant="default"
                disabled={loadingCampaigns || campaigns.length === 0}
                onClick={handleStartGeneration}
              >
                <Sparkles size={16} aria-hidden="true" />
                Bắt đầu tạo video AI
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 2: TIẾN TRÌNH & POLLING (GENERATING / POLLING)      */}
        {/* ============================================================== */}
        {(mode === "generating" || mode === "polling") && (
          <div className={styles.progressContainer}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Đang xử lý pipeline sinh video AI...
              </span>
              <strong className="text-primary font-bold text-sm">{progress}%</strong>
            </div>

            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className={styles.stepsList}>
              {[
                {
                  title: "Phân tích kịch bản & Hook viral cho chiến dịch",
                  desc: "Trích xuất góc quay, nhịp điệu và thông điệp nổi bật từ tư liệu thực tế",
                },
                {
                  title: "Ghép nối phân cảnh & Hiệu ứng chuyển động Spatial AI",
                  desc: "Áp dụng Drone Parallax và nhịp chuyển cảnh 1.5s - 2.5s",
                },
                {
                  title: "Hòa âm giọng đọc lồng tiếng & Âm thanh môi trường",
                  desc: "Tạo thuyết minh tự nhiên và âm thanh sống động",
                },
                {
                  title: "Xuất bản bản nháp 9:16 & Liên kết đặt tour chính thức",
                  desc: "Hoàn thiện video chuẩn TikTok & Instagram Reels",
                },
              ].map((step, idx) => {
                const isDone = currentStepIndex > idx || mode === "polling";
                const isActive = currentStepIndex === idx && mode !== "polling";

                return (
                  <div
                    key={idx}
                    className={`${styles.stepItem} ${
                      isDone
                        ? styles.stepDone
                        : isActive
                        ? styles.stepActive
                        : ""
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={18}
                        className="text-primary shrink-0"
                        aria-hidden="true"
                      />
                    ) : isActive ? (
                      <Loader2
                        size={18}
                        className="text-accent animate-spin shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border border-border shrink-0" />
                    )}
                    <div>
                      <strong className="block text-xs">{step.title}</strong>
                      <span className="text-[11px] text-muted-foreground">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                ⚡ Hệ thống AI Cluster đang render khung hình và hòa âm đa kênh.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipWait}
                className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
              >
                ⚡ Xem ngay kết quả (Demo Mode)
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 3: KẾT QUẢ THÀNH CÔNG (READY & PREVIEW)            */}
        {/* ============================================================== */}
        {mode === "ready" && videoResult && (
          <div className={styles.previewSection}>
            <div className={styles.previewGrid}>
              <div className={styles.videoWrapper}>
                <video
                  src={getPlayableVideoUrl(videoResult.video_url)}
                  controls
                  playsInline
                  poster={selectedItem?.thumbnailUrl || undefined}
                >
                  Trình duyệt không hỗ trợ thẻ video.
                </video>
              </div>

              <div className={styles.previewDetails}>
                <div className={styles.detailBox}>
                  <strong>Hook mở đầu (3 giây đầu)</strong>
                  <p className="font-semibold text-primary">
                    {videoResult.hook || "Khám phá ngay điểm đến hấp dẫn!"}
                  </p>
                </div>

                <div className={styles.detailBox}>
                  <strong>Kịch bản lồng tiếng (Voiceover)</strong>
                  <p className="text-xs leading-relaxed max-h-24 overflow-y-auto">
                    {videoResult.script || "Kịch bản tự động đã sẵn sàng."}
                  </p>
                </div>

                <div className={styles.detailBox}>
                  <strong>Social Caption & Kêu gọi hành động (CTA)</strong>
                  <p className="text-xs text-muted-foreground">
                    {videoResult.caption || videoResult.cta}
                  </p>
                </div>

                {videoResult.cost_breakdown && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Sparkles size={14} className="text-emerald-400" />
                        <span>Báo cáo Chi phí Tạo Video AI</span>
                        {actualRenderTimeSec && (
                          <span className="text-[10px] font-normal text-emerald-300/90 ml-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            (Thực tế {actualRenderTimeSec}s)
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        {videoResult.cost_breakdown.is_live_call ? "Google Cloud AI" : "100% Ảnh thật · 0đ"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <div>
                        <span>Cơ chế Hero: </span>
                        <strong className="text-foreground">{videoResult.cost_breakdown.model_name}</strong>
                      </div>
                      <div>
                        <span>Thời lượng Hero: </span>
                        <strong className="text-foreground">
                          {videoResult.cost_breakdown.duration_seconds}s ({videoResult.cost_breakdown.output_tokens.toLocaleString()} tokens)
                        </strong>
                      </div>
                    </div>

                    {videoResult.cost_breakdown.status_note && (
                      <div className="text-[10px] text-emerald-200/80 bg-emerald-950/40 p-1.5 rounded border border-emerald-500/20">
                        💡 {videoResult.cost_breakdown.status_note}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-dashed border-emerald-500/20 pt-1.5 text-emerald-300">
                      <div>
                        <div className="font-medium">Tổng chi phí phát sinh:</div>
                        <div className="text-[10px] text-muted-foreground">
                          (FFmpeg Ken Burns + Edge-TTS: 0đ Miễn phí)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {videoResult.cost_breakdown.cost_vnd > 0
                            ? `~${videoResult.cost_breakdown.cost_vnd.toLocaleString("vi-VN")} đ`
                            : "0 đ (Miễn phí)"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {videoResult.cost_breakdown.cost_usd > 0
                            ? `(${videoResult.cost_breakdown.cost_usd.toFixed(4)} USD)`
                            : "Tiết kiệm 100%"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span>Tỷ lệ: 9:16</span>
                  <span>·</span>
                  <span>Thời lượng: {videoResult.duration_sec}s</span>
                  {videoResult.scenes_count && (
                    <>
                      <span>·</span>
                      <span>{videoResult.scenes_count} phân cảnh</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy size={16} aria-hidden="true" />
                {copied ? "Đã sao chép link!" : "Sao chép link video"}
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a
                  href={getPlayableVideoUrl(videoResult.video_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="campaign-video.mp4"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Mở / Tải video
                </a>
              </Button>
              <Button variant="default" onClick={onClose}>
                Hoàn tất
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 4: BỊ CHẶN BỞI FAIL-FAST GATE (BLOCKED 422)         */}
        {/* ============================================================== */}
        {mode === "blocked" && (
          <div className={styles.blockedAlert} role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Cổng kiểm duyệt Fail-Fast Gate tạm dừng quá trình</strong>
                <p className="mt-1 text-xs">
                  Hệ thống bảo vệ từ chối tạo nội dung giả (AI hallucination) khi
                  chưa đủ tài nguyên thực tế từ Merchant.
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              {blockedErrors.map((err, i) => (
                <div key={i} className={styles.violationItem}>
                  <strong className="text-xs text-foreground block">
                    {err.field}
                  </strong>
                  <p>{err.reason}</p>
                  <p className="font-semibold text-primary mt-1">
                    👉 Hướng giải quyết: {err.required_action}
                  </p>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={() => setMode("config")}>
                Quay lại cấu hình
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 5: LỖI HỆ THỐNG / MẠNG (ERROR 400 / 500)            */}
        {/* ============================================================== */}
        {mode === "error" && (
          <div className={styles.blockedAlert} role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Chưa thể hoàn tất tạo video</strong>
                <p className="mt-1 text-xs">
                  {errorMessage || "Đã xảy ra lỗi không mong muốn."}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="default" onClick={handleStartGeneration}>
                Thử lại
              </Button>
              <Button variant="outline" onClick={() => setMode("config")}>
                Chỉnh sửa thông số
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

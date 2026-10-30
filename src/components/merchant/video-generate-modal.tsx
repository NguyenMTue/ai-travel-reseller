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
import { VideoPlayer } from "@/src/components/video-player";
import { playableVideoUrl } from "@/src/lib/video-delivery";
import { useDialogViewport } from "@/src/components/use-dialog-viewport";
import mobileStyles from "@/src/components/mobile-dialog.module.css";
import type { LibraryItem } from "@/src/lib/merchant/media-library";
import styles from "./video-generate-modal.module.css";

export interface VideoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: LibraryItem | null;
  merchantId?: string;
  autoStart?: boolean;
}

interface CampaignOption {
  id: string;
  name: string;
  productId: string;
  productName: string;
  productSalePrice: number | null;
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
}

interface BlockedItem {
  field: string;
  reason: string;
  required_action: string;
}

export function VideoGenerateModal(props: VideoGenerateModalProps) {
  // Each opening/selected record owns fresh state and resources. Closing unmounts
  // the player instead of resetting the previous session from an effect.
  return props.isOpen ? <VideoGenerateSession key={props.selectedItem?.id ?? "new"} {...props} /> : null;
}

function VideoGenerateSession({
  isOpen,
  onClose,
  selectedItem,
}: VideoGenerateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogViewport(dialogRef, isOpen);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
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
  const [blockedErrors, setBlockedErrors] = useState<BlockedItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

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
    const previousDocumentOverflow = document.documentElement.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      if (dialog.open) dialog.close();
      restoreFocusRef.current?.focus();
    };
  }, [isOpen]);

  // 2. Tải danh sách chiến dịch của Merchant khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let alive = true;
    const abort = new AbortController();

    fetch("/api/merchant/campaigns", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      signal: abort.signal,
    })
      .then((res) => res.json())
      .then((res) => {
        if (!alive) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCampaigns(res.data);
          setSelectedCampaignId(res.data[0].id);
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
      abort.abort();
    };
  }, [isOpen]);

  // 3. Kích hoạt pipeline sinh video AI
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
    setProgress(15);
    setCurrentStepIndex(0);
    setErrorMessage("");

    // Giả lập bước tiến trình trực quan
    const stepTimer1 = setTimeout(() => {
      setProgress(40);
      setCurrentStepIndex(1);
    }, 800);

    const stepTimer2 = setTimeout(() => {
      setProgress(70);
      setCurrentStepIndex(2);
    }, 1600);

    const stepTimer3 = setTimeout(() => {
      setProgress(90);
      setCurrentStepIndex(3);
    }, 2400);

    try {
      const payload = {
        campaign_id: campaign.id,
        product_id: campaign.productId,
        media_reference_ids: selectedItem ? [selectedItem.id] : [],
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

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const json = await response.json();

      if (response.status === 201 && json.success) {
        setProgress(95);
        setMode("polling");

        // Polling tra cứu trạng thái nội dung video vừa tạo
        const contentId = json.data?.content_id;
        if (contentId) {
          try {
            const pollRes = await fetch(
              `/api/merchant/video/generate?content_id=${contentId}`,
              { cache: "no-store", credentials: "same-origin" }
            );
            const pollJson = await pollRes.json();
            if (pollJson.success && pollJson.data) {
              setVideoResult(pollJson.data);
            } else {
              setVideoResult(json.data);
            }
          } catch {
            setVideoResult(json.data);
          }
        } else {
          setVideoResult(json.data);
        }

        setProgress(100);
        setCurrentStepIndex(3);
        setMode("ready");
      } else if (response.status === 422) {
        // Fail-Fast Gate chặn
        setMode("blocked");
        setBlockedErrors(json.missing_or_invalid_inputs || []);
      } else {
        setMode("error");
        setErrorMessage(
          json.error || "Không thể khởi tạo video. Vui lòng kiểm tra lại cấu hình."
        );
      }
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setMode("error");
      setErrorMessage("Lỗi kết nối mạng: " + (err instanceof Error ? err.message : "Không xác định"));
    }
  }

  function handleCopyLink() {
    const rawUrl = videoResult?.status === "ready" ? playableVideoUrl(videoResult.video_url) : null;
    if (rawUrl) {
      const playable = rawUrl;
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
            setCopied(false);
          });
      } else {
        setCopied(false);
      }
    }
  }

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="video-generate-title"
      aria-describedby="video-generate-desc"
      aria-busy={mode === "generating" || mode === "polling"}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const dialog = event.currentTarget;
        const targets = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),video[controls],[tabindex='0']")]
          .filter(element => element.getClientRects().length > 0);
        const first = targets[0], last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (mode !== "generating" && mode !== "polling") onClose();
      }}
      className={`${styles.dialog} ${mobileStyles.surface}`}
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
            {mode === "ready" && videoResult?.status === "ready" && playableVideoUrl(videoResult.video_url)
              ? "Video AI của bạn đã sẵn sàng!"
              : mode === "ready" ? "Đã nhận kết quả xử lý · Chờ video hợp lệ"
              : mode === "generating" || mode === "polling"
              ? "Đang tổng hợp video AI..."
              : "Tạo video AI từ mẫu tham khảo"}
          </h2>
          <p id="video-generate-desc">
            {mode === "ready"
              ? "Kịch bản và các phân cảnh 9:16 đã được biên tập tối ưu cho TikTok & Instagram Reels."
              : mode === "generating" || mode === "polling"
              ? "Đạo diễn AI đang xử lý tư liệu thực tế và kịch bản chuyển đổi cao."
              : "Tự động trích xuất phong cách từ mẫu đã chọn để sản xuất video tiếp thị bán tour."}
          </p>
        </div>

        {/* Mẫu tham khảo đã chọn */}
        {selectedItem && (
          <div className={styles.referenceBadge}>
            <Film size={20} className="text-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <strong>{selectedItem.title}</strong>
              <span className="text-xs text-muted-foreground">
                Nền tảng: {selectedItem.platform.toUpperCase()}
                {selectedItem.duration ? ` · ${selectedItem.duration}s` : ""}
                {selectedItem.styleTags.length > 0
                  ? ` · ${selectedItem.styleTags.join(", ")}`
                  : ""}
              </span>
            </div>
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
              <span>Đang xử lý pipeline sinh video...</span>
              <strong className="text-foreground">{progress}%</strong>
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
                  title: "Phân tích kịch bản & Hook viral từ mẫu đã chọn",
                  desc: "Trích xuất góc quay, nhịp điệu và thông điệp nổi bật",
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
          </div>
        )}

        {/* ============================================================== */}
        {/* TRẠNG THÁI 3: KẾT QUẢ THÀNH CÔNG (READY & PREVIEW)            */}
        {/* ============================================================== */}
        {isOpen && mode === "ready" && videoResult && (
          <div className={styles.previewSection}>
            <div className={styles.previewGrid}>
              <VideoPlayer videoId={videoResult.content_id} videoUrl={videoResult.video_url}
                ready={videoResult.status === "ready"} title={selectedCampaign?.name || `Video ${videoResult.content_id}`} />

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
              <Button variant="outline" onClick={handleCopyLink} disabled={videoResult.status !== "ready" || !playableVideoUrl(videoResult.video_url)}>
                <Copy size={16} aria-hidden="true" />
                {copied ? "Đã sao chép link!" : "Sao chép link video"}
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

"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { MediaCard as Card, MediaCardGrid as Grid } from "./media-card";
import { VideoGuidelinesModal as Guidelines } from "./video-guidelines-modal";
import { VideoGenerateModal, type CampaignOption } from "./video-generate-modal";
import {
  initialLibraryQuery,
  readLibrary,
  toMediaCardProps,
  type LibraryItem,
  type LibraryQuery,
  type LibraryRequest,
  type LibraryResult,
} from "@/src/lib/merchant/media-library";
import styles from "./library.module.css";

type LibraryState = LibraryResult | { status: "loading" };

export function MerchantLibraryLive({ merchantId }: { merchantId: string }) {
  return <LibraryClient contextKey={merchantId} request={readLibrary} />;
}

export function LibraryClient({
  request,
  contextKey,
  observeInvalidation,
}: {
  request: LibraryRequest;
  contextKey: string;
  observeInvalidation?: (invalidate: () => void) => () => void;
}) {
  return (
    <LibraryRead
      key={contextKey}
      merchantId={contextKey}
      request={request}
      observeInvalidation={observeInvalidation}
    />
  );
}

function LibraryRead({
  request,
  observeInvalidation,
  merchantId,
}: {
  request: LibraryRequest;
  observeInvalidation?: (invalidate: () => void) => () => void;
  merchantId?: string;
}) {
  const [query, setQuery] = useState(initialLibraryQuery);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<LibraryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [guide, setGuide] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  // Danh sách ID các ảnh được Merchant chọn theo thứ tự ưu tiên
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Danh sách Chiến dịch của Merchant
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const invalid = useRef(false);
  const privateView = useRef<HTMLDivElement>(null);

  // Tải danh sách chiến dịch thuộc Merchant
  useEffect(() => {
    let alive = true;
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
          setSelectedCampaignId(res.data[0].id);
        } else {
          setCampaigns([]);
        }
      })
      .catch(() => {
        if (alive) setCampaigns([]);
      });

    return () => {
      alive = false;
    };
  }, [merchantId]);

  // Đọc danh sách media references theo bộ lọc
  useEffect(() => {
    let alive = true;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const invalidate = () => {
      invalid.current = true;
      abort.abort();
      clearTimeout(timer);
      if (privateView.current) privateView.current.hidden = true;
      if (alive) {
        setSelected(null);
        setSelectedIds([]);
        setGuide(false);
        setResult({ status: "session" });
      }
    };

    const pageShow = (event: PageTransitionEvent) => {
      if (event.persisted) invalidate();
    };

    let unsubscribe = () => {};
    try {
      unsubscribe = observeInvalidation?.(invalidate) ?? unsubscribe;
    } catch {
      queueMicrotask(() => {
        if (alive) setResult({ status: "error", reason: "service" });
      });
      return () => {
        alive = false;
      };
    }

    window.addEventListener("pagehide", invalidate);
    window.addEventListener("pageshow", pageShow);

    if (!invalid.current) {
      queueMicrotask(() => {
        if (alive && !invalid.current) {
          setResult({ status: "loading" });
          setSelected(null);
        }
      });

      timer = setTimeout(() => {
        abort.abort();
        if (alive && !invalid.current)
          setResult({ status: "error", reason: "network" });
      }, 20000);

      void request(query, abort.signal)
        .then((next) => {
          if (alive && !invalid.current && !abort.signal.aborted)
            setResult(next);
        })
        .catch(() => {
          if (alive && !invalid.current && !abort.signal.aborted)
            setResult({ status: "error", reason: "network" });
        })
        .finally(() => clearTimeout(timer));
    }

    return () => {
      alive = false;
      abort.abort();
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("pagehide", invalidate);
      window.removeEventListener("pageshow", pageShow);
    };
  }, [query, attempt, request, observeInvalidation]);

  function change(next: LibraryQuery) {
    if (invalid.current) return;
    setSelected(null);
    setResult({ status: "loading" });
    setQuery(next);
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSelectRecommended() {
    if (result.status === "ready" && result.data.items.length > 0) {
      // Chọn 5 ảnh đầu tiên (2 Hero + 3 Body)
      const recommended = result.data.items.slice(0, 5).map((item) => item.id);
      setSelectedIds(recommended);
    }
  }

  function handleClearSelections() {
    setSelectedIds([]);
  }

  const failed = result.status === "session" || result.status === "forbidden";
  const selectedCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) ||
    campaigns[0] ||
    null;
  const totalAssets =
    result.status === "ready" ? result.data.pagination.total : 0;

  return (
    <>
      {/* THẺ TỔNG QUAN CHIẾN DỊCH & BẢNG ĐIỀU PHỐI HYBRID VIDEO */}
      {!failed && selectedCampaign && (
        <section
          className={styles.campaignHeroCard}
          aria-labelledby="campaign-hero-title"
        >
          <div className={styles.campaignHeroHeader}>
            <div className={styles.campaignSelectorWrap}>
              <label htmlFor="campaign-dropdown">Chiến dịch:</label>
              <select
                id="campaign-dropdown"
                className={styles.campaignSelect}
                value={selectedCampaign.id}
                onChange={(e) => {
                  setSelectedCampaignId(e.target.value);
                  setSelected(null);
                  setSelectedIds([]);
                }}
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <span className={styles.campaignBadge}>
              <CheckCircle2 size={14} aria-hidden="true" />
              Chiến dịch đang hoạt động
            </span>
          </div>

          <div className={styles.campaignHeroBody}>
            <div className={styles.campaignHeroInfo}>
              <h2 id="campaign-hero-title" className={styles.campaignHeroTitle}>
                {selectedCampaign.name}
              </h2>
              <div className={styles.campaignMetaList}>
                <span className={styles.campaignMetaItem}>
                  🎟️ <strong>{selectedCampaign.productName}</strong>
                </span>
                {selectedCampaign.targetLocation && (
                  <span className={styles.campaignMetaItem}>
                    <MapPin
                      size={14}
                      className="text-muted-foreground"
                      aria-hidden="true"
                    />
                    {selectedCampaign.targetLocation}
                  </span>
                )}
                {selectedCampaign.productSalePrice && (
                  <span
                    className={`${styles.campaignMetaItem} ${styles.campaignPrice}`}
                  >
                    <Tag size={14} aria-hidden="true" />
                    {Number(
                      selectedCampaign.productSalePrice
                    ).toLocaleString("vi-VN")}
                    đ
                  </span>
                )}
                <span className={styles.campaignMetaItem}>
                  📸 {totalAssets} tư liệu ảnh thật
                </span>
              </div>
            </div>

            <div className={styles.campaignHeroAction}>
              <Button
                variant="default"
                onClick={() => setGenerateOpen(true)}
                className={styles.generateCampaignBtn}
              >
                <Sparkles size={18} aria-hidden="true" />
                Tạo Video AI ({selectedIds.length > 0 ? `${selectedIds.length} ảnh đã chọn` : "Tự động chọn"})
              </Button>
            </div>
          </div>

          {/* BANNER HƯỚNG DẪN QUY TRÌNH HYBRID VIDEO MỚI */}
          <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm pb-1.5">
              <Zap size={16} />
              <span>Quy trình Tạo Video Du lịch Hybrid AI (Gemini Omni 1.1 Flash + FFmpeg)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Tối ưu hóa chi phí bằng cách kết hợp AI thế hệ mới với hiệu ứng chuyển động ảnh thật:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 p-2.5">
                <span className="font-semibold text-purple-300 block mb-1">
                  ⭐ Giai đoạn 1: Hero Hook (2 - 3 ảnh đầu)
                </span>
                <span className="text-muted-foreground text-[11px] leading-relaxed">
                  Đưa vào mô hình <strong>gemini-omni-1.1-flash</strong> sinh video chuyển cảnh điện ảnh 5s - 10s mượt mà giữ chân người xem trong 3 giây vàng.
                </span>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-2.5">
                <span className="font-semibold text-blue-300 block mb-1">
                  🎬 Giai đoạn 2: Body Slideshow (Các ảnh còn lại)
                </span>
                <span className="text-muted-foreground text-[11px] leading-relaxed">
                  Dùng hiệu ứng <strong>Ken Burns (Zoom/Pan 2s/ảnh)</strong> + <strong>giọng đọc tiếng Việt (Edge-TTS)</strong> hoàn toàn miễn phí (0đ).
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HEADER KHU VỰC TÀI NGUYÊN MEDIA & TOOLBAR CHỌN ẢNH */}
      <div className={styles.sectionHeader}>
        <div>
          <p className="eyebrow">CHỌN ẢNH TƯ LIỆU CHO CHIẾN DỊCH</p>
          <h2>Kho ảnh & video thực tế ({totalAssets})</h2>
          <p>
            Click vào từng ảnh bên dưới để chọn thứ tự xuất hiện trong video (ảnh 1-2 làm Hero Omni, các ảnh sau làm Body).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result.status === "ready" && result.data.items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSelectRecommended}>
              <Layers size={15} aria-hidden="true" />
              Chọn nhanh 5 ảnh đề xuất
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearSelections}>
              <RefreshCw size={15} aria-hidden="true" />
              Bỏ chọn ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setGuide(true)}>
            <CircleHelp size={16} aria-hidden="true" />
            Quy chuẩn
          </Button>
        </div>
      </div>

      {!failed && (
        <form
          className={styles.filters}
          onSubmit={(e) => {
            e.preventDefault();
            change({ ...query, page: 1, search: draft.trim() });
          }}
        >
          <label className={styles.search}>
            <span>Tìm theo tiêu đề tư liệu</span>
            <span className={styles.searchInput}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                maxLength={255}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tìm ảnh flycam, làng Pháp, cáp treo…"
              />
            </span>
          </label>
          <label>
            Nền tảng
            <select
              value={query.platform}
              onChange={(e) =>
                change({
                  ...query,
                  page: 1,
                  platform: e.target.value as LibraryQuery["platform"],
                })
              }
            >
              <option value="">Tất cả nền tảng</option>
              <option value="upload">Tải lên</option>
              <option value="tiktok">TikTok</option>
              <option value="reels">Reels</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="youtube">YouTube</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <Button type="submit">Tìm kiếm</Button>
          {(query.search || query.platform) && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setDraft("");
                change({ ...initialLibraryQuery });
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </form>
      )}

      <div aria-live="polite" aria-atomic="true" className={styles.status}>
        {result.status === "loading"
          ? "Đang tải tư liệu chiến dịch…"
          : result.status === "ready"
          ? `${result.data.pagination.total} tư liệu · Đang chọn ${selectedIds.length} ảnh`
          : "Chưa có kết quả tư liệu."}
      </div>

      {result.status === "loading" && <LibraryLoading />}

      {result.status === "error" && (
        <LibraryNotice
          title="Chưa thể tải thư viện"
          description={
            result.reason === "schema"
              ? "Dữ liệu trả về chưa đúng định dạng. Chưa thể xác định danh sách media."
              : result.reason === "network"
              ? "Kết nối bị gián đoạn hoặc quá thời gian chờ. Bạn có thể chủ động thử lại."
              : "Dịch vụ chưa trả về kết quả hợp lệ. Chưa thể xác định danh sách media."
          }
        >
          <Button
            variant="outline"
            onClick={() => {
              setResult({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Thử lại
          </Button>
        </LibraryNotice>
      )}

      {failed && (
        <LibraryNotice
          title={
            result.status === "session"
              ? "Cần xác minh lại phiên đăng nhập"
              : "Chưa có quyền Merchant"
          }
          description={
            result.status === "session"
              ? "Phiên đã hết hạn hoặc thay đổi. Dữ liệu của phiên trước đã được ẩn."
              : "Chưa xác nhận được quyền đọc thư viện của tài khoản hiện tại."
          }
        />
      )}

      {result.status === "ready" && (
        <div key="private-library" ref={privateView}>
          {result.data.items.length ? (
            <div className={styles.collection}>
              <Grid>
                {result.data.items.map((item) => {
                  const selectedIndex = selectedIds.indexOf(item.id);
                  const isSelected = selectedIndex !== -1;
                  let badgeText = "";
                  if (isSelected) {
                    if (selectedIndex === 0) badgeText = "⭐ Hero 1 (Omni)";
                    else if (selectedIndex === 1) badgeText = "⭐ Hero 2 (Omni)";
                    else badgeText = `🎬 Body #${selectedIndex + 1}`;
                  }

                  return (
                    <Card
                      key={item.id}
                      {...toMediaCardProps(item)}
                      isSelected={isSelected}
                      selectionBadge={badgeText}
                      onSelect={() => handleToggleSelect(item.id)}
                    />
                  );
                })}
              </Grid>
            </div>
          ) : (
            <LibraryNotice
              title={
                query.search || query.platform
                  ? "Chưa có tư liệu phù hợp"
                  : "Chiến dịch chưa có tài nguyên media"
              }
              description={
                query.search || query.platform
                  ? "Thử từ khóa khác hoặc xóa bộ lọc để xem lại danh sách tư liệu."
                  : "Khi tải lên ảnh/clip cho chiến dịch, chúng sẽ xuất hiện tại đây."
              }
              empty
            />
          )}

          {result.data.pagination.totalPages > 1 && (
            <nav aria-label="Phân trang thư viện" className={styles.pagination}>
              <Button
                variant="outline"
                disabled={query.page <= 1}
                onClick={() => change({ ...query, page: query.page - 1 })}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Trước
              </Button>
              <span>
                Trang {query.page} / {result.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={query.page >= result.data.pagination.totalPages}
                onClick={() => change({ ...query, page: query.page + 1 })}
              >
                Sau
                <ChevronRight size={18} aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>
      )}

      {/* THANH TÁC VỤ NỔI CỐ ĐỊNH KHI CHỌN ẢNH (FLOATING ACTION BAR) */}
      {selectedIds.length > 0 && (
        <aside
          aria-label="Thanh tác vụ chọn tư liệu"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 text-white px-5 py-3 rounded-full shadow-2xl border border-zinc-700 flex items-center gap-4 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="text-xs">
            <span className="font-semibold text-emerald-400">
              Đã chọn {selectedIds.length} ảnh:
            </span>{" "}
            <span className="text-zinc-300">
              {Math.min(2, selectedIds.length)} Hero (Omni) +{" "}
              {Math.max(0, selectedIds.length - 2)} Body (Ken Burns)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearSelections}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              Bỏ chọn
            </button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setGenerateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-4 rounded-full flex items-center gap-1.5 shadow-md"
            >
              <Sparkles size={14} />
              Tạo Video AI ({selectedIds.length} ảnh)
            </Button>
          </div>
        </aside>
      )}

      <Guidelines isOpen={guide} onClose={() => setGuide(false)} />
      <VideoGenerateModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        selectedItem={selected}
        selectedItemIds={selectedIds}
        selectedItems={
          result.status === "ready"
            ? selectedIds
                .map((id) => result.data.items.find((item) => item.id === id))
                .filter(Boolean) as LibraryItem[]
            : []
        }
        selectedCampaign={selectedCampaign}
        totalAssetsCount={totalAssets}
        merchantId={merchantId}
      />
    </>
  );
}

export function LibraryNotice({
  title,
  description,
  children,
  empty = false,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  empty?: boolean;
}) {
  return (
    <section className={styles.notice} role={empty ? "status" : "alert"}>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </section>
  );
}

export function LibraryLoading() {
  return (
    <div
      aria-label="Đang tải media"
      aria-busy="true"
      className={styles.skeleton}
    >
      {[0, 1, 2].map((n) => (
        <div key={n}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

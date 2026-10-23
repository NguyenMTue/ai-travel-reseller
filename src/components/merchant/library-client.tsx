"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  MapPin,
  Search,
  Sparkles,
  Tag,
  X,
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

// Preview and future live reads share canonical components; only transport is injected.
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

  const failed = result.status === "session" || result.status === "forbidden";
  const selectedCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) ||
    campaigns[0] ||
    null;
  const totalAssets =
    result.status === "ready" ? result.data.pagination.total : 0;

  return (
    <>
      {/* THẺ TỔNG QUAN CHIẾN DỊCH & HÀNH ĐỘNG TẠO VIDEO AI */}
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
                  📸 {totalAssets} tư liệu đạt chuẩn UGC
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
                Tạo Video AI cho chiến dịch này
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* HEADER KHU VỰC TÀI NGUYÊN MEDIA CỦA CHIẾN DỊCH */}
      <div className={styles.sectionHeader}>
        <div>
          <p className="eyebrow">TÀI NGUYÊN MEDIA CHIẾN DỊCH</p>
          <h2>Kho ảnh & video thực tế ({totalAssets})</h2>
          <p>
            Các hình ảnh góc cao flycam, trải nghiệm thực tế và phong cảnh của
            chiến dịch. AI sẽ kết hợp toàn bộ tài nguyên này khi dựng video 9:16.
          </p>
        </div>
        <Button variant="outline" onClick={() => setGuide(true)}>
          <CircleHelp size={18} aria-hidden="true" />
          Quy chuẩn video
        </Button>
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
          ? `${result.data.pagination.total} tư liệu${
              query.search ? ` · Kết quả cho “${query.search}”` : ""
            }`
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
          {selected && (
            <section role="status" className={styles.selection}>
              <div>
                <strong>Đã chọn tư liệu tiêu điểm</strong>
                <p>{selected.title}</p>
                <small>
                  Tư liệu này sẽ được AI ưu tiên xuất hiện tại phân cảnh mở màn
                  (Hook 0s - 3s) của video.
                </small>
              </div>
              <div className={styles.selectionActions}>
                <Button
                  variant="default"
                  onClick={() => setGenerateOpen(true)}
                  className={styles.generateButton}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Tạo video AI từ chiến dịch
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelected(null)}
                  aria-label="Bỏ chọn tư liệu"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}

          {result.data.items.length ? (
            <div className={styles.collection}>
              <Grid>
                {result.data.items.map((item) => (
                  <Card
                    key={item.id}
                    {...toMediaCardProps(item)}
                    isSelected={selected?.id === item.id}
                    onSelect={(id) => {
                      if (!invalid.current) {
                        setSelected((prev) =>
                          prev?.id === id
                            ? null
                            : result.data.items.find(
                                (value) => value.id === id
                              ) ?? null
                        );
                      }
                    }}
                  />
                ))}
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

      <Guidelines isOpen={guide} onClose={() => setGuide(false)} />
      <VideoGenerateModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        selectedItem={selected}
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

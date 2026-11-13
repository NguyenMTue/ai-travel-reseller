"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Film,
  MapPin,
  Percent,
  Search,
  Sparkles,
  Layers3,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { VideoPlayer } from "@/src/components/video-player";
import { formatCommission } from "@/src/lib/reseller/campaign-feed";

export interface ResellerMediaItem {
  id: string;
  campaignId: string;
  campaignName: string;
  location: string;
  commissionRate: number | null;
  productName: string | null;
  category: string | null;
  persona: string;
  hook: string | null;
  script: string | null;
  caption: string | null;
  cta: string | null;
  videoUrl: string;
  status: string;
  createdAt: string;
}

export function ResellerLibraryView({
  items,
  resellerId,
}: {
  items: ResellerMediaItem[];
  resellerId: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const locations = [
    "all",
    ...Array.from(new Set(items.map((i) => i.location).filter(Boolean))),
  ];

  const filteredItems = items.filter((item) => {
    if (selectedLocation !== "all" && item.location !== selectedLocation) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.campaignName.toLowerCase().includes(q);
      const matchHook = (item.hook || "").toLowerCase().includes(q);
      const matchCaption = (item.caption || "").toLowerCase().includes(q);
      const matchLoc = (item.location || "").toLowerCase().includes(q);
      if (!matchName && !matchHook && !matchCaption && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-w-0 space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={14} aria-hidden="true" />
            <span>KHO TÀI NGUYÊN NỘI DUNG AI</span>
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl [font-family:var(--font-display)]">
            Thư viện Media & Video
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Khám phá các video 9:16 chất lượng cao được tối ưu cho TikTok, Reels & Shorts. Lấy link tiếp thị và kịch bản để đăng ngay!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/reseller/campaigns">
              <Layers3 size={15} />
              Xem danh sách chiến dịch
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chiến dịch, điểm đến hoặc kịch bản..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="library-location-filter" className="text-xs text-muted-foreground shrink-0">
            Điểm đến:
          </label>
          <select
            id="library-location-filter"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả điểm đến ({items.length})</option>
            {locations
              .filter((l) => l !== "all")
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grid of Video Cards */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Film size={28} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Chưa có video phù hợp
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {items.length === 0
              ? "Hiện tại chưa có video nào được công bố. Khi các doanh nghiệp (Merchant) phê duyệt video AI tại Cổng kiểm duyệt, video sẽ tự động xuất hiện tại đây."
              : "Không tìm thấy video khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Hãy thử chọn điểm đến khác."}
          </p>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setSelectedLocation("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Video Player */}
              <div className="relative bg-black aspect-[9/16] max-h-[460px] w-full overflow-hidden">
                <VideoPlayer
                  videoId={item.id}
                  videoUrl={item.videoUrl}
                  title={item.campaignName}
                />
              </div>

              {/* Card Meta & Content Info */}
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground font-medium">
                    <MapPin size={13} className="text-primary" />
                    {item.location}
                  </span>
                  {item.commissionRate !== null && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                      <Percent size={12} />
                      Hoa hồng {formatCommission(item.commissionRate)}
                    </span>
                  )}
                </div>

                <h3 className="mt-2.5 line-clamp-2 text-base font-semibold text-foreground [font-family:var(--font-display)]">
                  {item.campaignName}
                </h3>

                {item.hook && (
                  <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/50">
                    &ldquo;{item.hook}&rdquo;
                  </p>
                )}

                {item.caption && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Caption gợi ý:</span>
                      <button
                        type="button"
                        onClick={() => copyText(item.caption || "", `caption-${item.id}`)}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        {copiedId === `caption-${item.id}` ? (
                          <>
                            <Check size={12} /> Đã copy
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="line-clamp-2 text-xs text-foreground/80">
                      {item.caption}
                    </p>
                  </div>
                )}

                {/* Card Actions */}
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-2">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/reseller/campaigns/${item.campaignId}`}>
                      Lấy link & Đăng bài
                      <ExternalLink size={13} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

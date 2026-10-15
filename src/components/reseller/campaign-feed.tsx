"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  defaultCampaignFilters,
  filterCampaigns,
  formatCommission,
  getFilterOptions,
  type CampaignFeedItem,
  type CampaignFilters,
} from "@/src/lib/reseller/campaign-feed";
import { FeedNotice } from "./feed-states";

const commissionOptions: {
  value: CampaignFilters["commission"];
  label: string;
}[] = [
  { value: "all", label: "Tất cả mức hoa hồng" },
  { value: "over-10", label: "Trên 10%" },
  { value: "over-15", label: "Trên 15%" },
  { value: "under-10", label: "Dưới 10%" },
  { value: "10-to-20", label: "Từ 10% đến 20%" },
  { value: "over-20", label: "Trên 20%" },
];

function CampaignCard({ campaign, detailBasePath }: { campaign: CampaignFeedItem; detailBasePath: string }) {
  return (
    <article
      data-testid="campaign-card"
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-5 flex text-xs text-muted-foreground">
          <span className="min-w-0 break-words rounded-md bg-muted px-3 py-1.5">
            {campaign.category?.trim() ? campaign.category : "Chưa có danh mục"}
          </span>
        </p>
        <h2 className="break-words text-xl font-medium leading-snug [font-family:var(--font-display)] sm:text-2xl">
          {campaign.name}
        </h2>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            {campaign.location?.trim() ? campaign.location : "Chưa có địa điểm"}
          </span>
        </p>
        <dl className="mt-6 border-t border-border pt-5">
          <div>
            <dt className="text-xs text-muted-foreground">Hoa hồng</dt>
            <dd className="mt-1 break-words text-2xl font-semibold tracking-tight text-primary">
              {formatCommission(campaign.commissionRate)}
            </dd>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-1 text-xs text-muted-foreground">
            <dt>Nội dung:</dt>
            <dd>
              {campaign.approvedContentCount === null
                ? "Xem Content Kit"
                : `${campaign.approvedContentCount} nội dung khả dụng`}
            </dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-border bg-background px-5 py-3 sm:px-6">
        <Button asChild variant="outline" size="sm"><Link prefetch={false}
          href={`${detailBasePath}/${encodeURIComponent(campaign.id)}`} aria-label={`Xem chi tiết ${campaign.name}`}>Xem chi tiết</Link></Button>
      </div>
    </article>
  );
}

export function CampaignFeed({ campaigns, detailBasePath = "/reseller/campaigns" }: { campaigns: CampaignFeedItem[]; detailBasePath?: string }) {
  const fieldId = useId();
  const [filters, setFilters] = useState<CampaignFilters>(defaultCampaignFilters);
  const options = getFilterOptions(campaigns);
  const filteredCampaigns = filterCampaigns(campaigns, filters);
  const hasFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.location ||
      filters.commission !== "all",
  );

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Kết nối & chia sẻ
        </p>
        <h1 className="text-3xl font-medium tracking-tight [font-family:var(--font-display)] sm:text-4xl">
          Chiến dịch dành cho bạn
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Tìm chiến dịch phù hợp với cộng đồng của bạn theo danh mục, địa điểm và mức hoa hồng.
        </p>
      </div>

      <section
        aria-labelledby={`${fieldId}-filters`}
        className="mb-7 rounded-xl border border-border bg-white p-4 sm:p-5"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${fieldId}-filters`} className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal size={17} aria-hidden="true" />
            Tìm & lọc chiến dịch
          </h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasFilters}
            onClick={() => setFilters(defaultCampaignFilters)}
          >
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor={`${fieldId}-search`} className="mb-2 block text-xs font-medium">
              Tìm kiếm chiến dịch
            </label>
            <div className="relative">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-4 text-muted-foreground" />
              <Input
                id={`${fieldId}-search`}
                type="search"
                value={filters.search}
                placeholder="Tên chiến dịch…"
                // The existing unlayered .input padding overrides ordinary utilities.
                className="min-w-0 pl-10!"
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${fieldId}-category`} className="mb-2 block text-xs font-medium">
              Danh mục
            </label>
            <select
              id={`${fieldId}-category`}
              className="min-h-12 w-full min-w-0 text-sm"
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">Tất cả danh mục</option>
              {options.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${fieldId}-location`} className="mb-2 block text-xs font-medium">
              Địa điểm
            </label>
            <select
              id={`${fieldId}-location`}
              className="min-h-12 w-full min-w-0 text-sm"
              value={filters.location}
              onChange={(event) => setFilters({ ...filters, location: event.target.value })}
            >
              <option value="">Tất cả địa điểm</option>
              {options.locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${fieldId}-commission`} className="mb-2 block text-xs font-medium">
              Hoa hồng
            </label>
            <select
              id={`${fieldId}-commission`}
              className="min-h-12 w-full min-w-0 text-sm"
              value={filters.commission}
              onChange={(event) => {
                const option = commissionOptions.find((item) => item.value === event.target.value);
                if (option) setFilters({ ...filters, commission: option.value });
              }}
            >
              {commissionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <p role="status" aria-live="polite" aria-atomic="true" className="mb-5 text-sm text-muted-foreground">
        {filteredCampaigns.length} chiến dịch{hasFilters ? " phù hợp" : " đang hiển thị"}
      </p>

      {campaigns.length === 0 ? (
        <FeedNotice
          title="Chưa có chiến dịch"
          description="Dịch vụ chưa trả về chiến dịch active trong phạm vi quyền hiện tại. Có thể chưa có dữ liệu hoặc RLS giới hạn kết quả; cần BE1 xác nhận nếu bạn biết có chiến dịch."
        >
          <FeedRetry />
        </FeedNotice>
      ) : filteredCampaigns.length === 0 ? (
        <FeedNotice
          title="Chưa tìm thấy chiến dịch phù hợp"
          description="Thử từ khóa khác hoặc xóa bộ lọc để xem lại danh sách chiến dịch."
        >
          <Button type="button" variant="outline" onClick={() => setFilters(defaultCampaignFilters)}>
            Xóa bộ lọc
          </Button>
        </FeedNotice>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} detailBasePath={detailBasePath} />)}
        </div>
      )}
    </div>
  );
}

export function FeedRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden="true" />
      {pending ? "Đang tải lại…" : "Thử lại"}
    </Button>
  );
}

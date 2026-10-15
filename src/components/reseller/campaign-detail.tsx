import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ContentKit } from "./content-kit";
import { formatCommission } from "@/src/lib/reseller/campaign-feed";
import type { CampaignDetail, ContentVariant } from "@/src/lib/reseller/content-kit";
import { formatCampaignDate } from "@/src/lib/reseller/campaign-date";
import type { DataFailureKind } from "@/src/lib/reseller/data-failure";

export function CampaignDetailView({ campaign, variants, contentStatus, contentReason, feedPath = "/reseller/campaigns" }: {
  campaign: CampaignDetail; variants: ContentVariant[]; contentStatus: "blocked" | "ready" | "error"; contentReason?: DataFailureKind; feedPath?: string;
}) {
  return (
    <div className="min-w-0">
      <Button asChild variant="outline" size="sm"><Link href={feedPath}>← Danh sách chiến dịch</Link></Button>
      <div className="my-6"><h1 className="text-3xl [overflow-wrap:anywhere] [font-family:var(--font-display)] sm:text-4xl">{campaign.name}</h1></div>
      <dl className="grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Địa bàn chiến dịch", campaign.target_location], ["Hoa hồng", formatCommission(campaign.commission_rate)],
          ["Đối tượng", campaign.target_audience], ["Danh mục", campaign.products?.category],
          ["Bắt đầu", formatCampaignDate(campaign.start_date)], ["Kết thúc", formatCampaignDate(campaign.end_date)],
        ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm [overflow-wrap:anywhere]">{value?.trim() ? value : "Chưa cập nhật"}</dd></div>)}
      </dl>
      <section aria-label="Thông tin sản phẩm" className="mt-5 rounded-xl border border-border bg-secondary p-5">
        <h2 className="text-xl [font-family:var(--font-display)]">{campaign.products?.name ?? "Chưa có thông tin sản phẩm"}</h2>
        <div className="mt-3 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{campaign.products?.description?.trim() ? campaign.products.description : "Chưa có mô tả sản phẩm."}</div>
      </section>
      <ContentKit variants={variants} contentStatus={contentStatus} contentReason={contentReason} />
    </div>
  );
}

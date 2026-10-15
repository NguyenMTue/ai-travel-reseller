import { notFound } from "next/navigation";
import { ResellerShell } from "@/src/components/reseller/shell";
import { CampaignDetailView } from "@/src/components/reseller/campaign-detail";
import type { DataFailureKind } from "@/src/lib/reseller/data-failure";

export const metadata = { title: "Fixture Content Kit", robots: { index: false, follow: false } };
export default async function ContentKitPreviewPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { fixtureCampaignDetail, fixtureContentVariants, approvedFixtureVariants } = await import("@/tests/fixtures/reseller-content-kit");
  const { id } = await params;
  if (id !== fixtureCampaignDetail.id) notFound();
  const { state } = await searchParams;
  const blocked = state === "blocked";
  const approved = state === "approved";
  const contentReason = new Map<string, DataFailureKind>([
    ["error", "query"], ["permission-error", "permission"], ["schema-error", "schema"],
    ["network-error", "network"], ["configuration-error", "configuration"],
  ]).get(state ?? "");
  const campaign = approved ? { ...fixtureCampaignDetail, start_date: "2026-10-14T00:15:00", end_date: "2026-10-21T23:59:00" } : fixtureCampaignDetail;
  return <ResellerShell preview>
    <aside className="mb-6 rounded-xl border border-border bg-secondary p-4 text-sm" aria-label="Thông tin fixture">
      BẢN KIỂM THỬ · Content Kit/Copy dùng fixture cô lập; không phải dữ liệu thật, không gọi Tracking/AI.
    </aside>
    <CampaignDetailView campaign={campaign} variants={blocked || contentReason || state === "empty" ? [] : approved ? approvedFixtureVariants : fixtureContentVariants}
      contentStatus={blocked ? "blocked" : contentReason ? "error" : "ready"} contentReason={contentReason} feedPath="/preview/reseller" />
  </ResellerShell>;
}

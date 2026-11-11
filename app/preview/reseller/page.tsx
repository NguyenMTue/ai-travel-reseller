import { notFound } from "next/navigation";

import { ResellerShell } from "@/src/components/reseller/shell";
export const viewport = { viewportFit: "cover" };
import { ResellerFeedPreview } from "./preview";

export const metadata = { title: "Kiểm thử giao diện Reseller", robots: { index: false, follow: false } };

export default async function ResellerPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  // Fixture module is only loaded in development, never by the real portal.
  const { campaignFixtures } = await import("@/tests/fixtures/reseller-campaigns");
  return (
    <ResellerShell preview>
      <ResellerFeedPreview campaigns={campaignFixtures} />
    </ResellerShell>
  );
}

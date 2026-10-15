"use client";

import { useState } from "react";
import { TrackingLinkModal } from "@/src/components/reseller/tracking-link";
import type { TrackingInput } from "@/src/lib/reseller/tracking-link";
import { requestTrackingFixture, type TrackingScenario } from "@/tests/fixtures/reseller-tracking";
import { CampaignDetailView } from "@/src/components/reseller/campaign-detail";
import type { CampaignDetail, ContentVariant } from "@/src/lib/reseller/content-kit";
import { Button } from "@/src/components/ui/button";

export function TrackingPreview({ input, scenario, onSettled }: { input: TrackingInput | null; scenario: TrackingScenario; onSettled?: () => void }) {
  const [attempts, setAttempts] = useState(0);
  const [payload, setPayload] = useState("");
  return <>
    <TrackingLinkModal input={scenario === "missing-product" ? null : input} preview={scenario !== "blocked"}
      request={async value => {
        const result = await requestTrackingFixture(value, scenario, body => { setAttempts(n => n + 1); setPayload(body); });
        onSettled?.();
        return result;
      }} />
    <p className="mt-3 text-xs text-muted-foreground" data-testid="tracking-attempts" data-payload={payload}>Số lần gửi mô phỏng: {attempts}</p>
  </>;
}

export function TrackingScopePreview({ campaign, variants }: { campaign: CampaignDetail; variants: ContentVariant[] }) {
  const [session, setSession] = useState(false);
  const [otherCampaign, setOtherCampaign] = useState(false);
  const [otherProduct, setOtherProduct] = useState(false);
  const [settled, setSettled] = useState(0);
  const selected = { ...campaign,
    id: otherCampaign ? "99999999-9999-9999-9999-999999999999" : campaign.id,
    product_id: otherProduct ? "88888888-8888-8888-8888-888888888888" : campaign.product_id,
    products: campaign.products ? { ...campaign.products, id: otherProduct ? "88888888-8888-8888-8888-888888888888" : campaign.products.id } : null };
  const sessionKey = session ? "fixture-reseller-b" : "fixture-reseller-a";
  return <>
    <aside className="mb-5 rounded-xl border border-border p-4" aria-label="Điều khiển fixture phạm vi">
      <p className="mb-3">MÔ PHỎNG — đổi phạm vi để kiểm tra xóa link, không thay đổi tài khoản hoặc dữ liệu thật.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setSession(value => !value)}>Đổi session fixture</Button>
        <Button variant="outline" onClick={() => setOtherCampaign(value => !value)}>Đổi campaign fixture</Button>
        <Button variant="outline" onClick={() => setOtherProduct(value => !value)}>Đổi product fixture</Button>
      </div>
      <p data-testid="tracking-settled">Số phản hồi fixture: {settled}</p>
    </aside>
    <CampaignDetailView campaign={selected} variants={variants} contentStatus="ready" preview viewerKey={sessionKey} feedPath="/preview/reseller"
      tracking={<TrackingPreview key={`${selected.id}:${selected.product_id}:${sessionKey}`} input={selected.product_id ? { campaign_id: selected.id, product_id: selected.product_id } : null} scenario="scope" onSettled={() => setSettled(value => value + 1)} />} />
  </>;
}

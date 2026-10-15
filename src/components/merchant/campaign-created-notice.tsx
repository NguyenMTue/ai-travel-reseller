"use client";

import { useEffect, useState } from "react";
import { campaignCreatedMessage } from "@/src/lib/merchant/campaign-form";
import { consumeCampaignCreated } from "@/src/lib/merchant/campaign-receipt";

export function CampaignCreatedNotice({ preview }: { preview: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Consume after hydration, inside the task so Strict Mode mount replay
    // cannot discard the one-time receipt during its cleanup.
    const timer = window.setTimeout(() => setVisible(consumeCampaignCreated(preview)), 0);
    return () => window.clearTimeout(timer);
  }, [preview]);
  return visible ? <div role="status" aria-live="polite" className="notice mb-6">
    {preview && <p>Mô phỏng — không tạo chiến dịch thật.</p>}
    <p>{campaignCreatedMessage}</p>
  </div> : null;
}

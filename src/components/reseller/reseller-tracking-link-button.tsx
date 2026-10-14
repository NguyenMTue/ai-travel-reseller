"use client";

import { useState } from "react";
import { Check, Copy, Link2, LoaderCircle } from "lucide-react";
import { useReseller } from "./reseller-shell";

type TrackingResponse = {
  error?: string;
  data?: { short_url?: string };
};

export function ResellerTrackingLinkButton({
  campaignId,
  productId,
}: {
  campaignId: string;
  productId: string;
}) {
  const { showToast } = useReseller();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function getTrackingLink() {
    setLoading(true);
    try {
      const response = await fetch("/api/tracking/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, product_id: productId }),
      });
      const result = (await response.json()) as TrackingResponse;
      if (!response.ok || !result.data?.short_url) {
        throw new Error(result.error ?? "Không thể tạo tracking link.");
      }
      setUrl(result.data.short_url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tạo tracking link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép tracking link");
    } catch {
      showToast("Không thể sao chép link. Hãy thử lại.");
    }
  }

  return (
    <div className="reseller-tracking-link-control">
      {!url ? (
        <button type="button" className="reseller-primary-btn" onClick={getTrackingLink} disabled={loading}>
          {loading ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <Link2 size={15} aria-hidden />}
          {loading ? "Đang cấp link…" : "Lấy Tracking Link"}
        </button>
      ) : (
        <div className="reseller-tracking-link-result" role="status">
          <a href={url} target="_blank" rel="noreferrer">{url}</a>
          <button type="button" className="reseller-action-btn" onClick={copyLink} aria-label="Sao chép tracking link">
            <Copy size={14} aria-hidden /> Sao chép
          </button>
          <Check size={16} aria-label="Link đã sẵn sàng" />
        </div>
      )}
    </div>
  );
}

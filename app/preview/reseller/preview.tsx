"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { ResellerPortalTabs } from "@/src/components/reseller/reseller-portal-tabs";
import { FeedLoading, FeedNotice } from "@/src/components/reseller/feed-states";
import type { CampaignFeedItem } from "@/src/lib/reseller/campaign-feed";

const previewStates = [
  { value: "ready", label: "Danh sách" },
  { value: "loading", label: "Đang tải" },
  { value: "empty", label: "Trống" },
  { value: "error", label: "Lỗi" },
  { value: "forbidden", label: "Không có quyền" },
  { value: "session-expired", label: "Phiên hết hạn" },
];

export function ResellerFeedPreview({ campaigns }: { campaigns: CampaignFeedItem[] }) {
  const [state, setState] = useState("ready");
  return (
    <>
      <aside aria-label="Thông tin fixture" className="mb-8 rounded-xl border border-border bg-secondary p-4 text-sm">
        <p className="font-medium">BẢN KIỂM THỬ · Dữ liệu fixture, không phải dữ liệu thật</p>
        <p className="mt-2 text-xs text-muted-foreground">Chỉ dùng tại local để kiểm tra giao diện; không tạo chiến dịch hoặc gọi Tracking/AI.</p>
        <label htmlFor="preview-state" className="mb-2 mt-4 block text-xs">Trạng thái giao diện</label>
        <select id="preview-state" value={state} className="w-full sm:w-auto" onChange={(event) => setState(event.target.value)}>
          {previewStates.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </aside>
      {state === "ready" && <ResellerPortalTabs campaigns={campaigns} detailBasePath="/preview/reseller/campaigns" />}
      {state === "loading" && <FeedLoading />}
      {state !== "ready" && state !== "loading" && (
        <>
          <h1 className="mb-6 font-[var(--font-display)] text-3xl">Chiến dịch dành cho bạn</h1>
          <FeedNotice
            title={state === "empty" ? "Chưa có chiến dịch" : state === "error" ? "Chưa thể tải chiến dịch" : state === "forbidden" ? "Bạn chưa có quyền Cộng tác viên" : "Phiên đăng nhập đã hết hạn"}
            description={state === "session-expired" ? "Đăng nhập lại để tiếp tục." : "Trạng thái được mô phỏng bằng fixture cô lập."}
          >
            {(state === "error" || state === "empty") && <Button variant="outline" onClick={() => setState("ready")}>Thử lại</Button>}
            {(state === "session-expired" || state === "forbidden") && <Button asChild><Link href="/login?next=/reseller/campaigns">{state === "session-expired" ? "Đăng nhập lại" : "Đến trang đăng nhập"}</Link></Button>}
          </FeedNotice>
        </>
      )}
    </>
  );
}

"use client";

import { useTransition } from "react";
import { Button } from "@/src/components/ui/button";
import { FeedNotice } from "@/src/components/reseller/feed-states";

// Next 16.3 retry re-fetches the failed segment; reset only clears its state.
export default function ResellerError({ retry }: { retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <>
      <h1 className="mb-6 font-[var(--font-display)] text-3xl">Không gian Cộng tác viên</h1>
      <FeedNotice title="Chưa thể hiển thị trang" description="Có lỗi khi tải trang. Vui lòng thử lại.">
        <Button variant="outline" disabled={pending} onClick={() => startTransition(retry)}>
          {pending ? "Đang tải lại…" : "Thử lại"}
        </Button>
      </FeedNotice>
    </>
  );
}

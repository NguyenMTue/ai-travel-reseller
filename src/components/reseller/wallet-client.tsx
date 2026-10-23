"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { FeedNotice } from "./feed-states";
import { WalletDashboard, WalletLoading } from "./wallet-dashboard";
import { createWalletSessionGate, requestWallet, type WalletRequest, type WalletResult, type WalletSessionObserver } from "@/src/lib/reseller/wallet";
import { observeWalletSession } from "@/src/lib/reseller/wallet-session";

export function ResellerWallet({ viewerId, request = requestWallet, observe = observeWalletSession }: {
  viewerId: string; request?: WalletRequest; observe?: WalletSessionObserver;
}) {
  const [attempt, setAttempt] = useState(0);
  return <WalletRead key={`${viewerId}:${attempt}`} viewerId={viewerId} request={request} observe={observe} retry={() => setAttempt(n => n + 1)} />;
}
function WalletRead({ viewerId, request, observe, retry }: {
  viewerId: string; request: WalletRequest; observe: WalletSessionObserver; retry: () => void;
}) {
  const [result, setResult] = useState<WalletResult | {status: "loading"}>({status: "loading"});
  const privateView = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true, invalidated = false, started = false;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      abort.abort();
      if (alive && !invalidated) setResult({status: "error", reason: "network"});
    }, 20000);
    const gate = createWalletSessionGate(viewerId);
    function invalidate() {
      invalidated = true; abort.abort(); clearTimeout(timer);
      if (privateView.current) privateView.current.hidden = true;
      if (alive) setResult({status: "session"});
    }
    function pageShow(event: PageTransitionEvent) { if (event.persisted) invalidate(); }
    let unsubscribe = () => {};
    try { unsubscribe = observe((event, userId, sessionId) => {
      const decision = gate(event, userId, sessionId);
      if (decision === "invalidated") { invalidate(); return; }
      if (decision !== "ready" || started || !alive || abort.signal.aborted) return;
      started = true;
      clearTimeout(timer);
      // Keep Auth callbacks synchronous; do not call another Auth method here.
      queueMicrotask(() => {
        if (!alive || invalidated) return;
        timer = setTimeout(() => { abort.abort(); if (alive && !invalidated) setResult({status: "error", reason: "network"}); }, 20000);
        void request(viewerId, abort.signal).then(next => {
          if (alive && !invalidated && !abort.signal.aborted) setResult(next);
        }).catch(() => { if (alive && !invalidated && !abort.signal.aborted) setResult({status: "error", reason: "network"}); })
          .finally(() => clearTimeout(timer));
      });
    }); } catch { clearTimeout(timer); queueMicrotask(() => { if (alive) setResult({status: "error", reason: "service"}); }); }
    window.addEventListener("pagehide", invalidate);
    window.addEventListener("pageshow", pageShow);
    return () => { alive = false; abort.abort(); clearTimeout(timer); unsubscribe();
      window.removeEventListener("pagehide", invalidate); window.removeEventListener("pageshow", pageShow); };
  }, [viewerId, request, observe]);
  if (result.status === "loading") return <WalletLoading />;
  if (result.status === "ready") return <div key="wallet-private-data" ref={privateView}><WalletDashboard wallet={result.data} refresh={retry} /></div>;
  const session = result.status === "session", forbidden = result.status === "forbidden";
  return <div key="wallet-feedback"><p className="eyebrow mb-3">VÍ HOA HỒNG</p><h1 className="mb-6 text-3xl [font-family:var(--font-display)]">Ví hoa hồng của bạn</h1>
    <div role="alert"><FeedNotice title={session ? "Cần xác minh lại phiên đăng nhập" : forbidden ? "Chưa có quyền đọc ví hoa hồng" : "Chưa thể tải ví hoa hồng"}
      description={session ? "Phiên đăng nhập đã hết hạn hoặc thay đổi. Dữ liệu ví trước đó đã được ẩn; xác minh lại trước khi tiếp tục."
        : forbidden ? "Dịch vụ chưa xác nhận quyền đọc ví của tài khoản hiện tại. Vui lòng nhờ nhóm hỗ trợ kiểm tra quyền và hồ sơ Reseller."
        : result.reason === "schema" ? "Số liệu trả về chưa hợp lệ hoặc chưa khớp tài khoản hiện tại. Chưa thể hiển thị số dư; vui lòng nhờ nhóm hỗ trợ đối chiếu."
        : result.reason === "network" ? "Kết nối bị gián đoạn hoặc quá thời gian chờ. Chưa có kết quả số dư; bạn có thể chủ động tải lại."
        : "Dịch vụ ví chưa trả về kết quả hợp lệ. Không thể xác định số dư lúc này."}>
      {session ? <><Button asChild><a href="/reseller/wallet">Xác minh phiên hiện tại</a></Button><Button asChild variant="outline"><Link prefetch={false} href="/login?next=%2Freseller%2Fwallet">Đăng nhập lại</Link></Button></>
        : <Button onClick={retry} variant="outline">Tải lại ví</Button>}
    </FeedNotice></div>
  </div>;
}

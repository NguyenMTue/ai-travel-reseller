"use client";
import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ResellerWallet } from "@/src/components/reseller/wallet-client";
import { WalletLoading } from "@/src/components/reseller/wallet-dashboard";
import type { WalletSessionListener, WalletSessionObserver } from "@/src/lib/reseller/wallet";
import { walletFixtureOwner, walletFixtureRequest, walletFixtureSession, type WalletScenario } from "@/tests/fixtures/wallet";

export function WalletPreview() {
  const [scenario, setScenario] = useState<WalletScenario | "loading">("ready");
  const [owner, setOwner] = useState(walletFixtureOwner);
  const [requests, setRequests] = useState(0);
  const [generation, setGeneration] = useState(0);
  const listener = useRef<WalletSessionListener | null>(null);
  const request = useMemo(() => walletFixtureRequest(scenario === "loading" ? "slow" : scenario, () => setRequests(n=>n+1)), [scenario]);
  const observe = useMemo<WalletSessionObserver>(() => callback => {
    listener.current = callback;
    const unsubscribe = walletFixtureSession(owner)(callback);
    return () => {listener.current=null;unsubscribe();};
  }, [owner]);
  return <>
    <details className="group mb-7 rounded-xl border border-border bg-secondary p-4">
      <summary aria-label="Tùy chọn mô phỏng ví" className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium">Mô phỏng · Dữ liệu fixture<ChevronDown className="shrink-0 group-open:rotate-180" size={20} aria-hidden="true" /></summary>
      <section aria-label="Điều khiển mô phỏng ví" className="mt-4 flex flex-wrap items-center gap-3">
      <strong className="w-full text-xs">Chờ UI/UX review</strong>
      <p className="w-full text-xs">Không phải số dư tài khoản thật. Không gọi API, ghi DB hoặc thực hiện chi trả.</p>
      <label>Trạng thái <select aria-label="Trạng thái ví mô phỏng" className="min-h-11 rounded border border-border bg-background px-3" value={scenario} onChange={e=>{setScenario(e.target.value as WalletScenario | "loading");setGeneration(n=>n+1);}}>
        <option value="ready">Có giao dịch</option><option value="zero">Số dư 0</option><option value="empty-history">Chưa có lịch sử</option>
        <option value="loading">Đang tải</option><option value="error">Lỗi dịch vụ</option><option value="malformed">Sai contract</option>
        <option value="session">Hết phiên</option><option value="forbidden">Không đủ quyền</option><option value="slow">Phản hồi chậm</option><option value="long">Nội dung dài</option>
      </select></label>
      <button className="min-h-11 rounded border border-primary px-3" onClick={()=>listener.current?.("SIGNED_OUT",undefined)}>Mô phỏng đăng xuất</button>
      <button className="min-h-11 rounded border border-primary px-3" onClick={()=>{listener.current?.("SIGNED_IN","55555555-5555-5555-5555-111111111111");setOwner(v=>v===walletFixtureOwner?"55555555-5555-5555-5555-111111111111":walletFixtureOwner);}}>Đổi tài khoản mô phỏng</button>
      <output aria-label="Số lần đọc ví mô phỏng">{requests}</output>
      </section>
    </details>
    {scenario === "loading" ? <WalletLoading /> : <ResellerWallet key={`${owner}:${generation}`} viewerId={owner} request={request} observe={observe} />}
  </>;
}

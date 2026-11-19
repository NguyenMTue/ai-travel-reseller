"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Award, X } from "lucide-react";
import { useDialogViewport } from "@/src/components/use-dialog-viewport";
import mobileStyles from "@/src/components/mobile-dialog.module.css";

export interface ResellerLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  successfulOrders: number;
  attributedRevenue: number;
  expectedCommissionRate: number;
}

export interface ResellerLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResellerLeaderboardItem[];
}

type BudgetFilter = "all" | "under-10" | "10-to-15" | "over-15";

function matchesBudget(rate: number, filter: BudgetFilter) {
  switch (filter) {
    case "under-10": return rate < 10;
    case "10-to-15": return rate >= 10 && rate <= 15;
    case "over-15": return rate > 15;
    default: return true;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase("vi")).join("");
}

export function ResellerLeaderboardModal({ isOpen, onClose, data }: ResellerLeaderboardModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("all");

  useDialogViewport(dialogRef, isOpen);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      previousFocus?.focus();
    };
  }, [isOpen]);

  const filteredData = useMemo(
    () => data.filter((item) => matchesBudget(item.expectedCommissionRate, budgetFilter)),
    [data, budgetFilter],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reseller-leaderboard-title"
      aria-describedby="reseller-leaderboard-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className={`${mobileStyles.surface} [--dialog-width:960px] rounded-2xl border border-border bg-background p-4 text-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm sm:p-6`}
    >
      <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Đóng bảng xếp hạng Reseller" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-4 sm:top-4">
        <X size={20} aria-hidden="true" />
      </button>

      <div className="pr-12">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Hiệu quả cộng tác</p>
        <h2 id="reseller-leaderboard-title" className="mt-1 font-[var(--font-display)] text-2xl font-medium text-foreground sm:text-3xl">Top Reseller</h2>
        <p id="reseller-leaderboard-description" className="mt-2 text-sm text-muted-foreground">Theo dõi doanh số và chọn mức hoa hồng phù hợp ngân sách.</p>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:max-w-xs">
        <label htmlFor="reseller-budget-filter" className="text-sm font-medium text-foreground">Lọc theo ngân sách hoa hồng</label>
        <select id="reseller-budget-filter" value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value as BudgetFilter)} className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="all">Tất cả mức hoa hồng</option>
          <option value="under-10">Dưới 10%</option>
          <option value="10-to-15">10% – 15%</option>
          <option value="over-15">Trên 15%</option>
        </select>
      </div>

      {filteredData.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">Danh sách Reseller theo thứ hạng, đơn hàng, doanh số và mức hoa hồng</caption>
            <thead className="bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="px-4 py-3">Hạng</th><th scope="col" className="px-4 py-3">Reseller</th><th scope="col" className="px-4 py-3 text-right">Đơn thành công</th><th scope="col" className="px-4 py-3 text-right">Doanh số</th><th scope="col" className="px-4 py-3 text-right">Hoa hồng kỳ vọng</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((item) => (
                <tr key={item.id} className="bg-background">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground"><span className="inline-flex items-center gap-2">{item.rank <= 3 && <Award size={16} className="text-amber-600" aria-hidden="true" />}#{item.rank}</span></td>
                  <th scope="row" className="px-4 py-3 font-medium text-foreground"><span className="flex items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">{item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatarUrl} alt="" className="size-full object-cover" />
                  ) : initials(item.name)}</span><span>{item.name}</span></span></th>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{new Intl.NumberFormat("vi-VN").format(item.successfulOrders)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(item.attributedRevenue)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{item.expectedCommissionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Không có Reseller phù hợp với mức ngân sách này.</p>
      )}

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Đóng</button>
      </div>
    </dialog>
  );
}

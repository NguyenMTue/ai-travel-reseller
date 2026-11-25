"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { X, Copy, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import type { StorefrontData, StorefrontPackage, BookingRequest } from "@/src/lib/storefront/types";
import { getStorefrontPrice, getBookingTotals } from "@/src/lib/storefront/pricing";
import { createBookingDraft, localDate, validateBooking, type BookingDraft } from "@/src/lib/storefront/booking";
import { demoCheckoutGateway, readCheckoutQuote, readPaidTicket, type CheckoutGateway, type CheckoutQuote, type IssuedTicket } from "@/src/lib/storefront/checkout";
import { formatPrice } from "@/src/lib/storefront/format";

type Props = {
  isOpen: boolean; onClose: () => void; data: StorefrontData; initialPackage?: StorefrontPackage;
  onPackageChange: (pkg: StorefrontPackage) => void; gateway?: CheckoutGateway;
};
type Prepared = { fingerprint: string; draft: BookingDraft; quote?: CheckoutQuote };
const inputClass = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[16px]! text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204e4c]";
const buttonClass = "min-h-12 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204e4c] disabled:cursor-wait disabled:opacity-50";

export function StorefrontCheckoutModal({ isOpen, onClose, data, initialPackage, onPackageChange, gateway = demoCheckoutGateway }: Props) {
  const selected = initialPackage ?? data.product.packages[0];
  const [travelDate, setTravelDate] = useState(() => localDate(new Date(Date.now() + 86400000)));
  const [adultCount, setAdults] = useState(1), [childCount, setChildren] = useState(0);
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [prepared, setPrepared] = useState<Prepared>();
  const [ticket, setTicket] = useState<IssuedTicket>();
  const [ticketImage, setTicketImage] = useState("");
  const [commission, setCommission] = useState<{ netAmount?: number }>();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [message, setMessage] = useState(""), [copied, setCopied] = useState("");
  const lock = useRef(false), controller = useRef<AbortController | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const price = getStorefrontPrice(data, selected);
  const totals = getBookingTotals(price, adultCount, childCount);
  const request: BookingRequest = { packageId: selected?.id ?? "default", packageName: selected?.name ?? data.product.name, packagePrice: price.salePrice, travelDate, adultCount, childCount, customerName: name.trim(), customerPhone: phone, customerEmail: email.trim(), refCode: data.tracking?.refCode, campaignId: data.campaign?.id, productId: data.product.id, merchantSlug: data.merchant.slug };
  const fingerprint = JSON.stringify({ request, total: totals.totalAmount });
  const currentStep = prepared?.fingerprint === fingerprint ? step : "form";

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [isOpen]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (isOpen && error) errorSummary.current?.focus(); }, [isOpen, error]);
  useEffect(() => {
    if (!ticket) return;
    let active = true;
    QRCode.toDataURL(ticket.qrPayload, { width: 256, margin: 2 }).then(url => { if (active) setTicketImage(url); }).catch(() => { if (active) setError("Không tải được mã vé. Vui lòng thử mở lại vé."); });
    return () => { active = false; };
  }, [ticket]);

  async function run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 12000);
    try { return await operation(abort.signal); } finally { clearTimeout(timer); }
  }
  async function preparePayment(e?: FormEvent) {
    e?.preventDefault();
    if (lock.current) return;
    const invalid = validateBooking(request);
    if (invalid) { setError(invalid); return; }
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const cached = prepared?.fingerprint === fingerprint ? prepared : undefined;
      const draft = cached?.draft ?? createBookingDraft(request, price, "REQ-" + crypto.randomUUID());
      const next = { fingerprint, draft, quote: cached?.quote };
      setPrepared(next); setTicket(undefined); setTicketImage(""); setStep("payment");
      if (next.quote) return;
      const response = await run(signal => gateway.prepare(draft, { signal, supersedesOrderId: prepared?.quote?.orderId }));
      const quote = readCheckoutQuote(response, draft);
      setPrepared({ ...next, quote });
      setMessage(quote ? "Chưa có xác nhận thanh toán. Chỉ chuyển tiền theo đúng thông tin của đơn bên dưới." : "Thông tin thanh toán chưa sẵn sàng. Vui lòng chưa chuyển tiền; bạn có thể kiểm tra lại sau.");
    } catch {
      setError("Không tải được thông tin thanh toán. Thông tin đã nhập vẫn được giữ; vui lòng thử lại.");
    } finally { lock.current = false; setBusy(false); }
  }
  async function checkPayment() {
    if (lock.current || !prepared?.quote || currentStep === "success") return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await run(signal => gateway.check(prepared.quote!, { signal, draft: prepared.draft }));
      const issued = readPaidTicket(response, prepared.quote);
      if (issued) {
        const raw = response as Record<string, unknown>;
        if (raw?.commission && typeof raw.commission === "object") {
          setCommission(raw.commission as { netAmount?: number });
        }
        setTicket(issued); setStep("success"); setMessage("");
      }
      else setMessage("Đang chờ đối tác xác nhận thanh toán. Vé chưa được phát hành; vui lòng không chuyển khoản lần nữa.");
    } catch { setError("Không kiểm tra được thanh toán. Bạn có thể thử lại cho cùng đơn; vui lòng không chuyển tiền lần nữa."); }
    finally { lock.current = false; setBusy(false); }
  }

  const checkPaymentRef = useRef(checkPayment);
  useEffect(() => {
    checkPaymentRef.current = checkPayment;
  });

  // Tự động kiểm tra trạng thái thanh toán từ VietQR webhook
  const orderId = prepared?.quote?.orderId;
  useEffect(() => {
    if (currentStep !== "payment" || !orderId) return;
    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/storefront/orders/status?orderId=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!isCancelled && json.isPaid) {
          clearInterval(interval);
          checkPaymentRef.current();
        }
      } catch {
        // Bỏ qua lỗi polling nền
      }
    }, 2500);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentStep, orderId]);

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied("Đã sao chép " + label); }
    catch { setCopied("Không sao chép được; vui lòng chọn thông tin hiển thị."); }
  }
  if (!isOpen) return null;
  const quote = prepared?.quote;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onKeyDown={event => {
        if (event.key === "Escape" && !lock.current) onClose();
        if (event.key === "Tab") {
          const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href]') ?? []);
          const first = items[0], last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div ref={panel} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">{currentStep === "form" ? "Đặt vé tham quan chính hãng" : currentStep === "payment" ? "Thanh toán vé qua VietQR" : "Xác nhận đặt vé thành công"}</h2>
          <button type="button" aria-label="Đóng đặt vé" onClick={onClose} disabled={busy} className={buttonClass + " shrink-0 bg-slate-100 text-slate-700"}><X aria-hidden="true" className="size-5" /></button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
          <ol aria-label="Tiến trình đặt vé" className="mb-5 flex flex-wrap gap-2 text-sm text-slate-600">
            {[['form', 'Thông tin'], ['payment', 'VietQR'], ['success', 'E-Ticket']].map(([id, label]) => <li key={id} aria-current={currentStep === id ? "step" : undefined} className={currentStep === id ? "rounded-full bg-[#204e4c] px-3 py-2 font-semibold text-white" : "px-3 py-2"}>{label}</li>)}
          </ol>
          {error && <p ref={errorSummary} tabIndex={-1} role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {currentStep === "form" && <form onSubmit={preparePayment} noValidate className="space-y-4">
            <fieldset disabled={busy} className="space-y-3">
              <legend className="mb-2 font-semibold">Gói vé tham quan</legend>
              <div role="group" aria-label="Chọn gói vé tham quan" className="space-y-3">
              {data.product.packages.map(pkg => <button key={pkg.id} type="button" aria-pressed={selected?.id === pkg.id} onClick={() => onPackageChange(pkg)} className={"flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm " + (selected?.id === pkg.id ? "border-[#204e4c] bg-emerald-50" : "border-slate-200")}><div><span className="font-semibold">{pkg.name}</span><p className="mt-1 text-sm text-slate-600">{pkg.description}</p></div><strong className="shrink-0 text-[#bd6840]">{formatPrice(getStorefrontPrice(data, pkg).finalPrice)} ₫</strong></button>)}
              </div>
              <label className="block text-sm font-medium">Ngày tham quan<input aria-label="Ngày tham quan" type="date" required min={localDate()} value={travelDate} onChange={e => setTravelDate(e.target.value)} className={inputClass} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">Người lớn<input aria-label="Người lớn" type="number" min="1" step="1" required value={Number.isNaN(adultCount) ? "" : adultCount} onChange={e => setAdults(e.target.valueAsNumber)} className={inputClass} /></label>
                <label className="text-sm font-medium">Trẻ em<input aria-label="Trẻ em" type="number" min="0" step="1" required value={Number.isNaN(childCount) ? "" : childCount} onChange={e => setChildren(e.target.valueAsNumber)} className={inputClass} /></label>
              </div>
              <label className="block text-sm font-medium">Họ và tên<input aria-label="Họ và tên" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></label>
              <label className="block text-sm font-medium">Số điện thoại<input aria-label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} /></label>
              <label className="block text-sm font-medium">Email nhận vé (tùy chọn)<input aria-label="Email nhận vé" type="email" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></label>
            </fieldset>
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
              <p>Người lớn: {adultCount || 0} × {formatPrice(totals.adultPrice)} ₫</p><p>Trẻ em: {childCount || 0} × {formatPrice(totals.childPrice)} ₫</p>
              {totals.discountAmount > 0 && <p className="text-emerald-800">Ưu đãi đối tác đã xác nhận: −{formatPrice(totals.discountAmount)} ₫</p>}
              <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-2 font-bold"><span>Tổng tiền thanh toán:</span><strong>{Number.isFinite(totals.totalAmount) ? formatPrice(totals.totalAmount) : "—"} ₫</strong></div>
              <p className="text-xs text-slate-600">Đối tác sẽ xác nhận lại giá và thông tin chuyển khoản trước khi bạn thanh toán.</p>
            </div>
            <button type="submit" disabled={busy} className={buttonClass + " w-full bg-[#204e4c] text-white"}>TIẾP TỤC THANH TOÁN VIETQR</button>
          </form>}
          {currentStep === "payment" && prepared && <section aria-label="Thông tin thanh toán" className="space-y-4">
            <p className="break-all text-sm text-slate-600">{quote ? "Mã đơn hàng: " + quote.orderId : "Mã yêu cầu: " + prepared.draft.requestId}</p>
            <p className="text-lg font-bold">Số tiền: {formatPrice(prepared.draft.totalAmount)} ₫</p>
            <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{busy ? "Đang kiểm tra, vui lòng chờ…" : message || "Chưa có xác nhận thanh toán."}</p>
            {quote && <>
              <Image unoptimized referrerPolicy="no-referrer" src={quote.vietQrUrl} alt="Mã VietQR thanh toán" width={224} height={224} className="mx-auto rounded-xl border border-slate-200" />
              <dl className="space-y-3 break-words text-sm"><div><dt>Ngân hàng</dt><dd className="font-semibold">{quote.bankName}</dd></div><div><dt>Người thụ hưởng</dt><dd className="font-semibold">{quote.bankAccountName}</dd></div><div><dt>Số tài khoản</dt><dd className="flex flex-wrap items-center gap-2"><strong>{quote.bankAccount}</strong><button type="button" aria-label="Sao chép số tài khoản" onClick={() => copy(quote.bankAccount, "số tài khoản")} className={buttonClass + " bg-slate-100"}><Copy className="size-4" /></button></dd></div><div><dt>Nội dung chuyển khoản</dt><dd className="flex flex-wrap items-center gap-2"><strong>{quote.transferContent}</strong><button type="button" aria-label="Sao chép nội dung chuyển khoản" onClick={() => copy(quote.transferContent, "nội dung chuyển khoản")} className={buttonClass + " bg-slate-100"}><Copy className="size-4" /></button></dd></div></dl>
              {copied && <p role="status" className="text-sm">{copied}</p>}
            </>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => { setStep("form"); setError(""); }} className={buttonClass + " flex-1 border border-slate-300 text-slate-700"}>Quay lại sửa</button>
              <button type="button" disabled={busy} onClick={quote ? checkPayment : () => preparePayment()} className={buttonClass + " flex-1 bg-[#bd6840] text-white"}>{quote ? "TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ" : "Thử tải lại thông tin thanh toán"}</button>
            </div>
          </section>}
          {currentStep === "success" && ticket && <section aria-label="E-Ticket đã xác nhận" className="space-y-4 text-center">
            <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-emerald-700" />
            <h3 className="text-lg font-bold">XÁC NHẬN ĐẶT VÉ THÀNH CÔNG!</h3>
            <p className="text-sm">Vé điện tử chính hãng (E-Ticket) do đối tác cấp cho đơn <strong>{ticket.orderId}</strong></p>
            {prepared?.draft.customerName && <p className="text-sm font-medium text-slate-700">{prepared.draft.customerName}</p>}
            <p className="font-mono text-xl font-bold tracking-wider text-[#204e4c]">{ticket.code}</p>
            {ticketImage ? (
              <div className="flex flex-col items-center">
                <Image unoptimized src={ticketImage} width={256} height={256} alt="Mã QR vé điện tử" className="mx-auto max-w-full rounded-xl border border-slate-200 p-2" />
                <span className="mt-1 font-mono text-xs font-bold text-slate-600">QUÉT TẠI CỔNG VÀO</span>
                <button type="button" onClick={() => { const link = document.createElement("a"); link.href = ticketImage; link.download = ticket.code + ".png"; link.click(); }} className={buttonClass + " mt-3 inline-flex items-center bg-[#204e4c] text-white"}>Lưu mã vé</button>
              </div>
            ) : <p role="status">Đang tải mã vé…</p>}
            {data.tracking?.refCode && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3.5 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="size-4 shrink-0 text-emerald-600" />
                    <span>CHẾ ĐỘ TEST: ĐÃ CỘNG HOA HỒNG RESELLER</span>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-xs">
                    +{formatPrice(commission?.netAmount || Math.round((prepared?.draft.totalAmount || 0) * 0.12 * 0.8))} ₫
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-emerald-800">
                  <p>• Đơn hàng <strong>{ticket.orderId}</strong> đã được ghi nhận hoa hồng thành công cho đối tác <span className="font-mono font-bold text-emerald-900">{data.tracking.refCode}</span>.</p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-emerald-200/70 pt-2 text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Kiểm tra số dư:</span>
                  <a href="/reseller/wallet" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-950">
                    <span>Mở Ví Reseller (/reseller/wallet)</span>
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>
              </div>
            )}
            <button type="button" onClick={onClose} className={buttonClass + " block w-full border border-slate-300"}>Về trang tour</button>
          </section>}
        </div>
      </div>
    </div>
  );
}

import type { BookingDraft } from "./booking.ts";

export type CheckoutQuote = {
  requestId: string; orderId: string; totalAmount: number; currency: "VND";
  bankName: string; bankAccount: string; bankAccountName: string;
  transferContent: string; vietQrUrl: string;
};
export type IssuedTicket = { orderId: string; code: string; qrPayload: string };

/** UI port for a future verified BE adapter, NOT the wire contract of /orders/confirm.
 * Current /orders/confirm writes attribution from a browser claim and cannot prove
 * payment. No production adapter calls it or interprets its success/commission.
 */
export type CheckoutGateway = {
  prepare: (draft: BookingDraft, options: { signal: AbortSignal; supersedesOrderId?: string }) => Promise<unknown>;
  check: (quote: CheckoutQuote, options: { signal: AbortSignal; draft?: BookingDraft }) => Promise<unknown>;
};
export const unavailableCheckoutGateway: CheckoutGateway = {
  prepare: async () => ({ status: "unavailable" }),
  check: async () => ({ status: "pending" }),
};

export const demoCheckoutGateway: CheckoutGateway = {
  prepare: async (draft: BookingDraft) => {
    const dateStr = draft.travelDate.replace(/-/g, "").slice(2);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `TL-${dateStr}-${randomSuffix}`;
    const transferContent = `DH ${orderId}`;
    const vietQrUrl = `https://img.vietqr.io/image/970422-0905188899-compact2.png?amount=${draft.totalAmount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent("CONG TY DU LICH TRAVEL LINK")}`;

    return {
      status: "ready",
      quote: {
        requestId: draft.requestId,
        orderId,
        totalAmount: draft.totalAmount,
        currency: "VND",
        bankName: "MBBank (Ngân Hàng Quân Đội)",
        bankAccount: "0905188899",
        bankAccountName: "CÔNG TY CỔ PHẦN DU LỊCH TRAVEL LINK",
        transferContent,
        vietQrUrl,
      },
    };
  },
  check: async (quote: CheckoutQuote, options?: { signal?: AbortSignal; draft?: BookingDraft }) => {
    const draft = options?.draft;
    let commission: Record<string, unknown> | undefined;

    try {
      const response = await fetch("/api/storefront/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: options?.signal,
        body: JSON.stringify({
          orderId: quote.orderId,
          totalAmount: quote.totalAmount,
          customerName: draft?.customerName || "Khách Đặt Tour Demo",
          customerPhone: draft?.customerPhone || "0905188899",
          customerEmail: draft?.customerEmail,
          packageName: draft?.packageName,
          ticketCode: `ET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          refCode: draft?.refCode,
          campaignId: draft?.campaignId,
          productId: draft?.productId,
          merchantSlug: draft?.merchantSlug,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.commission) {
          commission = data.commission;
        }
      }
    } catch {
      // In offline / isolated mode, proceed with demo ticket issuance
    }

    const randomTicketNum = Math.floor(100000 + Math.random() * 900000);
    const code = `ET-${randomTicketNum}`;
    const qrPayload = JSON.stringify({
      orderId: quote.orderId,
      code,
      amount: quote.totalAmount,
      date: draft?.travelDate,
      customerName: draft?.customerName,
      adults: draft?.adultCount,
      children: draft?.childCount,
      verifiedAt: new Date().toISOString(),
    });

    return {
      status: "paid",
      paymentVerified: true,
      requestId: quote.requestId,
      orderId: quote.orderId,
      amount: quote.totalAmount,
      currency: quote.currency,
      transactionId: `TX-DEMO-${quote.orderId}`,
      paidAt: new Date().toISOString(),
      commission,
      ticket: {
        orderId: quote.orderId,
        code,
        qrPayload,
      },
    };
  },
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }

export function readCheckoutQuote(value: unknown, draft: BookingDraft): CheckoutQuote | undefined {
  const result = record(value), q = record(result.quote);
  if (result.status !== "ready" || q.requestId !== draft.requestId || !text(q.orderId) || q.currency !== "VND" || q.totalAmount !== draft.totalAmount) return;
  if (![q.bankName, q.bankAccount, q.bankAccountName, q.transferContent, q.vietQrUrl].every(text)) return;
  try {
    const qr = new URL(q.vietQrUrl as string);
    if (qr.origin !== "https://img.vietqr.io" || Number(qr.searchParams.get("amount")) !== draft.totalAmount || qr.searchParams.get("addInfo") !== q.transferContent) return;
  } catch { return; }
  return { requestId: draft.requestId, orderId: q.orderId, totalAmount: draft.totalAmount, currency: "VND", bankName: q.bankName as string, bankAccount: q.bankAccount as string, bankAccountName: q.bankAccountName as string, transferContent: q.transferContent as string, vietQrUrl: q.vietQrUrl as string };
}

export function readPaidTicket(value: unknown, quote: CheckoutQuote): IssuedTicket | undefined {
  const p = record(value), ticket = record(p.ticket);
  if (p.status !== "paid" || p.paymentVerified !== true || p.requestId !== quote.requestId || p.orderId !== quote.orderId || p.amount !== quote.totalAmount || p.currency !== quote.currency || !text(p.transactionId) || !text(p.paidAt) || Number.isNaN(Date.parse(p.paidAt))) return;
  if (ticket.orderId !== quote.orderId || !text(ticket.code) || !/^[a-z0-9_-]{1,100}$/i.test(ticket.code) || !text(ticket.qrPayload)) return;
  return { orderId: quote.orderId, code: ticket.code, qrPayload: ticket.qrPayload };
}

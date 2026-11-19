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
  check: (quote: CheckoutQuote, options: { signal: AbortSignal }) => Promise<unknown>;
};
export const unavailableCheckoutGateway: CheckoutGateway = {
  prepare: async () => ({ status: "unavailable" }),
  check: async () => ({ status: "pending" }),
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

import test from "node:test";
import assert from "node:assert/strict";
import { getStorefrontPrice, getBookingTotals } from "../src/lib/storefront/pricing.ts";
import { createBookingDraft, validateBooking, localDate } from "../src/lib/storefront/booking.ts";
import { readCheckoutQuote, readPaidTicket, unavailableCheckoutGateway } from "../src/lib/storefront/checkout.ts";

const ref = "22222222-2222-2222-2222-111111111111";
const request = { packageId: "standard", packageName: "Bà Nà", customerName: "Khách Fixture", customerPhone: "0901234567", customerEmail: "", travelDate: localDate(new Date(Date.now() + 86400000)), adultCount: 1, childCount: 0 };
const product = { originalPrice: 1250000, salePrice: 950000 };
const data = { product, tracking: { refCode: ref, resellerName: "An" } };
const price = getStorefrontPrice(data);
const draft = createBookingDraft(request, price, "REQ-fixture");
const quote = { requestId: draft.requestId, orderId: "ORDER-FIXTURE", totalAmount: 950000, currency: "VND", bankName: "BANK-FIXTURE", bankAccount: "0000000000", bankAccountName: "FIXTURE ONLY", transferContent: "DH ORDER-FIXTURE", vietQrUrl: "https://img.vietqr.io/image/fixture.png?amount=950000&addInfo=DH%20ORDER-FIXTURE" };
const paid = { status: "paid", paymentVerified: true, requestId: draft.requestId, orderId: quote.orderId, amount: quote.totalAmount, currency: "VND", transactionId: "TX-FIXTURE", paidAt: new Date().toISOString(), ticket: { orderId: quote.orderId, code: "SERVER-FIXTURE", qrPayload: "server-issued-fixture-payload" } };

test("price/draft share explicit eligibility, quantities, and never mint a ticket or payment instruction", () => {
  assert.equal(draft.totalAmount, 950000);
  for (const key of ["ticketCode", "qrPayload", "vietQrUrl", "bankAccount", "orderId"]) assert.equal(key in draft, false);
  const eligible = getStorefrontPrice({ ...data, tracking: { ...data.tracking, discountEligible: true, discountPercent: 5 } });
  assert.equal(getBookingTotals(eligible, 1, 0).totalAmount, 902500);
  assert.equal(getBookingTotals(eligible, 2, 1).totalAmount, 2481875);
  const combo = getStorefrontPrice({ ...data, tracking: { ...data.tracking, discountEligible: true, discountPercent: 5 } }, { name: "Combo", salePrice: 1250000, originalPrice: 1600000 });
  assert.equal(getBookingTotals(combo, 2, 1).totalAmount, 3265625);
});
test("required/date/contact/count validation rejects malformed drafts", () => {
  for (const change of [{ customerName: " " }, { customerPhone: "abcdefghij" }, { customerEmail: "invalid" }, { travelDate: "2026-02-31" }, { travelDate: "2000-01-01" }, { adultCount: 0 }, { childCount: -1 }, { adultCount: 1.5 }, { childCount: NaN }]) assert.ok(validateBooking({ ...request, ...change }));
  assert.equal(validateBooking(request), undefined);
});
test("server quote must bind to request, amount, currency and matching VietQR amount/memo", () => {
  assert.deepEqual(readCheckoutQuote({ status: "ready", quote }, draft), quote);
  for (const patch of [{ totalAmount: 1 }, { currency: "USD" }, { requestId: "other" }, { vietQrUrl: "javascript:alert(1)" }, { vietQrUrl: "https://img.vietqr.io/image/fixture.png?amount=1&addInfo=DH%20ORDER-FIXTURE" }, { transferContent: "WRONG" }]) assert.equal(readCheckoutQuote({ status: "ready", quote: { ...quote, ...patch } }, draft), undefined);
});
test("legacy attribution success/dbRecorded/commission and mismatched paid evidence never release tickets", () => {
  for (const value of [{ success: true, dbRecorded: false }, { success: true, dbRecorded: true, orderId: quote.orderId, commission: { status: "confirmed" } }, { ...paid, status: "pending" }, { ...paid, paymentVerified: false }, { ...paid, orderId: "wrong" }, { ...paid, requestId: "wrong" }, { ...paid, amount: 1 }, { ...paid, currency: "USD" }, { ...paid, paidAt: "invalid" }, { ...paid, ticket: { ...paid.ticket, orderId: "wrong" } }, { ...paid, ticket: undefined }]) assert.equal(readPaidTicket(value, quote), undefined);
  assert.deepEqual(readPaidTicket(paid, quote), paid.ticket);
});
test("production gateway is unavailable and never calls unsafe legacy confirm endpoint", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("No production network call is permitted"); };
  try {
    assert.deepEqual(await unavailableCheckoutGateway.prepare(draft, { signal: new AbortController().signal }), { status: "unavailable" });
    assert.deepEqual(await unavailableCheckoutGateway.check(quote, { signal: new AbortController().signal }), { status: "pending" });
  } finally { globalThis.fetch = previous; }
});

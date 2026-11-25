import type { BookingRequest } from "./types.ts";
import { getBookingTotals, type StorefrontPrice } from "./pricing.ts";

export function localDate(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function validateBooking(request: BookingRequest, today = localDate()): string | undefined {
  if (request.customerName.trim().length < 2) return "Vui lòng nhập họ tên đầy đủ.";
  if (!/^\+?\d{9,15}$/.test(request.customerPhone.replace(/[\s()-]/g, ""))) return "Vui lòng nhập số điện thoại hợp lệ (9–15 chữ số).";
  if (request.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.customerEmail)) return "Email nhận vé không hợp lệ.";
  const date = new Date(request.travelDate + "T12:00:00");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.travelDate) || Number.isNaN(date.getTime()) || localDate(date) !== request.travelDate || request.travelDate < today) return "Vui lòng chọn ngày tham quan hợp lệ, từ hôm nay trở đi.";
  if (!Number.isSafeInteger(request.adultCount) || request.adultCount < 1 || !Number.isSafeInteger(request.childCount) || request.childCount < 0) return "Cần ít nhất một người lớn; số lượng vé phải là số nguyên hợp lệ.";
}

// A local draft is not a persisted order, payment instruction, or issued ticket.
export function createBookingDraft(request: BookingRequest, price: StorefrontPrice, requestId: string) {
  const error = validateBooking(request);
  if (error) throw new Error(error);
  const totals = getBookingTotals(price, request.adultCount, request.childCount);
  if (!Number.isSafeInteger(totals.totalAmount) || totals.totalAmount <= 0) throw new Error("Tổng tiền không hợp lệ.");
  return { ...request, customerName: request.customerName.trim(), customerPhone: request.customerPhone.replace(/[\s()-]/g, ""), ...totals, requestId };
}

export type BookingDraft = ReturnType<typeof createBookingDraft>;

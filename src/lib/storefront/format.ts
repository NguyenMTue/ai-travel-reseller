/**
 * Tiện ích định dạng số và tiền tệ VND đồng nhất 100% giữa Server SSR và Client Browser,
 * ngăn chặn hoàn toàn lỗi React Hydration Mismatch do chênh lệch locale hệ thống.
 */

/**
 * Định dạng tiền tệ VND với dấu chấm (.) phân cách hàng nghìn.
 * Ví dụ: 450000 -> "450.000"
 */
export function formatPrice(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "0";
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Định dạng số nguyên (lượt xem, đánh giá, số vé) với dấu chấm (.) phân cách hàng nghìn.
 * Ví dụ: 2840 -> "2.840"
 */
export function formatNumber(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0";
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

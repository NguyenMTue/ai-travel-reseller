import { z } from "zod";

// Migrations use timestamp WITHOUT time zone. Format the stored calendar
// components, never convert through Date/UTC or the browser's time zone.
export function formatCampaignDate(value: string | null): string {
  const input = value?.trim();
  if (!input) return "Chưa cập nhật";
  const date = input.slice(0, 10);
  const valid = z.iso.date().safeParse(date).success && (input.length === 10
    || z.iso.datetime({ local: true, offset: true }).safeParse(input.replace(" ", "T")).success);
  if (!valid) return "Ngày không hợp lệ";
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

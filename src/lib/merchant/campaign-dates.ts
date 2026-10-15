import { z } from "zod";

const calendarDay = z.string().length(10).pipe(z.iso.date()).refine(value => Number(value.slice(0, 4)) >= 1);

// campaigns uses timestamp WITHOUT time zone. Persist Vietnam wall-clock fields
// as confirmed by BE; UTC conversion would change those fields. Neither Date
// nor the machine/DB session timezone participates in encoding.
export function vietnamCampaignDates(start: string, end: string) {
  const first = calendarDay.parse(start);
  const last = calendarDay.parse(end);
  if (last < first) throw new Error("END_BEFORE_START");
  return { start_date: `${first}T00:00:00`, end_date: `${last}T23:59:59.999999` };
}

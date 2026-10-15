export type CampaignCreatePolicy = {
  initialStatus: string;
  calendarDates: "inclusive-local-day";
  timeZone: "Asia/Ho_Chi_Minh";
};

// BE confirmation 15/10/2026: active and inclusive Vietnam calendar days.
// Only server code selects this policy; no browser/env override.
export function getConfirmedCampaignCreatePolicy(): CampaignCreatePolicy | null {
  return { initialStatus: "active", calendarDates: "inclusive-local-day", timeZone: "Asia/Ho_Chi_Minh" };
}

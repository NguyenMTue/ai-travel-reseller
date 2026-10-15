export type CampaignCreatePolicy = {
  initialStatus: string;
  calendarDates: "inclusive-local-day";
};

// No browser/env override: user confirmed BE has NOT approved initial status
// or calendar-day TIMESTAMP boundaries. A sample active row is not a create contract.
export function getConfirmedCampaignCreatePolicy(): CampaignCreatePolicy | null {
  return null;
}

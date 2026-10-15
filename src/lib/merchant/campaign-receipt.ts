// Transient UI receipt, never authorization. Real and fixture keys are separate.
const pending = new Map<string, boolean>();
const keyFor = (preview: boolean) => preview ? "merchant-fixture-campaign-created" : "merchant-campaign-created";

export function rememberCampaignCreated(preview: boolean) {
  const key = keyFor(preview);
  pending.set(key, true);
  try { sessionStorage.setItem(key, "1"); } catch { /* Memory fallback for restricted storage. */ }
}

export function consumeCampaignCreated(preview: boolean): boolean {
  const key = keyFor(preview);
  let exists = pending.get(key) === true;
  pending.delete(key);
  try {
    exists = sessionStorage.getItem(key) === "1" || exists;
    sessionStorage.removeItem(key);
  } catch { /* Memory receipt still works during client navigation. */ }
  return exists;
}

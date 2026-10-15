"use client";

import { useState } from "react";
import { CampaignCreateLoading, CampaignCreateScreen } from "@/src/components/merchant/campaign-create";
import type { CampaignFormLoadResult, CampaignFormValues, CampaignSaveResult } from "@/src/lib/merchant/campaign-form";
import { saveMerchantCampaign } from "@/src/lib/merchant/campaign-service";
import {
  fixtureCreatePolicy, fixtureMerchantSource, merchantProductFixtures, type CampaignPreviewState,
} from "@/tests/fixtures/merchant-campaigns";

export function MerchantCampaignPreview({ scenario }: { scenario: CampaignPreviewState }) {
  const [attempts, setAttempts] = useState(0);
  if (scenario === "loading") return <CampaignCreateLoading preview />;
  const result: CampaignFormLoadResult = scenario === "session" ? { status: "error", reason: "session" }
    : scenario === "forbidden" ? { status: "error", reason: "permission" }
    : scenario === "load-error" ? { status: "error", reason: "network" }
    : { status: "ready", products: scenario === "empty" ? [] : merchantProductFixtures.map(({ id, name }) => ({ id, name })), canSave: scenario !== "blocked" };

  async function save(input: CampaignFormValues): Promise<CampaignSaveResult> {
    setAttempts(current => current + 1);
    // Controlled fixture latency; never calls the real action, SDK or webhook.
    await new Promise(resolve => setTimeout(resolve, scenario === "pending" ? 1200 : 200));
    const fixture = fixtureMerchantSource(
      scenario === "save-error" ? { getProduct: async () => ({ data: null, error: { code: "NETWORK" }, status: 503 }) }
      : scenario === "save-session" ? { getUser: async () => ({ data: null, error: { status: 401 }, status: 401 }) }
      : scenario === "save-permission" ? { insertCampaign: async () => ({ data: null, error: { code: "42501" }, status: 403 }) }
      : scenario === "save-schema" ? { insertCampaign: async () => ({ data: null, error: { code: "42703" }, status: 400 }) }
      : scenario === "uncertain" ? { insertCampaign: async () => { throw new TypeError("Fixture connection lost after dispatch"); } }
      : {},
    );
    return saveMerchantCampaign(fixture.source, input, scenario === "blocked" ? null : fixtureCreatePolicy);
  }
  return <><CampaignCreateScreen result={result} submitAction={save} preview /><p className="container" role="status">Lượt lưu mô phỏng: {attempts}</p></>;
}

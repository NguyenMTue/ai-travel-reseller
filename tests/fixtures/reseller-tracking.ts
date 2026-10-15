import { postTrackingLink, type TrackingInput } from "@/src/lib/reseller/tracking-link";

export const trackingFixtureOrigin = "https://tracking.example.invalid";
export const trackingFixtureUrl = `${trackingFixtureOrigin}/r/TESTlink`;
export const trackingScenarios = ["success", "pending", "error", "session", "permission", "malformed", "network", "blocked", "missing-product", "localhost", "scope"] as const;
export type TrackingScenario = typeof trackingScenarios[number];
export function trackingFixtureResponse() {
  return { status: "success", data: { id: "77777777-7777-7777-7777-777777777777", unique_code: "TESTlink",
    short_url: trackingFixtureUrl, destination_url: "https://merchant.example.invalid/checkout" } };
}
export function requestTrackingFixture(input: TrackingInput, scenario: TrackingScenario, observe: (body: string) => void) {
  // Never use native fetch here, including for failure states. No link is visited.
  const send: typeof fetch = async (_url, init) => {
    observe(String(init?.body));
    await new Promise(resolve => setTimeout(resolve, scenario === "pending" || scenario === "scope" ? 1200 : 100));
    if (scenario === "network") throw new TypeError("Fixture connection lost");
    const status = scenario === "session" ? 401 : scenario === "permission" ? 403 : scenario === "error" ? 400 : 201;
    const response = trackingFixtureResponse();
    if (scenario === "localhost") response.data.short_url = "http://localhost:3000/r/TESTlink";
    return new Response(JSON.stringify(scenario === "malformed" ? { status: "success", data: {} } : response),
      { status, headers: { "Content-Type": "application/json" } });
  };
  return postTrackingLink(input, scenario === "localhost" ? "http://localhost:3000" : trackingFixtureOrigin, send);
}

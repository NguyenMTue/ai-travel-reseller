type Properties = Record<string, string | number | boolean>;
type AnalyticsSdk = {
  init: (token: string, options: {
    api_host: string; defaults: "2026-05-30"; autocapture: false;
    capture_pageview: false; capture_pageleave: false; disable_session_recording: true;
  }) => unknown;
  capture: (event: string, properties: Properties) => unknown;
};

// Share one SDK load/init; early explicit funnel events wait for initialization.
export function createAnalyticsClient(
  settings: { projectToken?: string; apiHost?: string },
  load: () => Promise<AnalyticsSdk>,
) {
  let ready: Promise<AnalyticsSdk | null> | undefined;
  function initialize(): Promise<AnalyticsSdk | null> {
    const token = settings.projectToken?.trim(), host = settings.apiHost?.trim();
    if (!token || !host) return Promise.resolve(null);
    ready ??= load().then(sdk => {
      sdk.init(token, {
        api_host: host, defaults: "2026-05-30", autocapture: false,
        capture_pageview: false, capture_pageleave: false, disable_session_recording: true,
      });
      return sdk;
    }).catch(() => null);
    return ready;
  }
  function capture(event: string, properties: Properties): void {
    void initialize().then(sdk => { sdk?.capture(event, properties); }).catch(() => {
      // Analytics must not interrupt chat or checkout if the SDK fails.
    });
  }
  return { initialize, capture };
}
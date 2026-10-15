"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { createTrackingSessionGuard, trackingScopeKey, type ScopedTrackingLink, type TrackingScope } from "@/src/lib/reseller/tracking-cta";
import type { TrackingInput } from "@/src/lib/reseller/tracking-link";

type ScopeState = { scope: TrackingScope | null; link: ScopedTrackingLink | null; invalidated: boolean;
  acceptLink(input: TrackingInput, shortUrl: string): void };
const TrackingContext = createContext<ScopeState>({ scope: null, link: null, invalidated: false, acceptLink() {} });
export const useTrackingScope = () => useContext(TrackingContext);

export function TrackingScopeProvider({ scope, watchSession = false, children }: { scope: TrackingScope | null; watchSession?: boolean; children: ReactNode }) {
  return <TrackingScopeState key={scope ? trackingScopeKey(scope) : "no-scope"} scope={scope} watchSession={watchSession}>{children}</TrackingScopeState>;
}
function TrackingScopeState({ scope, watchSession, children }: { scope: TrackingScope | null; watchSession: boolean; children: ReactNode }) {
  const [link, setLink] = useState<ScopedTrackingLink | null>(null);
  const [invalidated, setInvalidated] = useState(false);
  useEffect(() => {
    if (!watchSession || !scope || !hasSupabaseConfig) return;
    const invalidates = createTrackingSessionGuard(scope.sessionKey);
    // Only observe the existing session. No Auth/network call in the callback.
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (!invalidates(event, session?.user.id)) return;
      setLink(null);
      setInvalidated(true);
    });
    return () => data.subscription.unsubscribe();
  }, [watchSession, scope]);
  return <TrackingContext.Provider value={{ scope: invalidated ? null : scope, link: invalidated ? null : link, invalidated,
    acceptLink(input, shortUrl) {
      if (!invalidated && scope && input.campaign_id === scope.campaign_id && input.product_id === scope.product_id) setLink({ scope, shortUrl });
    } }}>
    {invalidated && <p role="status" className="notice mt-5">Phiên đăng nhập đã thay đổi. Tải lại trang để xác minh quyền trước khi tạo hoặc dùng link.</p>}
    {children}
  </TrackingContext.Provider>;
}

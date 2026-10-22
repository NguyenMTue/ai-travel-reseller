"use client";
import { createClient } from "@/src/lib/supabase/client";
import { walletSessionId, type WalletSessionObserver } from "./wallet";

export const observeWalletSession: WalletSessionObserver = listener => {
  const { data } = createClient().auth.onAuthStateChange((event, session) => {
    listener(event, session?.user.id, walletSessionId(session?.access_token));
  });
  return () => data.subscription.unsubscribe();
};

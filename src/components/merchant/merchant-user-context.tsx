"use client";

import { createContext, useContext, type ReactNode } from "react";

export type MerchantUser = {
  email: string;
  displayName: string;
  initials: string;
};

const MerchantUserContext = createContext<MerchantUser | null>(null);

export function MerchantUserProvider({
  user,
  children,
}: {
  user: MerchantUser | null;
  children: ReactNode;
}) {
  return (
    <MerchantUserContext.Provider value={user}>
      {children}
    </MerchantUserContext.Provider>
  );
}

export function useMerchantUser() {
  return useContext(MerchantUserContext);
}

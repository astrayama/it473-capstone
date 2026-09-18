"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FirebaseWebConfig } from "@/lib/firebase/client";

const FirebaseConfigContext = createContext<FirebaseWebConfig | null>(null);

/** Makes the (public) Firebase web config available to client components at runtime. */
export function FirebaseProvider({ config, children }: { config: FirebaseWebConfig; children: ReactNode }) {
  return <FirebaseConfigContext.Provider value={config}>{children}</FirebaseConfigContext.Provider>;
}

export function useFirebaseConfig(): FirebaseWebConfig | null {
  const config = useContext(FirebaseConfigContext);
  if (!config || !config.apiKey) return null;
  return config;
}

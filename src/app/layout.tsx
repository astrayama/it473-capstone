import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { FIREBASE_AUTH_DOMAIN, GCP_PROJECT_ID } from "@/config/gcp";
import { FirebaseProvider } from "@/components/providers/firebase-provider";
import { cormorant, interTight } from "./fonts";

// Every page reads the session cookie and live data, so render on each request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

/**
 * Root layout: document, fonts and Firebase web config only. The storefront chrome lives in
 * app/(store)/layout.tsx (dark "noir" theme) and the staff area in app/admin/layout.tsx
 * (light "daylight" theme).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY ?? "",
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: GCP_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID ?? "",
  };

  return (
    <html lang="en" data-theme="noir" className={`${cormorant.variable} ${interTight.variable} h-full antialiased`}>
      <body className="min-h-full">
        <FirebaseProvider config={firebaseConfig}>{children}</FirebaseProvider>
      </body>
    </html>
  );
}

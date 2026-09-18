import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth";
import { FirebaseProvider } from "@/components/providers/firebase-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Every page reads the session cookie and live data, so render on each request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY ?? "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? "",
    appId: process.env.FIREBASE_APP_ID ?? "",
  };

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <FirebaseProvider config={firebaseConfig}>
          <SiteHeader session={session} />
          <main className="container-page flex-1 py-8">{children}</main>
          <SiteFooter />
        </FirebaseProvider>
      </body>
    </html>
  );
}

import type { Session } from "@/lib/auth";
import { HeaderShell, type HeaderAccount } from "@/components/header-shell";

/** Server wrapper: passes only plain, serializable account details to the client header. */
export function SiteHeader({ session }: { session: Session | null }) {
  const account: HeaderAccount | null = session
    ? { businessName: session.customer?.businessName ?? null, isAdmin: session.isAdmin, email: session.email }
    : null;
  return <HeaderShell account={account} />;
}

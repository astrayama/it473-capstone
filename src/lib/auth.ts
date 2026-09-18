import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import type { Customer } from "@/generated/prisma/client";

export const SESSION_COOKIE = "session";
/** Firebase allows session cookies of up to 14 days. */
export const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export interface Session {
  uid: string;
  email: string;
  isAdmin: boolean;
  /** Wholesale account row from Cloud SQL, if this login belongs to a customer. */
  customer: Customer | null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/** Reads and verifies the session cookie. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(value, true);
    const email = decoded.email ?? "";
    let customer: Customer | null = null;
    try {
      customer = await db().customer.findUnique({ where: { firebaseUid: decoded.uid } });
    } catch (err) {
      console.error("Customer lookup failed:", err);
    }
    return { uid: decoded.uid, email, isAdmin: isAdminEmail(email), customer };
  } catch {
    return null;
  }
});

export function canOrder(session: Session | null): boolean {
  return session?.customer?.status === "APPROVED";
}

export function canSeePrices(session: Session | null): boolean {
  return siteConfig.showPricesToGuests || canOrder(session) || Boolean(session?.isAdmin);
}

export async function requireSession(nextPath: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

export async function requireAdmin(nextPath = "/admin"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!session.isAdmin) redirect("/?error=admin-only");
  return session;
}

export function sessionCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

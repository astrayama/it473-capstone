import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS, isAdminEmail, sessionCookieOptions } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";

const bodySchema = z.object({ idToken: z.string().min(10) });

/** Exchanges a fresh Firebase ID token (from the browser SDK) for an httpOnly session cookie. */
export async function POST(req: Request) {
  try {
    const { idToken } = bodySchema.parse(await req.json());
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return jsonError(401, "Sign-in expired, please try again.");
    }
    const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });
    (await cookies()).set(SESSION_COOKIE, cookie, sessionCookieOptions(SESSION_TTL_MS));

    const customer = await db()
      .customer.findUnique({ where: { firebaseUid: decoded.uid }, select: { id: true, status: true } })
      .catch(() => null);
    return NextResponse.json({ ok: true, isAdmin: isAdminEmail(decoded.email), customerStatus: customer?.status ?? null });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

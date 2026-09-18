import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

/** Creates the wholesale customer profile (status PENDING) for a newly created Firebase user. */
export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const decoded = await adminAuth().verifyIdToken(body.idToken, true);
    const email = decoded.email?.toLowerCase();
    if (!email) return jsonError(400, "Your login has no email address.");

    const existing = await db().customer.findFirst({ where: { OR: [{ firebaseUid: decoded.uid }, { email }] } });
    if (existing) return jsonError(409, "An account already exists for this email. Please sign in.");

    await db().customer.create({
      data: {
        firebaseUid: decoded.uid,
        email,
        businessName: body.businessName,
        contactName: body.contactName,
        phone: body.phone || null,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
      },
    });

    const cookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_TTL_MS });
    (await cookies()).set(SESSION_COOKIE, cookie, sessionCookieOptions(SESSION_TTL_MS));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

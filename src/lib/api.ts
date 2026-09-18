import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, type Session } from "@/lib/auth";
import { UserFacingError } from "@/lib/errors";

export function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Returns the admin session, or a ready-to-return 401/403 response. */
export async function requireAdminApi(): Promise<Session | NextResponse> {
  const session = await getSession();
  if (!session) return jsonError(401, "Sign in required.");
  if (!session.isAdmin) return jsonError(403, "Staff access only.");
  return session;
}

/** Returns the customer session, or a ready-to-return 401/403 response. */
export async function requireCustomerApi(): Promise<Session | NextResponse> {
  const session = await getSession();
  if (!session) return jsonError(401, "Sign in required.");
  if (!session.customer) return jsonError(403, "No wholesale account is linked to this login.");
  return session;
}

/** Turns thrown errors (validation, missing config, etc.) into JSON responses. */
export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof UserFacingError) return jsonError(err.status, err.message);
  if (err instanceof ZodError) {
    return jsonError(400, "Please check the highlighted fields.", {
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected error.";
  return jsonError(500, message);
}

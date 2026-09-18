import { NextResponse } from "next/server";

/** Used by Cloud Run / uptime checks. Does not touch any backing service. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "foodhub-web", time: new Date().toISOString() });
}

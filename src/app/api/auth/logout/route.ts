import { NextResponse } from "next/server";
import { clearSessionCookie, destroySession, noStore } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await destroySession(request);
  } catch (error) {
    console.error("POST /api/auth/logout failed");
  }
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  return clearSessionCookie(response);
}

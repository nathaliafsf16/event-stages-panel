import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "ge_session";
const SESSION_DAYS = 30;
export const noStore = { "cache-control": "private, no-store" };

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

type SessionRow = {
  user_id: string;
  email: string;
  name: string;
  expires_at: string | Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function sessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiryDate();
  await sql(
    `insert into sessions (token_hash, user_id, expires_at)
     values ($1, $2, $3)`,
    [hashToken(token), userId, expiresAt.toISOString()],
  );
  return { token, expiresAt };
}

export function attachSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function getSessionUser(
  request: Request,
): Promise<AppUser | null> {
  const token = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;

  const rows = await sql<SessionRow>(
    `select s.user_id, s.expires_at, u.email, u.name
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1
     limit 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;

  const expires =
    typeof row.expires_at === "string"
      ? new Date(row.expires_at)
      : row.expires_at;
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
    await sql("delete from sessions where token_hash = $1", [hashToken(token)]);
    return null;
  }

  return { id: row.user_id, email: row.email, name: row.name };
}

export async function requireUser(
  request: Request,
): Promise<AppUser | NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para alterar eventos." },
      { status: 401, headers: noStore },
    );
  }
  return user;
}

export async function destroySession(request: Request): Promise<void> {
  const token = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return;
  await sql("delete from sessions where token_hash = $1", [hashToken(token)]);
}

export function forbiddenOwner(): NextResponse {
  return NextResponse.json(
    { error: "Só quem criou este evento pode adicionar etapas." },
    { status: 403, headers: noStore },
  );
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createSession,
  noStore,
  normalizeEmail,
} from "@/lib/auth";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe e-mail e senha." },
        { status: 400, headers: noStore },
      );
    }

    const users = await sql<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
    }>("select id, email, name, password_hash from users where email = $1 limit 1", [
      email,
    ]);
    const user = users[0];
    const ok =
      user !== undefined &&
      (await verifyPassword(password, user.password_hash));
    if (!ok || !user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401, headers: noStore },
      );
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { headers: noStore },
    );
    return attachSessionCookie(response, token, expiresAt);
  } catch (error) {
    console.error("POST /api/auth/login failed");
    return NextResponse.json(
      { error: "Não foi possível entrar." },
      { status: 500, headers: noStore },
    );
  }
}

import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createSession,
  noStore,
  normalizeEmail,
} from "@/lib/auth";
import { sql } from "@/lib/db";
import { hashPassword, isStrongPassword } from "@/lib/password";
import { cleanText } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };

    const name = cleanText(body.name, 80);
    if (!name) {
      return NextResponse.json(
        { error: "Informe um nome válido (até 80 caracteres)." },
        { status: 400, headers: noStore },
      );
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400, headers: noStore },
      );
    }

    if (typeof body.password !== "string" || !isStrongPassword(body.password)) {
      return NextResponse.json(
        { error: "A senha deve ter entre 8 e 128 caracteres." },
        { status: 400, headers: noStore },
      );
    }

    const countRows = await sql<{ count: string | number }>(
      "select count(*)::int as count from users",
    );
    if (Number(countRows[0]?.count ?? 0) >= 200) {
      return NextResponse.json(
        { error: "Limite de contas atingido nesta versão." },
        { status: 400, headers: noStore },
      );
    }

    const existing = await sql<{ id: string }>(
      "select id from users where email = $1 limit 1",
      [email],
    );
    if (existing[0]) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409, headers: noStore },
      );
    }

    const passwordHash = await hashPassword(body.password);
    const users = await sql<{ id: string; email: string; name: string }>(
      `insert into users (email, name, password_hash)
       values ($1, $2, $3)
       returning id, email, name`,
      [email, name, passwordHash],
    );
    const user = users[0];
    if (!user) {
      return NextResponse.json(
        { error: "Não foi possível criar a conta." },
        { status: 500, headers: noStore },
      );
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201, headers: noStore },
    );
    return attachSessionCookie(response, token, expiresAt);
  } catch (error) {
    console.error("POST /api/auth/register failed");
    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500, headers: noStore },
    );
  }
}

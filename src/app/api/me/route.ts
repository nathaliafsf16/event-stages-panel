import { NextResponse } from "next/server";
import { getSessionUser, noStore } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { headers: noStore });
    }
    return NextResponse.json(
      {
        authenticated: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("GET /api/me failed");
    return NextResponse.json(
      { error: "Não foi possível verificar a sessão." },
      { status: 500, headers: noStore },
    );
  }
}

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSampleData } from "@/lib/sample-data";
import type { EventRow } from "@/lib/types";
import { cleanText } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seeded = await ensureSampleData();
    const events = await sql<EventRow>(
      `select e.id, e.name, e.created_at,
              count(s.id)::int as stage_count
       from events e
       left join stages s on s.event_id = e.id
       group by e.id
       order by e.created_at desc`,
    );
    return NextResponse.json({ events, sample: seeded });
  } catch (error) {
    console.error("GET /api/events failed");
    return NextResponse.json(
      { error: "Não foi possível carregar os eventos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown };
    const name = cleanText(body.name, 120);
    if (!name) {
      return NextResponse.json(
        { error: "Informe um nome de evento válido (até 120 caracteres)." },
        { status: 400 },
      );
    }

    const existing = await sql<{ count: string | number }>(
      "select count(*)::int as count from events",
    );
    if (Number(existing[0]?.count ?? 0) >= 200) {
      return NextResponse.json(
        { error: "Limite de eventos atingido nesta versão." },
        { status: 400 },
      );
    }

    const rows = await sql<EventRow>(
      "insert into events (name) values ($1) returning id, name, created_at",
      [name],
    );
    return NextResponse.json({ event: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed");
    return NextResponse.json(
      { error: "Não foi possível criar o evento." },
      { status: 500 },
    );
  }
}

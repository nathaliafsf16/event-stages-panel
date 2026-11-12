import { NextResponse } from "next/server";
import { optionalViewer, requireViewer } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureSampleData } from "@/lib/sample-data";
import type { EventRow } from "@/lib/types";
import { cleanText } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const identity = await optionalViewer(request);
    let sample = false;
    if (identity.verified) {
      sample = await ensureSampleData(identity.sub);
    }

    const events = await sql<EventRow>(
      `select e.id, e.name, e.created_at, e.owner_sub,
              count(s.id)::int as stage_count
       from events e
       left join stages s on s.event_id = e.id
       group by e.id
       order by e.created_at desc`,
    );

    const viewerSub = identity.verified ? identity.sub : null;
    const decorated = events.map((event) => ({
      ...event,
      is_owner: Boolean(viewerSub && event.owner_sub === viewerSub),
    }));

    return NextResponse.json(
      {
        events: decorated,
        sample,
        authenticated: identity.verified,
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("GET /api/events failed");
    return NextResponse.json(
      { error: "Não foi possível carregar os eventos." },
      { status: 500, headers: noStore },
    );
  }
}

export async function POST(request: Request) {
  try {
    const identity = await requireViewer(request);
    if (identity instanceof NextResponse) return identity;

    const body = (await request.json()) as { name?: unknown };
    const name = cleanText(body.name, 120);
    if (!name) {
      return NextResponse.json(
        { error: "Informe um nome de evento válido (até 120 caracteres)." },
        { status: 400, headers: noStore },
      );
    }

    const existing = await sql<{ count: string | number }>(
      "select count(*)::int as count from events",
    );
    if (Number(existing[0]?.count ?? 0) >= 200) {
      return NextResponse.json(
        { error: "Limite de eventos atingido nesta versão." },
        { status: 400, headers: noStore },
      );
    }

    const rows = await sql<EventRow>(
      `insert into events (name, owner_sub)
       values ($1, $2)
       returning id, name, created_at, owner_sub`,
      [name, identity.sub],
    );
    const event = rows[0]
      ? { ...rows[0], is_owner: true, stage_count: 0 }
      : undefined;
    return NextResponse.json({ event }, { status: 201, headers: noStore });
  } catch (error) {
    console.error("POST /api/events failed");
    return NextResponse.json(
      { error: "Não foi possível criar o evento." },
      { status: 500, headers: noStore },
    );
  }
}

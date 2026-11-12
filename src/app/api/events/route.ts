import { NextResponse } from "next/server";
import { getSessionUser, noStore, requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureSampleData } from "@/lib/sample-data";
import type { EventRow } from "@/lib/types";
import { cleanText } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    let sample = false;
    if (user) {
      sample = await ensureSampleData(user.id);
    }

    if (!user) {
      return NextResponse.json(
        { events: [], sample: false, authenticated: false },
        { headers: noStore },
      );
    }

    const events = await sql<EventRow>(
      `select e.id, e.name, e.created_at, e.owner_user_id,
              count(s.id)::int as stage_count
       from events e
       left join stages s on s.event_id = e.id
       where e.owner_user_id = $1
       group by e.id
       order by e.created_at desc`,
      [user.id],
    );

    const decorated = events.map((event) => ({
      ...event,
      is_owner: true,
    }));

    return NextResponse.json(
      {
        events: decorated,
        sample,
        authenticated: true,
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
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    const body = (await request.json()) as { name?: unknown };
    const name = cleanText(body.name, 120);
    if (!name) {
      return NextResponse.json(
        { error: "Informe um nome de evento válido (até 120 caracteres)." },
        { status: 400, headers: noStore },
      );
    }

    const existing = await sql<{ count: string | number }>(
      "select count(*)::int as count from events where owner_user_id = $1",
      [user.id],
    );
    if (Number(existing[0]?.count ?? 0) >= 200) {
      return NextResponse.json(
        { error: "Limite de eventos atingido nesta conta." },
        { status: 400, headers: noStore },
      );
    }

    const rows = await sql<EventRow>(
      `insert into events (name, owner_user_id)
       values ($1, $2)
       returning id, name, created_at, owner_user_id`,
      [name, user.id],
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

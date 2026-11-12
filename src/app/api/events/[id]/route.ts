import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSampleData } from "@/lib/sample-data";
import type { EventRow, StageRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    await ensureSampleData();

    const events = await sql<EventRow>(
      "select id, name, created_at from events where id = $1",
      [id],
    );
    const event = events[0];
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const stages = await sql<StageRow>(
      `select id, event_id, name, stage_date, notes, sort_order, created_at
       from stages
       where event_id = $1
       order by sort_order asc, created_at asc`,
      [id],
    );

    return NextResponse.json({ event, stages });
  } catch (error) {
    console.error("GET /api/events/[id] failed");
    return NextResponse.json(
      { error: "Não foi possível carregar o evento." },
      { status: 500 },
    );
  }
}

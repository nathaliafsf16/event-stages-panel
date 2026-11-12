import { NextResponse } from "next/server";
import { optionalViewer } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureSampleData } from "@/lib/sample-data";
import type { EventRow, StageRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const noStore = { "cache-control": "private, no-store" };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404, headers: noStore },
      );
    }

    const identity = await optionalViewer(request);
    if (identity.verified) {
      await ensureSampleData(identity.sub);
    }

    const events = await sql<EventRow>(
      "select id, name, created_at, owner_sub from events where id = $1",
      [id],
    );
    const event = events[0];
    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404, headers: noStore },
      );
    }

    const stages = await sql<StageRow>(
      `select id, event_id, name, stage_date, notes, sort_order, created_at
       from stages
       where event_id = $1
       order by sort_order asc, created_at asc`,
      [id],
    );

    const isOwner = Boolean(
      identity.verified && event.owner_sub === identity.sub,
    );

    return NextResponse.json(
      {
        event: { ...event, is_owner: isOwner },
        stages,
        authenticated: identity.verified,
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("GET /api/events/[id] failed");
    return NextResponse.json(
      { error: "Não foi possível carregar o evento." },
      { status: 500, headers: noStore },
    );
  }
}

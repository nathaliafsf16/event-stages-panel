import { NextResponse } from "next/server";
import { forbiddenOwner, requireViewer } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { StageRow } from "@/lib/types";
import {
  cleanText,
  optionalDate,
  optionalOrder,
  optionalText,
} from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const noStore = { "cache-control": "private, no-store" };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request, { params }: Params) {
  try {
    const identity = await requireViewer(request);
    if (identity instanceof NextResponse) return identity;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404, headers: noStore },
      );
    }

    const events = await sql<{ id: string; owner_sub: string }>(
      "select id, owner_sub from events where id = $1",
      [id],
    );
    const event = events[0];
    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404, headers: noStore },
      );
    }

    if (event.owner_sub !== identity.sub) {
      return forbiddenOwner();
    }

    const stageCount = await sql<{ count: string | number }>(
      "select count(*)::int as count from stages where event_id = $1",
      [id],
    );
    if (Number(stageCount[0]?.count ?? 0) >= 100) {
      return NextResponse.json(
        { error: "Limite de etapas neste evento atingido." },
        { status: 400, headers: noStore },
      );
    }

    const body = (await request.json()) as {
      name?: unknown;
      stage_date?: unknown;
      notes?: unknown;
      sort_order?: unknown;
    };

    const name = cleanText(body.name, 120);
    if (!name) {
      return NextResponse.json(
        { error: "Informe um nome de etapa válido (até 120 caracteres)." },
        { status: 400, headers: noStore },
      );
    }

    const stageDate = optionalDate(body.stage_date);
    if (stageDate === undefined) {
      return NextResponse.json(
        { error: "Data inválida. Use o formato AAAA-MM-DD." },
        { status: 400, headers: noStore },
      );
    }

    const notes = optionalText(body.notes, 500);
    if (notes === undefined) {
      return NextResponse.json(
        { error: "Notas devem ter até 500 caracteres." },
        { status: 400, headers: noStore },
      );
    }

    let sortOrder = optionalOrder(body.sort_order);
    if (
      body.sort_order !== undefined &&
      body.sort_order !== null &&
      body.sort_order !== "" &&
      sortOrder === undefined
    ) {
      return NextResponse.json(
        { error: "Ordem inválida." },
        { status: 400, headers: noStore },
      );
    }

    if (sortOrder === undefined) {
      const maxRows = await sql<{ max: string | number | null }>(
        "select max(sort_order) as max from stages where event_id = $1",
        [id],
      );
      const max = Number(maxRows[0]?.max ?? 0);
      sortOrder = Number.isFinite(max) ? max + 1 : 1;
    }

    const rows = await sql<StageRow>(
      `insert into stages (event_id, name, stage_date, notes, sort_order)
       values ($1, $2, $3, $4, $5)
       returning id, event_id, name, stage_date, notes, sort_order, created_at`,
      [id, name, stageDate, notes, sortOrder],
    );

    return NextResponse.json(
      { stage: rows[0] },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    console.error("POST /api/events/[id]/stages failed");
    return NextResponse.json(
      { error: "Não foi possível adicionar a etapa." },
      { status: 500, headers: noStore },
    );
  }
}

import { sql } from "./db";

const SAMPLE_EVENTS = [
  {
    name: "Festival de Inverno Serra Verde",
    stages: [
      {
        name: "Briefing com fornecedores",
        stage_date: "2026-06-10",
        notes: "Confirmar montagem de palco e energia.",
        sort_order: 1,
      },
      {
        name: "Montagem da arena",
        stage_date: "2026-06-18",
        notes: "Equipe técnica das 8h às 18h.",
        sort_order: 2,
      },
      {
        name: "Ensaios gerais",
        stage_date: "2026-06-20",
        notes: null,
        sort_order: 3,
      },
      {
        name: "Abertura ao público",
        stage_date: "2026-06-21",
        notes: "Portões às 16h.",
        sort_order: 4,
      },
    ],
  },
  {
    name: "Casamento Marina & Thiago",
    stages: [
      {
        name: "Degustação do menu",
        stage_date: "2026-04-02",
        notes: "Restaurante Horizonte.",
        sort_order: 1,
      },
      {
        name: "Prova de vestido e terno",
        stage_date: "2026-04-15",
        notes: null,
        sort_order: 2,
      },
      {
        name: "Cerimônia e recepção",
        stage_date: "2026-05-09",
        notes: "Jardim das Oliveiras.",
        sort_order: 3,
      },
    ],
  },
] as const;

export async function ensureSampleData(): Promise<boolean> {
  const rows = await sql<{ count: string | number }>(
    "select count(*)::int as count from events",
  );
  const count = Number(rows[0]?.count ?? 0);
  if (count > 0) return false;

  for (const event of SAMPLE_EVENTS) {
    const created = await sql<{ id: string }>(
      "insert into events (name) values ($1) returning id",
      [event.name],
    );
    const eventId = created[0]?.id;
    if (!eventId) continue;
    for (const stage of event.stages) {
      await sql(
        `insert into stages (event_id, name, stage_date, notes, sort_order)
         values ($1, $2, $3, $4, $5)`,
        [
          eventId,
          stage.name,
          stage.stage_date,
          stage.notes,
          stage.sort_order,
        ],
      );
    }
  }
  return true;
}

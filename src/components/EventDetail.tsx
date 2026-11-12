"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import styles from "@/app/event/[id]/event.module.css";
import type { EventRow, StageRow } from "@/lib/types";

type Props = {
  eventId: string;
};

function formatDate(value: string | Date | null): string | null {
  if (!value) return null;
  const raw = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function EventDetail({ eventId }: Props) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [stages, setStages] = useState<StageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stageDate, setStageDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
      const data = (await res.json()) as {
        event?: EventRow;
        stages?: StageRow[];
        error?: string;
      };
      if (!res.ok || !data.event) {
        setError(data.error ?? "Evento não encontrado.");
        setEvent(null);
        setStages([]);
        return;
      }
      setEvent(data.event);
      setStages(data.stages ?? []);
    } catch {
      setError("Não foi possível carregar o evento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [eventId]);

  async function onAddStage(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string | number> = { name };
      if (stageDate) payload.stage_date = stageDate;
      if (notes.trim()) payload.notes = notes.trim();
      if (sortOrder !== "") payload.sort_order = Number(sortOrder);

      const res = await fetch(`/api/events/${eventId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { stage?: StageRow; error?: string };
      if (!res.ok || !data.stage) {
        setError(data.error ?? "Não foi possível adicionar a etapa.");
        return;
      }
      setName("");
      setStageDate("");
      setNotes("");
      setSortOrder("");
      setStages((current) =>
        [...current, data.stage!].sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        ),
      );
    } catch {
      setError("Não foi possível adicionar a etapa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={`${styles.loading} fade`}>Carregando evento…</p>;
  }

  if (!event) {
    return (
      <div className={styles.shell}>
        <p className={styles.error}>{error ?? "Evento não encontrado."}</p>
        <p>
          <Link className={styles.back} href="/">
            Voltar aos eventos
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={`${styles.topbar} fade`}>
        <Link className={styles.brandMini} href="/">
          Gestão de Eventos
        </Link>
        <Link className={styles.back} href="/">
          Todos os eventos
        </Link>
      </div>

      <header className={`${styles.hero} rise`}>
        <p className={styles.kicker}>Detalhe do evento</p>
        <h1 className={styles.title}>{event.name}</h1>
        <p className={styles.lede}>
          Organize as etapas na ordem da produção. Data e notas são opcionais.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={`${styles.panel} rise rise-delay-1`} aria-labelledby="etapas-titulo">
          <h2 id="etapas-titulo" className={styles.panelTitle}>
            Etapas
          </h2>
          <p className={styles.panelHint}>
            {stages.length === 0
              ? "Ainda não há etapas neste evento."
              : `${stages.length} etapa${stages.length === 1 ? "" : "s"} no fluxo.`}
          </p>
          {stages.length === 0 ? (
            <p className={styles.empty}>Inclua a primeira etapa no formulário abaixo.</p>
          ) : (
            <ol className={styles.stageList}>
              {stages.map((stage) => {
                const dateLabel = formatDate(stage.stage_date);
                return (
                  <li key={stage.id} className={styles.stageItem}>
                    <span className={`${styles.order} stage-dot`} aria-hidden>
                      {stage.sort_order}
                    </span>
                    <div>
                      <h3 className={styles.stageName}>{stage.name}</h3>
                      {dateLabel ? (
                        <p className={styles.stageMeta}>{dateLabel}</p>
                      ) : (
                        <p className={styles.stageMeta}>Sem data definida</p>
                      )}
                      {stage.notes ? (
                        <p className={styles.stageNotes}>{stage.notes}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className={`${styles.panel} rise rise-delay-2`} aria-labelledby="nova-etapa">
          <h2 id="nova-etapa" className={styles.panelTitle}>
            Nova etapa
          </h2>
          <p className={styles.panelHint}>Nome obrigatório; data, notas e ordem são opcionais.</p>
          <form className={styles.form} onSubmit={onAddStage}>
            <label className={styles.label}>
              Nome da etapa
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                placeholder="Ex.: Montagem do palco"
                autoComplete="off"
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label}>
                Data (opcional)
                <input
                  className={styles.input}
                  type="date"
                  value={stageDate}
                  onChange={(e) => setStageDate(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Ordem (opcional)
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={10000}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="Automática"
                />
              </label>
            </div>
            <label className={styles.label}>
              Notas (opcional)
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="Observações curtas para a equipe"
              />
            </label>
            <button className={styles.button} type="submit" disabled={saving || !name.trim()}>
              {saving ? "Salvando…" : "Adicionar etapa"}
            </button>
            {error ? <p className={styles.error}>{error}</p> : null}
          </form>
        </section>
      </div>
    </div>
  );
}

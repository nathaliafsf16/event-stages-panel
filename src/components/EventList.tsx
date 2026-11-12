"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import type { EventRow } from "@/lib/types";

type EventsResponse = {
  events: EventRow[];
  sample?: boolean;
  error?: string;
};

function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function EventList() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sample, setSample] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = (await res.json()) as EventsResponse;
      if (!res.ok) {
        setError(data.error ?? "Não foi possível carregar os eventos.");
        return;
      }
      setEvents(data.events);
      setSample(Boolean(data.sample));
    } catch {
      setError("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        event?: EventRow;
        error?: string;
      };
      if (!res.ok || !data.event) {
        setError(data.error ?? "Não foi possível criar o evento.");
        return;
      }
      setName("");
      setSuccess("Evento criado.");
      setSample(false);
      setEvents((current) => [data.event!, ...current]);
    } catch {
      setError("Não foi possível criar o evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.layout}>
      <section className={`${styles.panel} rise rise-delay-2`} aria-labelledby="eventos-titulo">
        <h2 id="eventos-titulo" className={styles.panelTitle}>
          Eventos
        </h2>
        <p className={styles.panelHint}>
          Abra um evento para ver e incluir as etapas da produção.
        </p>
        {sample ? (
          <p className={styles.sampleBadge}>Dados de exemplo para pré-visualização</p>
        ) : null}
        {loading ? <p className={styles.empty}>Carregando eventos…</p> : null}
        {!loading && events.length === 0 ? (
          <p className={styles.empty}>Nenhum evento ainda. Crie o primeiro ao lado.</p>
        ) : null}
        {!loading && events.length > 0 ? (
          <ul className={styles.eventList}>
            {events.map((item) => (
              <li key={item.id}>
                <Link className={styles.eventLink} href={`/event/${item.id}`}>
                  <span className={styles.eventName}>{item.name}</span>
                  <span className={styles.eventMeta}>
                    {Number(item.stage_count ?? 0)} etapa
                    {Number(item.stage_count ?? 0) === 1 ? "" : "s"}
                    {item.created_at ? ` · criado em ${formatDate(item.created_at)}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={`${styles.panel} rise rise-delay-3`} aria-labelledby="novo-evento">
        <h2 id="novo-evento" className={styles.panelTitle}>
          Novo evento
        </h2>
        <p className={styles.panelHint}>Só o nome basta para começar.</p>
        <form className={styles.form} onSubmit={onCreate}>
          <label className={styles.label}>
            Nome do evento
            <input
              className={styles.input}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
              placeholder="Ex.: Conferência Aurora 2026"
              autoComplete="off"
            />
          </label>
          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={saving || !name.trim()}>
              {saving ? "Salvando…" : "Criar evento"}
            </button>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}
        </form>
      </section>
    </div>
  );
}

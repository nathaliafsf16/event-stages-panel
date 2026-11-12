"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import { AuthPanel } from "@/components/AuthPanel";
import type { EventRow, PublicUser } from "@/lib/types";

type EventsResponse = {
  events: EventRow[];
  sample?: boolean;
  authenticated?: boolean;
  error?: string;
};

type MeResponse = {
  authenticated: boolean;
  user?: PublicUser;
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
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sample, setSample] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        cache: "no-store",
        credentials: "same-origin",
      });
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json()) as MeResponse;
        if (cancelled) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) void loadEvents();
    else {
      setEvents([]);
      setSample(false);
    }
  }, [user, loadEvents]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("Faça login para criar eventos.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
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

  async function onLogout() {
    setError(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // still clear local state
    }
    setUser(null);
    setEvents([]);
    setSample(false);
    setSuccess(null);
  }

  if (!authChecked) {
    return <p className={styles.empty}>Carregando…</p>;
  }

  if (!user) {
    return (
      <AuthPanel
        onAuthed={(next) => {
          setUser(next);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className={styles.layout}>
      <section className={`${styles.panel} rise rise-delay-2`} aria-labelledby="eventos-titulo">
        <div className={styles.panelHead}>
          <div>
            <h2 id="eventos-titulo" className={styles.panelTitle}>
              Seus eventos
            </h2>
            <p className={styles.panelHint}>
              Abra um evento para ver e incluir as etapas da produção.
            </p>
          </div>
          <div className={styles.viewerBlock}>
            <p className={styles.viewerBadge}>{user.name}</p>
            <button className={styles.linkButton} type="button" onClick={() => void onLogout()}>
              Sair
            </button>
          </div>
        </div>
        {sample ? (
          <p className={styles.sampleBadge}>Dados de exemplo para começar</p>
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
        <p className={styles.panelHint}>Só o nome basta para começar. Só você poderá editar.</p>
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

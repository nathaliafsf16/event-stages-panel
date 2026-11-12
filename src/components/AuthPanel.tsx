"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/page.module.css";
import type { PublicUser } from "@/lib/types";

type Props = {
  onAuthed: (user: PublicUser) => void;
};

export function AuthPanel({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        user?: PublicUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(data.error ?? "Não foi possível autenticar.");
        return;
      }
      onAuthed(data.user);
    } catch {
      setError("Não foi possível autenticar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${styles.panel} rise rise-delay-2`} aria-labelledby="auth-titulo">
      <h2 id="auth-titulo" className={styles.panelTitle}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h2>
      <p className={styles.panelHint}>
        Cada pessoa usa o próprio e-mail e senha neste app — não precisa de conta
        Cursor.
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        {mode === "register" ? (
          <label className={styles.label}>
            Nome
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className={styles.label}>
          E-mail
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            autoComplete="email"
          />
        </label>
        <label className={styles.label}>
          Senha
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        <div className={styles.actions}>
          <button
            className={styles.button}
            type="submit"
            disabled={saving || !email.trim() || password.length < 8}
          >
            {saving
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
          <button
            className={styles.linkButton}
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>
    </section>
  );
}

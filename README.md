# Gestão de Eventos

Painel em português com contas por e-mail e senha: cada pessoa cria a própria conta no app, vê só os seus eventos e só o dono adiciona etapas.

## Local

```bash
env -u DATABASE_URL npm run dev -- --port 3456 --hostname 127.0.0.1
```

Sem `DATABASE_URL`, o app usa PGlite em memória e aplica `migrations/`. Na primeira visita autenticada de uma conta vazia, carrega dados de exemplo.

## Produção (Cursor publish-app)

Pode publicar como **Public**: o login é do próprio app (e-mail/senha), não exige conta Cursor. `cursor-app.json` declara Postgres. O build roda `next build && node scripts/migrate.mjs`. A plataforma cria o banco e define `DATABASE_URL` no publish — este ambiente nunca vê a URL de produção.

# Gestão de Eventos

Painel em português com login Cursor: listar eventos, criar eventos e organizar etapas (nome, data opcional, notas opcionais, ordem). Só quem está autenticado cria eventos; só o criador adiciona etapas.

## Local

```bash
env -u DATABASE_URL npm run dev -- --port 3456 --hostname 127.0.0.1
```

Sem `DATABASE_URL`, o app usa PGlite em memória e aplica `migrations/`. Com banco vazio, carrega dados de exemplo na primeira leitura. O preview usa identidade simulada (`cursor/identity.dev.ts`).

## Produção (Cursor publish-app)

Publique como **Private** ou **Team** (não Public): o login Cursor só vale nesses modos. `cursor-app.json` declara Postgres. O build roda `next build && node scripts/migrate.mjs`. A plataforma cria o banco e define `DATABASE_URL` no publish — este ambiente nunca vê a URL de produção.

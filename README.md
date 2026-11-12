# Gestão de Eventos

Painel público em português para listar eventos, criar eventos e organizar etapas (nome, data opcional, notas opcionais, ordem).

## Local

```bash
env -u DATABASE_URL npm run dev
```

Sem `DATABASE_URL`, o app usa PGlite em memória e aplica `migrations/`. Com banco vazio, carrega dados de exemplo na primeira leitura.

## Produção (Cursor publish-app)

`cursor-app.json` declara Postgres. O build roda `next build && node scripts/migrate.mjs`. A plataforma cria o banco e define `DATABASE_URL` no publish — este ambiente nunca vê a URL de produção.

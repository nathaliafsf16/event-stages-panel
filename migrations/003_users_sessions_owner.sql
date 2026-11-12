create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint users_email_unique unique (email)
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

alter table events
  add column if not exists owner_user_id uuid references users (id) on delete cascade;

delete from events where owner_user_id is null;

alter table events
  drop column if exists owner_sub;

alter table events
  alter column owner_user_id set not null;

create index if not exists events_owner_user_id_idx on events (owner_user_id);

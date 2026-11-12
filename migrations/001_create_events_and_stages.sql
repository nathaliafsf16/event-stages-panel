create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  stage_date date,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists stages_event_id_sort_order_idx
  on stages (event_id, sort_order);

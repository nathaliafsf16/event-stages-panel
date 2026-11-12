alter table events
  add column if not exists owner_sub text;

update events
set owner_sub = 'user:unassigned'
where owner_sub is null;

alter table events
  alter column owner_sub set not null;

create index if not exists events_owner_sub_idx on events (owner_sub);

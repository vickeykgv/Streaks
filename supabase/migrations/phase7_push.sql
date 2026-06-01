-- Phase 7: Push notification tables

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  timezone   text not null default 'UTC',
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists reminders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  entity_type  text not null check (entity_type in ('habit', 'task')),
  entity_id    text not null unique,
  local_time   text not null,           -- 'HH:mm'
  days_of_week integer[] not null,      -- 0=Sun … 6=Sat
  timezone     text not null default 'UTC',
  next_fire_at timestamptz not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists reminders_next_fire_idx on reminders (next_fire_at) where active = true;
create index if not exists reminders_user_id_idx   on reminders (user_id);

alter table reminders enable row level security;

create policy "Users manage own reminders"
  on reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

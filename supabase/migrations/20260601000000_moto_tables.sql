-- Moto Logging module tables
-- Applied to remote via MCP apply_migration (name: moto_tables) on 2026-06-01.
-- This file mirrors the deployed schema so local `supabase db push` history stays consistent.

-- ── moto_vehicles ─────────────────────────────────────────────────────────────
create table if not exists public.moto_vehicles (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  make             text not null,
  model            text not null,
  year             int  not null,
  registration_no  text not null default '',
  vehicle_type     text not null default 'bike',
  fuel_type        text not null default 'petrol',
  tank_capacity_l  numeric,
  purchase_date    text,
  purchase_odo_km  numeric,
  current_odo_km   numeric not null default 0,
  color            text not null default '#e50914',
  archived         boolean not null default false,
  created_at       bigint not null,
  updated_at       bigint not null,
  deleted_at       bigint,
  synced_at        bigint
);
alter table public.moto_vehicles enable row level security;
drop policy if exists "Users own their moto_vehicles" on public.moto_vehicles;
create policy "Users own their moto_vehicles"
  on public.moto_vehicles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_vehicles_user_updated on public.moto_vehicles(user_id, updated_at);

-- ── moto_fuel_logs ────────────────────────────────────────────────────────────
create table if not exists public.moto_fuel_logs (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  vehicle_id  text not null,
  date        text not null,
  odo_km      numeric not null,
  litres      numeric not null,
  price_per_l numeric not null,
  total_cost  numeric not null,
  fuel_type   text not null default 'petrol',
  station     text,
  full_tank   boolean not null default true,
  note        text,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted_at  bigint,
  synced_at   bigint
);
alter table public.moto_fuel_logs enable row level security;
drop policy if exists "Users own their moto_fuel_logs" on public.moto_fuel_logs;
create policy "Users own their moto_fuel_logs"
  on public.moto_fuel_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_fuel_logs_user_updated on public.moto_fuel_logs(user_id, updated_at);
create index if not exists moto_fuel_logs_vehicle     on public.moto_fuel_logs(vehicle_id);

-- ── moto_services ─────────────────────────────────────────────────────────────
create table if not exists public.moto_services (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  vehicle_id          text not null,
  date                text not null,
  odo_km              numeric not null,
  service_type        text not null default 'general',
  workshop            text,
  labor_cost          numeric not null default 0,
  parts_cost          numeric not null default 0,
  total_cost          numeric not null default 0,
  next_due_date       text,
  next_due_odo_km     numeric,
  note                text,
  linked_issue_ids    text[] not null default '{}',
  created_at          bigint not null,
  updated_at          bigint not null,
  deleted_at          bigint,
  synced_at           bigint
);
alter table public.moto_services enable row level security;
drop policy if exists "Users own their moto_services" on public.moto_services;
create policy "Users own their moto_services"
  on public.moto_services for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_services_user_updated on public.moto_services(user_id, updated_at);
create index if not exists moto_services_vehicle      on public.moto_services(vehicle_id);

-- ── moto_parts ────────────────────────────────────────────────────────────────
create table if not exists public.moto_parts (
  id                    text primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  vehicle_id            text not null,
  part_name             text not null,
  part_number           text,
  brand                 text,
  installed_at          text not null,
  odo_km_at_install     numeric not null default 0,
  cost                  numeric not null default 0,
  expected_life_km      numeric,
  expected_life_months  numeric,
  linked_service_id     text,
  note                  text,
  created_at            bigint not null,
  updated_at            bigint not null,
  deleted_at            bigint,
  synced_at             bigint
);
alter table public.moto_parts enable row level security;
drop policy if exists "Users own their moto_parts" on public.moto_parts;
create policy "Users own their moto_parts"
  on public.moto_parts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_parts_user_updated on public.moto_parts(user_id, updated_at);
create index if not exists moto_parts_vehicle      on public.moto_parts(vehicle_id);

-- ── moto_issues ───────────────────────────────────────────────────────────────
create table if not exists public.moto_issues (
  id                     text primary key,
  user_id                uuid not null references auth.users(id) on delete cascade,
  vehicle_id             text not null,
  title                  text not null,
  description            text,
  status                 text not null default 'open',
  priority               text not null default 'medium',
  reported_at            text not null,
  resolved_at            text,
  resolved_by_service_id text,
  created_at             bigint not null,
  updated_at             bigint not null,
  deleted_at             bigint,
  synced_at              bigint
);
alter table public.moto_issues enable row level security;
drop policy if exists "Users own their moto_issues" on public.moto_issues;
create policy "Users own their moto_issues"
  on public.moto_issues for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_issues_user_updated on public.moto_issues(user_id, updated_at);
create index if not exists moto_issues_vehicle      on public.moto_issues(vehicle_id);

-- ── moto_notes ────────────────────────────────────────────────────────────────
create table if not exists public.moto_notes (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  vehicle_id  text not null,
  title       text,
  body        text not null,
  pinned      boolean not null default false,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted_at  bigint,
  synced_at   bigint
);
alter table public.moto_notes enable row level security;
drop policy if exists "Users own their moto_notes" on public.moto_notes;
create policy "Users own their moto_notes"
  on public.moto_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_notes_user_updated on public.moto_notes(user_id, updated_at);
create index if not exists moto_notes_vehicle      on public.moto_notes(vehicle_id);

-- ── moto_documents ────────────────────────────────────────────────────────────
create table if not exists public.moto_documents (
  id                   text primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  vehicle_id           text,
  type                 text not null,
  provider             text,
  policy_no            text,
  issued_date          text,
  expiry_date          text not null,
  premium              numeric,
  reminder_days_before int  not null default 30,
  note                 text,
  created_at           bigint not null,
  updated_at           bigint not null,
  deleted_at           bigint,
  synced_at            bigint
);
alter table public.moto_documents enable row level security;
drop policy if exists "Users own their moto_documents" on public.moto_documents;
create policy "Users own their moto_documents"
  on public.moto_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists moto_documents_user_updated on public.moto_documents(user_id, updated_at);
create index if not exists moto_documents_vehicle      on public.moto_documents(vehicle_id);

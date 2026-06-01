-- Lightweight client-side error log for MVP research visibility.
-- Applied to remote via MCP apply_migration (name: client_errors) on 2026-06-01.
-- Insert-only from clients (anon + authenticated); readable only via service role / dashboard.
create table if not exists public.client_errors (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete set null,
  message     text not null,
  stack       text,
  context     text,
  url         text,
  user_agent  text,
  app_version text,
  created_at  bigint not null
);

alter table public.client_errors enable row level security;

drop policy if exists "anyone can insert client errors" on public.client_errors;
create policy "anyone can insert client errors"
  on public.client_errors for insert to anon, authenticated
  with check (true);

create index if not exists client_errors_created on public.client_errors(created_at desc);

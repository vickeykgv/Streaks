-- Add world column to habits and tasks (missing from Phase 5 schema)
alter table public.habits add column if not exists world text not null default 'personal';
alter table public.tasks  add column if not exists world text not null default 'personal';

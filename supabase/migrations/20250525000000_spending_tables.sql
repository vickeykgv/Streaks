-- Spending Tracker tables
-- Run this in the Supabase SQL editor or via: supabase db push

-- ── spending_accounts ────────────────────────────────────────────────────────
create table if not exists public.spending_accounts (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  type             text not null default 'bank',
  opening_balance  numeric not null default 0,
  currency         text not null default 'INR',
  color            text not null default '#6366f1',
  icon             text not null default '🏦',
  archived         boolean not null default false,
  created_at       bigint not null,
  updated_at       bigint not null,
  deleted_at       bigint,
  synced_at        bigint
);

alter table public.spending_accounts enable row level security;
create policy "Users manage own spending accounts"
  on public.spending_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists spending_accounts_user_updated
  on public.spending_accounts (user_id, updated_at);

-- ── spending_categories ──────────────────────────────────────────────────────
create table if not exists public.spending_categories (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null default 'expense',
  parent_id   text,
  color       text not null default '#6366f1',
  icon        text not null default '📦',
  archived    boolean not null default false,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted_at  bigint,
  synced_at   bigint
);

alter table public.spending_categories enable row level security;
create policy "Users manage own spending categories"
  on public.spending_categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists spending_categories_user_updated
  on public.spending_categories (user_id, updated_at);

-- ── spending_transactions ────────────────────────────────────────────────────
create table if not exists public.spending_transactions (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null,
  amount         numeric not null,
  currency       text not null default 'INR',
  date           text not null,
  account_id     text not null,
  to_account_id  text,
  category_id    text,
  tags           text[] not null default '{}',
  note           text,
  payee          text,
  recurring_id   text,
  created_at     bigint not null,
  updated_at     bigint not null,
  deleted_at     bigint,
  synced_at      bigint
);

alter table public.spending_transactions enable row level security;
create policy "Users manage own spending transactions"
  on public.spending_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists spending_transactions_user_date
  on public.spending_transactions (user_id, date desc);
create index if not exists spending_transactions_user_updated
  on public.spending_transactions (user_id, updated_at);

-- ── spending_budgets ─────────────────────────────────────────────────────────
create table if not exists public.spending_budgets (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  amount        numeric not null,
  period        text not null default 'monthly',
  start_date    text not null,
  end_date      text,
  category_ids  text[] not null default '{}',
  rollover      boolean not null default false,
  created_at    bigint not null,
  updated_at    bigint not null,
  deleted_at    bigint,
  synced_at     bigint
);

alter table public.spending_budgets enable row level security;
create policy "Users manage own spending budgets"
  on public.spending_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists spending_budgets_user_updated
  on public.spending_budgets (user_id, updated_at);

-- ── spending_recurring ───────────────────────────────────────────────────────
create table if not exists public.spending_recurring (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  type           text not null,
  amount         numeric not null,
  currency       text not null default 'INR',
  account_id     text not null,
  to_account_id  text,
  category_id    text,
  tags           text[] not null default '{}',
  note           text,
  payee          text,
  interval       text not null default 'monthly',
  next_run_at    bigint not null,
  last_run_at    bigint,
  active         boolean not null default true,
  created_at     bigint not null,
  updated_at     bigint not null,
  deleted_at     bigint,
  synced_at      bigint
);

alter table public.spending_recurring enable row level security;
create policy "Users manage own spending recurring"
  on public.spending_recurring for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists spending_recurring_user_updated
  on public.spending_recurring (user_id, updated_at);

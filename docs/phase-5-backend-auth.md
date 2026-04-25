# Phase 5 — Backend + Auth
**Estimated time:** Day 8–9  
**Goal:** A Supabase backend with tables mirroring the client schema, Row-Level Security locking each user to their own data, and a working sign-up / sign-in / sign-out flow in the client. Sync isn't wired yet — that's Phase 6. This phase just proves the auth layer works and the DB schema is correct.

**Prerequisite:** Phase 4 complete — PWA working offline.

---

## Step 1 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Note down: **Project URL**, **anon key**, **service_role key** (keep service_role secret — server-side only).
3. Install the client: `npm install @supabase/supabase-js`.
4. Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

5. Add to `.env.local` (git-ignored):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

6. Add to `.env.example` (committed, no values):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Step 2 — Database schema (Supabase SQL editor)

Run this SQL in the Supabase SQL editor. The schema mirrors the client types exactly — same field names, same types, with `user_id` as the ownership column.

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── TAGS ─────────────────────────────────────────────────────────────
create table public.tags (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted_at  bigint,
  synced_at   bigint
);
create index tags_user_id_idx on public.tags(user_id);
create index tags_updated_at_idx on public.tags(user_id, updated_at);

-- ─── HABITS ───────────────────────────────────────────────────────────
create table public.habits (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  tags             text[] not null default '{}',
  measurement_type text not null,
  target           numeric,
  unit             text,
  recurrence       jsonb not null,
  start_date       text not null,
  end_date         text,
  reminder_time    text,
  color            text not null default '#6366f1',
  icon             text not null default '✅',
  archived         boolean not null default false,
  created_at       bigint not null,
  updated_at       bigint not null,
  deleted_at       bigint,
  synced_at        bigint
);
create index habits_user_id_idx on public.habits(user_id);
create index habits_updated_at_idx on public.habits(user_id, updated_at);

-- ─── TASKS ────────────────────────────────────────────────────────────
create table public.tasks (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  tags             text[] not null default '{}',
  measurement_type text not null,
  target           numeric,
  unit             text,
  due_date         text not null,
  due_time         text,
  priority         text not null default 'med',
  status           text not null default 'pending',
  completed_at     bigint,
  progress         numeric,
  color            text not null default '#6366f1',
  icon             text not null default '🎯',
  created_at       bigint not null,
  updated_at       bigint not null,
  deleted_at       bigint,
  synced_at        bigint
);
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_updated_at_idx on public.tasks(user_id, updated_at);
create index tasks_due_date_idx on public.tasks(user_id, due_date);

-- ─── HABIT ENTRIES ────────────────────────────────────────────────────
create table public.habit_entries (
  id           text primary key,   -- '{habitId}_{YYYY-MM-DD}'
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     text not null,
  date         text not null,
  status       text not null default 'pending',
  value        numeric,
  note         text,
  completed_at bigint,
  updated_at   bigint not null,
  deleted_at   bigint,
  synced_at    bigint
);
create index habit_entries_user_id_idx on public.habit_entries(user_id);
create index habit_entries_habit_id_idx on public.habit_entries(habit_id);
create index habit_entries_updated_at_idx on public.habit_entries(user_id, updated_at);

-- ─── PUSH SUBSCRIPTIONS (used in Phase 7) ────────────────────────────
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index push_subs_user_id_idx on public.push_subscriptions(user_id);

-- ─── REMINDERS (used in Phase 7) ──────────────────────────────────────
create table public.reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entity_type     text not null,  -- 'habit' | 'task'
  entity_id       text not null,
  local_time      text not null,  -- 'HH:mm'
  days_of_week    int[] not null default '{0,1,2,3,4,5,6}',
  timezone        text not null default 'UTC',
  next_fire_at    timestamptz,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index reminders_next_fire_idx on public.reminders(next_fire_at) where active = true;
```

---

## Step 3 — Row Level Security (RLS)

Every table must have RLS enabled and a policy that allows users to access only their own rows. Run this after the schema above.

```sql
-- Enable RLS on all tables
alter table public.tags             enable row level security;
alter table public.habits           enable row level security;
alter table public.tasks            enable row level security;
alter table public.habit_entries    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminders        enable row level security;

-- Policy template (repeat for each table):
-- habits
create policy "users manage own habits"
  on public.habits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tasks
create policy "users manage own tasks"
  on public.tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- habit_entries
create policy "users manage own entries"
  on public.habit_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tags
create policy "users manage own tags"
  on public.tags for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- push_subscriptions
create policy "users manage own push subs"
  on public.push_subscriptions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reminders
create policy "users manage own reminders"
  on public.reminders for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Test RLS:** After creating a user, try to insert a row with a different `user_id` via the Supabase dashboard → it should fail with a policy violation.

---

## Step 4 — Auth client module

Create `src/auth/client.ts`:

```ts
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type AuthUser = User

export const authClient = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data.user
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  },

  async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },
}
```

Create `src/auth/session.ts` — a thin Zustand slice for the current user:

```ts
import { create } from 'zustand'
import type { AuthUser } from './client'

interface SessionState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  loading: true,
  setUser:    (user)    => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
```

Wire in `main.tsx` (or `App.tsx`):
```tsx
import { authClient } from '@/auth/client'
import { useSession } from '@/auth/session'

// On app start, restore the session:
authClient.getUser().then(user => {
  useSession.getState().setUser(user)
  useSession.getState().setLoading(false)
})

// Listen for auth state changes (e.g. magic link email redirect):
authClient.onAuthStateChange(user => {
  useSession.getState().setUser(user)
})
```

---

## Step 5 — Sign-in route (`src/routes/SignIn.tsx`)

A minimal auth screen. Keep it clean — this isn't the main product.

```
┌────────────────────────────────┐
│          🎯 Habit Tracker      │
│                                │
│  Email                         │
│  [──────────────────────────]  │
│  Password                      │
│  [──────────────────────────]  │
│                                │
│  [        Sign in         ]    │
│  [     Create account     ]    │
│                                │
│  ─── or ───                   │
│  [   Send magic link      ]    │
│                                │
│  ← Back to app (no sync)       │
└────────────────────────────────┘
```

Implement:
- `Sign in` calls `authClient.signIn`. On success: navigate to `/`, trigger initial sync (Phase 6 will implement — for now just navigate).
- `Create account` calls `authClient.signUp`. On success: show "Check your email to confirm your account", then redirect.
- `Send magic link` calls `authClient.signInWithMagicLink`. On success: "Check your email for the sign-in link".
- `Back to app` navigates to `/` — the app fully works without signing in.

Use React Hook Form + Zod for validation. Zod email + password (min 8 chars).

---

## Step 6 — Settings page: auth section

Update `src/routes/Settings.tsx` to add an account section:

**If signed out:**
```
Account
  [Sign in / Create account]
  Signing in enables sync across devices.
```

**If signed in:**
```
Account
  Signed in as: user@email.com
  [Sign out]
  [Delete account]
```

Sign-out flow:
1. If there's unsynced data (`dirty: true` records in IndexedDB), warn: "You have X unsynced changes. Sign out anyway?"
2. Call `authClient.signOut()`.
3. Set `user = null` in session store.
4. Do **not** clear IndexedDB — local data stays.

Delete account:
1. Confirmation dialog: "This will permanently delete all your data on the server. Local data is kept."
2. Call Supabase `supabase.auth.admin.deleteUser` via an Edge Function (do not call admin methods from the client — they require the service_role key). For now: stub this with a toast "Contact support to delete your account" — implement the Edge Function in Phase 7 or 8.

---

## Step 7 — Auth guard in routing

Some routes don't need auth (everything works offline). But if a user tries to access `/settings` and goes to sign-in, they should be redirected back.

In `App.tsx`, add a `redirectAfterSignIn` mechanism:
```ts
// In SignIn.tsx:
const location = useLocation()
const returnTo = new URLSearchParams(location.search).get('return') ?? '/'
// On success:
navigate(returnTo)
```

From Settings:
```tsx
<Link to={`/signin?return=/settings`}>Sign in</Link>
```

---

## ✅ Phase 5 done when

- [ ] `npm run dev` — no errors from Supabase client initializing.
- [ ] Open `/signin` → sign-up form → create account → confirmation email received.
- [ ] Click the confirmation link → redirected to app → user shown in Settings as signed in.
- [ ] Sign in with email+password → user shown in Settings.
- [ ] Magic link: enter email → email arrives → click link → signed in.
- [ ] Sign out → Settings shows "Sign in" again.
- [ ] Open Supabase Dashboard → Authentication → Users → new user is present.
- [ ] Open Supabase Dashboard → Table Editor → habits → attempt to insert a row with a different user_id → fails with RLS violation (test via SQL editor with a different JWT).
- [ ] Typescript compiles clean.
- [ ] App still fully works offline — auth is completely optional.
-- 0007_moderation.sql
-- Reportes, bloqueos, advertencias y auditoría.

drop type if exists public.report_target cascade;
create type public.report_target as enum ('post', 'video', 'comment', 'message', 'user');

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blockee_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blockee_id),
  constraint blocks_no_self check (blocker_id <> blockee_id)
);

create table if not exists public.warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  severity int not null default 1 check (severity between 1 and 3),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_target_idx on public.audit_logs (target_type, target_id);

-- Un usuario no puede chatear ni ver contenido de quien le bloqueó.
create or replace function public.is_blocked(by_user uuid, other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where b.blocker_id = by_user and b.blockee_id = other
  )
$$;

create or replace function public.has_any_block(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_blocked(a, b) or public.is_blocked(b, a)
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.warnings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "reports_select_staff" on public.reports;
drop policy if exists "reports_insert_authenticated" on public.reports;
drop policy if exists "reports_update_staff" on public.reports;
drop policy if exists "reports_delete_forbidden" on public.reports;
drop policy if exists "blocks_select_own" on public.blocks;
drop policy if exists "blocks_insert_own" on public.blocks;
drop policy if exists "blocks_delete_own" on public.blocks;
drop policy if exists "warnings_select_staff" on public.warnings;
drop policy if exists "warnings_insert_staff" on public.warnings;
drop policy if exists "warnings_delete_forbidden" on public.warnings;
drop policy if exists "audit_select_staff" on public.audit_logs;
drop policy if exists "audit_insert_forbidden" on public.audit_logs;

-- --- reports ---
create policy "reports_select_staff"
on public.reports for select
to authenticated
using (public.is_staff() or reporter_id = auth.uid());

create policy "reports_insert_authenticated"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "reports_update_staff"
on public.reports for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "reports_delete_forbidden"
on public.reports for delete
to authenticated
using (false);

-- --- blocks ---
create policy "blocks_select_own"
on public.blocks for select
to authenticated
using (blocker_id = auth.uid() or blockee_id = auth.uid() or public.is_staff());

create policy "blocks_insert_own"
on public.blocks for insert
to authenticated
with check (blocker_id = auth.uid());

create policy "blocks_delete_own"
on public.blocks for delete
to authenticated
using (blocker_id = auth.uid() or public.is_staff());

-- --- warnings ---
create policy "warnings_select_staff"
on public.warnings for select
to authenticated
using (user_id = auth.uid() or public.is_staff());

create policy "warnings_insert_staff"
on public.warnings for insert
to authenticated
with check (public.is_staff());

create policy "warnings_delete_forbidden"
on public.warnings for delete
to authenticated
using (false);

-- --- audit_logs ---
-- Append-only. Lectura staff; escritura solo service_role (Edge Functions).
create policy "audit_select_staff"
on public.audit_logs for select
to authenticated
using (public.is_staff());

create policy "audit_insert_forbidden"
on public.audit_logs for insert
to authenticated
with check (false);

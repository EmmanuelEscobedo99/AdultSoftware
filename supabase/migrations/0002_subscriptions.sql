-- 0002_subscriptions.sql
-- Planes de suscripción y suscripciones.

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Suscripción mensual',
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'USD',
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'quarterly', 'yearly')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_no_self_check check (subscriber_id <> creator_id)
);

create index if not exists subscriptions_subscriber_idx
  on public.subscriptions (subscriber_id, status);
create index if not exists subscriptions_creator_idx
  on public.subscriptions (creator_id, status);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ============================================================
-- ENTITLEMENT: suscripción activa
-- ============================================================

create or replace function public.has_active_subscription(viewer uuid, creator uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.subscriber_id = viewer
      and s.creator_id = creator
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  )
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "plans_select_all" on public.subscription_plans;
drop policy if exists "plans_insert_owner" on public.subscription_plans;
drop policy if exists "plans_update_owner" on public.subscription_plans;
drop policy if exists "plans_delete_owner" on public.subscription_plans;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "subscriptions_insert_staff" on public.subscriptions;
drop policy if exists "subscriptions_update_own_status" on public.subscriptions;
drop policy if exists "subscriptions_delete_staff" on public.subscriptions;

-- Planes: visibles para todos (publicidad), gestión solo del creador/staff.
create policy "plans_select_all"
on public.subscription_plans for select
using (true);

create policy "plans_insert_owner"
on public.subscription_plans for insert
to authenticated
with check (creator_id = auth.uid() and public.is_creator(auth.uid()));

create policy "plans_update_owner"
on public.subscription_plans for update
to authenticated
using (creator_id = auth.uid() or public.is_staff())
with check (creator_id = auth.uid() or public.is_staff());

create policy "plans_delete_owner"
on public.subscription_plans for delete
to authenticated
using (creator_id = auth.uid() or public.is_staff());

-- Suscripciones: cada uno ve las suyas; staff ve todas.
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (
  subscriber_id = auth.uid()
  or creator_id = auth.uid()
  or public.is_staff()
);

-- Insert solo vía flujo de pago (service_role). Prohibido en cliente salvo staff.
create policy "subscriptions_insert_staff"
on public.subscriptions for insert
to authenticated
with check (public.is_staff());

create policy "subscriptions_update_own_status"
on public.subscriptions for update
to authenticated
using (
  subscriber_id = auth.uid() or creator_id = auth.uid() or public.is_staff()
)
with check (
  (subscriber_id = auth.uid() or creator_id = auth.uid() or public.is_staff())
  and (public.is_staff() or status = 'cancelled')
);

create policy "subscriptions_delete_staff"
on public.subscriptions for delete
to authenticated
using (public.is_staff());

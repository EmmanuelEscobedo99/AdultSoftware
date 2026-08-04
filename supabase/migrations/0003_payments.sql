-- 0003_payments.sql
-- Arquitectura de pagos multi-proveedor: payments, transactions, payouts.

drop type if exists public.payment_purpose cascade;
create type public.payment_purpose as enum ('subscription', 'ppv_unlock');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete set null,
  post_id uuid,
  plan_id uuid,
  purpose public.payment_purpose not null default 'subscription',
  provider text not null check (provider in ('stripe', 'ccbill', 'segpay')),
  provider_payment_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_unique
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists payments_user_idx on public.payments (user_id, status);
create index if not exists payments_post_idx on public.payments (post_id) where post_id is not null;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('payment', 'refund', 'payout', 'chargeback')),
  amount numeric(12,2) not null check (amount >= 0),
  provider text,
  provider_txn_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transactions_payment_idx on public.transactions (payment_id);
create index if not exists transactions_user_idx on public.transactions (user_id);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed')),
  provider text,
  provider_payout_id text,
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists payouts_set_updated_at on public.payouts;
create trigger payouts_set_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

-- ============================================================
-- ENTITLEMENT: post desbloqueado por PPV
-- ============================================================

create or replace function public.has_unlocked_post(viewer uuid, post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.payments p
    where p.user_id = viewer
      and p.post_id = post
      and p.purpose = 'ppv_unlock'
      and p.status = 'completed'
  )
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.payments enable row level security;
alter table public.transactions enable row level security;
alter table public.payouts enable row level security;

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_forbidden" on public.payments;
drop policy if exists "payments_update_staff" on public.payments;
drop policy if exists "payments_delete_forbidden" on public.payments;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_forbidden" on public.transactions;
drop policy if exists "transactions_delete_forbidden" on public.transactions;
drop policy if exists "payouts_select_own" on public.payouts;
drop policy if exists "payouts_insert_forbidden" on public.payouts;
drop policy if exists "payouts_update_staff" on public.payouts;
drop policy if exists "payouts_delete_forbidden" on public.payouts;

-- Payments: el usuario ve sus compras; el creador ve pagos hacia él; staff todo.
create policy "payments_select_own"
on public.payments for select
to authenticated
using (
  user_id = auth.uid()
  or creator_id = auth.uid()
  or public.is_staff()
);

-- Escrituras SOLO vía Edge Functions / webhooks con service_role.
create policy "payments_insert_forbidden"
on public.payments for insert
to authenticated
with check (public.is_staff());

create policy "payments_update_staff"
on public.payments for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "payments_delete_forbidden"
on public.payments for delete
to authenticated
using (false);

create policy "transactions_select_own"
on public.transactions for select
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.payments p where p.id = payment_id and (p.creator_id = auth.uid() or public.is_staff()))
);

create policy "transactions_insert_forbidden"
on public.transactions for insert
to authenticated
with check (public.is_staff());

create policy "transactions_delete_forbidden"
on public.transactions for delete
to authenticated
using (false);

create policy "payouts_select_own"
on public.payouts for select
to authenticated
using (creator_id = auth.uid() or public.is_staff());

create policy "payouts_insert_forbidden"
on public.payouts for insert
to authenticated
with check (public.is_staff());

create policy "payouts_update_staff"
on public.payouts for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "payouts_delete_forbidden"
on public.payouts for delete
to authenticated
using (false);

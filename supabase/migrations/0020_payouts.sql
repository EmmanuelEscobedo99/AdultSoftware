-- 0020_payouts.sql
-- Método de pago del creador + pagos (payouts) con comisión de plataforma.
-- El creador configura dónde recibe su dinero y solicita liquidar sus
-- ganancias; la plataforma retiene un % (commission_rate) de lo generado.

-- 1) Configuración global de la plataforma (pública de lectura).
create table if not exists public.platform_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

insert into public.platform_config (key, value)
values ('payout', '{"commission_rate": 0.20}'::jsonb)
on conflict (key) do nothing;

alter table public.platform_config enable row level security;

drop policy if exists "platform_config_select_public" on public.platform_config;
create policy "platform_config_select_public"
on public.platform_config for select
using (true);

-- 2) Método de pago del creador (uno por creador).
create table if not exists public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'test'
    check (provider in ('bank', 'paypal', 'stripe', 'test')),
  account_holder text,
  bank_name text,
  account_number text,
  routing_number text,
  account_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_methods_one_per_creator unique (creator_id)
);

drop trigger if exists payout_methods_set_updated_at on public.payout_methods;
create trigger payout_methods_set_updated_at
before update on public.payout_methods
for each row execute function public.set_updated_at();

alter table public.payout_methods enable row level security;

drop policy if exists "payout_methods_select_own" on public.payout_methods;
drop policy if exists "payout_methods_insert_own" on public.payout_methods;
drop policy if exists "payout_methods_update_own" on public.payout_methods;
drop policy if exists "payout_methods_delete_own" on public.payout_methods;

create policy "payout_methods_select_own"
on public.payout_methods for select
to authenticated
using (creator_id = auth.uid() or public.is_staff());

create policy "payout_methods_insert_own"
on public.payout_methods for insert
to authenticated
with check (creator_id = auth.uid());

create policy "payout_methods_update_own"
on public.payout_methods for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "payout_methods_delete_own"
on public.payout_methods for delete
to authenticated
using (creator_id = auth.uid());

-- 3) Vinculamos cada pago completado a la liquidación que lo cubre.
alter table public.payments
  add column if not exists payout_id uuid references public.payouts(id) on delete set null;

create index if not exists payments_payout_idx
  on public.payments (payout_id) where payout_id is not null;

-- 4) Comisión de plataforma (%). Configurable en platform_config.
create or replace function public.commission_rate()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (p.value ->> 'commission_rate')::numeric from public.platform_config p where p.key = 'payout'),
    0.20
  )
$$;

-- 5) Resumen de ganancias del creador (mes actual + saldo pendiente).
create or replace function public.get_creator_earnings()
returns table (
  rate numeric,
  month_gross numeric,
  month_commission numeric,
  month_net numeric,
  pending_gross numeric,
  pending_net numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator uuid := auth.uid();
  v_rate numeric;
begin
  if v_creator is null then
    raise exception 'not_authenticated';
  end if;

  v_rate := public.commission_rate();

  select coalesce(sum(p.amount), 0) into month_gross
  from public.payments p
  where p.creator_id = v_creator
    and p.status = 'completed'
    and p.created_at >= date_trunc('month', now())
    and p.created_at < date_trunc('month', now()) + interval '1 month';

  month_commission := round(month_gross * v_rate, 2);
  month_net := round(month_gross - month_commission, 2);

  select coalesce(sum(p.amount), 0) into pending_gross
  from public.payments p
  where p.creator_id = v_creator
    and p.status = 'completed'
    and p.payout_id is null;

  pending_net := round(pending_gross * (1 - v_rate), 2);

  rate := v_rate;
  return next;
end;
$$;

revoke all on function public.get_creator_earnings() from public;
grant execute on function public.get_creator_earnings() to authenticated;

-- 6) Solicitar pago: liquida los pagos completados pendientes (netos).
create or replace function public.request_payout()
returns public.payouts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator uuid := auth.uid();
  v_method public.payout_methods;
  v_gross numeric := 0;
  v_net numeric;
  v_rate numeric;
  v_payout public.payouts;
begin
  if v_creator is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_creator(v_creator) then
    raise exception 'not_creator';
  end if;

  select * into v_method
  from public.payout_methods
  where creator_id = v_creator
  limit 1;

  if v_method.id is null then
    raise exception 'no_payout_method';
  end if;

  select coalesce(sum(p.amount), 0) into v_gross
  from public.payments p
  where p.creator_id = v_creator
    and p.status = 'completed'
    and p.payout_id is null;

  if v_gross <= 0 then
    raise exception 'nothing_to_payout';
  end if;

  v_rate := public.commission_rate();
  v_net := round(v_gross * (1 - v_rate), 2);

  insert into public.payouts (creator_id, amount, currency, status, provider)
  values (v_creator, v_net, 'USD', 'pending', v_method.provider)
  returning * into v_payout;

  update public.payments
  set payout_id = v_payout.id
  where creator_id = v_creator
    and status = 'completed'
    and payout_id is null;

  return v_payout;
end;
$$;

revoke all on function public.request_payout() from public;
grant execute on function public.request_payout() to authenticated;

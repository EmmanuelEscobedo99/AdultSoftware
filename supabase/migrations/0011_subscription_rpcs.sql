-- 0011_subscription_rpcs.sql
-- RPCs seguras de suscripción.
-- NOTA Fase 9: en producción estos RPCs se invocan SOLO desde el webhook
-- de pago (Stripe/CCBill/SegPay) vía Edge Function con service_role.
-- Aquí se registra un payment interno para trazabilidad.

create or replace function public.subscribe_to_creator(p_plan_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_plan public.subscription_plans;
  v_interval text;
  v_sub public.subscriptions;
  v_creator_role text;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if public.is_user_banned(v_caller) then
    raise exception 'banned';
  end if;

  select * into v_plan from public.subscription_plans where id = p_plan_id;
  if v_plan is null or v_plan.is_active = false then
    raise exception 'plan_not_available';
  end if;

  select role into v_creator_role from public.profiles where id = v_plan.creator_id;
  if v_creator_role <> 'creator' then
    raise exception 'invalid_creator';
  end if;

  -- Registrar el pago (proveedor 'test' hasta integrar webhooks reales).
  insert into public.payments (
    user_id, creator_id, plan_id, purpose, provider, provider_payment_id,
    amount, currency, status, metadata
  ) values (
    v_caller, v_plan.creator_id, v_plan.id, 'subscription', 'test',
    'test_' || gen_random_uuid(),
    v_plan.price, v_plan.currency, 'completed',
    jsonb_build_object('billing_interval', v_plan.billing_interval)
  );

  -- Cancelar suscripciones activas previas (idempotencia).
  update public.subscriptions
  set status = 'cancelled', cancelled_at = now()
  where subscriber_id = v_caller
    and creator_id = v_plan.creator_id
    and status = 'active';

  v_interval := case v_plan.billing_interval
    when 'monthly' then '1 month'
    when 'quarterly' then '3 months'
    when 'yearly' then '1 year'
    else '1 month'
  end;

  insert into public.subscriptions (
    subscriber_id, creator_id, plan_id, started_at, expires_at, status
  ) values (
    v_caller, v_plan.creator_id, v_plan.id, now(), now() + v_interval::interval, 'active'
  ) returning * into v_sub;

  return v_sub;
end;
$$;

create or replace function public.cancel_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.subscriptions
  set status = 'cancelled', cancelled_at = now()
  where id = p_subscription_id
    and (subscriber_id = auth.uid() or creator_id = auth.uid())
    and status = 'active';
  if not found then
    raise exception 'not_authorized';
  end if;
end;
$$;

revoke all on function public.subscribe_to_creator(uuid) from public;
grant execute on function public.subscribe_to_creator(uuid) to authenticated;

revoke all on function public.cancel_subscription(uuid) from public;
grant execute on function public.cancel_subscription(uuid) to authenticated;

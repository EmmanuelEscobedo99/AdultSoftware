-- 0012_payments_rpcs.sql
-- RPCs de pago. En producción, la escritura real llega EXCLUSIVAMENTE
-- desde el webhook (payment-webhook) con service_role.

-- Desbloquear un post PPV. Modo demo con proveedor 'test';
-- en producción este RPC no se llama desde el cliente.
create or replace function public.unlock_ppv_post(p_post_id uuid)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_post public.creator_posts;
  v_payment public.payments;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_post from public.creator_posts where id = p_post_id;
  if v_post is null or v_post.visibility <> 'ppv' then
    raise exception 'not_ppv';
  end if;

  -- Idempotencia: si ya está desbloqueado, devolver el pago existente.
  select * into v_payment
  from public.payments
  where user_id = v_caller and post_id = p_post_id and status = 'completed'
  order by created_at desc
  limit 1;

  if v_payment.id is not null then
    return v_payment;
  end if;

  insert into public.payments (
    user_id, creator_id, post_id, purpose, provider, provider_payment_id,
    amount, currency, status, metadata
  ) values (
    v_caller, v_post.creator_id, p_post_id, 'ppv_unlock', 'test',
    'test_' || gen_random_uuid(),
    coalesce(v_post.price, 0), 'USD', 'completed', '{}'::jsonb
  ) returning * into v_payment;

  return v_payment;
end;
$$;

-- Finalizar un pago exitoso (llamado desde payment-webhook).
create or replace function public.finalize_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_interval text;
begin
  select * into v_payment from public.payments where id = p_payment_id;
  if v_payment is null then
    raise exception 'payment_not_found';
  end if;

  update public.payments
  set status = 'completed', updated_at = now()
  where id = p_payment_id and status = 'pending';

  insert into public.transactions (
    payment_id, user_id, type, amount, provider, provider_txn_id, metadata
  ) values (
    p_payment_id, v_payment.user_id, 'payment', v_payment.amount,
    v_payment.provider, v_payment.provider_payment_id, v_payment.metadata
  );

  if v_payment.purpose = 'subscription' and v_payment.plan_id is not null then
    update public.subscriptions
    set status = 'cancelled', cancelled_at = now()
    where subscriber_id = v_payment.user_id
      and creator_id = v_payment.creator_id
      and status = 'active';

    select billing_interval into v_interval
    from public.subscription_plans where id = v_payment.plan_id;
    v_interval := coalesce(v_interval, 'monthly');

    insert into public.subscriptions (
      subscriber_id, creator_id, plan_id, started_at, expires_at, status
    ) values (
      v_payment.user_id, v_payment.creator_id, v_payment.plan_id, now(),
      now() + (
        case v_interval
          when 'monthly' then '1 month'
          when 'quarterly' then '3 months'
          when 'yearly' then '1 year'
          else '1 month'
        end
      )::interval,
      'active'
    );
  end if;
end;
$$;

revoke all on function public.unlock_ppv_post(uuid) from public;
grant execute on function public.unlock_ppv_post(uuid) to authenticated;

revoke all on function public.finalize_payment(uuid) from public;
grant execute on function public.finalize_payment(uuid) to authenticated;

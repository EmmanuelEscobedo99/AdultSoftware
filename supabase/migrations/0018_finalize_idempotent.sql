-- 0018_finalize_idempotent.sql
-- Hace finalize_payment idempotente a nivel de BD.
-- Stripe puede enviar más de un evento para el mismo pago
-- (checkout.session.completed y payment_intent.succeeded): sin este guard,
-- el webhook podía duplicar transactions y subscriptions.

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
  -- Bloquea la fila para que dos webhooks concurrentes no finalicen dos veces.
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment is null then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status = 'completed' then
    return;
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

-- Seguridad: solo el webhook (service_role) puede finalizar pagos.
revoke all on function public.finalize_payment(uuid) from public, authenticated;
grant execute on function public.finalize_payment(uuid) to service_role;

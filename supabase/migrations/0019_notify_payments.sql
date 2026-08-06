-- 0019_notify_payments.sql
-- Notificaciones al creador:
--   - 'subscription': alguien se suscribió a su perfil (payments → subscriptions).
--   - 'ppv_unlock': alguien compró/desbloqueó su contenido premium.

-- 1) Nuevo tipo de notificación 'subscription'.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('follow', 'ppv_unlock', 'new_post', 'message', 'subscription'));

-- 2) Notificar al creador cuando se crea una suscripción activa.
--    El trigger corre como security definer (como el de follows), así que el
--    insert en notifications no se ve bloqueado por RLS.
create or replace function public.notify_new_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, actor_id)
  values (new.creator_id, 'subscription', new.subscriber_id);
  return new;
end;
$$;

drop trigger if exists subscriptions_notify_new_subscription on public.subscriptions;
create trigger subscriptions_notify_new_subscription
after insert on public.subscriptions
for each row
when (new.status = 'active')
execute function public.notify_new_subscription();

-- 3) Notificar al creador cuando un pago PPV pasa de pending a completed.
--    (Los pagos se insertan como 'pending' en create-checkout y se completan
--    desde el webhook con finalize_payment.)
create or replace function public.notify_ppv_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, actor_id, post_id)
  values (new.creator_id, 'ppv_unlock', new.user_id, new.post_id);
  return new;
end;
$$;

drop trigger if exists payments_notify_ppv_purchase on public.payments;
create trigger payments_notify_ppv_purchase
after update on public.payments
for each row
when (old.status is distinct from 'completed'
  and new.status = 'completed'
  and new.purpose = 'ppv_unlock')
execute function public.notify_ppv_purchase();

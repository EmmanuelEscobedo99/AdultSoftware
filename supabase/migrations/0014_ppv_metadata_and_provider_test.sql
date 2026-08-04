-- 0014_ppv_metadata_and_provider_test.sql
-- 1) Añade 'test' al CHECK de payments.provider (modo demo / Edge Functions).
-- 2) Permite ver metadatos de posts PPV (título, descripción, precio) a cualquier
--    usuario autenticado; el contenido (post_media) sigue bloqueado por RLS.
-- 3) Hardening: finalize_payment solo para service_role (payment-webhook) y
--    retira del cliente los helpers de modo demo ya sin uso.

alter table public.payments
  drop constraint if exists payments_provider_check;

alter table public.payments
  add constraint payments_provider_check
  check (provider in ('stripe', 'ccbill', 'segpay', 'test'));

drop policy if exists "posts_select_ppv_metadata" on public.creator_posts;
create policy "posts_select_ppv_metadata"
on public.creator_posts for select
to authenticated
using (
  visibility = 'ppv'
  and not public.is_user_banned(creator_id)
);

-- finalize_payment solo debe ejecutarse desde payment-webhook (service_role).
revoke all on function public.finalize_payment(uuid) from public, authenticated;
grant execute on function public.finalize_payment(uuid) to service_role;

-- Helpers de modo demo: ya no se llaman desde el cliente (todo pasa por
-- la Edge Function create-checkout).
revoke all on function public.subscribe_to_creator(uuid) from public, authenticated;
revoke all on function public.unlock_ppv_post(uuid) from public, authenticated;

-- 0024_fix_chat_rls.sql
-- La migración 0022 rompió el chat: la política participants_select_member
-- usaba una subconsulta recursiva sobre la MISMA tabla (conversation_participants),
-- provocando el error de PostgreSQL:
--   "infinite recursion detected in policy for relation conversation_participants"
-- Ese fallo rompía TODAS las lecturas del chat (lista de conversaciones, mensajes
-- y nombres de participantes), por eso "no enviaba mensajes ni aparecía nada".
--
-- Solución: helper SECURITY DEFINER que comprueba la pertenencia sin recursión,
-- y una política sencilla que lo usa. Idempotente.

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

drop policy if exists "participants_select_member" on public.conversation_participants;

create policy "participants_select_member"
on public.conversation_participants for select
to authenticated
using (public.is_staff() or public.is_conversation_member(conversation_id));

-- 0022_chat_fix_participants.sql
-- Corrección RLS: permitir ver a los demás participantes de tus conversaciones.
-- Antes, conversation_participants solo devolvía TU fila, por lo que el nombre
-- y la foto del otro usuario nunca llegaban al frontend (salía "Chat" genérico).

drop policy if exists "participants_select_member" on public.conversation_participants;

create policy "participants_select_member"
on public.conversation_participants for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id
      and cp.user_id = auth.uid()
  )
);

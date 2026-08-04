-- 0009_realtime.sql
-- Activa Realtime para chat. La autorización de canales usa RLS
-- (messages_select_participant) + claims del JWT.

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_participants;
alter publication supabase_realtime add table public.messages;

-- Notificación a Edge Functions para el agente IA.
-- (Opcional, usado por el webhook de realtime de Fase 8)
create or replace function public.notify_ai_agent()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify('ai_agent_inbox', json_build_object(
    'message_id', new.id,
    'conversation_id', new.conversation_id,
    'sender_id', new.sender_id,
    'is_ai', new.is_ai
  )::text);
  return new;
end;
$$;

drop trigger if exists messages_ai_notify on public.messages;
create trigger messages_ai_notify
after insert on public.messages
for each row
when (new.is_ai = false and new.sender_id is not null)
execute function public.notify_ai_agent();

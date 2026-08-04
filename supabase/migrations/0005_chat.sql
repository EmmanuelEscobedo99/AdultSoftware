-- 0005_chat.sql
-- Conversaciones y mensajes. Realtime-ready. Preparado para agentes de IA.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists conversations_created_idx
  on public.conversations (last_message_at desc);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id, last_read_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (length(body) > 0),
  media_url text,
  is_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at asc);

-- ============================================================
-- RPCs SEGURAS (security definer): todo el chat pasa por aquí
-- ============================================================

create or replace function public.start_conversation(p_target_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_conv uuid;
  v_caller_role text;
  v_target_role text;
  v_ok boolean;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body_required';
  end if;
  if v_caller = p_target_id then
    raise exception 'cannot_chat_with_self';
  end if;

  select role into v_caller_role from public.profiles where id = v_caller;
  select role into v_target_role from public.profiles where id = p_target_id;

  if v_caller_role is null or v_target_role is null then
    raise exception 'user_not_found';
  end if;

  if public.is_user_banned(v_caller) or public.is_user_banned(p_target_id) then
    raise exception 'banned';
  end if;

  v_ok := public.is_staff(v_caller)
    or (v_target_role = 'creator' and public.has_active_subscription(v_caller, p_target_id))
    or (v_caller_role = 'creator' and v_target_role in ('subscriber', 'creator'))
    or v_caller_role = v_target_role;

  if not v_ok then
    raise exception 'not_authorized_to_chat';
  end if;

  -- Reutilizar conversación existente entre ambos.
  select cp.conversation_id into v_conv
  from public.conversation_participants cp
  where cp.user_id in (v_caller, p_target_id)
  group by cp.conversation_id
  having count(distinct cp.user_id) = 2
     and bool_and(cp.user_id in (v_caller, p_target_id))
  limit 1;

  if v_conv is null then
    insert into public.conversations (created_by)
    values (v_caller)
    returning id into v_conv;

    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conv, v_caller), (v_conv, p_target_id);
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, v_caller, p_body);

  update public.conversations set last_message_at = now() where id = v_conv;
  return v_conv;
end;
$$;

create or replace function public.send_message(p_conversation_id uuid, p_body text, p_media_url text default null)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_row public.messages;
  v_creator uuid;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body_required';
  end if;
  if public.is_user_banned(v_caller) then
    raise exception 'banned';
  end if;
  if not exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = v_caller
  ) then
    raise exception 'not_participant';
  end if;

  -- Si el destinatario es un creador con agente IA habilitado,
  -- el agente responderá vía Edge Function (webhook de realtime).
  select cp.user_id into v_creator
  from public.conversation_participants cp
  join public.profiles p on p.id = cp.user_id and p.role = 'creator'
  join public.ai_agents a on a.creator_id = cp.user_id and a.enabled = true
  where cp.conversation_id = p_conversation_id
  limit 1;

  insert into public.messages (conversation_id, sender_id, body, media_url)
  values (p_conversation_id, v_caller, p_body, p_media_url)
  returning * into v_row;

  update public.conversations set last_message_at = now() where id = p_conversation_id;
  return v_row;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();
end;
$$;

revoke all on function public.start_conversation(uuid, text) from public;
grant execute on function public.start_conversation(uuid, text) to authenticated;

revoke all on function public.send_message(uuid, text, text) from public;
grant execute on function public.send_message(uuid, text, text) to authenticated;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ============================================================
-- RLS
-- ============================================================

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
drop policy if exists "conversations_insert_forbidden" on public.conversations;
drop policy if exists "conversations_update_participant" on public.conversations;
drop policy if exists "conversations_delete_staff" on public.conversations;
drop policy if exists "participants_select_member" on public.conversation_participants;
drop policy if exists "participants_insert_forbidden" on public.conversation_participants;
drop policy if exists "participants_update_own_read" on public.conversation_participants;
drop policy if exists "participants_delete_forbidden" on public.conversation_participants;
drop policy if exists "messages_select_participant" on public.messages;
drop policy if exists "messages_insert_forbidden" on public.messages;
drop policy if exists "messages_update_forbidden" on public.messages;
drop policy if exists "messages_delete_staff" on public.messages;

create policy "conversations_select_participant"
on public.conversations for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  )
);

-- Insert directo solo vía RPC start_conversation (protegido).
create policy "conversations_insert_forbidden"
on public.conversations for insert
to authenticated
with check (public.is_staff());

create policy "conversations_update_participant"
on public.conversations for update
to authenticated
using (
  public.is_staff()
  or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  )
);

create policy "conversations_delete_staff"
on public.conversations for delete
to authenticated
using (public.is_staff());

create policy "participants_select_member"
on public.conversation_participants for select
to authenticated
using (user_id = auth.uid() or public.is_staff());

create policy "participants_insert_forbidden"
on public.conversation_participants for insert
to authenticated
with check (public.is_staff());

create policy "participants_update_own_read"
on public.conversation_participants for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and last_read_at is not null);

create policy "participants_delete_forbidden"
on public.conversation_participants for delete
to authenticated
using (false);

create policy "messages_select_participant"
on public.messages for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

-- Insert de mensajes únicamente vía RPC / Edge Functions (service_role).
create policy "messages_insert_forbidden"
on public.messages for insert
to authenticated
with check (public.is_staff());

create policy "messages_update_forbidden"
on public.messages for update
to authenticated
using (public.is_staff());

create policy "messages_delete_staff"
on public.messages for delete
to authenticated
using (public.is_staff());

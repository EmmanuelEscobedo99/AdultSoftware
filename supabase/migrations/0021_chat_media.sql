-- 0021_chat_media.sql
-- Adjuntos de chat: fotos y videos en las conversaciones.
--  - Nuevo bucket privado 'chat-media' (rutas <conversation_id>/<archivo>).
--  - Columnas media_path / media_type en messages (media-only permitido).
--  - RPCs start_conversation / send_message aceptan media.

-- 1) Bucket privado para adjuntos de chat.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  false,
  209715200,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set public = false;

-- Subida: solo participantes de la conversación (ruta <conversation_id>/<archivo>).
drop policy if exists "chat_media_upload_participant" on storage.objects;
create policy "chat_media_upload_participant"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and owner_id = auth.uid()::text
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = (storage.foldername(name))[1]::uuid
      and cp.user_id = auth.uid()
  )
);

-- Lectura: participante / dueño / staff.
drop policy if exists "chat_media_read_participant" on storage.objects;
create policy "chat_media_read_participant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and (
    owner_id = auth.uid()::text
    or public.is_staff()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = (storage.foldername(name))[1]::uuid
        and cp.user_id = auth.uid()
    )
  )
);

-- Borrado: dueño o staff.
drop policy if exists "chat_media_delete_owner" on storage.objects;
create policy "chat_media_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and (owner_id = auth.uid()::text or public.is_staff())
);

-- 2) Messages: soporte de adjuntos y mensajes solo-media.
alter table public.messages
  add column if not exists media_path text;

alter table public.messages
  add column if not exists media_type text
    check (media_type in ('image', 'video'));

alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_body_check
  check (length(trim(body)) > 0 or media_path is not null);

-- 3) RPCs actualizadas (aceptan adjunto + permiten mensaje solo-media).
--    Eliminamos las firmas antiguas para evitar sobrecarga ambigua en PostgREST.
drop function if exists public.start_conversation(uuid, text);
drop function if exists public.send_message(uuid, text, text);

create or replace function public.start_conversation(
  p_target_id uuid,
  p_body text,
  p_media_url text default null,
  p_media_path text default null,
  p_media_type text default null
)
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
  v_media_type text;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if (p_body is null or length(trim(p_body)) = 0)
     and (p_media_path is null or length(trim(p_media_path)) = 0) then
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

  v_media_type := case
    when p_media_type in ('image', 'video') then p_media_type
    else null
  end;

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

  insert into public.messages (conversation_id, sender_id, body, media_url, media_path, media_type)
  values (v_conv, v_caller, coalesce(p_body, ''), p_media_url, p_media_path, v_media_type);

  update public.conversations set last_message_at = now() where id = v_conv;
  return v_conv;
end;
$$;

create or replace function public.send_message(
  p_conversation_id uuid,
  p_body text,
  p_media_url text default null,
  p_media_path text default null,
  p_media_type text default null
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_row public.messages;
  v_creator uuid;
  v_media_type text;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if (p_body is null or length(trim(p_body)) = 0)
     and (p_media_path is null or length(trim(p_media_path)) = 0) then
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

  v_media_type := case
    when p_media_type in ('image', 'video') then p_media_type
    else null
  end;

  insert into public.messages (conversation_id, sender_id, body, media_url, media_path, media_type)
  values (p_conversation_id, v_caller, coalesce(p_body, ''), p_media_url, p_media_path, v_media_type)
  returning * into v_row;

  update public.conversations set last_message_at = now() where id = p_conversation_id;
  return v_row;
end;
$$;

revoke all on function public.start_conversation(uuid, text, text, text, text) from public;
grant execute on function public.start_conversation(uuid, text, text, text, text) to authenticated;

revoke all on function public.send_message(uuid, text, text, text, text) from public;
grant execute on function public.send_message(uuid, text, text, text, text) to authenticated;

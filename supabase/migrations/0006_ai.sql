-- 0006_ai.sql
-- Agentes de IA por creador. La inferencia se ejecuta en Edge Functions
-- con service_role; aquí solo configuración + RLS.

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  personality text,
  system_prompt text,
  max_tokens int not null default 180 check (max_tokens between 16 and 2048),
  temperature numeric(3,2) not null default 0.7 check (temperature between 0 and 2),
  auto_reply boolean not null default true,
  auto_reply_delay_seconds int not null default 30 check (auto_reply_delay_seconds between 0 and 600),
  can_sell_ppv boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id)
);

drop trigger if exists ai_agents_set_updated_at on public.ai_agents;
create trigger ai_agents_set_updated_at
before update on public.ai_agents
for each row execute function public.set_updated_at();

-- Un agente por creador: ayuda a gestionarlo desde la UI del creador.
create or replace function public.upsert_ai_agent(
  p_enabled boolean,
  p_personality text,
  p_system_prompt text,
  p_max_tokens int,
  p_temperature numeric,
  p_auto_reply boolean,
  p_auto_reply_delay_seconds int,
  p_can_sell_ppv boolean
)
returns public.ai_agents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.ai_agents;
begin
  if not public.is_creator(auth.uid()) then
    raise exception 'forbidden';
  end if;

  insert into public.ai_agents (
    creator_id, enabled, personality, system_prompt, max_tokens,
    temperature, auto_reply, auto_reply_delay_seconds, can_sell_ppv
  )
  values (
    auth.uid(), p_enabled, p_personality, p_system_prompt, p_max_tokens,
    p_temperature, p_auto_reply, p_auto_reply_delay_seconds, p_can_sell_ppv
  )
  on conflict (creator_id) do update set
    enabled = excluded.enabled,
    personality = excluded.personality,
    system_prompt = excluded.system_prompt,
    max_tokens = excluded.max_tokens,
    temperature = excluded.temperature,
    auto_reply = excluded.auto_reply,
    auto_reply_delay_seconds = excluded.auto_reply_delay_seconds,
    can_sell_ppv = excluded.can_sell_ppv
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_ai_agent(boolean, text, text, int, numeric, boolean, int, boolean) from public;
grant execute on function public.upsert_ai_agent(boolean, text, text, int, numeric, boolean, int, boolean) to authenticated;

alter table public.ai_agents enable row level security;

drop policy if exists "ai_agents_select_owner" on public.ai_agents;
drop policy if exists "ai_agents_insert_forbidden" on public.ai_agents;
drop policy if exists "ai_agents_update_owner" on public.ai_agents;
drop policy if exists "ai_agents_delete_owner" on public.ai_agents;

create policy "ai_agents_select_owner"
on public.ai_agents for select
to authenticated
using (creator_id = auth.uid() or public.is_staff());

-- La IA (Edge Function con service_role) puede leer config de cualquier agente.
create policy "ai_agents_insert_forbidden"
on public.ai_agents for insert
to authenticated
with check (public.is_staff());

create policy "ai_agents_update_owner"
on public.ai_agents for update
to authenticated
using (creator_id = auth.uid() or public.is_staff())
with check (creator_id = auth.uid() or public.is_staff());

create policy "ai_agents_delete_owner"
on public.ai_agents for delete
to authenticated
using (creator_id = auth.uid() or public.is_staff());

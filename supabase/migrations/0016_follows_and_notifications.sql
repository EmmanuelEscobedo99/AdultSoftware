-- 0016_follows_and_notifications.sql
-- Seguir (follow) a creadores + sistema de notificaciones.
-- Al seguir a alguien se crea una notificación 'follow' para el seguido.

-- ============================================================
-- FOLLOWS
-- ============================================================

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_check check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id, created_at desc);

alter table public.follows enable row level security;

drop policy if exists "follows_select_own" on public.follows;
drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;

create policy "follows_select_own"
on public.follows for select
to authenticated
using (follower_id = auth.uid() or following_id = auth.uid() or public.is_staff());

create policy "follows_insert_own"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

create policy "follows_delete_own"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow', 'ppv_unlock', 'new_post', 'message')),
  actor_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.creator_posts(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notifications_delete_own"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- TRIGGER: notificar al creador cuando alguien lo sigue
-- ============================================================

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, actor_id)
  values (new.following_id, 'follow', new.follower_id);
  return new;
end;
$$;

drop trigger if exists follows_notify_new_follower on public.follows;
create trigger follows_notify_new_follower
after insert on public.follows
for each row execute function public.notify_new_follower();

-- ============================================================
-- REALTIME: notificaciones en vivo (idempotente)
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

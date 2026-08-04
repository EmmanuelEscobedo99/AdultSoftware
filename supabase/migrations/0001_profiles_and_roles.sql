-- 0001_extensions_and_helpers.sql
-- Extensiones, helpers globales y tabla de perfiles con roles.
--
-- IMPORTANTE: las funciones en LANGUAGE sql se validan en el momento de
-- crearse, por lo que la tabla profiles debe existir antes que los helpers.

-- Extensiones requeridas
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Trigger genérico de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TABLA profiles
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'subscriber'
    check (role in ('super_admin', 'admin', 'moderator', 'support', 'creator', 'subscriber')),
  is_banned boolean not null default false,
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ============================================================
-- HELPER DE ROLES (fuente de verdad: profiles.role)
-- Se ejecutan con security definer para evitar RLS recursivo.
-- ============================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'subscriber'
  )
$$;

create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.role in ('super_admin', 'admin', 'moderator', 'support')
  )
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.role in ('super_admin', 'admin')
  )
$$;

create or replace function public.is_creator(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.role = 'creator'
  )
$$;

create or replace function public.is_user_banned(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.is_banned = true
  )
$$;

-- ============================================================
-- AUTO-CREACIÓN DE PERFIL AL REGISTRARSE
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'subscriber')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- SINCRONIZAR ROL CON LOS CLAIMS DEL JWT (app_metadata)
-- ============================================================

create or replace function public.sync_role_to_jwt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new.role)
  )
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change
after insert or update of role on public.profiles
for each row execute function public.sync_role_to_jwt();

-- ============================================================
-- CAMBIO DE ROL SEGURO (solo super_admin/admin)
-- ============================================================

create or replace function public.admin_set_role(p_target_user uuid, p_new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_new_role not in ('super_admin', 'admin', 'moderator', 'support', 'creator', 'subscriber') then
    raise exception 'invalid_role';
  end if;
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;
  update public.profiles set role = p_new_role where id = p_target_user;
  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.admin_set_role(uuid, text) from public;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ============================================================
-- RLS: profiles
-- - Select: todos los autenticados ven perfiles (perfil público básico).
-- - Insert: solo el propio usuario (via trigger handle_new_user, pero se protege igual).
-- - Update: el propio usuario en campos no sensibles.
-- - Delete: prohibido para clientes (solo service_role).
-- ============================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_anon" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_safe_fields" on public.profiles;
drop policy if exists "profiles_delete_forbidden" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_select_anon"
on public.profiles for select
to anon
using (true);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own_safe_fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and is_banned = (select p.is_banned from public.profiles p where p.id = auth.uid())
  and banned_at is not distinct from (select p.banned_at from public.profiles p where p.id = auth.uid())
);

create policy "profiles_delete_forbidden"
on public.profiles for delete
to authenticated
using (false);

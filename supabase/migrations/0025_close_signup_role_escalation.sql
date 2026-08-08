-- 0025_close_signup_role_escalation.sql
-- Cierra la escalada de privilegios en el registro:
-- antes, handle_new_user() insertaba cualquier rol que viniera en
-- raw_user_meta_data.role, así que cualquiera podía registrarse con
-- role='super_admin' mediante la API pública de signup.
--
-- Ahora solo se aceptan 'subscriber' y 'creator'. Cualquier otro valor
-- (super_admin, admin, moderator, support, etc.) se fuerza a 'subscriber'.
-- Los roles privilegiados solo se pueden asignar vía admin_set_role().

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_role text;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'subscriber');
  if v_role not in ('subscriber', 'creator') then
    v_role := 'subscriber';
  end if;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username),
    v_role
  );
  return new;
end;
$$;

-- Auditoría: listar cuentas existentes con roles privilegiados
-- (debería devolver 0 filas salvo que ya exista un admin legítimo).
-- select id, email, raw_user_meta_data->>'username' as username
-- from auth.users u
-- where exists (
--   select 1 from public.profiles p
--   where p.id = u.id and p.role in ('super_admin', 'admin', 'moderator', 'support')
-- );

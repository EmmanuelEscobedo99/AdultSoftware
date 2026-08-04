-- 0013_admin_rpcs.sql
-- Acciones administrativas protegidas (siempre verifican rol en servidor).

create or replace function public.admin_ban_user(p_user_id uuid, p_ban boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) and not public.is_staff(auth.uid()) then
    raise exception 'forbidden';
  end if;
  update public.profiles
  set is_banned = p_ban,
      banned_at = case when p_ban then now() else null end
  where id = p_user_id;
  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

create or replace function public.admin_update_report(
  p_report_id uuid,
  p_status text,
  p_resolve boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'forbidden';
  end if;
  if p_status not in ('pending', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'invalid_status';
  end if;
  update public.reports
  set status = p_status,
      moderator_id = auth.uid(),
      resolved_at = case when p_resolve then now() else resolved_at end,
      updated_at = now()
  where id = p_report_id;
end;
$$;

create or replace function public.admin_warn_user(p_user_id uuid, p_reason text, p_severity int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'forbidden';
  end if;
  if p_reason is null or length(p_reason) = 0 then
    raise exception 'reason_required';
  end if;
  insert into public.warnings (user_id, moderator_id, reason, severity)
  values (p_user_id, auth.uid(), p_reason, p_severity);
end;
$$;

revoke all on function public.admin_ban_user(uuid, boolean) from public;
grant execute on function public.admin_ban_user(uuid, boolean) to authenticated;

revoke all on function public.admin_update_report(uuid, text, boolean) from public;
grant execute on function public.admin_update_report(uuid, text, boolean) to authenticated;

revoke all on function public.admin_warn_user(uuid, text, int) from public;
grant execute on function public.admin_warn_user(uuid, text, int) to authenticated;

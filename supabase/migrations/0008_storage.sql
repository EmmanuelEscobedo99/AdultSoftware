-- 0008_storage.sql
-- Buckets privados + políticas. Nunca público. Acceso por Signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content-images', 'content-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('content-videos', 'content-videos', false, 524288000, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false;

-- ============================================================
-- POLÍTICAS STORAGE.OBJECTS
-- ============================================================

drop policy if exists "avatars_read_any" on storage.objects;
drop policy if exists "avatars_upload_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "content_read_with_entitlement" on storage.objects;
drop policy if exists "content_upload_owner" on storage.objects;
drop policy if exists "content_update_owner" on storage.objects;
drop policy if exists "content_delete_owner" on storage.objects;

-- avatars: cualquier autenticado puede leer (son públicos por naturaleza);
-- solo el dueño sube/borra el suyo.
create policy "avatars_read_any"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

create policy "avatars_upload_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and owner_id = auth.uid()::text);

create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and owner_id = auth.uid()::text);

-- contenido: rutas con formato <post_id>/<archivo>.
-- Lectura solo si el usuario tiene acceso al post padre (entitlement).
create policy "content_read_with_entitlement"
on storage.objects for select
to authenticated
using (
  bucket_id in ('content-images', 'content-videos')
  and (
    owner_id = auth.uid()::text
    or public.is_staff()
    or exists (
      select 1 from public.creator_posts cp
      where cp.id = (storage.foldername(name))[1]::uuid
        and public.has_post_access(auth.uid(), cp.id)
    )
  )
);

create policy "content_upload_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('content-images', 'content-videos')
  and owner_id = auth.uid()::text
  and public.is_creator(auth.uid())
);

create policy "content_update_owner"
on storage.objects for update
to authenticated
using (
  bucket_id in ('content-images', 'content-videos')
  and (owner_id = auth.uid()::text or public.is_staff())
);

create policy "content_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('content-images', 'content-videos')
  and (owner_id = auth.uid()::text or public.is_staff())
);

-- Sin acceso anónimo a ningún bucket.
revoke all on storage.objects from anon;
grant select on storage.objects to anon;

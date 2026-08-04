-- 0015_profile_cover.sql
-- Foto de portada del perfil (estilo OnlyFans/Fansly).
-- cover_url guarda una ruta dentro del bucket 'avatars' (<user_id>/cover-<uuid>).
-- La política profiles_update_own_safe_fields ya permite al dueño actualizar
-- su perfil; las políticas del bucket avatars ya permiten subir/leer lo suyo.

alter table public.profiles
  add column if not exists cover_url text;

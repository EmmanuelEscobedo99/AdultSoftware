-- 0023_fix_storage_schema.sql
-- Reparación: la migración 0021 creó políticas RLS sobre storage.objects,
-- lo que NO está permitido en Supabase (desde abril 2025) y rompe el
-- servicio de Storage ("The database schema is invalid or incompatible",
-- listado de buckets/objetos vacío, previsualizaciones rotas).
--
-- Solución: eliminar esas políticas. El bucket 'chat-media' se conserva.
-- (Los adjuntos de chat deberán subirse vía Edge Function con service_role,
-- ya que no se pueden crear políticas sobre storage.objects.)

drop policy if exists "chat_media_upload_participant" on storage.objects;
drop policy if exists "chat_media_read_participant" on storage.objects;
drop policy if exists "chat_media_delete_owner" on storage.objects;

-- Verificación: debe devolver 0 filas (ninguna política "chat_media_*" restante).
select policyname
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'chat_media_%';

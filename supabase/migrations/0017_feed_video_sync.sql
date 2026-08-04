-- 0017_feed_video_sync.sql
-- Sincroniza automáticamente los videos subidos en post_media hacia creator_videos
-- para alimentar el feed tipo TikTok, y mantiene contadores de likes y comentarios.
-- Idempotente: aplicable varias veces sin errores.

-- --- published_at nullable: un video de un borrador (sin publicar) NO debe salir en el feed ---
alter table public.creator_videos alter column published_at drop not null;

-- --- Contadores de engagement en creator_videos ---
alter table public.creator_videos
  add column if not exists like_count int not null default 0;
alter table public.creator_videos
  add column if not exists comment_count int not null default 0;

-- --- Sync post_media (media_type='video') -> creator_videos ---
create or replace function public.sync_post_video_to_feed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post record;
  v_video_id uuid;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    -- Si deja de ser video, eliminar la entrada del feed.
    if new.media_type <> 'video' then
      if tg_op = 'UPDATE' and old.media_type = 'video' then
        delete from public.creator_videos
         where post_id = old.post_id and storage_path = old.storage_path;
      end if;
      return new;
    end if;

    select id, creator_id, title, description, visibility, price, published_at
      into v_post
      from public.creator_posts
     where id = new.post_id;

    if not found then
      return new;
    end if;

    -- Actualización de un video ya sincronizado (misma ruta).
    if tg_op = 'UPDATE' and old.media_type = 'video' then
      update public.creator_videos
         set creator_id = v_post.creator_id,
             title = coalesce(v_post.title, ''),
             description = v_post.description,
             storage_path = new.storage_path,
             duration = new.duration,
             visibility = v_post.visibility,
             price = v_post.price,
             published_at = v_post.published_at,
             updated_at = now()
       where post_id = new.post_id and storage_path = old.storage_path;
      return new;
    end if;

    select id into v_video_id
      from public.creator_videos
     where post_id = new.post_id and storage_path = new.storage_path
     limit 1;

    if v_video_id is null then
      insert into public.creator_videos (
        creator_id, post_id, title, description, storage_path, thumbnail_path,
        duration, visibility, price, published_at
      ) values (
        v_post.creator_id, v_post.id, coalesce(v_post.title, ''), v_post.description,
        new.storage_path, null, new.duration, v_post.visibility, v_post.price,
        v_post.published_at
      );
    else
      update public.creator_videos
         set title = coalesce(v_post.title, ''),
             description = v_post.description,
             duration = new.duration,
             visibility = v_post.visibility,
             price = v_post.price,
             published_at = v_post.published_at,
             updated_at = now()
       where id = v_video_id;
    end if;
    return new;
  end if;

  if old.media_type = 'video' then
    delete from public.creator_videos
     where post_id = old.post_id and storage_path = old.storage_path;
  end if;
  return old;
end;
$$;

drop trigger if exists sync_post_video_feed on public.post_media;
create trigger sync_post_video_feed
after insert or update or delete on public.post_media
for each row execute function public.sync_post_video_to_feed();

-- --- Sync metadatos de creator_posts (título, visibilidad, precio, publicación) ---
create or replace function public.sync_post_video_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.creator_videos
     set title = coalesce(new.title, ''),
         description = new.description,
         visibility = new.visibility,
         price = new.price,
         published_at = new.published_at,
         updated_at = now()
   where post_id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_post_video_meta on public.creator_posts;
create trigger sync_post_video_meta
after update on public.creator_posts
for each row execute function public.sync_post_video_metadata();

-- --- Contador de likes ---
create or replace function public.bump_video_likes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.creator_videos
       set like_count = like_count + 1, updated_at = now()
     where id = new.video_id;
    return new;
  else
    update public.creator_videos
       set like_count = greatest(like_count - 1, 0), updated_at = now()
     where id = old.video_id;
    return old;
  end if;
end;
$$;

drop trigger if exists bump_video_likes_trigger on public.video_likes;
create trigger bump_video_likes_trigger
after insert or delete on public.video_likes
for each row execute function public.bump_video_likes();

-- --- Contador de comentarios ---
create or replace function public.bump_video_comments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.creator_videos
       set comment_count = comment_count + 1, updated_at = now()
     where id = new.video_id;
    return new;
  else
    update public.creator_videos
       set comment_count = greatest(comment_count - 1, 0), updated_at = now()
     where id = old.video_id;
    return old;
  end if;
end;
$$;

drop trigger if exists bump_video_comments_trigger on public.video_comments;
create trigger bump_video_comments_trigger
after insert or delete on public.video_comments
for each row execute function public.bump_video_comments();

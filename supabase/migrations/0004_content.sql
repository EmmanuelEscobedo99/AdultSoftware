-- 0004_content.sql
-- Posts de creadores, medios y feed tipo TikTok (videos, likes, vistas, comentarios, bookmarks).

create table if not exists public.creator_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  description text,
  price numeric(10,2) check (price is null or price >= 0),
  visibility text not null default 'free'
    check (visibility in ('free', 'subscribers', 'ppv')),
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_posts_creator_idx
  on public.creator_posts (creator_id, published_at desc);
create index if not exists creator_posts_visibility_idx
  on public.creator_posts (visibility);

drop trigger if exists creator_posts_set_updated_at on public.creator_posts;
create trigger creator_posts_set_updated_at
before update on public.creator_posts
for each row execute function public.set_updated_at();

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.creator_posts(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text,
  width int,
  height int,
  duration numeric(10,2),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists post_media_post_idx on public.post_media (post_id, sort_order);

-- ============================================================
-- Feed tipo TikTok
-- ============================================================

create table if not exists public.creator_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.creator_posts(id) on delete set null,
  title text,
  description text,
  storage_path text not null,
  thumbnail_path text,
  duration numeric(10,2),
  visibility text not null default 'free'
    check (visibility in ('free', 'subscribers', 'ppv')),
  price numeric(10,2) check (price is null or price >= 0),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_videos_feed_idx
  on public.creator_videos (published_at desc);

drop trigger if exists creator_videos_set_updated_at on public.creator_videos;
create trigger creator_videos_set_updated_at
before update on public.creator_videos
for each row execute function public.set_updated_at();

create table if not exists public.video_likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.creator_videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

create table if not exists public.video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.creator_videos(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  viewed_at timestamptz not null default now()
);

create index if not exists video_views_video_idx on public.video_views (video_id);

create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.creator_videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists video_comments_set_updated_at on public.video_comments;
create trigger video_comments_set_updated_at
before update on public.video_comments
for each row execute function public.set_updated_at();

create table if not exists public.video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.creator_videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

-- ============================================================
-- ENTITLEMENT: acceso a un post (free / suscriptores / ppv)
-- ============================================================

create or replace function public.has_post_access(viewer uuid, post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.creator_posts cp
    where cp.id = post
      and not public.is_user_banned(cp.creator_id)
      and (
        cp.visibility = 'free'
        or cp.creator_id = viewer
        or public.has_active_subscription(viewer, cp.creator_id)
        or (cp.visibility = 'ppv' and public.has_unlocked_post(viewer, cp.id))
      )
  )
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.creator_posts enable row level security;
alter table public.post_media enable row level security;
alter table public.creator_videos enable row level security;
alter table public.video_likes enable row level security;
alter table public.video_views enable row level security;
alter table public.video_comments enable row level security;
alter table public.video_bookmarks enable row level security;

drop policy if exists "posts_select" on public.creator_posts;
drop policy if exists "posts_select_anon_free" on public.creator_posts;
drop policy if exists "posts_insert_creator" on public.creator_posts;
drop policy if exists "posts_update_owner" on public.creator_posts;
drop policy if exists "posts_delete_owner" on public.creator_posts;
drop policy if exists "media_select_with_post" on public.post_media;
drop policy if exists "media_insert_owner" on public.post_media;
drop policy if exists "media_update_owner" on public.post_media;
drop policy if exists "media_delete_owner" on public.post_media;
drop policy if exists "videos_select" on public.creator_videos;
drop policy if exists "videos_select_anon_free" on public.creator_videos;
drop policy if exists "videos_insert_creator" on public.creator_videos;
drop policy if exists "videos_update_owner" on public.creator_videos;
drop policy if exists "videos_delete_owner" on public.creator_videos;
drop policy if exists "likes_select" on public.video_likes;
drop policy if exists "likes_insert_own" on public.video_likes;
drop policy if exists "likes_delete_own" on public.video_likes;
drop policy if exists "views_select_staff" on public.video_views;
drop policy if exists "views_insert_own" on public.video_views;
drop policy if exists "comments_select" on public.video_comments;
drop policy if exists "comments_insert_own" on public.video_comments;
drop policy if exists "comments_update_own" on public.video_comments;
drop policy if exists "comments_delete_moderators" on public.video_comments;
drop policy if exists "bookmarks_select_own" on public.video_bookmarks;
drop policy if exists "bookmarks_insert_own" on public.video_bookmarks;
drop policy if exists "bookmarks_delete_own" on public.video_bookmarks;

-- --- creator_posts ---
create policy "posts_select"
on public.creator_posts for select
using (
  creator_id = auth.uid()
  or public.has_post_access(auth.uid(), id)
  or (auth.uid() is null and visibility = 'free')
  or public.is_staff()
);

create policy "posts_select_anon_free"
on public.creator_posts for select
to anon
using (visibility = 'free');

create policy "posts_insert_creator"
on public.creator_posts for insert
to authenticated
with check (creator_id = auth.uid() and public.is_creator(auth.uid()));

create policy "posts_update_owner"
on public.creator_posts for update
to authenticated
using (creator_id = auth.uid() or public.is_staff())
with check (creator_id = auth.uid() or public.is_staff());

create policy "posts_delete_owner"
on public.creator_posts for delete
to authenticated
using (creator_id = auth.uid() or public.is_staff());

-- --- post_media ---
create policy "media_select_with_post"
on public.post_media for select
using (
  exists (
    select 1 from public.creator_posts cp
    where cp.id = post_id
      and (cp.creator_id = auth.uid() or public.has_post_access(auth.uid(), cp.id) or public.is_staff())
  )
);

create policy "media_insert_owner"
on public.post_media for insert
to authenticated
with check (
  exists (select 1 from public.creator_posts cp where cp.id = post_id and cp.creator_id = auth.uid())
);

create policy "media_update_owner"
on public.post_media for update
to authenticated
using (
  exists (select 1 from public.creator_posts cp where cp.id = post_id and (cp.creator_id = auth.uid() or public.is_staff()))
);

create policy "media_delete_owner"
on public.post_media for delete
to authenticated
using (
  exists (select 1 from public.creator_posts cp where cp.id = post_id and (cp.creator_id = auth.uid() or public.is_staff()))
);

-- --- creator_videos ---
create policy "videos_select"
on public.creator_videos for select
using (
  creator_id = auth.uid()
  or (post_id is not null and public.has_post_access(auth.uid(), post_id))
  or (post_id is null and visibility = 'free')
  or public.is_staff()
);

create policy "videos_select_anon_free"
on public.creator_videos for select
to anon
using (visibility = 'free');

create policy "videos_insert_creator"
on public.creator_videos for insert
to authenticated
with check (creator_id = auth.uid() and public.is_creator(auth.uid()));

create policy "videos_update_owner"
on public.creator_videos for update
to authenticated
using (creator_id = auth.uid() or public.is_staff())
with check (creator_id = auth.uid() or public.is_staff());

create policy "videos_delete_owner"
on public.creator_videos for delete
to authenticated
using (creator_id = auth.uid() or public.is_staff());

-- --- video_likes ---
create policy "likes_select"
on public.video_likes for select
to authenticated
using (user_id = auth.uid() or public.is_staff());

create policy "likes_insert_own"
on public.video_likes for insert
to authenticated
with check (user_id = auth.uid());

create policy "likes_delete_own"
on public.video_likes for delete
to authenticated
using (user_id = auth.uid());

-- --- video_views ---
create policy "views_select_staff"
on public.video_views for select
to authenticated
using (public.is_staff());

create policy "views_insert_own"
on public.video_views for insert
to authenticated
with check (user_id = auth.uid() or user_id is null);

-- --- video_comments ---
create policy "comments_select"
on public.video_comments for select
using (true);

create policy "comments_insert_own"
on public.video_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.creator_videos v
    where v.id = video_id
      and not public.is_user_banned(v.creator_id)
  )
);

create policy "comments_update_own"
on public.video_comments for update
to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

create policy "comments_delete_moderators"
on public.video_comments for delete
to authenticated
using (user_id = auth.uid() or public.is_staff());

-- --- video_bookmarks ---
create policy "bookmarks_select_own"
on public.video_bookmarks for select
to authenticated
using (user_id = auth.uid());

create policy "bookmarks_insert_own"
on public.video_bookmarks for insert
to authenticated
with check (user_id = auth.uid());

create policy "bookmarks_delete_own"
on public.video_bookmarks for delete
to authenticated
using (user_id = auth.uid());

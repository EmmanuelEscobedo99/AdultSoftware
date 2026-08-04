import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Check, Heart, MessageCircle, Send, User, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import { feedService } from '../../application/feed.service'
import {
  useVideoUrl,
  useVideoComments,
  useAddComment,
  useDeleteComment,
} from '../../application/useFeed'

function formatCount(value) {
  const n = Number(value) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'ahora mismo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return new Date(date).toLocaleDateString()
}

function ActionButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex flex-col items-center gap-1"
    >
      {children}
      {label !== undefined ? (
        <span className="text-xs font-medium text-white">{label}</span>
      ) : null}
    </button>
  )
}

function CommentRow({ comment, onDelete, busy }) {
  const { user } = useAuth()
  const { data: avatarUrl } = useProfileImage(comment.author?.avatar_url)
  const own = user?.id === comment.user_id
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-neutral-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">
          {comment.author?.display_name ?? comment.author?.username}
          <span className="ml-1 font-normal text-white/50">
            {timeAgo(comment.created_at)}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-white/90">{comment.body}</p>
      </div>
      {own ? (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-white/60 hover:text-white"
          onClick={() => onDelete(comment.id)}
          loading={busy}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

export function VideoCard({
  video,
  active,
  liked,
  bookmarked,
  isFollowing,
  isOwnVideo,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  likePending,
  followPending,
}) {
  const { data: videoUrl } = useVideoUrl(video?.storage_path)
  const { data: avatarUrl } = useProfileImage(video?.creator?.avatar_url)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [body, setBody] = useState('')

  const { data: comments, isLoading: commentsLoading } = useVideoComments(
    commentsOpen ? video?.id : null,
  )
  const addComment = useAddComment(video?.id)
  const deleteComment = useDeleteComment(video?.id)

  useEffect(() => {
    if (video?.id && active) feedService.recordView(video.id)
  }, [video?.id, active])

  if (!video) return null

  const profileTo = `/c/${video.creator?.username}`

  const handleSubmitComment = (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text || addComment.isPending) return
    addComment.mutate({ body: text }, { onSuccess: () => setBody('') })
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          loop
          muted
          autoPlay={active}
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />
      ) : (
        <Skeleton className="h-full w-full" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={profileTo} className="pointer-events-auto block shrink-0">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-surface-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={video.creator?.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-neutral-300" />
                )}
              </div>
            </Link>
            <div className="min-w-0">
              <Link to={profileTo} className="pointer-events-auto">
                <p className="truncate font-semibold text-white">
                  {video.creator?.display_name ?? video.creator?.username}
                </p>
                <p className="truncate text-xs text-white/70">
                  @{video.creator?.username}
                </p>
              </Link>
              {video.title ? (
                <p className="mt-1 line-clamp-2 text-sm text-white/90">
                  {video.title}
                </p>
              ) : null}
            </div>
          </div>

          {!isOwnVideo ? (
            <div className="pointer-events-auto flex shrink-0 flex-col gap-2">
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : undefined}
                className={cn(
                  isFollowing && 'border-white/40 text-white hover:bg-white/10',
                )}
                onClick={() => onToggleFollow(video)}
                loading={followPending}
              >
                {isFollowing ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Button>
              <Link to={profileTo}>
                <Button size="sm" variant="secondary" className="w-full">
                  Suscribirse
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
        <ActionButton label={formatCount(video.like_count)} onClick={() => onToggleLike(video)}>
          <Heart
            className={cn(
              'h-7 w-7 drop-shadow text-white',
              liked && 'fill-red-500 text-red-500',
              likePending && 'opacity-60',
            )}
          />
        </ActionButton>
        <ActionButton
          label={formatCount(video.comment_count)}
          onClick={() => setCommentsOpen((value) => !value)}
        >
          <MessageCircle
            className={cn(
              'h-7 w-7 drop-shadow text-white',
              commentsOpen && 'fill-white/50',
            )}
          />
        </ActionButton>
        <ActionButton label="Guardar" onClick={() => onToggleBookmark(video)}>
          <Bookmark
            className={cn(
              'h-7 w-7 drop-shadow text-white',
              bookmarked && 'fill-amber-400 text-amber-400',
            )}
          />
        </ActionButton>
      </div>

      {commentsOpen ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/75 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-semibold text-white">
              Comentarios{' '}
              <span className="text-sm font-normal text-white/60">
                ({formatCount(video.comment_count)})
              </span>
            </p>
            <button
              type="button"
              onClick={() => setCommentsOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            {commentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : comments?.length ? (
              comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  onDelete={deleteComment.mutate}
                  busy={deleteComment.isPending}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/60">
                Aún no hay comentarios. ¡Sé el primero!
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-2 border-t border-white/10 p-3"
          >
            <Input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Añade un comentario…"
              className="border-white/10 bg-white/10 text-white placeholder:text-white/50"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              loading={addComment.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

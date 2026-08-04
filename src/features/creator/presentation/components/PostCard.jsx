import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { POST_VISIBILITY } from '@/lib/constants'
import { creatorContentService } from '../../application/creatorContent.service'
import { usePostMediaUrl } from '../../application/useCreatorPosts'
import { FileText, Eye, EyeOff, Play, Trash2 } from 'lucide-react'

const visibilityLabel = {
  [POST_VISIBILITY.FREE]: { label: 'Libre', tone: 'info' },
  [POST_VISIBILITY.SUBSCRIBERS]: { label: 'Suscriptores', tone: 'warning' },
  [POST_VISIBILITY.PPV]: { label: 'PPV', tone: 'danger' },
}

function PostCover({ post }) {
  const media = post.media?.[0]
  const { data: url, isLoading } = usePostMediaUrl(media)

  if (isLoading) return <Skeleton className="h-full w-full" />

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-600">
        <FileText className="h-8 w-8" />
      </div>
    )
  }

  if (media.media_type === 'video') {
    return (
      <div className="relative h-full w-full">
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
            <Play className="h-6 w-6 fill-white text-white" />
          </div>
        </div>
      </div>
    )
  }

  return <img src={url} alt={post.title} className="h-full w-full object-cover" />
}

export function PostCard({ post }) {
  const queryClient = useQueryClient()
  const badge = visibilityLabel[post.visibility] ?? visibilityLabel[POST_VISIBILITY.FREE]
  const extraMedia = (post.media?.length ?? 0) - 1

  const publishMutation = useMutation({
    mutationFn: () =>
      post.published_at
        ? creatorContentService.unpublishPost(post.id)
        : creatorContentService.publishPost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator-posts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => creatorContentService.deletePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator-posts'] }),
  })

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-2">
      <PostCover post={post} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-10">
        <p className="line-clamp-2 text-sm font-medium text-white">
          {post.title || 'Sin título'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          {post.price ? <span className="text-xs font-semibold text-white">${post.price}</span> : null}
          {post.published_at ? (
            <span className="text-xs text-white/70">
              {new Date(post.published_at).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-amber-300">Borrador</span>
          )}
        </div>
      </div>

      {extraMedia > 0 ? (
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          +{extraMedia}
        </span>
      ) : null}

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
          title={post.published_at ? 'Despublicar' : 'Publicar'}
          className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        >
          {post.published_at ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Eliminar este post?')) deleteMutation.mutate()
          }}
          disabled={deleteMutation.isPending}
          title="Eliminar"
          className="rounded-full bg-black/60 p-2 text-red-300 hover:bg-black/80 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

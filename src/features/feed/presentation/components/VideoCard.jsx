import { useEffect } from 'react'
import { Heart, Bookmark, Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { feedService } from '../../application/feed.service'
import { useVideoUrl } from '../../application/useFeed'

export function VideoCard({ video, liked, bookmarked, onToggleLike, onToggleBookmark }) {
  const { data: videoUrl } = useVideoUrl(video?.storage_path)

  useEffect(() => {
    if (video?.id) feedService.recordView(video.id)
  }, [video?.id])

  if (!video) return null

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />
      ) : (
        <Skeleton className="h-full w-full" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="font-medium text-white">
          {video.creator?.display_name ?? video.creator?.username}
        </p>
        {video.title ? <p className="text-sm text-white/80">{video.title}</p> : null}
      </div>

      <div className="absolute right-3 bottom-16 flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto text-white"
            onClick={() => onToggleLike(video)}
          >
            <Heart
              className={cn(
                'h-6 w-6',
                liked && 'fill-red-500 text-red-500',
              )}
            />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-auto text-white"
            onClick={() => onToggleBookmark(video)}
          >
            <Bookmark
              className={cn('h-6 w-6', bookmarked && 'fill-amber-400 text-amber-400')}
            />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Play className="h-5 w-5 text-white/80" />
        </div>
      </div>
    </div>
  )
}

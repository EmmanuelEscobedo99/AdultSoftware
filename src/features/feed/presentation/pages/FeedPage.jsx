import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useInView } from '@/hooks/useInView'
import { feedService } from '../../application/feed.service'
import { useFeed, useMyEngagements } from '../../application/useFeed'
import { VideoCard } from '../components/VideoCard'

function FeedItem({ video, onActive, ...handlers }) {
  const ref = useInView(() => onActive(video.id))
  return (
    <div ref={ref} className="h-full w-full snap-center snap-always py-1">
      <VideoCard video={video} {...handlers} />
    </div>
  )
}

export default function FeedPage() {
  const queryClient = useQueryClient()
  const { data: videos, isLoading } = useFeed()
  const { data: engagements } = useMyEngagements()
  const [activeId, setActiveId] = useState(null)

  const handleToggleLike = async (video) => {
    const liked = engagements?.likes.has(video.id) ?? false
    await feedService.toggleLike(video.id, liked)
    queryClient.invalidateQueries({ queryKey: ['my-engagements'] })
  }

  const handleToggleBookmark = async (video) => {
    const bookmarked = engagements?.bookmarks.has(video.id) ?? false
    await feedService.toggleBookmark(video.id, bookmarked)
    queryClient.invalidateQueries({ queryKey: ['my-engagements'] })
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex h-full max-w-md items-center justify-center">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    )
  }

  if (!videos?.length) {
    return (
      <div className="mx-auto flex h-full max-w-md items-center justify-center px-4">
        <Card className="w-full text-center">
          <p className="text-neutral-300">Aún no hay videos disponibles.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Vuelve pronto o sigue a creadores para ver su contenido.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-scroll px-0">
      {videos.map((video) => (
        <FeedItem
          key={video.id}
          video={video}
          active={activeId === video.id}
          onActive={setActiveId}
          liked={engagements?.likes.has(video.id)}
          bookmarked={engagements?.bookmarks.has(video.id)}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
        />
      ))}
    </div>
  )
}

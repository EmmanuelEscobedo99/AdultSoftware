import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useInView } from '@/hooks/useInView'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useMyFollowing, useToggleFollow } from '@/features/subscriber/application/useSubscriber'
import {
  useFeed,
  useMyEngagements,
  useToggleVideoLike,
  useToggleVideoBookmark,
} from '../../application/useFeed'
import { VideoCard } from '../components/VideoCard'

function FeedItem({ video, active, onActive, ...handlers }) {
  const ref = useInView(() => onActive(video.id))
  return (
    <div ref={ref} className="h-full w-full snap-center snap-always py-1">
      <VideoCard video={video} active={active} {...handlers} />
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const userId = user?.id
  const { data: videos, isLoading } = useFeed()
  const { data: engagements } = useMyEngagements(userId)
  const { data: following } = useMyFollowing(userId)
  const toggleFollowMutation = useToggleFollow(userId)
  const toggleLikeMutation = useToggleVideoLike(userId)
  const toggleBookmarkMutation = useToggleVideoBookmark(userId)
  const [activeId, setActiveId] = useState(null)

  const handleToggleLike = (video) => {
    toggleLikeMutation.mutate({
      videoId: video.id,
      liked: engagements?.likes.has(video.id) ?? false,
    })
  }

  const handleToggleBookmark = (video) => {
    toggleBookmarkMutation.mutate({
      videoId: video.id,
      bookmarked: engagements?.bookmarks.has(video.id) ?? false,
    })
  }

  const handleToggleFollow = (video) => {
    toggleFollowMutation.mutate({
      creatorId: video.creator_id,
      isFollowing: following?.has(video.creator_id),
    })
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
          isFollowing={following?.has(video.creator_id)}
          isOwnVideo={video.creator_id === userId}
          likePending={toggleLikeMutation.isPending}
          bookmarkPending={toggleBookmarkMutation.isPending}
          followPending={toggleFollowMutation.isPending}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onToggleFollow={handleToggleFollow}
        />
      ))}
    </div>
  )
}

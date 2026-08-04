import { useQuery } from '@tanstack/react-query'
import { feedService } from '@/features/feed/application/feed.service'

export function useFeed({ limit = 20 } = {}) {
  return useQuery({
    queryKey: ['feed', limit],
    queryFn: () => feedService.getFeed({ limit }),
    staleTime: 60_000,
  })
}

export function useVideoUrl(path) {
  return useQuery({
    queryKey: ['video-url', path],
    queryFn: () => feedService.getVideoUrl(path),
    enabled: Boolean(path),
    staleTime: 60 * 60 * 1000,
  })
}

export function useMyEngagements() {
  return useQuery({
    queryKey: ['my-engagements'],
    queryFn: async () => {
      const [likes, bookmarks] = await Promise.all([
        feedService.getMyLikes(),
        feedService.getMyBookmarks(),
      ])
      return { likes, bookmarks }
    },
    staleTime: 30_000,
  })
}

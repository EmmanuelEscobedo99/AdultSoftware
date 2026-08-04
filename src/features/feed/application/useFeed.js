import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useVideoComments(videoId) {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: () => feedService.listComments(videoId),
    enabled: Boolean(videoId),
    staleTime: 15_000,
  })
}

export function useAddComment(videoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body }) => feedService.addComment(videoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeleteComment(videoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId) => feedService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useToggleVideoLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ videoId, liked }) => feedService.toggleLike(videoId, liked),
    onMutate: async ({ videoId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['my-engagements'] })
      const previous = queryClient.getQueryData(['my-engagements'])
      queryClient.setQueryData(['my-engagements'], (old) => {
        if (!old) return old
        const likes = new Set(old.likes)
        if (liked) likes.delete(videoId)
        else likes.add(videoId)
        return { ...old, likes }
      })
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((video) =>
          video.id === videoId
            ? {
                ...video,
                like_count: Math.max((video.like_count ?? 0) + (liked ? -1 : 1), 0),
              }
            : video,
        )
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['my-engagements'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useToggleVideoBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ videoId, bookmarked }) =>
      feedService.toggleBookmark(videoId, bookmarked),
    onMutate: async ({ videoId, bookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ['my-engagements'] })
      const previous = queryClient.getQueryData(['my-engagements'])
      queryClient.setQueryData(['my-engagements'], (old) => {
        if (!old) return old
        const bookmarks = new Set(old.bookmarks)
        if (bookmarked) bookmarks.delete(videoId)
        else bookmarks.add(videoId)
        return { ...old, bookmarks }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['my-engagements'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] })
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { creatorContentService } from '../application/creatorContent.service'

export function useCreatorPosts() {
  return useQuery({
    queryKey: ['creator-posts'],
    queryFn: () => creatorContentService.getMyPosts(),
    staleTime: 30_000,
  })
}

export function usePostMediaUrl(media) {
  return useQuery({
    queryKey: ['post-media-url', media?.storage_path],
    queryFn: () =>
      creatorContentService.getMediaUrl(
        media.media_type === 'video' ? 'content-videos' : 'content-images',
        media.storage_path,
      ),
    enabled: Boolean(media?.storage_path),
    staleTime: 60 * 60 * 1000,
  })
}

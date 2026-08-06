import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriberService } from '../application/subscriber.service'

export function useCreators(search) {
  return useQuery({
    queryKey: ['creators', search ?? 'all'],
    queryFn: () => subscriberService.listCreators({ search }),
    staleTime: 60_000,
  })
}

export function useActiveSubscriberCounts() {
  return useQuery({
    queryKey: ['creator-subscriber-counts'],
    queryFn: () => subscriberService.getActiveSubscriberCounts(),
    staleTime: 60_000,
  })
}

export function usePostMediaUrl(media) {
  return useQuery({
    queryKey: ['post-media-url', media?.storage_path],
    queryFn: () => subscriberService.getPostMediaUrl(media),
    enabled: Boolean(media?.storage_path),
    staleTime: 60 * 60 * 1000,
  })
}

export function useCreatorProfile(username) {
  return useQuery({
    queryKey: ['creator-profile', username],
    queryFn: () => subscriberService.getCreatorByUsername(username),
    enabled: Boolean(username),
  })
}

export function useCreatorPlans(creatorId) {
  return useQuery({
    queryKey: ['creator-plans', creatorId],
    queryFn: () => subscriberService.listPlans(creatorId),
    enabled: Boolean(creatorId),
    staleTime: 30_000,
  })
}

export function useCreatorFreePosts(creatorId) {
  return useQuery({
    queryKey: ['creator-free-posts', creatorId],
    queryFn: () => subscriberService.listFreePosts(creatorId),
    enabled: Boolean(creatorId),
  })
}

export function useCreatorPpvPosts(creatorId) {
  return useQuery({
    queryKey: ['creator-ppv-posts', creatorId],
    queryFn: () => subscriberService.listPpvPosts(creatorId),
    enabled: Boolean(creatorId),
  })
}

export function useMyPpvUnlocks(creatorId) {
  return useQuery({
    queryKey: ['my-ppv-unlocks', creatorId],
    queryFn: () => subscriberService.getMyPpvUnlocks(creatorId),
    enabled: Boolean(creatorId),
  })
}

export function useMyActiveSubscription(creatorId) {
  return useQuery({
    queryKey: ['my-subscription', creatorId],
    queryFn: () => subscriberService.getMyActiveSubscription(creatorId),
    enabled: Boolean(creatorId),
  })
}

export function useMySubscriptions() {
  return useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => subscriberService.getMySubscriptions(),
    staleTime: 30_000,
  })
}

export function useMyFollowing(userId) {
  return useQuery({
    queryKey: ['my-following', userId],
    queryFn: () => subscriberService.getMyFollowing(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })
}

export function useToggleFollow(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ creatorId, isFollowing }) =>
      isFollowing
        ? subscriberService.unfollow(userId, creatorId)
        : subscriberService.follow(userId, creatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-following', userId] })
      queryClient.invalidateQueries({ queryKey: ['creator-subscriber-counts'] })
    },
  })
}

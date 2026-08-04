import { useQuery } from '@tanstack/react-query'
import { subscriberService } from '../application/subscriber.service'

export function useCreators() {
  return useQuery({
    queryKey: ['creators'],
    queryFn: () => subscriberService.listCreators(),
    staleTime: 60_000,
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
    staleTime: 15_000,
  })
}

export function useMySubscriptions() {
  return useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => subscriberService.getMySubscriptions(),
    staleTime: 30_000,
  })
}

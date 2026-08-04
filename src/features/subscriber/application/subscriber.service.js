import { supabaseSubscriberRepository } from '../infrastructure/supabaseSubscriberRepository'

export const subscriberService = {
  listCreators({ search } = {}) {
    return supabaseSubscriberRepository.listCreators({ search })
  },

  getActiveSubscriberCounts() {
    return supabaseSubscriberRepository.getActiveSubscriberCounts()
  },

  getCreatorByUsername(username) {
    return supabaseSubscriberRepository.getCreatorByUsername(username)
  },

  listPlans(creatorId) {
    return supabaseSubscriberRepository.listPlans(creatorId)
  },

  listFreePosts(creatorId) {
    return supabaseSubscriberRepository.listFreePosts(creatorId)
  },

  listPpvPosts(creatorId) {
    return supabaseSubscriberRepository.listPpvPosts(creatorId)
  },

  getPostMediaUrl(media) {
    return supabaseSubscriberRepository.getPostMediaUrl(media)
  },

  follow(userId, creatorId) {
    return supabaseSubscriberRepository.follow(userId, creatorId)
  },

  unfollow(userId, creatorId) {
    return supabaseSubscriberRepository.unfollow(userId, creatorId)
  },

  getMyFollowing(userId) {
    return supabaseSubscriberRepository.getMyFollowing(userId)
  },

  getMyPpvUnlocks(creatorId) {
    return supabaseSubscriberRepository.getMyPpvUnlocks(creatorId)
  },

  getMyActiveSubscription(creatorId) {
    return supabaseSubscriberRepository.getMyActiveSubscription(creatorId)
  },

  getMySubscriptions() {
    return supabaseSubscriberRepository.getMySubscriptions()
  },

  cancelSubscription(subscriptionId) {
    return supabaseSubscriberRepository.cancelSubscription(subscriptionId)
  },
}

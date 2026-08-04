import { supabaseSubscriberRepository } from '../infrastructure/supabaseSubscriberRepository'

export const subscriberService = {
  listCreators() {
    return supabaseSubscriberRepository.listCreators()
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

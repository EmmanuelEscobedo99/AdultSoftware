import { supabaseNotificationsRepository } from '../infrastructure/supabaseNotificationsRepository'

export const notificationsService = {
  listNotifications(userId) {
    return supabaseNotificationsRepository.listNotifications(userId)
  },

  getUnreadCount(userId) {
    return supabaseNotificationsRepository.getUnreadCount(userId)
  },

  markAllRead(userId) {
    return supabaseNotificationsRepository.markAllRead(userId)
  },

  subscribeToNotifications(userId, onEvent) {
    return supabaseNotificationsRepository.subscribeToNotifications(userId, onEvent)
  },
}

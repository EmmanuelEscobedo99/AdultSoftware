import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from './notifications.service'

export function useNotifications(userId) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const [items, unreadCount] = await Promise.all([
        notificationsService.listNotifications(userId),
        notificationsService.getUnreadCount(userId),
      ])
      return { items, unreadCount }
    },
    enabled: Boolean(userId),
    refetchInterval: 60_000,
  })
}

export function useMarkAllNotificationsRead(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })
}

/** Realtime: invalida la consulta al llegar una notificación nueva. */
export function useNotificationsRealtime(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return
    const unsubscribe = notificationsService.subscribeToNotifications(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    })
    return unsubscribe
  }, [userId, queryClient])
}

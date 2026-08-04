import { supabase } from '@/services/supabase/client'

export const supabaseNotificationsRepository = {
  async listNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(id, username, display_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
    return count ?? 0
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
  },

  subscribeToNotifications(userId, onEvent) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onEvent(payload.new),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}

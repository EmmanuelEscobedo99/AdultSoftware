import { supabase } from '@/services/supabase/client'

export const supabaseChatRepository = {
  async listConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participants:conversation_participants(
          user_id,
          last_read_at,
          profile:profiles(id, username, display_name, avatar_url)
        )
      `,
      )
      .order('last_message_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getMessages(conversationId, { limit = 100 } = {}) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  },

  async startConversation(targetUserId, body) {
    const { data, error } = await supabase.rpc('start_conversation', {
      p_target_id: targetUserId,
      p_body: body,
    })
    if (error) throw error
    return data
  },

  async sendMessage(conversationId, body, mediaUrl = null) {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_body: body,
      p_media_url: mediaUrl,
    })
    if (error) throw error
    return data
  },

  async markRead(conversationId) {
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    })
    if (error) throw error
  },

  async resolveUserId(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return data
  },

  subscribeToConversation(conversationId, onInsert) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onInsert(payload.new),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}

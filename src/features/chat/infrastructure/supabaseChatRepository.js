import { supabase } from '@/services/supabase/client'

const CHAT_BUCKET = 'chat-media'
const CHAT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const CHAT_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

function extensionOf(name) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name ?? '')
  return match ? `.${match[1]}` : ''
}

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

  async startConversation(targetUserId, body, media = null) {
    const { data, error } = await supabase.rpc('start_conversation', {
      p_target_id: targetUserId,
      p_body: body,
      p_media_url: media?.path ?? null,
      p_media_path: media?.path ?? null,
      p_media_type: media?.mediaType ?? null,
    })
    if (error) throw error
    return data
  },

  async sendMessage(conversationId, body, media = null) {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_body: body,
      p_media_url: media?.path ?? null,
      p_media_path: media?.path ?? null,
      p_media_type: media?.mediaType ?? null,
    })
    if (error) throw error
    return data
  },

  async uploadMedia(conversationId, file) {
    const mediaType = CHAT_IMAGE_TYPES.has(file.type)
      ? 'image'
      : CHAT_VIDEO_TYPES.has(file.type)
        ? 'video'
        : null
    if (!mediaType) {
      throw new Error('Formato no permitido. Usa imágenes (JPG, PNG, WebP, GIF) o videos (MP4, WebM).')
    }
    const path = `${conversationId}/${crypto.randomUUID()}${extensionOf(file.name)}`
    const { error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw error
    return { path, mediaType }
  },

  async getMediaUrl(path) {
    if (!path) return null
    const { data, error } = await supabase.storage
      .from(CHAT_BUCKET)
      .createSignedUrl(path, 60 * 60)
    if (error) throw error
    return data?.signedUrl ?? null
  },

  async getMyRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error
    return data?.role ?? null
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

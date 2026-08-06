import { supabaseChatRepository } from '../infrastructure/supabaseChatRepository'

export const chatService = {
  listConversations() {
    return supabaseChatRepository.listConversations()
  },

  getMessages(conversationId) {
    return supabaseChatRepository.getMessages(conversationId)
  },

  async startConversation(targetUsername, body, media = null) {
    const target = await supabaseChatRepository.resolveUserId(targetUsername)
    if (!target) throw new Error('Usuario no encontrado')
    const myRole = await supabaseChatRepository.getMyRole()
    if (target.role !== 'creator' && myRole !== 'creator') {
      throw new Error('Solo puedes chatear con creadores')
    }
    return supabaseChatRepository.startConversation(target.id, body, media)
  },

  sendMessage(conversationId, body, media = null) {
    return supabaseChatRepository.sendMessage(conversationId, body, media)
  },

  uploadMedia(conversationId, file) {
    return supabaseChatRepository.uploadMedia(conversationId, file)
  },

  getMediaUrl(path) {
    return supabaseChatRepository.getMediaUrl(path)
  },

  markRead(conversationId) {
    return supabaseChatRepository.markRead(conversationId)
  },

  subscribeToConversation(conversationId, onInsert) {
    return supabaseChatRepository.subscribeToConversation(conversationId, onInsert)
  },
}

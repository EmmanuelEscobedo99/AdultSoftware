import { supabaseChatRepository } from '../infrastructure/supabaseChatRepository'

export const chatService = {
  listConversations() {
    return supabaseChatRepository.listConversations()
  },

  getMessages(conversationId) {
    return supabaseChatRepository.getMessages(conversationId)
  },

  async startConversation(targetUsername, body) {
    const target = await supabaseChatRepository.resolveUserId(targetUsername)
    if (!target) throw new Error('Usuario no encontrado')
    if (target.role === 'creator') {
      return supabaseChatRepository.startConversation(target.id, body)
    }
    throw new Error('Solo puedes chatear con creadores')
  },

  sendMessage(conversationId, body) {
    return supabaseChatRepository.sendMessage(conversationId, body)
  },

  markRead(conversationId) {
    return supabaseChatRepository.markRead(conversationId)
  },

  subscribeToConversation(conversationId, onInsert) {
    return supabaseChatRepository.subscribeToConversation(conversationId, onInsert)
  },
}

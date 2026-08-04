import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from './chat.service'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.listConversations(),
    staleTime: 30_000,
  })
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 0,
  })
}

export function useSendMessage(conversationId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => chatService.sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, body }) =>
      chatService.startConversation(username, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Suscripción Realtime a los mensajes de una conversación. */
export function useChatRealtime(conversationId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = chatService.subscribeToConversation(conversationId, (message) => {
      queryClient.setQueryData(['messages', conversationId], (old) => {
        if (!old) return [message]
        if (old.some((m) => m.id === message.id)) return old
        return [...old, message]
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    return unsubscribe
  }, [conversationId, queryClient])
}

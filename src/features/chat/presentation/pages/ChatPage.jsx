import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useConversations, useStartConversation } from '../../application/useChat'
import { ConversationList, getOtherParticipant } from '../components/ConversationList'
import { ChatWindow } from '../components/ChatWindow'
import { MessageCircle } from 'lucide-react'

const chatErrorMessages = {
  not_authorized_to_chat:
    'Debes suscribirte a este creador para poder enviarle mensajes.',
  cannot_chat_with_self: 'No puedes enviarte mensajes a ti mismo.',
  banned: 'No tienes permitido enviar mensajes.',
}

const mapChatError = (message) => chatErrorMessages[message] ?? message

export default function ChatPage() {
  const { username } = useParams()
  const { user } = useAuth()
  const { data: conversations, isLoading } = useConversations()
  const startMutation = useStartConversation()
  const [conversationId, setConversationId] = useState(null)
  const [firstMessage, setFirstMessage] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!username) {
      setConversationId(null)
      return
    }
    const existing = conversations?.find(
      (c) => getOtherParticipant(c, user.id)?.profile?.username === username,
    )
    if (existing) {
      setConversationId(existing.id)
    } else {
      setConversationId(null)
    }
  }, [conversations, username, user.id])

  const activeConversation = conversations?.find(
    (c) => c.id === conversationId,
  )

  const handleStart = async () => {
    const body = firstMessage.trim()
    if (!body) return
    setStarting(true)
    try {
      const id = await startMutation.mutateAsync({ username, body })
      setConversationId(id)
      setFirstMessage('')
    } catch (err) {
      alert(mapChatError(err.message) ?? 'No se pudo iniciar la conversación')
    } finally {
      setStarting(false)
    }
  }

  const renderMain = () => {
    if (username && !conversationId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
            <MessageCircle className="h-7 w-7" />
          </span>
          <p className="text-sm text-neutral-300">
            Inicia una conversación con{' '}
            <span className="font-semibold text-neutral-100">@{username}</span>
          </p>
          <Textarea
            rows={4}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            placeholder="Escribe tu primer mensaje…"
            className="max-w-md"
          />
          <Button onClick={handleStart} loading={starting} disabled={!firstMessage.trim()}>
            Iniciar conversación
          </Button>
        </div>
      )
    }
    if (!conversationId) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-3 text-neutral-500">
            <MessageCircle className="h-7 w-7" />
          </span>
          <p className="max-w-sm text-center text-sm text-neutral-500">
            Selecciona una conversación o entra al perfil de un creador para
            escribirle.
          </p>
        </div>
      )
    }
    return (
      <ChatWindow conversation={activeConversation} conversationId={conversationId} />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 shrink-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            onSelect={setConversationId}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">{renderMain()}</div>
    </div>
  )
}

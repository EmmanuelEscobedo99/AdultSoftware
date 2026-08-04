import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMessages, useSendMessage, useChatRealtime } from '../../application/useChat'
import { getOtherParticipant } from './ConversationList'
import { Send } from 'lucide-react'

function MessageBubble({ message, isMine }) {
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
          isMine
            ? 'rounded-br-sm bg-primary text-white'
            : 'rounded-bl-sm bg-surface-3 text-neutral-100',
        )}
      >
        {message.is_ai ? (
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            IA
          </span>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isMine ? 'text-white/60' : 'text-neutral-500',
          )}
        >
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export function ChatWindow({ conversation, conversationId }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  const { data: messages, isLoading } = useMessages(conversationId)
  const sendMutation = useSendMessage(conversationId)
  useChatRealtime(conversationId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const other = getOtherParticipant(conversation, user.id)
  const title = other?.profile?.display_name ?? other?.profile?.username ?? 'Chat'

  const handleSend = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !conversationId) return
    setDraft('')
    try {
      await sendMutation.mutateAsync(body)
    } catch (err) {
      setDraft(body)
      alert(err.message ?? 'No se pudo enviar el mensaje')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-3">
        <p className="font-medium text-neutral-100">{title}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
          </>
        ) : messages?.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === user.id && !message.is_ai}
            />
          ))
        ) : (
          <p className="text-center text-sm text-neutral-500">
            Sin mensajes. ¡Saluda!
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          loading={sendMutation.isPending}
          disabled={!draft.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { Button } from '@/components/ui/Button'
import { useConversations } from '../../application/useChat'
import { ConversationList, isConversationUnread } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { ArrowLeft, MessageCircle, X } from 'lucide-react'

export default function FloatingChat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: conversations } = useConversations()
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const unread = useMemo(
    () =>
      (conversations ?? []).filter((c) => isConversationUnread(c, user.id))
        .length,
    [conversations, user.id],
  )

  useEffect(() => {
    const channel = supabase
      .channel('chat-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const activeConversation = conversations?.find((c) => c.id === activeId)

  const handleOpenConversation = (id) => {
    setActiveId(id)
  }

  const handleClose = () => {
    setOpen(false)
    setActiveId(null)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            {activeId ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setActiveId(null)}
                title="Volver a conversaciones"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <MessageCircle className="h-5 w-5 text-primary" />
            )}
            <p className="flex-1 truncate text-sm font-semibold text-neutral-100">
              {activeId ? 'Chat' : 'Mensajes'}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClose}
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                conversationId={activeId}
                hideHeader
              />
            ) : (
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={handleOpenConversation}
              />
            )}
          </div>
        </div>
      ) : null}

      <Button
        className="relative h-14 w-14 rounded-full shadow-xl"
        onClick={() => setOpen((v) => !v)}
        title="Chat"
      >
        <MessageCircle className="h-6 w-6" />
        {!open && unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </Button>
    </div>
  )
}

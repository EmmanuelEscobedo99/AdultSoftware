import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import { Button } from '@/components/ui/Button'
import { useConversations } from '../../application/useChat'
import {
  ConversationList,
  getOtherParticipant,
  isConversationUnread,
} from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { ArrowLeft, MessageCircle, User, X } from 'lucide-react'

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

  const activeConversation = conversations?.find((c) => c.id === activeId)
  const other = activeConversation
    ? getOtherParticipant(activeConversation, user.id)
    : null
  const { data: otherAvatarUrl } = useProfileImage(other?.profile?.avatar_url)
  const otherName =
    other?.profile?.display_name ?? other?.profile?.username ?? 'Chat'

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
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface-2/95 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-line/70 px-3 py-2.5">
            {activeId ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setActiveId(null)}
                  title="Volver a conversaciones"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3">
                  {otherAvatarUrl ? (
                    <img
                      src={otherAvatarUrl}
                      alt={otherName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-neutral-500" />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-100">
                  {otherName}
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-100">
                  Mensajes
                </p>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
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
        className="relative h-14 w-14 rounded-full bg-brand-gradient shadow-[0_12px_32px_-8px_rgba(225,29,99,0.65)] transition-transform hover:scale-105"
        onClick={() => setOpen((v) => !v)}
        title="Chat"
      >
        <MessageCircle className="h-6 w-6" />
        {!open && unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-accent px-1 text-xs font-bold text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.8)]">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </Button>
    </div>
  )
}

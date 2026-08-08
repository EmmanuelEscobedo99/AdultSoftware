import { useAuth } from '@/features/auth/application/AuthProvider'
import { cn } from '@/lib/cn'
import { User } from 'lucide-react'

export function getOtherParticipant(conversation, myUserId) {
  return (
    conversation?.participants?.find((p) => p.user_id !== myUserId) ?? null
  )
}

export function isConversationUnread(conversation, myUserId) {
  const mine = conversation?.participants?.find((p) => p.user_id === myUserId)
  if (!mine?.last_read_at) return Boolean(conversation?.last_message_at)
  return new Date(mine.last_read_at) < new Date(conversation.last_message_at)
}

export function ConversationList({ conversations, activeId, onSelect }) {
  const { user } = useAuth()

  return (
    <div className="h-full overflow-y-auto border-r border-line">
      <div className="border-b border-line p-4">
        <h2 className="text-sm font-semibold text-neutral-200">Conversaciones</h2>
      </div>
      {conversations?.length ? (
        <ul>
          {conversations.map((conversation) => {
            const other = getOtherParticipant(conversation, user.id)
            const unread = isConversationUnread(conversation, user.id)
            return (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2',
                    activeId === conversation.id && 'bg-surface-2',
                  )}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-px">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-3">
                      <User className="h-5 w-5 text-neutral-500" />
                    </div>
                    {unread ? (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-brand-gradient" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm',
                        unread ? 'font-semibold text-neutral-100' : 'font-medium text-neutral-200',
                      )}
                    >
                      {other?.profile?.display_name ?? other?.profile?.username ?? 'Chat'}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleTimeString()
                        : ''}
                    </p>
                  </div>
                  {unread ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gradient" />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="p-4 text-sm text-neutral-500">
          Sin conversaciones todavía.
        </p>
      )}
    </div>
  )
}

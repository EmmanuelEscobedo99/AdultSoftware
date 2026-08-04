import { useAuth } from '@/features/auth/application/AuthProvider'
import { cn } from '@/lib/cn'
import { User } from 'lucide-react'

export function getOtherParticipant(conversation, myUserId) {
  return (
    conversation?.participants?.find((p) => p.user_id !== myUserId) ?? null
  )
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
            return (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2',
                    activeId === conversation.id && 'bg-surface-2',
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-3">
                    <User className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {other?.profile?.display_name ?? other?.profile?.username ?? 'Chat'}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleTimeString()
                        : ''}
                    </p>
                  </div>
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

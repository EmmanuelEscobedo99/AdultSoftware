import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useMarkRead,
  useMediaUrl,
  useMessages,
  useSendMessage,
  useChatRealtime,
} from '../../application/useChat'
import { chatService } from '../../application/chat.service'
import { getOtherParticipant } from './ConversationList'
import { Paperclip, Send, X } from 'lucide-react'

function MediaAttachment({ message }) {
  const { data: url } = useMediaUrl(message.media_path)
  if (!url) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }
  if (message.media_type === 'video') {
    return (
      <video src={url} controls playsInline className="max-h-72 w-full rounded-xl bg-black" />
    )
  }
  return (
    <img src={url} alt="" className="max-h-72 w-full rounded-xl object-cover" />
  )
}

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
        {message.media_path ? (
          <div className="mb-1 overflow-hidden">
            <MediaAttachment message={message} />
          </div>
        ) : null}
        {message.body ? (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        ) : null}
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

export function ChatWindow({ conversation, conversationId, hideHeader = false }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [pendingMedia, setPendingMedia] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  const { data: messages, isLoading } = useMessages(conversationId)
  const sendMutation = useSendMessage(conversationId)
  const markReadMutation = useMarkRead(conversationId)
  useChatRealtime(conversationId)

  useEffect(() => {
    if (conversationId) markReadMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    if (!pendingMedia?.preview) return undefined
    const url = pendingMedia.preview
    return () => URL.revokeObjectURL(url)
  }, [pendingMedia])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const other = getOtherParticipant(conversation, user.id)
  const title = other?.profile?.display_name ?? other?.profile?.username ?? 'Chat'

  const handlePickFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !conversationId) return
    setUploading(true)
    try {
      const media = await chatService.uploadMedia(conversationId, file)
      setPendingMedia({ ...media, file, preview: URL.createObjectURL(file) })
    } catch (err) {
      alert(err.message ?? 'No se pudo adjuntar el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async (event) => {
    event.preventDefault()
    if (!conversationId) return
    const body = draft.trim()
    if (!body && !pendingMedia) return
    setDraft('')
    const media = pendingMedia
    setPendingMedia(null)
    try {
      await sendMutation.mutateAsync({ body, media })
    } catch (err) {
      setDraft(body)
      if (media) setPendingMedia(media)
      alert(err.message ?? 'No se pudo enviar el mensaje')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {!hideHeader ? (
        <div className="border-b border-line px-4 py-3">
          <p className="font-medium text-neutral-100">{title}</p>
        </div>
      ) : null}

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

      {pendingMedia ? (
        <div className="flex items-center gap-3 border-t border-line px-3 py-2">
          {pendingMedia.mediaType === 'video' ? (
            <video
              src={pendingMedia.preview}
              controls
              playsInline
              className="h-16 w-24 rounded-lg bg-black object-cover"
            />
          ) : (
            <img
              src={pendingMedia.preview}
              alt=""
              className="h-16 w-24 rounded-lg object-cover"
            />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-400">
            {pendingMedia.file.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPendingMedia(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          className="hidden"
          onChange={handlePickFile}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          disabled={!conversationId}
          title="Adjuntar foto o video"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
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
          disabled={(!draft.trim() && !pendingMedia) || Boolean(uploading)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

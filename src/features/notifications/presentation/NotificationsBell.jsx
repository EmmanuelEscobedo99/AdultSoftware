import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useNotificationsRealtime,
} from '../application/useNotifications'
import { Bell, CheckCheck, CreditCard, Heart, Lock, MessageSquare, Upload, Users } from 'lucide-react'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'ahora mismo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return new Date(date).toLocaleDateString()
}

function notificationMeta(type) {
  switch (type) {
    case 'follow':
      return { Icon: Users, text: (actor) => `${actor?.display_name ?? actor?.username ?? 'Alguien'} comenzó a seguirte` }
    case 'subscription':
      return { Icon: CreditCard, text: (actor) => `${actor?.display_name ?? actor?.username ?? 'Alguien'} se suscribió a tu perfil` }
    case 'ppv_unlock':
      return { Icon: Lock, text: (actor) => `${actor?.display_name ?? actor?.username ?? 'Alguien'} compró tu contenido premium` }
    case 'new_post':
      return { Icon: Upload, text: () => 'Tienes una nueva publicación' }
    case 'message':
      return { Icon: MessageSquare, text: () => 'Tienes un nuevo mensaje' }
    default:
      return { Icon: Bell, text: () => 'Nueva notificación' }
  }
}

function NotificationRow({ notification, onNavigate }) {
  const meta = notificationMeta(notification.type)
  const { Icon } = meta
  const { data: avatarUrl } = useProfileImage(notification.actor?.avatar_url)
  const to = notification.actor?.username
    ? `/c/${notification.actor.username}`
    : '#'

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-surface-3"
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/40 to-accent/40 p-px">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-4 w-4 text-neutral-400" />
            )}
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-100">{meta.text(notification.actor)}</p>
        <p className="text-xs text-neutral-500">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.read_at ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      ) : null}
    </Link>
  )
}

export function NotificationsBell() {
  const { user } = useAuth()
  const userId = user?.id
  const { data, isLoading } = useNotifications(userId)
  const markRead = useMarkAllNotificationsRead(userId)
  useNotificationsRealtime(userId)

  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const unread = data?.unreadCount ?? 0

  useEffect(() => {
    const onMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) markRead.mutate()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        title="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line/70 bg-surface-2/70 text-neutral-200 shadow-card backdrop-blur-sm transition-colors hover:border-neutral-500/50 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(225,29,99,0.7)]">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-line/70 bg-surface-2/95 shadow-soft backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-100">Notificaciones</p>
            {unread > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markRead.mutate()}
                loading={markRead.isPending}
              >
                <CheckCheck className="h-4 w-4" /> Leídas
              </Button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data?.items?.length ? (
              data.items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onNavigate={() => setOpen(false)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Heart className="h-6 w-6 text-neutral-600" />
                <p className="text-sm text-neutral-500">Sin notificaciones</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import { useMySubscriptions } from '../../application/useSubscriber'
import { Send, Users } from 'lucide-react'

function SubCreatorAvatar({ creator }) {
  const { data: avatarUrl } = useProfileImage(creator?.avatar_url)
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-neutral-500" />
        )}
      </div>
    </div>
  )
}

export default function MySubscriptionsPage() {
  const { data: subscriptions, isLoading } = useMySubscriptions()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!subscriptions?.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-neutral-100">
          Mis suscripciones
        </h1>
        <Card className="text-center">
          <p className="text-neutral-300">No tienes suscripciones activas.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Explora creadores y suscríbete para ver su contenido exclusivo.
          </p>
          <Link to="/browse" className="mt-4 inline-block">
            <Button>Explorar creadores</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-neutral-100">Mis suscripciones</h1>

      {subscriptions.map((sub) => (
        <Card key={sub.id} className="flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
          <SubCreatorAvatar creator={sub.creator} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-100">
              {sub.creator?.display_name ?? sub.creator?.username}
            </p>
            <p className="text-sm text-neutral-500">
              {sub.plan?.name ?? 'Plan'} · ${sub.plan?.price ?? '—'}/
              {sub.plan?.billing_interval ?? '—'} · vence{' '}
              {sub.expires_at
                ? new Date(sub.expires_at).toLocaleDateString()
                : '—'}
            </p>
          </div>
          <Badge tone={sub.status === 'active' ? 'success' : 'default'}>
            {sub.status}
          </Badge>
          {sub.creator?.username ? (
            <div className="flex shrink-0 gap-2">
              <Link to={`/chat/${sub.creator.username}`}>
                <Button variant="ghost" size="sm">
                  <Send className="h-4 w-4" /> Mensaje
                </Button>
              </Link>
              <Link to={`/c/${sub.creator.username}`}>
                <Button variant="outline" size="sm">
                  Ver perfil
                </Button>
              </Link>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

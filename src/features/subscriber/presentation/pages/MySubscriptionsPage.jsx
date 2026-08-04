import { Card, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { User } from 'lucide-react'
import { useMySubscriptions } from '../../application/useSubscriber'

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
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-neutral-100">Mis suscripciones</h1>

      {subscriptions.map((sub) => (
        <Card key={sub.id} className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-3">
            <User className="h-5 w-5 text-neutral-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-100">
              {sub.creator?.display_name ?? sub.creator?.username}
            </p>
            <CardDescription>
              {sub.plan?.name ?? 'Plan'} · $
              {sub.plan?.price ?? '—'}/
              {sub.plan?.billing_interval ?? '—'} · vence{' '}
              {sub.expires_at
                ? new Date(sub.expires_at).toLocaleDateString()
                : '—'}
            </CardDescription>
          </div>
          <Badge tone={sub.status === 'active' ? 'success' : 'default'}>
            {sub.status}
          </Badge>
        </Card>
      ))}
    </div>
  )
}

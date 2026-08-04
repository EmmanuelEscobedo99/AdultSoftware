import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Users } from 'lucide-react'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import { paymentsService } from '@/features/payments/application/payments.service'
import {
  useCreatorProfile,
  useCreatorPlans,
  useCreatorFreePosts,
  useCreatorPpvPosts,
  useMyPpvUnlocks,
  useMyActiveSubscription,
} from '../../application/useSubscriber'

const PROVIDERS = [
  { value: 'test', label: 'Modo prueba' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'ccbill', label: 'CCBill' },
  { value: 'segpay', label: 'SegPay' },
]

export default function CreatorProfilePage() {
  const { username } = useParams()
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState('test')
  const [busy, setBusy] = useState(false)
  const { data: creator, isLoading } = useCreatorProfile(username)
  const { data: plans } = useCreatorPlans(creator?.id)
  const { data: freePosts } = useCreatorFreePosts(creator?.id)
  const { data: ppvPosts } = useCreatorPpvPosts(creator?.id)
  const { data: unlockedPosts } = useMyPpvUnlocks(creator?.id)
  const { data: subscription } = useMyActiveSubscription(creator?.id)
  const { data: avatarUrl } = useProfileImage(creator?.avatar_url)
  const { data: coverUrl } = useProfileImage(creator?.cover_url)

  const applyCheckoutResult = (result) => {
    if (result.redirect_url) {
      window.location.assign(result.redirect_url)
      return false
    }
    if (result.client_secret) {
      alert('Confirma el pago con Stripe para completar la compra.')
      return false
    }
    return true
  }

  const handleSubscribe = async (planId) => {
    setBusy(true)
    try {
      const result = await paymentsService.checkout({ planId, provider })
      if (!applyCheckoutResult(result)) return
      queryClient.invalidateQueries({ queryKey: ['my-subscription', creator?.id] })
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['my-payments'] })
    } catch (err) {
      alert(err.message ?? 'No se pudo completar la suscripción')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlock = async (postId) => {
    setBusy(true)
    try {
      const result = await paymentsService.checkout({ postId, provider })
      if (!applyCheckoutResult(result)) return
      queryClient.invalidateQueries({ queryKey: ['my-ppv-unlocks', creator?.id] })
      queryClient.invalidateQueries({ queryKey: ['my-payments'] })
    } catch (err) {
      alert(err.message ?? 'No se pudo desbloquear el contenido')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full max-w-3xl" />

  if (!creator) {
    return (
      <p className="text-center text-neutral-500">Creador no encontrado.</p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-fuchsia-700/40 via-purple-700/30 to-pink-700/40 sm:h-48">
          {coverUrl ? (
            <img src={coverUrl} alt="Portada" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="px-4">
          <div className="relative -mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={creator.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-8 w-8 text-neutral-500" />
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-neutral-100">
                  {creator.display_name ?? creator.username}
                </h1>
                <p className="text-sm text-neutral-400">@{creator.username}</p>
                {creator.bio ? (
                  <p className="mt-2 text-sm text-neutral-300">{creator.bio}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 pb-1">
              {subscription ? (
                <Badge tone="success">
                  Suscrito · expira{' '}
                  {new Date(subscription.expires_at).toLocaleDateString()}
                </Badge>
              ) : null}
              <Link to={`/chat/${creator.username}`}>
                <Button variant="outline" size="sm">
                  Enviar mensaje
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-100">
          Planes de suscripción
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="provider" className="text-sm text-neutral-400">
            Proveedor de pago
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-lg border border-line bg-surface-3 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary"
          >
            {PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.billing_interval === 'monthly'
                    ? 'Mensual'
                    : plan.billing_interval === 'quarterly'
                      ? 'Trimestral'
                      : 'Anual'}
                </CardDescription>
              </CardHeader>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xl font-bold text-neutral-100">
                  ${plan.price}
                  <span className="text-sm font-normal text-neutral-500">
                    /{plan.billing_interval === 'monthly' ? 'mes' : 'período'}
                  </span>
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={Boolean(subscription) || busy}
                  loading={busy}
                >
                  {subscription ? 'Suscrito' : 'Suscribirse'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {!plans?.length ? (
          <p className="text-sm text-neutral-500">
            Este creador aún no tiene planes disponibles.
          </p>
        ) : null}
      </div>

      {ppvPosts?.length ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-neutral-100">
            Contenido premium
          </h2>
          <div className="space-y-3">
            {ppvPosts.map((post) => {
              const unlocked = unlockedPosts?.has(post.id)
              const included = Boolean(subscription)
              return (
                <Card key={post.id} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-100">{post.title}</p>
                    {post.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                        {post.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-semibold text-neutral-100">
                    ${post.price}
                  </span>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleUnlock(post.id)}
                    disabled={unlocked || included || busy}
                  >
                    {unlocked
                      ? 'Desbloqueado'
                      : included
                        ? 'Acceso incluido'
                        : 'Desbloquear'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {freePosts?.length ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-neutral-100">
            Publicaciones
          </h2>
          <div className="space-y-3">
            {freePosts.map((post) => (
              <Card key={post.id}>
                <p className="font-medium text-neutral-100">{post.title}</p>
                {post.description ? (
                  <p className="mt-1 text-sm text-neutral-400">{post.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-neutral-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

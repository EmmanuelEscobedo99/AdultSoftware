import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Lock, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import { paymentsService } from '@/features/payments/application/payments.service'
import {
  useCreatorProfile,
  useCreatorPlans,
  useCreatorFreePosts,
  useCreatorPpvPosts,
  useMyPpvUnlocks,
  useMyActiveSubscription,
  useMyFollowing,
  useToggleFollow,
  usePostMediaUrl,
} from '../../application/useSubscriber'

const PROVIDERS = [
  { value: 'test', label: 'Modo prueba' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'ccbill', label: 'CCBill' },
  { value: 'segpay', label: 'SegPay' },
]

function PostMedia({ media, aspect = 'aspect-[4/5]' }) {
  const { data: url, isLoading } = usePostMediaUrl(media)

  if (isLoading || !url) {
    return <Skeleton className={`${aspect} w-full`} />
  }

  if (media.media_type === 'video') {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        controls
        className={`${aspect} w-full object-cover`}
      />
    )
  }

  return <img src={url} alt="" className={`${aspect} w-full object-cover`} />
}

const errorMessages = {
  unauthorized: 'Sesión expirada. Inicia sesión de nuevo.',
  plan_no_disponible: 'El plan ya no está disponible.',
  post_no_disponible: 'Este contenido ya no está disponible.',
  ya_suscrito: 'Ya tienes una suscripción activa con este creador.',
  stripe_no_configurado: 'Stripe no está configurado. Inténtalo más tarde.',
}

const mapError = (message) => errorMessages[message] ?? message

export default function CreatorProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState('stripe')
  const [busy, setBusy] = useState(false)
  const { data: creator, isLoading } = useCreatorProfile(username)
  const { data: plans } = useCreatorPlans(creator?.id)
  const { data: freePosts } = useCreatorFreePosts(creator?.id)
  const { data: ppvPosts } = useCreatorPpvPosts(creator?.id)
  const { data: unlockedPosts } = useMyPpvUnlocks(creator?.id)
  const { data: subscription } = useMyActiveSubscription(creator?.id)
  const { data: avatarUrl } = useProfileImage(creator?.avatar_url)
  const { data: coverUrl } = useProfileImage(creator?.cover_url)
  const { data: following } = useMyFollowing(user?.id)
  const toggleFollowMutation = useToggleFollow(user?.id)

  const isFollowing = Boolean(creator && following?.has(creator.id))
  const isOwnProfile = Boolean(creator && user?.id === creator.id)

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
      alert(mapError(err.message) ?? 'No se pudo completar la suscripción')
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
      alert(mapError(err.message) ?? 'No se pudo desbloquear el contenido')
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
        <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-br from-fuchsia-700/40 via-purple-700/30 to-pink-700/40 shadow-card sm:h-48">
          <div className="absolute inset-0 bg-grid opacity-30" />
          {coverUrl ? (
            <img src={coverUrl} alt="Portada" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="px-4">
          <div className="relative -mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-[3px] shadow-[0_10px_30px_-10px_rgba(225,29,99,0.6)]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-3">
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
              {!isOwnProfile ? (
                <Button
                  variant={isFollowing ? 'outline' : undefined}
                  size="sm"
                  onClick={() =>
                    toggleFollowMutation.mutate({
                      creatorId: creator.id,
                      isFollowing,
                    })
                  }
                  loading={toggleFollowMutation.isPending}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Button>
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
            className="rounded-xl border border-line bg-surface-3 px-3 py-2 text-sm text-neutral-200 outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
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
            <Card
              key={plan.id}
              className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow"
            >
              <div className="h-1 w-full bg-brand-gradient opacity-70" />
              <div className="flex flex-1 flex-col p-5 pt-4">
                <CardHeader className="mb-0">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.billing_interval === 'monthly'
                      ? 'Mensual'
                      : plan.billing_interval === 'quarterly'
                        ? 'Trimestral'
                        : 'Anual'}
                  </CardDescription>
                </CardHeader>
                {plan.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-400">
                    {plan.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-display text-2xl font-bold text-neutral-100">
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
              </div>
            </Card>
          ))}
        </div>
        {!plans?.length ? (
          isOwnProfile ? (
            <p className="text-sm text-neutral-500">
              Aún no tienes planes de suscripción.{' '}
              <Link to="/dashboard/profile" className="text-primary hover:underline">
                Créalos desde tu perfil
              </Link>
              .
            </p>
          ) : (
            <p className="text-sm text-neutral-500">
              Este creador aún no tiene planes disponibles.
            </p>
          )
        ) : null}
      </div>

      {ppvPosts?.length ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-neutral-100">
            Contenido premium
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ppvPosts.map((post) => {
              const unlocked = unlockedPosts?.has(post.id)
              const included = Boolean(subscription)
              const canSee = unlocked || included
              return (
                <Card key={post.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-purple-800/50 via-[#3b1a4f] to-pink-800/50">
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    {canSee && post.media?.length ? (
                      <PostMedia media={post.media[0]} aspect="h-full w-full" />
                    ) : (
                      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 text-white/90">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm">
                          <Lock className="h-6 w-6" />
                        </span>
                        <span className="text-xs font-medium [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                          Contenido premium
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-100">
                        {post.title}
                      </p>
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
                      disabled={canSee || busy}
                    >
                      {unlocked
                        ? 'Desbloqueado'
                        : included
                          ? 'Acceso incluido'
                          : 'Desbloquear'}
                    </Button>
                  </div>
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
          <div className="grid gap-4 sm:grid-cols-2">
            {freePosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                {post.media?.length ? (
                  <div
                    className={
                      post.media.length > 1
                        ? 'grid grid-cols-2 gap-0.5'
                        : 'block'
                    }
                  >
                    {post.media.slice(0, 4).map((media, index) => (
                      <PostMedia key={index} media={media} />
                    ))}
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="font-medium text-neutral-100">{post.title}</p>
                  {post.description ? (
                    <p className="mt-1 text-sm text-neutral-400">
                      {post.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-neutral-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

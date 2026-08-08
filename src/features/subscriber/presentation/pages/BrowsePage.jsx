import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useProfileImage } from '@/features/dashboard/application/useProfile'
import {
  useCreators,
  useActiveSubscriberCounts,
  useMyFollowing,
  useToggleFollow,
} from '../../application/useSubscriber'
import { Compass, Search, Send, Users } from 'lucide-react'

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function CreatorAvatar({ creator }) {
  const { data: avatarUrl } = useProfileImage(creator.avatar_url)
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-[2px] shadow-[0_8px_20px_-8px_rgba(225,29,99,0.5)]">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={creator.username} className="h-full w-full object-cover" />
        ) : (
          <Users className="h-6 w-6 text-neutral-500" />
        )}
      </div>
    </div>
  )
}

function CreatorCard({ creator, isFollowing, subscriberCount, toggleFollow, busy }) {
  const profileTo = `/c/${creator.username}`
  return (
    <Card className="group flex items-center gap-4 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <Link to={profileTo} className="flex min-w-0 flex-1 items-center gap-4">
        <CreatorAvatar creator={creator} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-neutral-100 transition-colors group-hover:text-primary">
              {creator.display_name ?? creator.username}
            </p>
            <Badge tone="info">Creador</Badge>
          </div>
          <p className="text-xs text-neutral-500">
            @{creator.username}
            {subscriberCount ? ` · ${subscriberCount} suscriptores` : ''}
          </p>
          {creator.bio ? (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-400">
              {creator.bio}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link to={`/chat/${creator.username}`}>
          <Button variant="ghost" size="sm">
            <Send className="h-4 w-4" /> Mensaje
          </Button>
        </Link>
        <Button
          size="sm"
          variant={isFollowing ? 'outline' : undefined}
          onClick={() => toggleFollow({ creatorId: creator.id, isFollowing })}
          loading={busy}
        >
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </Button>
      </div>
    </Card>
  )
}

export default function BrowsePage() {
  const { user } = useAuth()
  const userId = user?.id
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: creators, isLoading } = useCreators(debouncedSearch)
  const { data: counts } = useActiveSubscriberCounts()
  const { data: following } = useMyFollowing(userId)
  const toggleFollowMutation = useToggleFollow(userId)

  const toggleFollow = (payload) => toggleFollowMutation.mutate(payload)

  const recommended = (creators ?? [])
    .filter((creator) => creator.id !== userId && !following?.has(creator.id))
    .sort((a, b) => (counts?.[b.id] ?? 0) - (counts?.[a.id] ?? 0))
    .slice(0, 12)

  const hasSearch = Boolean(debouncedSearch.trim())

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgba(225,29,99,0.6)]">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Explora</h1>
            <p className="text-sm text-neutral-400">
              Descubre creadores, suscríbete y disfruta su contenido exclusivo.
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          type="search"
          placeholder="Buscar por nombre, usuario o biografía…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !creators?.length ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center">
          <p className="text-neutral-300">
            {hasSearch ? 'No se encontraron creadores.' : 'Aún no hay creadores registrados.'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {hasSearch
              ? 'Prueba con otro término de búsqueda.'
              : 'Vuelve pronto para ver los primeros perfiles.'}
          </p>
        </div>
      ) : hasSearch ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Resultados ({creators.length})
          </h2>
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              isFollowing={following?.has(creator.id)}
              subscriberCount={counts?.[creator.id] ?? 0}
              toggleFollow={toggleFollow}
              busy={toggleFollowMutation.isPending}
            />
          ))}
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Recomendados para ti
            </h2>
            {recommended.length ? (
              recommended.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  isFollowing={following?.has(creator.id)}
                  subscriberCount={counts?.[creator.id] ?? 0}
                  toggleFollow={toggleFollow}
                  busy={toggleFollowMutation.isPending}
                />
              ))
            ) : (
              <p className="text-sm text-neutral-500">
                ¡Ya sigues a todos los creadores! Vuelve pronto por más.
              </p>
            )}
          </section>

          {recommended.length < creators.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Otros creadores
              </h2>
              {creators
                .filter((creator) => !recommended.includes(creator))
                .map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    isFollowing={following?.has(creator.id)}
                    subscriberCount={counts?.[creator.id] ?? 0}
                    toggleFollow={toggleFollow}
                    busy={toggleFollowMutation.isPending}
                  />
                ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

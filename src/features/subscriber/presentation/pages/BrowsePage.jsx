import { Link } from 'react-router-dom'
import { Card, CardDescription } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { User } from 'lucide-react'
import { useCreators } from '../../application/useSubscriber'

export default function BrowsePage() {
  const { data: creators, isLoading } = useCreators()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!creators?.length) {
    return (
      <p className="text-center text-sm text-neutral-500">
        Aún no hay creadores registrados.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Explora creadores</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Suscríbete para acceder a contenido exclusivo.
        </p>
      </header>

      {creators.map((creator) => (
        <Link key={creator.id} to={`/c/${creator.username}`} className="block">
          <Card className="flex items-center gap-4 transition-colors hover:border-primary">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-3">
              <User className="h-6 w-6 text-neutral-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-100">
                {creator.display_name ?? creator.username}
              </p>
              <CardDescription>@{creator.username}</CardDescription>
              {creator.bio ? (
                <p className="mt-1 line-clamp-1 text-sm text-neutral-400">
                  {creator.bio}
                </p>
              ) : null}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

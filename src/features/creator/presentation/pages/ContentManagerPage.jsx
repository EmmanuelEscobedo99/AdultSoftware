import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCreatorPosts } from '../../application/useCreatorPosts'
import { PostCard } from '../components/PostCard'
import { Plus } from 'lucide-react'

export default function ContentManagerPage() {
  const { data: posts, isLoading } = useCreatorPosts()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Contenido</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Tu perfil como lo ven tus fans. Publica y administra tus posts.
          </p>
        </div>
        <Link to="/dashboard/creator/content/new">
          <Button>
            <Plus className="h-4 w-4" /> Nuevo post
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
        </div>
      ) : posts?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-surface-2/40 py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <p className="text-neutral-200">Aún no has publicado nada.</p>
            <p className="mt-1 text-sm text-neutral-500">
              Sube tu primer post y míralo aquí como lo verían tus fans.
            </p>
            <Link to="/dashboard/creator/content/new">
              <Button className="mt-5">
                <Plus className="h-4 w-4" /> Crear mi primer post
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

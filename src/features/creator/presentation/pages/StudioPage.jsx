import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useCreatorPosts } from '../../application/useCreatorPosts'
import { FileText, MessageSquare, Sparkles, Users } from 'lucide-react'

export default function StudioPage() {
  const { profile } = useAuth()
  const { data: posts } = useCreatorPosts()

  const published = (posts ?? []).filter((p) => p.published_at).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Estudio del creador</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gestiona tu contenido, suscripciones, chat y agente IA.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/creator/content" className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Contenido
              </CardTitle>
            </CardHeader>
            <CardDescription>{published} posts publicados</CardDescription>
          </Card>
        </Link>

        <Link to="/dashboard/creator/subscriptions" className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Suscripciones
              </CardTitle>
            </CardHeader>
            <CardDescription>Gestiona tus planes y fans</CardDescription>
          </Card>
        </Link>

        <Link to="/dashboard/creator/chat" className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardDescription>Conversa con tus fans</CardDescription>
          </Card>
        </Link>

        <Link to="/dashboard/creator/ai" className="block">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Agente IA
              </CardTitle>
            </CardHeader>
            <CardDescription>Automatiza respuestas y ventas</CardDescription>
          </Card>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">Acciones rápidas</h2>
        <Link to="/dashboard/creator/content/new">
          <Button>Nuevo post</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenido, {profile?.display_name ?? profile?.username}</CardTitle>
        </CardHeader>
        <CardDescription>
          Publica tu primer contenido para empezar a monetizar. Usa "Nuevo post"
          para subir imágenes o videos con visibilidad libre, para suscriptores o
          PPV.
        </CardDescription>
      </Card>
    </div>
  )
}

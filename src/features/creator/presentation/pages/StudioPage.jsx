import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { useCreatorPosts } from '../../application/useCreatorPosts'
import { DollarSign, FileText, MessageSquare, Sparkles, Users } from 'lucide-react'

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/dashboard/creator/content" className="group block">
          <Card className="flex h-full flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <FileText className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">Contenido</CardTitle>
              <CardDescription>{published} posts publicados</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/dashboard/creator/subscriptions" className="group block">
          <Card className="flex h-full flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <Users className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">Suscripciones</CardTitle>
              <CardDescription>Gestiona tus planes y fans</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/dashboard/creator/chat" className="group block">
          <Card className="flex h-full flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <MessageSquare className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">Chat</CardTitle>
              <CardDescription>Conversa con tus fans</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/dashboard/creator/ai" className="group block">
          <Card className="flex h-full flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <Sparkles className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">Agente IA</CardTitle>
              <CardDescription>Automatiza respuestas y ventas</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/dashboard/creator/payouts" className="group block">
          <Card className="flex h-full flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <DollarSign className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">Pagos y cobros</CardTitle>
              <CardDescription>Configura tu método de pago y cobra</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">Acciones rápidas</h2>
        <Link to="/dashboard/creator/content/new">
          <Button>Nuevo post</Button>
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-surface-2/70 p-6 shadow-card backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-lg font-semibold text-neutral-100">
            Bienvenido, {profile?.display_name ?? profile?.username}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Publica tu primer contenido para empezar a monetizar. Usa "Nuevo
            post" para subir imágenes o videos con visibilidad libre, para
            suscriptores o PPV.
          </p>
        </div>
      </div>
    </div>
  )
}

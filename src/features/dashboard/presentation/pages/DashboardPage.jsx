import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { BarChart3, Star, ShieldCheck, Users } from 'lucide-react'

const roleCards = {
  [ROLES.SUPER_ADMIN]: {
    title: 'Panel de administración',
    description: 'Gestiona usuarios, creadores, pagos y moderación global.',
    to: '/dashboard/admin',
  },
  [ROLES.ADMIN]: {
    title: 'Panel de administración',
    description: 'Gestiona usuarios, creadores, pagos y moderación global.',
    to: '/dashboard/admin',
  },
  [ROLES.MODERATOR]: {
    title: 'Centro de moderación',
    description: 'Revisa reportes, bloqueos y advertencias.',
    to: '/dashboard/admin/moderation',
  },
  [ROLES.SUPPORT]: {
    title: 'Soporte',
    description: 'Ayuda a usuarios y resuelve incidencias.',
    to: '/dashboard/admin',
  },
  [ROLES.CREATOR]: {
    title: 'Estudio del creador',
    description: 'Publica contenido, gestiona suscripciones, chat y tu agente IA.',
    to: '/dashboard/creator',
  },
  [ROLES.SUBSCRIBER]: {
    title: 'Explora',
    description: 'Descubre creadores, suscríbete y disfruta el contenido.',
    to: '/dashboard',
  },
}

export default function DashboardPage() {
  const { profile, role } = useAuth()
  const card = roleCards[role] ?? roleCards[ROLES.SUBSCRIBER]

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-100">
            Hola, {profile?.display_name ?? profile?.username}
          </h1>
          <Badge tone="info">{ROLE_LABELS[role]}</Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-400">Bienvenido a tu panel.</p>
      </header>

      <Link to={card.to} className="block">
        <Card className="transition-colors hover:border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {role === ROLES.CREATOR ? (
                <Star className="h-5 w-5 text-primary" />
              ) : role === ROLES.SUBSCRIBER ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardDescription>{card.description}</CardDescription>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-neutral-400" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardDescription>
          Las métricas detalladas se habilitan conforme avancen las fases del
          producto.
        </CardDescription>
      </Card>
    </div>
  )
}

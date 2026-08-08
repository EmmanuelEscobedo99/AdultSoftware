import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import {
  ArrowRight,
  BarChart3,
  Clapperboard,
  Compass,
  FileText,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'

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
    title: 'Explora creadores',
    description: 'Descubre creadores, suscríbete y disfruta el contenido.',
    to: '/browse',
  },
}

function QuickActions({ role }) {
  const actions =
    role === ROLES.CREATOR
      ? [
          { to: '/dashboard/creator/content/new', Icon: FileText, label: 'Nuevo post', hint: 'Sube contenido' },
          { to: '/dashboard/creator/ai', Icon: Sparkles, label: 'Agente IA', hint: 'Automatiza respuestas' },
          { to: '/dashboard/creator/payouts', Icon: Wallet, label: 'Cobrar', hint: 'Tus ganancias' },
          { to: '/feed', Icon: Clapperboard, label: 'Feed', hint: 'Ve tu contenido' },
        ]
      : [
          { to: '/browse', Icon: Compass, label: 'Explorar', hint: 'Descubre creadores' },
          { to: '/feed', Icon: Clapperboard, label: 'Feed de videos', hint: 'Contenido nuevo' },
          { to: '/dashboard/my-subscriptions', Icon: Heart, label: 'Suscripciones', hint: 'Tus planes activos' },
          { to: '/dashboard/payments', Icon: Wallet, label: 'Mis pagos', hint: 'Tu historial' },
        ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(({ to, Icon, label, hint }) => (
        <Link key={label} to={to} className="group">
          <Card className="h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-glow">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgba(225,29,99,0.6)]">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-neutral-100">{label}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{hint}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { profile, role } = useAuth()
  const card = roleCards[role] ?? roleCards[ROLES.SUBSCRIBER]
  const firstName = (profile?.display_name ?? profile?.username ?? '')
    .split(' ')[0]

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/20 via-surface-2 to-accent/20 p-8 shadow-glow">
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(70%_80%_at_80%_0%,black,transparent)]" />
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-neutral-50">
                Hola, {firstName}
              </h1>
              <Badge tone="info">{ROLE_LABELS[role]}</Badge>
            </div>
            <p className="mt-2 max-w-lg text-sm text-neutral-400">
              {card.description}
            </p>
            <Link to={card.to} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-accent">
              {card.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <span className="hidden shrink-0 items-center gap-3 rounded-2xl border border-line/70 bg-surface-2/70 px-5 py-4 backdrop-blur-sm sm:flex">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-neutral-500">Resumen</p>
              <p className="text-sm font-semibold text-neutral-100">
                Métricas próximamente
              </p>
            </div>
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">
          Accesos rápidos
        </h2>
        <QuickActions role={role} />
      </div>

      <Card className="flex items-center gap-4 border-dashed border-line/70 bg-transparent">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-3 text-neutral-400">
          <Star className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-neutral-200">Panel en crecimiento</p>
          <p className="text-sm text-neutral-500">
            Las métricas detalladas se habilitan conforme avancen las fases del producto.
          </p>
        </div>
        <ShieldCheck className="ml-auto hidden h-5 w-5 shrink-0 text-neutral-600 sm:block" />
      </Card>
    </div>
  )
}

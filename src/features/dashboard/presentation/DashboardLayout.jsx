import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { NotificationsBell } from '@/features/notifications/presentation/NotificationsBell'
import { LogOut, User } from 'lucide-react'

function getNavByRole(role) {
  const common = [
    { to: '/dashboard', label: 'Panel', end: true },
    { to: '/dashboard/profile', label: 'Perfil', end: false },
    { to: '/browse', label: 'Explorar', end: false },
    { to: '/feed', label: 'Feed de videos', end: false },
  ]
  const creator = [
    { to: '/dashboard/creator', label: 'Estudio del creador', end: false },
    { to: '/dashboard/creator/content', label: 'Contenido', end: false },
    { to: '/dashboard/creator/subscriptions', label: 'Suscripciones', end: false },
    { to: '/dashboard/creator/chat', label: 'Chat', end: false },
    { to: '/dashboard/creator/ai', label: 'Agente IA', end: false },
    { to: '/dashboard/creator/payouts', label: 'Pagos y cobros', end: false },
  ]
  const subscriber = [
    { to: '/dashboard/my-subscriptions', label: 'Mis suscripciones', end: false },
    { to: '/dashboard/payments', label: 'Mis pagos', end: false },
    { to: '/chat', label: 'Chat', end: false },
  ]
  const admin = [
    { to: '/dashboard/admin', label: 'Administración', end: false },
    { to: '/dashboard/admin/moderation', label: 'Moderación', end: false },
    { to: '/dashboard/admin/payments', label: 'Pagos', end: false },
  ]

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.SUPPORT].includes(role)) {
    return [...common, ...subscriber, ...admin]
  }
  if (role === ROLES.CREATOR) {
    const subscriberWithoutChat = subscriber.filter((item) => item.label !== 'Chat')
    return [...common, ...creator, ...subscriberWithoutChat]
  }
  return [...common, ...subscriber]
}

export default function DashboardLayout() {
  const { user, profile, role, authService } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth/login', { replace: true })
  }

  const nav = getNavByRole(role)

  return (
    <div className="flex min-h-screen">
      <NotificationsBell />
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-surface-2">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-lg font-bold text-neutral-100">CreatorHub</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-3 text-neutral-100'
                    : 'text-neutral-400 hover:bg-surface-3 hover:text-neutral-200',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-neutral-200">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-100">
                {profile?.display_name ?? user?.email}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="rounded-md p-2 text-neutral-400 hover:bg-surface-3 hover:text-neutral-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

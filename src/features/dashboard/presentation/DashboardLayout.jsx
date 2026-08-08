import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { NotificationsBell } from '@/features/notifications/presentation/NotificationsBell'
import { BrandMark } from '@/components/ui/BrandLogo'
import {
  Clapperboard,
  Compass,
  CreditCard,
  FileText,
  Flag,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'

const navItems = {
  panel: { to: '/dashboard', label: 'Panel', end: true, Icon: LayoutDashboard },
  perfil: { to: '/dashboard/profile', label: 'Perfil', end: false, Icon: User },
  explorar: { to: '/browse', label: 'Explorar', end: false, Icon: Compass },
  feed: { to: '/feed', label: 'Feed de videos', end: false, Icon: Clapperboard },
  estudio: { to: '/dashboard/creator', label: 'Estudio del creador', end: false, Icon: Star },
  contenido: { to: '/dashboard/creator/content', label: 'Contenido', end: false, Icon: FileText },
  suscripciones: { to: '/dashboard/creator/subscriptions', label: 'Suscripciones', end: false, Icon: Users },
  chat: { to: '/dashboard/creator/chat', label: 'Chat', end: false, Icon: MessageSquare },
  ai: { to: '/dashboard/creator/ai', label: 'Agente IA', end: false, Icon: Sparkles },
  pagosCobros: { to: '/dashboard/creator/payouts', label: 'Pagos y cobros', end: false, Icon: Wallet },
  misSuscripciones: { to: '/dashboard/my-subscriptions', label: 'Mis suscripciones', end: false, Icon: Heart },
  misPagos: { to: '/dashboard/payments', label: 'Mis pagos', end: false, Icon: Receipt },
  chatGlobal: { to: '/chat', label: 'Chat', end: false, Icon: MessageSquare },
  admin: { to: '/dashboard/admin', label: 'Administración', end: false, Icon: ShieldCheck },
  moderacion: { to: '/dashboard/admin/moderation', label: 'Moderación', end: false, Icon: Flag },
  pagosAdmin: { to: '/dashboard/admin/payments', label: 'Pagos', end: false, Icon: CreditCard },
}

function getNavByRole(role) {
  const common = [navItems.panel, navItems.perfil, navItems.explorar, navItems.feed]
  const creator = [
    navItems.estudio,
    navItems.contenido,
    navItems.suscripciones,
    navItems.chat,
    navItems.ai,
    navItems.pagosCobros,
  ]
  const subscriber = [navItems.misSuscripciones, navItems.misPagos, navItems.chatGlobal]
  const admin = [navItems.admin, navItems.moderacion, navItems.pagosAdmin]

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.SUPPORT].includes(role)) {
    return [...common, ...subscriber, ...admin]
  }
  if (role === ROLES.CREATOR) {
    return [...common, ...creator, ...subscriber.filter((item) => item.to !== '/chat')]
  }
  return [...common, ...subscriber]
}

function SidebarContent({ nav, onNavigate }) {
  const { user, profile, role, authService } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth/login', { replace: true })
  }

  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-line/70 px-5">
        <BrandMark className="h-8 w-8" />
        <span className="font-display text-lg font-bold tracking-tight text-neutral-100">
          Creator<span className="text-gradient">Hub</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-surface-3/80 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'text-neutral-400 hover:bg-surface-2 hover:text-neutral-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-neutral-500 group-hover:text-neutral-300',
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line/70 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
              {(profile?.display_name ?? profile?.username ?? 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
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
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-surface-3 hover:text-neutral-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const nav = getNavByRole(useAuth().role)

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line/70 bg-surface-2/95 backdrop-blur transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-end border-b border-line/70 p-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-neutral-400 hover:bg-surface-3"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent nav={nav} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line/60 bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-neutral-300 transition-colors hover:bg-surface-3 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden text-sm text-neutral-500 sm:block">
            Panel de CreatorHub
          </span>
          <NotificationsBell />
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

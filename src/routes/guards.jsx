import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLE_LEVELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { FullPageLoader } from '@/components/ui/Loader'
import ForbiddenPage from '@/pages/ForbiddenPage'

/** Requiere sesión iniciada. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

/** Solo accesible sin sesión (login, registro, recuperación). */
export function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />

  if (user) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

/** Requiere un rol mínimo en la jerarquía (o uno de los roles listados). */
export function RoleRoute({ roles, minLevel }) {
  const { role, loading } = useAuth()

  if (loading) return <FullPageLoader />

  const allowed = Array.isArray(roles) ? roles.includes(role) : false
  const aboveMinimum = minLevel ? (ROLE_LEVELS[role] ?? 0) >= minLevel : false

  if (!allowed && !aboveMinimum) return <ForbiddenPage />

  return <Outlet />
}

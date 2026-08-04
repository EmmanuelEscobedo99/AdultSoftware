import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { supabaseAdminRepository } from '../../infrastructure/supabaseAdminRepository'
import { useAdminStats, useUsers } from '../../application/useAdmin'
import { Ban, Search, Users, Star, ShieldCheck, Flag, CreditCard } from 'lucide-react'

function UserRow({ user, queryClient }) {
  const [role, setRole] = useState(user.role)

  const roleMutation = useMutation({
    mutationFn: () => supabaseAdminRepository.setUserRole(user.id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const banMutation = useMutation({
    mutationFn: () => supabaseAdminRepository.banUser(user.id, !user.is_banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-neutral-100">
            {user.display_name ?? user.username}
          </p>
          {user.is_banned ? (
            <Badge tone="danger">Baneado</Badge>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">
          @{user.username} · {ROLE_LABELS[user.role]}
        </p>
      </div>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="h-9 rounded-lg border border-line bg-surface-3 px-2 text-sm text-neutral-200"
      >
        {Object.values(ROLES).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        loading={roleMutation.isPending}
        disabled={role === user.role}
        onClick={() => roleMutation.mutate()}
      >
        Cambiar rol
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-400"
        loading={banMutation.isPending}
        onClick={() => banMutation.mutate()}
      >
        <Ban className="h-4 w-4" />
        {user.is_banned ? 'Desbanear' : 'Banear'}
      </Button>
    </div>
  )
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data: users, isLoading } = useUsers({ role: roleFilter, search })

  const statCards = [
    { label: 'Usuarios', value: stats?.users, icon: Users },
    { label: 'Creadores', value: stats?.creators, icon: Star },
    { label: 'Suscriptores', value: stats?.subscribers, icon: Users },
    { label: 'Reportes pendientes', value: stats?.pendingReports, icon: Flag },
    { label: 'Pagos completados', value: stats?.completedPayments, icon: CreditCard },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Administración</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Usuarios, roles, contenido y pagos de la plataforma.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <card.icon className="mb-2 h-5 w-5 text-primary" />
            {statsLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-neutral-100">{card.value}</p>
            )}
            <CardDescription>{card.label}</CardDescription>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-neutral-400" />
            Usuarios
          </CardTitle>
          <CardDescription>
            Gestiona roles y bloqueos. Los cambios se reflejan al instante en los
            claims JWT.
          </CardDescription>
        </CardHeader>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              className="pl-9"
              placeholder="Buscar por usuario…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface-3 px-2 text-sm text-neutral-200"
          >
            <option value="">Todos los roles</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : users?.length ? (
          <div>
            {users.map((user) => (
              <UserRow key={user.id} user={user} queryClient={queryClient} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500">
            Sin usuarios para los filtros actuales.
          </p>
        )}
      </Card>
    </div>
  )
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { supabaseAdminRepository } from '../../infrastructure/supabaseAdminRepository'
import { useReports } from '../../application/useAdmin'
import { Flag } from 'lucide-react'

const statusTone = {
  pending: 'warning',
  reviewing: 'info',
  resolved: 'success',
  dismissed: 'default',
}

export default function ModerationPage() {
  const queryClient = useQueryClient()
  const { data: reports, isLoading } = useReports()

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolve }) =>
      supabaseAdminRepository.updateReport(id, status, resolve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Moderación</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Reportes de la comunidad, bloqueos y advertencias.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-neutral-400" />
            Reportes
          </CardTitle>
          <CardDescription>
            Revisa y resuelve los reportes enviados por los usuarios.
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : reports?.length ? (
          <div>
            {reports.map((report) => (
              <div
                key={report.id}
                className="border-b border-line py-4 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-neutral-100">
                    Reporte de {report.target_type} #{report.target_id.slice(0, 8)}
                  </p>
                  <Badge tone={statusTone[report.status] ?? 'default'}>
                    {report.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-400">{report.reason}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Por @{report.reporter?.username} ·{' '}
                  {new Date(report.created_at).toLocaleString()}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: report.id,
                        status: 'reviewing',
                        resolve: false,
                      })
                    }
                  >
                    En revisión
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: report.id,
                        status: 'resolved',
                        resolve: true,
                      })
                    }
                  >
                    Resolver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: report.id,
                        status: 'dismissed',
                        resolve: true,
                      })
                    }
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-neutral-500">
            No hay reportes pendientes.
          </p>
        )}
      </Card>
    </div>
  )
}

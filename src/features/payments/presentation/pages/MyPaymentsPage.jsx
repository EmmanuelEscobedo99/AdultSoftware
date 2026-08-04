import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMyPayments } from '../../application/usePayments'

const statusTone = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'default',
  cancelled: 'default',
}

export default function MyPaymentsPage() {
  const { data: payments, isLoading } = useMyPayments()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Mis pagos</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Historial de suscripciones y desbloqueos PPV.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : payments?.length ? (
        <Card>
          <div>
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center gap-4 border-b border-line py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-100">
                    {payment.purpose === 'subscription' ? 'Suscripción' : 'Desbloqueo PPV'}
                    {' · '}
                    {payment.creator?.display_name ?? payment.creator?.username ?? '—'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(payment.created_at).toLocaleDateString()} ·{' '}
                    {payment.provider}
                  </p>
                </div>
                <span className="font-semibold text-neutral-100">
                  ${payment.amount}
                </span>
                <Badge tone={statusTone[payment.status] ?? 'default'}>
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sin pagos</CardTitle>
            <CardDescription>
              Cuando compres suscripciones o contenido PPV, aparecerá aquí.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMyPayments } from '../../application/usePayments'
import { CreditCard } from 'lucide-react'

const statusTone = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'default',
  cancelled: 'default',
}

export default function MyPaymentsPage() {
  const { data: payments, isLoading, refetch } = useMyPayments()
  const [searchParams, setSearchParams] = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  useEffect(() => {
    if (success || cancelled) {
      refetch()
      const timeout = setTimeout(() => {
        setSearchParams({}, { replace: true })
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [success, cancelled, refetch, setSearchParams])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <CreditCard className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Mis pagos</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Historial de suscripciones y desbloqueos PPV.
          </p>
        </div>
      </header>

      {success ? (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          Pago completado correctamente. Tu contenido y suscripciones se
          actualizarán de inmediato.
        </div>
      ) : null}

      {cancelled ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          El pago fue cancelado. No se realizó ningún cargo.
        </div>
      ) : null}

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

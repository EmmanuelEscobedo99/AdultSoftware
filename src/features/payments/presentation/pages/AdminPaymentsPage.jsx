import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminPayments, useAdminPayouts } from '../../application/usePayments'
import { Banknote, CreditCard } from 'lucide-react'

const statusTone = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'default',
  cancelled: 'default',
  processing: 'info',
  paid: 'success',
}

export default function AdminPaymentsPage() {
  const { data: payments, isLoading } = useAdminPayments()
  const { data: payouts } = useAdminPayouts()

  return (
    <div className="max-w-5xl space-y-8">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <CreditCard className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Pagos</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Transacciones y pagos a creadores (payouts).
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <CreditCard className="h-4 w-4" />
            </span>
            Pagos
          </CardTitle>
          <CardDescription>Últimas 200 transacciones.</CardDescription>
        </CardHeader>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : payments?.length ? (
          <div>
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-100">
                    {payment.user?.display_name ?? payment.user?.username} ·{' '}
                    {payment.purpose}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payment.provider} · {new Date(payment.created_at).toLocaleString()}
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
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500">
            Sin pagos registrados.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Banknote className="h-4 w-4" />
            </span>
            Payouts a creadores
          </CardTitle>
        </CardHeader>
        {payouts?.length ? (
          <div>
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-100">
                    {payout.creator?.display_name ?? payout.creator?.username}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payout.provider ?? '—'} ·{' '}
                    {new Date(payout.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-semibold text-neutral-100">
                  ${payout.amount}
                </span>
                <Badge tone={statusTone[payout.status] ?? 'default'}>
                  {payout.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500">
            Sin payouts todavía.
          </p>
        )}
      </Card>
    </div>
  )
}

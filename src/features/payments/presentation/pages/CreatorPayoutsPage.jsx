import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { useAuth } from '@/features/auth/application/AuthProvider'
import {
  useCreatorEarnings,
  useMyPayouts,
  usePayoutMethod,
  useRequestPayout,
  useUpsertPayoutMethod,
} from '../../application/usePayments'
import { BadgeDollarSign, DollarSign, Landmark, Wallet } from 'lucide-react'

const PROVIDERS = [
  { value: 'bank', label: 'Transferencia bancaria' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'test', label: 'Modo prueba (demo)' },
]

const payoutStatusTone = {
  pending: 'warning',
  processing: 'info',
  paid: 'success',
  failed: 'danger',
}

const errorMessages = {
  no_payout_method: 'Configura primero un método de pago.',
  nothing_to_payout: 'No tienes ganancias pendientes por cobrar.',
  not_creator: 'Solo los creadores pueden solicitar pagos.',
}

const mapError = (message) => errorMessages[message] ?? message

const EMPTY_FORM = {
  account_holder: '',
  bank_name: '',
  account_number: '',
  routing_number: '',
  account_email: '',
}

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface-2/70 p-4 shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-gradient">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  )
}

export default function CreatorPayoutsPage() {
  const { user } = useAuth()
  const creatorId = user?.id
  const { data: method, isLoading: loadingMethod } = usePayoutMethod(creatorId)
  const { data: earnings, isLoading: loadingEarnings } = useCreatorEarnings()
  const { data: payouts, isLoading: loadingPayouts } = useMyPayouts()
  const upsertMethod = useUpsertPayoutMethod()
  const requestPayout = useRequestPayout()

  const [provider, setProvider] = useState('bank')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (method) {
      setProvider(method.provider)
      setForm({
        account_holder: method.account_holder ?? '',
        bank_name: method.bank_name ?? '',
        account_number: method.account_number ?? '',
        routing_number: method.routing_number ?? '',
        account_email: method.account_email ?? '',
      })
    }
  }, [method])

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSaveMethod = async (event) => {
    event.preventDefault()
    setFormError(null)
    if (provider === 'bank' && (!form.account_holder || !form.bank_name || !form.account_number)) {
      setFormError('Completa el titular, el banco y el número de cuenta.')
      return
    }
    if ((provider === 'paypal' || provider === 'stripe') && !form.account_email) {
      setFormError('Indica el email de tu cuenta para recibir pagos.')
      return
    }
    try {
      await upsertMethod.mutateAsync({
        creator_id: creatorId,
        provider,
        ...form,
      })
    } catch (err) {
      setFormError(err.message ?? 'No se pudo guardar el método de pago.')
    }
  }

  const handleRequestPayout = async () => {
    const pending = earnings?.pending_net ?? 0
    if (!window.confirm(`¿Solicitar el pago de ${formatMoney(pending)} a tu método configurado?`)) return
    try {
      await requestPayout.mutateAsync()
    } catch (err) {
      alert(mapError(err.message))
    }
  }

  const requiresEmail = provider === 'paypal' || provider === 'stripe'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <BadgeDollarSign className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Pagos y cobros</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Configura dónde recibes tu dinero y solicita tus ganancias del mes.
          </p>
        </div>
      </header>

      {/* Resumen del mes */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-100">
          Resumen del mes
        </h2>
        {loadingEarnings ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Generado este mes"
              value={formatMoney(earnings?.month_gross)}
              hint="Ventas brutas (suscripciones + PPV)"
            />
            <StatCard
              label="Comisión de la plataforma"
              value={formatMoney(earnings?.month_commission)}
              hint={`${((earnings?.rate ?? 0.2) * 100).toFixed(0)}% de lo generado`}
            />
            <StatCard
              label="Tu ganancia neta"
              value={formatMoney(earnings?.month_net)}
              hint="Depósito estimado del mes"
            />
          </div>
        )}
      </div>

      {/* Saldo pendiente + solicitar pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Wallet className="h-4 w-4" />
            </span>
            Saldo pendiente de cobro
          </CardTitle>
          <CardDescription>
            Ganancias completadas aún no liquidadas.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-3xl font-bold text-gradient">
              {formatMoney(earnings?.pending_net)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Bruto pendiente: {formatMoney(earnings?.pending_gross)}
            </p>
          </div>
          <Button
            onClick={handleRequestPayout}
            disabled={!method || (earnings?.pending_gross ?? 0) <= 0}
            loading={requestPayout.isPending}
          >
            <DollarSign className="h-4 w-4" />
            Solicitar pago
          </Button>
        </div>
        {!method ? (
          <p className="px-4 pb-4 text-sm text-amber-300">
            Configura tu método de pago abajo para poder cobrar.
          </p>
        ) : null}
      </Card>

      {/* Método de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Landmark className="h-4 w-4" />
            </span>
            Método de pago
          </CardTitle>
          <CardDescription>
            Aquí se depositarán tus pagos. Puedes guardarlo o actualizarlo cuando quieras.
          </CardDescription>
        </CardHeader>

        {loadingMethod ? (
          <div className="p-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSaveMethod} className="space-y-4 p-4">
            <div>
              <Label htmlFor="provider">Proveedor</Label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm text-neutral-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                {PROVIDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="account_holder">Titular de la cuenta</Label>
                <Input
                  id="account_holder"
                  value={form.account_holder}
                  onChange={setField('account_holder')}
                  placeholder={requiresEmail ? 'Tu nombre' : 'Nombre del titular de la cuenta'}
                />
              </div>

              {provider === 'bank' ? (
                <>
                  <div>
                    <Label htmlFor="bank_name">Banco</Label>
                    <Input
                      id="bank_name"
                      value={form.bank_name}
                      onChange={setField('bank_name')}
                      placeholder="Nombre del banco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Número de cuenta</Label>
                    <Input
                      id="account_number"
                      value={form.account_number}
                      onChange={setField('account_number')}
                      placeholder="Cuenta (CLABE / IBAN / etc.)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routing_number">Código de ruta (opcional)</Label>
                    <Input
                      id="routing_number"
                      value={form.routing_number}
                      onChange={setField('routing_number')}
                      placeholder="Routing / SWIFT / ABA"
                    />
                  </div>
                </>
              ) : null}

              {requiresEmail ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="account_email">
                    Email de {provider === 'paypal' ? 'PayPal' : 'Stripe'}
                  </Label>
                  <Input
                    id="account_email"
                    type="email"
                    value={form.account_email}
                    onChange={setField('account_email')}
                    placeholder="tu@correo.com"
                  />
                </div>
              ) : null}

              {provider === 'test' ? (
                <p className="sm:col-span-2 text-sm text-neutral-500">
                  Modo prueba: los pagos se marcan como solicitados sin depósito real.
                </p>
              ) : null}
            </div>

            {formError ? <FieldError message={formError} /> : null}

            <Button type="submit" loading={upsertMethod.isPending}>
              {method ? 'Actualizar método de pago' : 'Guardar método de pago'}
            </Button>
            {upsertMethod.isSuccess ? (
              <span className="ml-3 text-sm text-emerald-400">Guardado</span>
            ) : null}
          </form>
        )}
      </Card>

      {/* Historial de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        {loadingPayouts ? (
          <Skeleton className="h-32 w-full" />
        ) : payouts?.length ? (
          <div>
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-100">
                    {new Date(payout.created_at).toLocaleDateString()} ·{' '}
                    {payout.provider}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(payout.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-semibold text-neutral-100">
                  ${payout.amount}
                </span>
                <Badge tone={payoutStatusTone[payout.status] ?? 'default'}>
                  {payout.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500">
            Todavía no has solicitado ningún pago.
          </p>
        )}
      </Card>
    </div>
  )
}

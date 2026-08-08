import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Segmented } from '@/components/ui/Segmented'
import { User } from 'lucide-react'
import { supabasePlansRepository } from '../../infrastructure/supabasePlansRepository'
import { useMyPlans, useMySubscribers } from '../../application/usePlans'

const planSchema = z.object({
  name: z.string().min(1, 'Nombre obligatorio').max(60),
  price: z.coerce.number().min(0, 'Precio inválido'),
  billing_interval: z.enum(['monthly', 'quarterly', 'yearly']),
  description: z.string().max(300).optional(),
})

function PlanCard({ plan }) {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: () => supabasePlansRepository.togglePlan(plan.id, !plan.is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-plans'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => supabasePlansRepository.deletePlan(plan.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-plans'] }),
  })

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <Badge tone={plan.is_active ? 'success' : 'default'}>
            {plan.is_active ? 'Activo' : 'Pausado'}
          </Badge>
        </div>
        <CardDescription>
          ${plan.price} / {plan.billing_interval}
        </CardDescription>
      </CardHeader>
      <div className="mt-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMutation.mutate()}
          loading={toggleMutation.isPending}
        >
          {plan.is_active ? 'Pausar' : 'Activar'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400"
          onClick={() => {
            if (window.confirm('¿Eliminar este plan?')) deleteMutation.mutate()
          }}
          loading={deleteMutation.isPending}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

export default function SubscriptionsManagerPage() {
  const { data: plans, isLoading } = useMyPlans()
  const { data: subscribers } = useMySubscribers()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: '',
      billing_interval: 'monthly',
      description: '',
    },
  })

  const onSubmit = async (values) => {
    await supabasePlansRepository.createPlan(values)
    setCreating(false)
    reset()
    queryClient.invalidateQueries({ queryKey: ['my-plans'] })
  }

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Suscripciones</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Crea planes y gestiona a tus suscriptores.
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Planes</h2>
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancelar' : '+ Nuevo plan'}
          </Button>
        </div>

        {creating ? (
          <Card className="mb-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" error={errors.name} {...register('name')} />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <Label htmlFor="price">Precio (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    error={errors.price}
                    {...register('price')}
                  />
                  <FieldError message={errors.price?.message} />
                </div>
              </div>

              <div>
                <Label>Ciclo de facturación</Label>
                <Segmented
                  className="grid-cols-3"
                  options={[
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'quarterly', label: 'Trimestral' },
                    { value: 'yearly', label: 'Anual' },
                  ]}
                  error={errors.billing_interval}
                  {...register('billing_interval')}
                />
                <FieldError message={errors.billing_interval?.message} />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={2}
                  error={errors.description}
                  {...register('description')}
                />
                <FieldError message={errors.description?.message} />
              </div>

              <Button type="submit" loading={isSubmitting}>
                Crear plan
              </Button>
            </form>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : plans?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Aún no tienes planes.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-100">
          Suscriptores activos
        </h2>
        {subscribers?.length ? (
          <Card>
            <div>
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 border-b border-line py-3 last:border-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3">
                    <User className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {sub.subscriber?.display_name ?? sub.subscriber?.username}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Plan: {sub.plan?.name ?? '—'} · desde{' '}
                      {new Date(sub.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <p className="text-sm text-neutral-500">Sin suscriptores todavía.</p>
        )}
      </section>
    </div>
  )
}

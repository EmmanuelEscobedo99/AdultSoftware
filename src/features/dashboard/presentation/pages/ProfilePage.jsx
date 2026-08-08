import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { supabaseProfileRepository } from '@/features/auth/infrastructure/supabaseProfileRepository'
import { supabasePlansRepository } from '@/features/creator/infrastructure/supabasePlansRepository'
import { useMyPlans, useMySubscribers } from '@/features/creator/application/usePlans'
import { useCreatorPosts } from '@/features/creator/application/useCreatorPosts'
import { useProfileImage } from '../../application/useProfile'
import {
  Camera,
  Check,
  FileText,
  ImageIcon,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20')
    .regex(/^[a-z0-9_]+$/i, 'Solo letras, números y guion bajo'),
  display_name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  bio: z.string().max(300, 'Máximo 300 caracteres').optional(),
})

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
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-100">{plan.name}</p>
          <p className="text-xs text-neutral-500">
            {plan.billing_interval === 'monthly'
              ? 'Mensual'
              : plan.billing_interval === 'quarterly'
                ? 'Trimestral'
                : 'Anual'}
          </p>
        </div>
        <Badge tone={plan.is_active ? 'success' : 'default'}>
          {plan.is_active ? 'Activo' : 'Pausado'}
        </Badge>
      </div>
      <p className="mt-3 text-2xl font-bold text-neutral-100">
        ${plan.price}
        <span className="text-sm font-normal text-neutral-500">
          {' '}
          / {plan.billing_interval === 'monthly' ? 'mes' : 'período'}
        </span>
      </p>
      {plan.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{plan.description}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
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
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth()
  const [success, setSuccess] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const { data: avatarUrl } = useProfileImage(profile?.avatar_url)
  const { data: coverUrl } = useProfileImage(profile?.cover_url)
  const { data: plans, isLoading: loadingPlans } = useMyPlans()
  const { data: subscribers } = useMySubscribers()
  const { data: posts } = useCreatorPosts()
  const queryClient = useQueryClient()

  const isCreator = role === ROLES.CREATOR

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username ?? '',
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    },
  })

  const planForm = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: '',
      billing_interval: 'monthly',
      description: '',
    },
  })

  const uploadImage = async (file, kind) => {
    if (!file || !user) return
    setUploadError(null)
    if (kind === 'avatar') setSavingAvatar(true)
    else setSavingCover(true)
    try {
      if (kind === 'avatar') await supabaseProfileRepository.updateAvatar(user.id, file)
      else await supabaseProfileRepository.updateCover(user.id, file)
      await refreshProfile()
    } catch (err) {
      setUploadError(err.message ?? 'No se pudo subir la imagen')
    } finally {
      if (kind === 'avatar') setSavingAvatar(false)
      else setSavingCover(false)
    }
  }

  const onAvatarChange = async (event) => {
    await uploadImage(event.target.files?.[0], 'avatar')
    event.target.value = ''
  }

  const onCoverChange = async (event) => {
    await uploadImage(event.target.files?.[0], 'cover')
    event.target.value = ''
  }

  const onSubmit = async (values) => {
    setSuccess(false)
    try {
      await supabaseProfileRepository.updateProfile(user.id, values)
      await refreshProfile()
      setSuccess(true)
    } catch {
      setSuccess(false)
    }
  }

  const onPlanSubmit = async (values) => {
    await supabasePlansRepository.createPlan(values)
    planForm.reset()
    setCreatingPlan(false)
    queryClient.invalidateQueries({ queryKey: ['my-plans'] })
  }

  const planErrors = planForm.formState.errors

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Portada */}
      <div className="relative">
        <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-br from-fuchsia-700/40 via-purple-700/30 to-pink-700/40 shadow-card sm:h-64">
          <div className="absolute inset-0 bg-grid opacity-30" />
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Portada"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onCoverChange}
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={savingCover}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
        >
          <Camera className="h-4 w-4" />
          {savingCover ? 'Subiendo…' : 'Cambiar portada'}
        </button>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-[3px] shadow-[0_10px_30px_-10px_rgba(225,29,99,0.6)]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users className="h-10 w-10 text-neutral-500" />
                  )}
                </div>
              </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={savingAvatar}
              title="Cambiar foto de perfil"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {uploadError}
        </div>
      ) : null}

      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-16">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-100">
              {profile?.display_name ?? profile?.username ?? 'Tu perfil'}
            </h1>
            <Badge tone="info">{ROLE_LABELS[role] ?? role}</Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">@{profile?.username}</p>

          {isCreator ? (
            <div className="mt-4 flex gap-8">
              <div>
                <p className="text-xl font-bold text-neutral-100">
                  {posts?.length ?? 0}
                </p>
                <p className="text-xs text-neutral-500">Posts</p>
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-100">
                  {subscribers?.length ?? 0}
                </p>
                <p className="text-xs text-neutral-500">Suscriptores</p>
              </div>
            </div>
          ) : null}
        </div>

        {profile?.username ? (
          <Link to={`/c/${profile.username}`}>
            <Button variant="outline" size="sm">
              Ver perfil público
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle>Información del perfil</CardTitle>
          <CardDescription>
            Nombre, usuario y biografía que verán tus fans.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="display_name">Nombre público</Label>
              <Input
                id="display_name"
                error={errors.display_name}
                {...register('display_name')}
              />
              <FieldError message={errors.display_name?.message} />
            </div>
            <div>
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input id="username" error={errors.username} {...register('username')} />
              <FieldError message={errors.username?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Cuéntanos sobre ti…"
              error={errors.bio}
              {...register('bio')}
            />
            <FieldError message={errors.bio?.message} />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={isSubmitting}>
              Guardar cambios
            </Button>
            {success ? (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <Check className="h-4 w-4" /> Guardado
              </span>
            ) : null}
          </div>
        </form>
      </Card>

      {/* Precios de suscripción (solo creadores) */}
      {isCreator ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Precios de suscripción</CardTitle>
                <CardDescription>
                  Define cuánto cobrar a tus fans por mes, trimestre o año.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreatingPlan((v) => !v)}>
                {creatingPlan ? (
                  <>
                    <X className="h-4 w-4" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Nuevo plan
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {creatingPlan ? (
            <form onSubmit={planForm.handleSubmit(onPlanSubmit)} className="mb-5 space-y-4 rounded-xl bg-surface-2 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="plan-name">Nombre</Label>
                  <Input
                    id="plan-name"
                    error={planErrors.name}
                    {...planForm.register('name')}
                  />
                  <FieldError message={planErrors.name?.message} />
                </div>
                <div>
                  <Label htmlFor="plan-price">Precio (USD)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    step="0.01"
                    error={planErrors.price}
                    {...planForm.register('price')}
                  />
                  <FieldError message={planErrors.price?.message} />
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
                  error={planErrors.billing_interval}
                  {...planForm.register('billing_interval')}
                />
                <FieldError message={planErrors.billing_interval?.message} />
              </div>

              <div>
                <Label htmlFor="plan-description">Descripción</Label>
                <Textarea
                  id="plan-description"
                  rows={2}
                  error={planErrors.description}
                  {...planForm.register('description')}
                />
                <FieldError message={planErrors.description?.message} />
              </div>

              <Button type="submit" loading={planForm.formState.isSubmitting}>
                Crear plan
              </Button>
            </form>
          ) : null}

          {loadingPlans ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-sm text-neutral-500">
              Aún no tienes planes. Crea uno para empezar a cobrar suscripciones.
            </p>
          )}
        </Card>
      ) : null}

      <p className="flex items-center justify-center gap-1 text-center text-xs text-neutral-600">
        <FileText className="h-3.5 w-3.5" />
        Los cambios se reflejan al instante en tu perfil público.
      </p>
    </div>
  )
}

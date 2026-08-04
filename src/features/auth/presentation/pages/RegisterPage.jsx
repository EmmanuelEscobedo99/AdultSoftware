import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { ROLES } from '@/lib/constants'
import { registerSchema } from '../../domain/auth.schema'
import { useAuth } from '../../application/AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export default function RegisterPage() {
  const { authService, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: ROLES.SUBSCRIBER },
  })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values) => {
    const { error } = await authService.register(values)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    navigate('/auth/login', {
      replace: true,
      state: { info: 'Cuenta creada. Revisa tu email para confirmarla.' },
    })
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Únete como creador o suscriptor"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            error={errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="tu_usuario"
              error={errors.username}
              {...register('username')}
            />
            <FieldError message={errors.username?.message} />
          </div>
          <div>
            <Label htmlFor="displayName">Nombre público</Label>
            <Input
              id="displayName"
              autoComplete="name"
              placeholder="Nombre que verán los demás"
              error={errors.displayName}
              {...register('displayName')}
            />
            <FieldError message={errors.displayName?.message} />
          </div>
        </div>

        <div>
          <Label>Quiero registrarme como</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: ROLES.SUBSCRIBER, label: 'Suscriptor' },
              { value: ROLES.CREATOR, label: 'Creador' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-3 px-3 py-2.5 text-sm text-neutral-200 has-checked:border-primary has-checked:text-primary"
              >
                <input
                  type="radio"
                  value={option.value}
                  className="sr-only"
                  {...register('role')}
                />
                {option.label}
              </label>
            ))}
          </div>
          <FieldError message={errors.role?.message} />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {errors.root ? (
          <p className="text-sm text-red-400">{errors.root.message}</p>
        ) : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}

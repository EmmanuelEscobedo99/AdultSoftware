import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { loginSchema } from '../../domain/auth.schema'
import { useAuth } from '../../application/AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export default function LoginPage() {
  const { authService, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values) => {
    const { error } = await authService.login(values)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/auth/register" className="text-primary hover:underline">
            Regístrate
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

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/auth/forgot-password"
              className="mb-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        {errors.root ? (
          <p className="text-sm text-red-400">{errors.root.message}</p>
        ) : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  )
}

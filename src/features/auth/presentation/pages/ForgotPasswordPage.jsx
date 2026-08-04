import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { forgotPasswordSchema } from '../../domain/auth.schema'
import { useAuth } from '../../application/AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export default function ForgotPasswordPage() {
  const { authService } = useAuth()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (values) => {
    const { error } = await authService.requestPasswordReset(values.email)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecerla"
      footer={
        <>
          <Link to="/auth/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-3 text-sm text-neutral-300">
          <p>
            Si el email existe, recibirás un enlace de recuperación. Revisa tu
            bandeja de entrada (y la carpeta de spam).
          </p>
          <Link
            to="/auth/login"
            className="inline-block text-primary hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
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

          {errors.root ? (
            <p className="text-sm text-red-400">{errors.root.message}</p>
          ) : null}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

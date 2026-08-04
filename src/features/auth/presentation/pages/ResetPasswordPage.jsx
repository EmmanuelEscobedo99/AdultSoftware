import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { resetPasswordSchema } from '../../domain/auth.schema'
import { useAuth } from '../../application/AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export default function ResetPasswordPage() {
  const { authService } = useAuth()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return
    })
    return () => sub?.unsubscribe()
  }, [])

  const onSubmit = async (values) => {
    const { error } = await authService.updatePassword(values.password)
    if (error) {
      setError('root', { message: error.message })
      return
    }
    setDone(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura"
    >
      {done ? (
        <p className="text-sm text-emerald-400">
          Contraseña actualizada. Redirigiendo…
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
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
            Actualizar contraseña
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

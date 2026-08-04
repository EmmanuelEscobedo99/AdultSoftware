import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold text-neutral-100">CreatorHub</h1>
      <p className="max-w-md text-center text-neutral-400">
        Plataforma para creadores: suscripciones, contenido, chat con IA y
        pagos.
      </p>
      <div className="flex gap-3">
        <Link to="/auth/login">
          <Button>Iniciar sesión</Button>
        </Link>
        <Link to="/auth/register">
          <Button variant="outline">Crear cuenta</Button>
        </Link>
      </div>
    </div>
  )
}

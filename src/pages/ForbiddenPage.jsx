import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-5xl font-bold text-neutral-200">403</h1>
      <p className="max-w-sm text-neutral-400">
        No tienes permisos para acceder a esta sección.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Ir al panel</Button>
      </Link>
    </div>
  )
}

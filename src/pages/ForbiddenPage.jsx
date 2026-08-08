import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ShieldX } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden px-6 text-center">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <ShieldX className="h-8 w-8" />
        </span>
        <h1 className="text-gradient text-7xl font-extrabold">403</h1>
        <p className="max-w-sm text-neutral-400">
          No tienes permisos para acceder a esta sección.
        </p>
        <Link to="/dashboard">
          <Button variant="outline">Ir al panel</Button>
        </Link>
      </div>
    </div>
  )
}

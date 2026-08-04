import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-6xl font-bold text-neutral-200">404</h1>
      <p className="text-neutral-400">La página que buscas no existe.</p>
      <Link to="/">
        <Button variant="outline">Volver al inicio</Button>
      </Link>
    </div>
  )
}

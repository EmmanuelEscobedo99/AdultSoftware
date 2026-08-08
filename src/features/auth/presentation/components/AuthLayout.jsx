import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandLogo'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(60%_50%_at_50%_30%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-gradient opacity-25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-4 flex items-center gap-2.5"
            aria-label="Ir al inicio"
          >
            <BrandMark />
            <span className="font-display text-xl font-bold tracking-tight text-neutral-100">
              Creator<span className="text-gradient">Hub</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-neutral-50">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-neutral-400">{subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-line/70 bg-surface-2/80 p-7 shadow-soft backdrop-blur-xl">
          {children}
        </div>

        {footer ? (
          <div className="mt-5 text-center text-sm text-neutral-400">{footer}</div>
        ) : null}

        <p className="mt-8 text-center text-[11px] text-neutral-600">
          Al continuar confirmas que eres mayor de 18 años y aceptas los
          términos de la plataforma.
        </p>
      </div>
    </div>
  )
}

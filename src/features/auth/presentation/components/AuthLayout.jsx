import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-neutral-100">
            CreatorHub
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-100">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-6">
          {children}
        </div>
        {footer ? (
          <div className="mt-4 text-center text-sm text-neutral-400">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Sparkles } from 'lucide-react'

export function BrandMark({ className }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_-8px_rgba(225,29,99,0.6)]',
        className,
      )}
    >
      <Sparkles className="h-4.5 w-4.5" />
      <span className="absolute inset-0 rounded-xl bg-brand-gradient opacity-40 blur-md" />
    </span>
  )
}

export function BrandLogo({ to = '/', className, textClassName }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <BrandMark />
      <span
        className={cn(
          'font-display text-lg font-bold tracking-tight text-neutral-100',
          textClassName,
        )}
      >
        Creator
        <span className="text-gradient">Hub</span>
      </span>
    </Link>
  )
}

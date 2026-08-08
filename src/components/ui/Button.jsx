import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-brand-gradient text-primary-foreground shadow-[0_8px_24px_-10px_rgba(225,29,99,0.55)] hover:shadow-[0_14px_34px_-10px_rgba(225,29,99,0.65)] hover:brightness-110',
  secondary: 'bg-surface-3 text-neutral-100 hover:bg-surface-4',
  outline:
    'border border-line text-neutral-100 hover:border-neutral-500/60 hover:bg-surface-2',
  ghost: 'text-neutral-300 hover:bg-surface-2 hover:text-neutral-100',
  danger: 'bg-red-600 text-white shadow-[0_8px_20px_-10px_rgba(239,68,68,0.5)] hover:bg-red-500',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-7 text-base',
  icon: 'h-10 w-10',
}

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', loading = false, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    />
  )
})

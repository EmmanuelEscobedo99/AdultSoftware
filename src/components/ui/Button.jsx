import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-surface-3 text-neutral-100 hover:bg-line',
  outline: 'border border-line text-neutral-100 hover:bg-surface-2',
  ghost: 'text-neutral-300 hover:bg-surface-2 hover:text-neutral-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    />
  )
})

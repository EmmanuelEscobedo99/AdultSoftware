import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export const Input = forwardRef(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        error && 'border-red-500',
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        error && 'border-red-500',
        className,
      )}
      {...props}
    />
  )
})

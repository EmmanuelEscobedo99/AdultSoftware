import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const baseField =
  'w-full rounded-xl border bg-surface-2/70 px-3 text-sm text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-neutral-500 transition-colors focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/25'

export const Input = forwardRef(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        baseField,
        'h-10',
        error ? 'border-red-500' : 'border-line',
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
        baseField,
        'py-2',
        error ? 'border-red-500' : 'border-line',
        className,
      )}
      {...props}
    />
  )
})

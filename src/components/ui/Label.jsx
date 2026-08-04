import { cn } from '../../lib/cn'

export function Label({ className, ...props }) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-neutral-300', className)}
      {...props}
    />
  )
}

export function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-400">{message}</p>
}

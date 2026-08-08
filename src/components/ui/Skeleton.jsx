import { cn } from '../../lib/cn'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-surface-3', className)}
      {...props}
    />
  )
}

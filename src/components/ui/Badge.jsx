import { cn } from '../../lib/cn'

const tones = {
  default: 'bg-surface-3 text-neutral-200',
  success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 ring-red-500/20',
  info: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
}

export function Badge({ className, tone = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

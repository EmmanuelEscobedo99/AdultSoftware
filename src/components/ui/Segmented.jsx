import { cn } from '@/lib/cn'

export function Segmented({ options, error, className, ...inputProps }) {
  return (
    <div className={cn('grid gap-2', className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all has-checked:border-transparent has-checked:bg-brand-gradient has-checked:text-white has-checked:shadow-[0_6px_18px_-6px_rgba(225,29,99,0.6)]',
            error
              ? 'border-red-500'
              : 'border-line bg-surface-3 text-neutral-300 hover:border-neutral-500/50',
          )}
        >
          <input
            type="radio"
            value={option.value}
            className="sr-only"
            {...inputProps}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

import { cn } from '@/lib/utils'

// Extracted from ProductDetailPage: a labelled row of selectable pills used for
// every value-add option on both frames and prints.
export function OptionPillGroup({
  label,
  items,
  value,
  onChange,
}: {
  label: string
  items: { id: string; name: string }[]
  value: string | null
  onChange: (id: string) => void
}) {
  if (!items.length) return null
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={selected}
              className={cn(
                'rounded-full px-4 py-1 text-sm font-medium transition',
                selected
                  ? 'bg-brand-gold text-white'
                  : 'bg-black/[0.04] text-foreground/80 hover:bg-black/[0.07]',
              )}
            >
              {item.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}


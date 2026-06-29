import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number // 1-based
  pageCount: number
  onPage: (page: number) => void
  className?: string
}

function pageList(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < pageCount - 1) out.push('…')
  out.push(pageCount)
  return out
}

export function Pagination({ page, pageCount, onPage, className }: Props) {
  if (pageCount <= 1) return null
  const btn =
    'flex h-9 min-w-9 items-center justify-center rounded-lg border border-black/10 px-3 text-sm font-medium transition disabled:opacity-40'
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        className={btn}
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageList(page, pageCount).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1.5 text-sm text-foreground/40">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={cn(
              btn,
              'tabular-nums',
              p === page
                ? 'border-brand-navy bg-brand-navy text-white'
                : 'text-foreground/70 hover:bg-black/[0.04]',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={btn}
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

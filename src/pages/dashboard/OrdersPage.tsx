import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Loader2, Package } from 'lucide-react'
import { ordersApi, type Order, type OrderStatus, type PageMeta } from '@/api/orders.api'
import { formatOMR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'

const PAGE_SIZE = 6

const STATUS_CLS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation('dashboard')
  const key = STATUS_CLS[status] ? status : 'pending'
  return (
    <span className={cn('inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', STATUS_CLS[key])}>
      {t(`orders.status.${key}`)}
    </span>
  )
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function OrdersPage() {
  const { t } = useTranslation('dashboard')
  const [data, setData] = useState<{ items: Order[]; meta?: PageMeta } | null>(null)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    ordersApi
      .mine({ page, limit: PAGE_SIZE })
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true))
    return () => { alive = false }
  }, [page])

  if (data === null && !error) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-black/[0.07] bg-white py-24">
        <Loader2 className="h-5 w-5 animate-spin text-brand-navy/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white py-16 text-center text-sm text-foreground/60">
        {t('orders.loadError')}
      </div>
    )
  }

  const total = data?.meta?.total ?? 0
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] bg-white py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
          <Package className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-brand-navy">{t('orders.empty.title')}</p>
        <p className="mt-1 text-sm text-foreground/55">{t('orders.empty.subtitle')}</p>
        <Link to="/products" className="mt-5 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          {t('orders.empty.browseFrames')}
        </Link>
      </div>
    )
  }

  const paged = data?.items ?? []
  const pageCount = data?.meta?.pageCount ?? 1
  const current = data?.meta?.page ?? page

  return (
    <div className="space-y-4">
      {paged.map((o) => (
        <div key={o.id} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-brand-navy">{o.orderNumber}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-0.5 text-[12px] text-foreground/50">{t('orders.placed', { date: fmtDate(o.createdAt) })}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-foreground/45">{t('orders.total')}</p>
              <p className="text-lg font-bold tabular-nums text-brand-navy">{formatOMR(o.total)}</p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-black/[0.06] border-t border-black/[0.06]">
            {o.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt={it.name} className="h-12 w-12 shrink-0 rounded-lg border border-black/10 object-contain p-1" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/[0.03]">
                    <Package className="h-4 w-4 text-foreground/30" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-navy">{it.name}</p>
                  <p className="truncate text-[12px] text-foreground/50">
                    {t('orders.dimensions', { width: it.widthCm, height: it.heightCm })}
                    {it.matSizeName ? ` · ${t('orders.matLabel', { name: it.matSizeName })}` : ''}
                    {it.mdfName ? ` · ${t('orders.mdfLabel', { name: it.mdfName })}` : ''}
                    {` · ${t('orders.qtyLabel', { qty: it.qty })}`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-navy">
                  {formatOMR(it.pricePerItem * it.qty)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Pagination page={current} pageCount={pageCount} onPage={setPage} className="pt-2" />
    </div>
  )
}

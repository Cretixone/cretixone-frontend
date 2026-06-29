import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Package } from 'lucide-react'
import { ordersApi, type Order, type OrderStatus } from '@/api/orders.api'
import { formatOMR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'

const PAGE_SIZE = 6

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Processing', cls: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Shipped', cls: 'bg-violet-100 text-violet-700' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS[status] ?? STATUS.pending
  return (
    <span className={cn('inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', m.cls)}>
      {m.label}
    </span>
  )
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    ordersApi
      .mine()
      .then((data) => alive && setOrders(data))
      .catch(() => alive && setError(true))
    return () => { alive = false }
  }, [])

  if (orders === null && !error) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-black/[0.07] bg-white py-24">
        <Loader2 className="h-5 w-5 animate-spin text-brand-navy/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white py-16 text-center text-sm text-foreground/60">
        Couldn't load your orders. Please refresh.
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] bg-white py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
          <Package className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-brand-navy">No orders yet</p>
        <p className="mt-1 text-sm text-foreground/55">When you place an order it will show up here.</p>
        <Link to="/products" className="mt-5 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          Browse frames
        </Link>
      </div>
    )
  }

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const paged = orders.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

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
              <p className="mt-0.5 text-[12px] text-foreground/50">Placed {fmtDate(o.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-foreground/45">Total</p>
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
                    {it.widthCm}×{it.heightCm} cm
                    {it.matSizeName ? ` · Mat: ${it.matSizeName}` : ''}
                    {it.mdfName ? ` · MDF: ${it.mdfName}` : ''}
                    {` · Qty ${it.qty}`}
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

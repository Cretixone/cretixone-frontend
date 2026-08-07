import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Download, Home, Loader2 } from 'lucide-react'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { ordersApi, type Order } from '@/api/orders.api'
import { formatOMR } from '@/lib/format'
import { getCountryName } from '@/lib/countries'
import { downloadInvoice } from '@/lib/invoice'

/** Joins the order's address fields into one flowing line, e.g.
 * "Building Number 2403, Al Qurum Street, Apt 169, Al Batinah North, Rustaq". */
function formatAddress(order: Order): string {
  return [
    order.houseNumber ? `Building Number ${order.houseNumber}` : null,
    order.location,
    order.address,
    order.city,
    getCountryName(order.country),
  ]
    .filter(Boolean)
    .join(', ')
}

export default function OrderCompletePage() {
  const { t } = useTranslation('cart')
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const stateOrder = (location.state as { order?: Order } | null)?.order ?? null
  const [order, setOrder] = useState<Order | null>(stateOrder)
  const [loading, setLoading] = useState(!stateOrder)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#000000'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  // The checkout page hands the freshly-created order over via router state
  // (instant). A direct load or refresh has no state, so fall back to
  // fetching it by id — the owning user is allowed to read their own order.
  useEffect(() => {
    if (stateOrder || !orderId) return
    let alive = true
    ordersApi
      .getById(orderId)
      .then((o) => alive && setOrder(o))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [orderId, stateOrder])

  const handleDownload = async () => {
    if (!order || downloading) return
    setDownloading(true)
    try {
      await downloadInvoice(order)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1200px] px-5 pt-28 pb-20 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {/* Breadcrumb */}
        <nav
          aria-label={t('breadcrumb.label')}
          className="flex items-center gap-2 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/cart" className="hover:text-brand-navy">{t('cartPage.breadcrumb')}</Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/checkout" className="hover:text-brand-navy">{t('checkoutPage.breadcrumbCheckout')}</Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <span className="text-foreground/70">{t('orderComplete.breadcrumb')}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {t('orderComplete.title')}
        </h1>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
          </div>
        ) : !order || notFound ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] py-20 text-center">
            <p className="text-base font-medium text-brand-navy">{t('orderComplete.notFound')}</p>
            <Button variant="gold" onClick={() => navigate('/dashboard/orders')} className="mt-5">
              {t('orderComplete.viewOrders')}
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-foreground/70">{t('orderComplete.cashOnDelivery')}</p>

            <div className="mt-6 border-t border-black/[0.08]" />

            <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
              {/* Order details */}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-brand-navy">{t('orderComplete.orderDetails')}</h2>

                <div className="mt-4">
                  <div className="flex items-center justify-between border-b border-black/[0.08] pb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                    <span>{t('orderComplete.table.product')}</span>
                    <span>{t('orderComplete.table.total')}</span>
                  </div>

                  <div className="divide-y divide-black/[0.06]">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-navy">{item.name}</p>
                          {item.subtitle && (
                            <p className="mt-0.5 text-xs text-foreground/50">{item.subtitle}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-foreground/50">
                            <span>
                              {t('orderComplete.table.finishedSize', {
                                w: item.widthCm.toFixed(1),
                                h: item.heightCm.toFixed(1),
                              })}
                            </span>
                            <span>
                              {t('orderComplete.table.imageSize', {
                                w: item.widthCm.toFixed(1),
                                h: item.heightCm.toFixed(1),
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-navy">
                          {formatOMR(item.pricePerItem * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 border-t border-black/[0.08] pt-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{t('orderComplete.table.shipping')}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="text-xs text-foreground/50">{t('cartPage.summary.shipping')}</span>
                        <span className="font-semibold tabular-nums text-brand-navy">{formatOMR(order.shipping)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{t('orderComplete.table.subtotal')}</span>
                      <span className="font-semibold tabular-nums text-brand-navy">{formatOMR(order.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{t('orderComplete.table.paymentMethod')}</span>
                      <span className="text-xs text-foreground/50">{t('orderComplete.table.cashOnDelivery')}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-black/[0.08] pt-2.5">
                      <span className="text-base font-semibold text-brand-navy">{t('orderComplete.table.totalPayment')}</span>
                      <span className="text-lg font-bold tabular-nums text-brand-navy">{formatOMR(order.total)}</span>
                    </div>
                  </div>
                </div>

                {order.orderNotes && (
                  <div className="mt-6 rounded-xl bg-black/[0.03] p-4">
                    <p className="text-sm font-semibold text-brand-navy">{t('orderComplete.orderNotes')}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/60">
                      {order.orderNotes}
                    </p>
                  </div>
                )}

                <Button
                  variant="gold"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-6"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t('orderComplete.downloadInvoice')}
                </Button>
              </div>

              {/* Shipping & billing address */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[33px] bg-white p-6 shadow-[0px_0px_21.1px_rgba(0,0,0,0.09)]">
                  <h2 className="text-lg font-semibold text-brand-navy">{t('orderComplete.addressCard.title')}</h2>

                  <p className="mt-4 text-sm font-semibold text-foreground">{order.customerName}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/60">{formatAddress(order)}</p>

                  <div className="mt-4 border-t border-black/[0.08] pt-4">
                    <p className="text-xs text-foreground/50">{t('orderComplete.addressCard.deliveryType')}</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {t('orderComplete.addressCard.standardDelivery')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

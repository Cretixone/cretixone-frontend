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

/** One "Label: value" line for a chosen option. Renders nothing when the
 *  option wasn't selected, so unselected options leave no empty row behind. */
function OptionLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-1.5">
      <dt>{label}</dt>
      <dd className="text-foreground/70">{value}</dd>
    </div>
  )
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
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-foreground">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/cart" className="hover:text-foreground">{t('cartPage.breadcrumb')}</Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/checkout" className="hover:text-foreground">{t('checkoutPage.breadcrumbCheckout')}</Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <span className="text-foreground/70">{t('orderComplete.breadcrumb')}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {t('orderComplete.title')}
        </h1>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
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
            {/* Same 12-col split as the checkout page: content on 8, address
                card on 4. The intro line + rule take their own 8-wide row, so
                the rule stops at the content's right edge instead of running
                under the card, and auto-placement drops the card into row 2 —
                aligning its top edge with "Order details". */}
            <div className="mt-2 grid grid-cols-1 items-start gap-x-8 lg:grid-cols-12 lg:gap-x-10">
              <div className="lg:col-span-8">
                <p className="text-sm text-foreground/70">{t('orderComplete.cashOnDelivery')}</p>
                <div className="mt-6 border-t border-black/[0.08]" />
              </div>

              {/* Order details */}
              <div className="mt-8 min-w-0 lg:col-span-8">
                <h2 className="text-lg font-semibold text-foreground">{t('orderComplete.orderDetails')}</h2>

                {/* One `divide-y` list covers the header, the line items and
                    every total, so each row is separated by a single rule and
                    there's no trailing rule under "Total payment" — matching
                    the design. */}
                <div className="mt-5 divide-y divide-black/[0.08] border-b border-black/[0.08] text-[15px]">
                  <div className="flex items-center justify-between pb-3 text-foreground/70">
                    <span>{t('orderComplete.table.product')}</span>
                    <span>{t('orderComplete.table.total')}</span>
                  </div>

                  {/* Rows wrap on phones: name + price share the first line and
                      the size drops onto its own line below, rather than the
                      size being hidden outright. Three side-by-side tracks from
                      sm up (product / size / price). */}
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-5 sm:flex-nowrap sm:gap-x-6"
                    >
                      <div className="order-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{item.name}</p>
                          {/* Marks which catalogue the line came from. Only
                              shown for prints: frames are the default, so
                              badging every frame line would be noise. */}
                          {item.kind === 'print' && (
                            <span className="rounded-full bg-brand-navy/[0.07] px-2 py-0.5 text-[11px] font-medium text-brand-navy">
                              {t('cartPage.row.printBadge')}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="mt-1 text-[13px] text-foreground/45">{item.subtitle}</p>
                        )}

                        {/* The value-add options this line was ordered with.
                            Each is rendered only when it was actually chosen —
                            frames that don't offer glass/lamination (e.g.
                            stretched canvas) simply show nothing here. Same
                            labels as the cart row, so the two views agree. */}
                        <dl className="mt-2 space-y-0.5 text-[13px] text-foreground/50">
                          <OptionLine label={t('cartPage.row.matSize')} value={item.matSizeName} />
                          <OptionLine label={t('cartPage.row.matColor')} value={item.matColorName} />
                          <OptionLine label={t('cartPage.row.paperType')} value={item.paperTypeName} />
                          <OptionLine label={t('cartPage.row.mdfType')} value={item.mdfName} />
                          <OptionLine label={t('cartPage.row.canvasMaterial')} value={item.canvasMaterialName} />
                          <OptionLine label={t('cartPage.row.lamination')} value={item.laminationName} />
                          <OptionLine label={t('cartPage.row.canvasEdge')} value={item.canvasEdgeName} />
                          <OptionLine label={t('cartPage.row.glassType')} value={item.glassTypeName} />
                        </dl>
                      </div>

                      {/* Full width on its own line on phones; from sm up it
                          claims the middle track (`flex-1`) with the label/value
                          pair centred in it.
                          Only the finished size is shown — an order line stores
                          one size pair (widthCm/heightCm), so an "Image Size"
                          row would just repeat these exact numbers. Add it back
                          once artwork dimensions are actually tracked. */}
                      {/* Gifts carry no dimensions — omit rather than print 0.0 × 0.0. */}
                      {item.widthCm > 0 && item.heightCm > 0 && (
                        <div className="order-3 flex w-full items-baseline gap-x-6 text-[13px] text-foreground/60 sm:order-2 sm:w-auto sm:flex-1 sm:justify-center">
                          <span>{t('orderComplete.table.finishedSizeLabel')}</span>
                          <span>
                            {t('orderComplete.table.finishedSizeValue', {
                              w: item.widthCm.toFixed(1),
                              h: item.heightCm.toFixed(1),
                            })}
                          </span>
                        </div>
                      )}

                      <p className="order-2 shrink-0 font-semibold tabular-nums text-foreground sm:order-3">
                        {formatOMR(item.pricePerItem * item.qty)}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between py-4">
                    <span className="font-semibold text-foreground">{t('orderComplete.table.shipping')}</span>
                    <span className="flex items-baseline gap-3">
                      <span className="text-[13px] italic text-foreground/45">{t('cartPage.summary.shipping')}</span>
                      <span className="font-semibold tabular-nums text-foreground">{formatOMR(order.shipping)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <span className="font-semibold text-foreground">{t('orderComplete.table.subtotal')}</span>
                    <span className="font-semibold tabular-nums text-foreground">{formatOMR(order.total)}</span>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <span className="font-semibold text-foreground">{t('orderComplete.table.paymentMethod')}</span>
                    <span className="text-[13px] italic text-foreground/45">{t('orderComplete.table.cashOnDelivery')}</span>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <span className="font-semibold text-foreground">{t('orderComplete.table.totalPayment')}</span>
                    <span className="font-semibold tabular-nums text-foreground">{formatOMR(order.total)}</span>
                  </div>
                </div>

                {order.orderNotes && (
                  <div className="font-sans mt-8 rounded-2xl bg-[#F8F8F8] p-5">
                    <p className="font-semibold text-foreground">{t('orderComplete.orderNotes')}</p>
                    {/* break-words so a long unbroken string in free-text notes
                        can't push the layout wider than the viewport. */}
                    <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/60">
                      {order.orderNotes}
                    </p>
                  </div>
                )}

                <Button
                  variant="gold"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-8 font-sans"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t('orderComplete.downloadInvoice')}
                </Button>
              </div>

              {/* Shipping & billing address */}
              {/* mt-8 only while stacked (below lg) so the card isn't flush
                  against the order table above it. */}
              <div className="mt-8 lg:col-span-4 lg:mt-0 lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[33px] bg-white p-6 shadow-[0px_0px_21.1px_rgba(0,0,0,0.09)]">
                  {/* Manrope on the card heading, matching the Purchase
                      Summary card on cart/checkout. */}
                  <h2 className="font-manrope text-lg font-medium mb-6">{t('orderComplete.addressCard.title')}</h2>

                  <p className="mt-4 break-words font-manrope text-sm font-semibold text-black">{order.customerName}</p>
                  <p className="mt-1 break-words font-sans text-sm font-normal leading-relaxed text-foreground/80">{formatAddress(order)}</p>

                  <div className=" border-black/[0.08] pt-4">
                    <p className="text-[14px] font-manrope font-semibold text-foreground">{t('orderComplete.addressCard.deliveryType')}</p>
                    <p className="mt-0.5 text-[12px] font-normal font-sans text-foreground/80">
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

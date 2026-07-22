import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Home, Loader2, Minus, Plus, Trash2, X } from 'lucide-react'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  useCartStore,
  cartSubtotal,
  cartCount,
  SHIPPING_OMR,
  type CartItem,
} from '@/store/cartStore'
import { formatOMR } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useAuthUiStore } from '@/store/authUiStore'
import { ordersApi, type CreateOrderPayload } from '@/api/orders.api'
import { OrderSuccess } from '@/components/OrderSuccess'
import { PhoneField } from '@/components/auth/PhoneField'

export default function CartPage() {
  const { t } = useTranslation('cart')
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const openAuth = useAuthUiStore((s) => s.openAuth)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null)

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

  const subtotal = cartSubtotal(items)
  const shipping = items.length ? SHIPPING_OMR : 0
  const total = subtotal + shipping
  const count = cartCount(items)

  // Checkout is gated: a logged-out user is sent to the auth dialog first
  // (returning to /cart after login); a logged-in user opens the details modal.
  const onCheckoutClick = () => {
    if (!isAuthenticated) {
      openAuth('login', '/cart')
      return
    }
    setCheckoutOpen(true)
  }

  // Creates the order on the backend, then shows the success animation.
  const placeOrder = async (details: {
    fullName: string
    email: string
    phone: string
    address: string
    zip: string
  }) => {
    const payload: CreateOrderPayload = {
      items: items.map((i) => ({
        frameId: i.frameId,
        name: i.name,
        subtitle: i.subtitle,
        thumbnail: i.thumbnail,
        widthCm: i.widthCm,
        heightCm: i.heightCm,
        pricePerItem: i.pricePerItem,
        qty: i.qty,
        matSizeName: i.matSizeName ?? null,
        matColorName: i.matColorName ?? null,
        mdfName: i.mdfName ?? null,
      })),
      customerName: details.fullName,
      customerEmail: details.email,
      customerPhone: details.phone || undefined,
      address: details.address,
      zipcode: details.zip,
      shipping,
      currency: 'OMR',
    }
    const order = await ordersApi.create(payload)
    clear()
    setCheckoutOpen(false)
    setSuccess({ orderNumber: order.orderNumber, total: order.total })
    window.scrollTo(0, 0)
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
          <span className="text-foreground/70">{t('cartPage.breadcrumb')}</span>
        </nav>

        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
            {t('cartPage.title')}
          </h1>
          <span className="pb-1 text-sm text-foreground/55">
            ({count} {count === 1 ? t('cartPage.productSingular') : t('cartPage.productPlural')})
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyCart onBrowse={() => navigate('/products')} />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
            {/* Items + note + actions */}
            <div className="min-w-0">
              <div className="divide-y divide-black/[0.08]">
                {items.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onQty={(q) => setQty(item.id, q)}
                    onEdit={() => navigate(`/editor?frame=${item.frameId}&edit=${item.id}`)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>

              {/* Note */}
              <div className="mt-8 rounded-xl border border-brand-gold/30 bg-brand-gold/[0.06] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
                  {t('cartPage.note.title')}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/60">
                  {t('cartPage.note.body')}
                </p>
              </div>

              {/* Bottom actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 border-brand-gold/50 bg-transparent text-brand-gold hover:bg-brand-gold/10"
                >
                  {t('cartPage.actions.backHome')}
                </Button>
                <Button
                  variant="gold"
                  onClick={() => navigate('/products')}
                  className="flex-1"
                >
                  {t('cartPage.actions.createProduct')}
                </Button>
              </div>
            </div>

            {/* Purchase summary */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-black/10 p-6 shadow-[0_20px_50px_-30px_rgba(0,35,101,0.3)]">
                <h2 className="text-lg font-semibold text-brand-navy">{t('cartPage.summary.title')}</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <Row label={t('cartPage.summary.subtotal')} value={formatOMR(subtotal)} />
                  <Row label={t('cartPage.summary.shipping')} value={formatOMR(shipping)} />
                </div>

                <div className="my-4 h-px bg-black/[0.08]" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t('cartPage.summary.total')}</span>
                  <span className="text-lg font-bold tabular-nums text-brand-navy">
                    {formatOMR(total)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                  {t('cartPage.summary.taxLine1')}
                  <br />
                  {t('cartPage.summary.taxLine2')}
                </p>

                <Button
                  variant="gold"
                  onClick={onCheckoutClick}
                  className="mt-5 w-full"
                >
                  {isAuthenticated ? t('cartPage.summary.goToCheckout') : t('cartPage.summary.loginToCheckout')}
                </Button>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-foreground/45">
                {t('cartPage.summary.pricingPolicy')}
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {checkoutOpen && (
        <CheckoutModal
          onClose={() => setCheckoutOpen(false)}
          onSubmit={placeOrder}
          prefill={{
            fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            address: user?.address ?? '',
            zip: user?.zipcode ?? '',
          }}
        />
      )}

      {success && (
        <OrderSuccess
          orderNumber={success.orderNumber}
          total={success.total}
          onViewOrders={() => navigate('/dashboard/orders')}
          onContinue={() => navigate('/products')}
        />
      )}
    </div>
  )
}

// ── Cart line ────────────────────────────────────────────────────────────────
function CartRow({
  item,
  onQty,
  onEdit,
  onRemove,
}: {
  item: CartItem
  onQty: (q: number) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation('cart')
  const lineTotal = item.pricePerItem * item.qty
  return (
    <div className="flex gap-4 py-6 first:pt-0">
      {/* Thumbnail */}
      <div className="h-[110px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="h-full w-full object-contain p-1.5"
            draggable={false}
          />
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-brand-navy">{item.name}</h3>
        <p className="mt-0.5 text-[12px] text-foreground/50">{item.subtitle}</p>
        <dl className="mt-2.5 space-y-1 text-[12px] text-foreground/70">
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-foreground/80">{t('cartPage.row.finishedSize')}</dt>
            <dd>
              {t('cartPage.row.dimensions', { w: item.widthCm.toFixed(1), h: item.heightCm.toFixed(1) })}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-foreground/80">{t('cartPage.row.frameSku')}</dt>
            <dd>CF-{Math.abs(item.frameId)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onEdit}
          className="mt-3 rounded-lg border border-brand-navy/30 px-4 py-1.5 text-[13px] font-medium text-brand-navy transition hover:bg-brand-navy/5"
        >
          {t('cartPage.row.edit')}
        </button>
      </div>

      {/* Price + qty + remove */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-right">
          <p className="text-[15px] font-bold tabular-nums text-brand-navy">
            {formatOMR(lineTotal)}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground/50">
            {t('cartPage.row.perItem', { price: formatOMR(item.pricePerItem) })}
          </p>
        </div>

        <div className="my-3 flex items-center gap-3 rounded-full border border-black/15 px-2 py-1">
          <button
            type="button"
            aria-label={item.qty <= 1 ? t('cartPage.row.removeItem') : t('cartPage.row.decreaseQty')}
            onClick={() => (item.qty <= 1 ? onRemove() : onQty(item.qty - 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/70 hover:bg-black/5"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-5 text-center text-sm font-medium tabular-nums">
            {item.qty}
          </span>
          <button
            type="button"
            aria-label={t('cartPage.row.increaseQty')}
            onClick={() => onQty(item.qty + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/70 hover:bg-black/5"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          aria-label={t('cartPage.row.removeItem')}
          onClick={onRemove}
          className="text-foreground/40 transition hover:text-red-500"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/60">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  const { t } = useTranslation('cart')
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] py-20 text-center">
      <p className="text-base font-medium text-brand-navy">{t('cartPage.empty.title')}</p>
      <p className="mt-1 text-sm text-foreground/55">
        {t('cartPage.empty.subtitle')}
      </p>
      <Button variant="gold" onClick={onBrowse} className="mt-5">
        {t('cartPage.empty.browse')}
      </Button>
    </div>
  )
}

// ── Checkout details popup ───────────────────────────────────────────────────
interface CheckoutDetails {
  fullName: string
  email: string
  phone: string
  address: string
  zip: string
}

function CheckoutModal({
  onClose,
  onSubmit,
  prefill,
}: {
  onClose: () => void
  onSubmit: (details: CheckoutDetails) => Promise<void>
  prefill: CheckoutDetails
}) {
  const { t } = useTranslation('cart')
  const [fullName, setFullName] = useState(prefill.fullName)
  const [email, setEmail] = useState(prefill.email)
  const [phone, setPhone] = useState(prefill.phone)
  const [address, setAddress] = useState(prefill.address)
  const [zip, setZip] = useState(prefill.zip)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const valid = fullName.trim() && emailOk && address.trim() && zip.trim()

  const inputCls =
    'h-10 w-full rounded-lg border border-black/15 px-3 text-sm text-foreground focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ fullName, email, phone, address, zip })
    } catch {
      // Error toast is shown globally by the axios interceptor; keep the
      // modal open so the user can retry.
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          aria-label={t('checkoutModal.close')}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('checkoutModal.dialogLabel')}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">{t('checkoutModal.title')}</h2>
              <p className="mt-0.5 text-[13px] text-foreground/55">
                {t('checkoutModal.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('checkoutModal.close')}
              className="rounded-md p-1 text-foreground/50 hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
            <Field label={t('checkoutModal.fields.fullName')} required error={touched && !fullName.trim() ? t('checkoutModal.errors.required') : ''}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
                placeholder={t('checkoutModal.fields.fullNamePlaceholder')}
              />
            </Field>
            <Field
              label={t('checkoutModal.fields.email')}
              required
              error={touched && !emailOk ? t('checkoutModal.errors.invalidEmail') : ''}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder={t('checkoutModal.fields.emailPlaceholder')}
              />
            </Field>
            <Field label={t('checkoutModal.fields.phone')} optional>
              <PhoneField
                value={phone}
                onChange={(v) => setPhone(v ?? '')}
                placeholder={t('checkoutModal.fields.phonePlaceholder')}
              />
            </Field>
            <Field label={t('checkoutModal.fields.address')} required error={touched && !address.trim() ? t('checkoutModal.errors.required') : ''}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
                placeholder={t('checkoutModal.fields.addressPlaceholder')}
              />
            </Field>
            <Field label={t('checkoutModal.fields.zip')} required error={touched && !zip.trim() ? t('checkoutModal.errors.required') : ''}>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={inputCls}
                placeholder={t('checkoutModal.fields.zipPlaceholder')}
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="flex-1 border-black/15 bg-transparent text-foreground hover:bg-black/5">
                {t('checkoutModal.cancel')}
              </Button>
              <Button type="submit" variant="navy" disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('checkoutModal.placeOrder')}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
        style={{
          top: '-186px',
          width: 'min(1560px, 140vw)',
          height: '270px',
          background: 'rgba(65, 105, 226, 0.2)',
          filter: 'blur(130px)',
        }}
      />
    </>
  )
}

function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  const { t } = useTranslation('cart')
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-foreground/80">
        {label}
        {optional && <span className="font-normal text-foreground/40">{' '}{t('checkoutModal.fields.optional')}</span>}
      </span>
      <div className="mt-1">{children}</div>
      {required && error && <span className="mt-1 block text-[11px] text-red-500">{error}</span>}
    </label>
  )
}

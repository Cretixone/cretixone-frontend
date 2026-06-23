import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Home, Minus, Plus, Trash2, X } from 'lucide-react'
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

export default function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [placed, setPlaced] = useState(false)

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

  const onPlaceOrder = () => {
    // Cart is client-side for now; DB persistence lands once guest-vs-login
    // is settled. Confirm + clear so the flow is coherent.
    clear()
    setCheckoutOpen(false)
    setPlaced(true)
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
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label="Home" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <span className="text-foreground/70">Cart</span>
        </nav>

        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
            Cart
          </h1>
          <span className="pb-1 text-sm text-foreground/55">
            ({count} {count === 1 ? 'Product' : 'Products'})
          </span>
        </div>

        {placed ? (
          <OrderPlaced onContinue={() => navigate('/products')} />
        ) : items.length === 0 ? (
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
                  Note for image optimization
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/60">
                  Image optimization is activated for one or more of your photos. If you
                  did not intend to utilize this feature, you can deactivate it from the
                  editor.
                </p>
              </div>

              {/* Bottom actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 border-brand-gold/50 bg-transparent text-brand-gold hover:bg-brand-gold/10"
                >
                  Back to home page
                </Button>
                <Button
                  variant="gold"
                  onClick={() => navigate('/products')}
                  className="flex-1"
                >
                  Create a new product
                </Button>
              </div>
            </div>

            {/* Purchase summary */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-black/10 p-6 shadow-[0_20px_50px_-30px_rgba(0,35,101,0.3)]">
                <h2 className="text-lg font-semibold text-brand-navy">Purchase Summary</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <Row label="Subtotal" value={formatOMR(subtotal)} />
                  <Row label="Standard Shipping" value={formatOMR(shipping)} />
                </div>

                <div className="my-4 h-px bg-black/[0.08]" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <span className="text-lg font-bold tabular-nums text-brand-navy">
                    {formatOMR(total)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                  Sales tax not included
                  <br />
                  Sales tax may apply
                </p>

                <Button
                  variant="gold"
                  onClick={() => setCheckoutOpen(true)}
                  className="mt-5 w-full"
                >
                  Go to checkout
                </Button>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-foreground/45">
                Pricing policy: The full list price is a price at which we have offered the
                product for sale; however, we may not have sold the item at that price.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {checkoutOpen && (
        <CheckoutModal onClose={() => setCheckoutOpen(false)} onSubmit={onPlaceOrder} />
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
            <dt className="w-24 font-medium text-foreground/80">Finished Size:</dt>
            <dd>
              {item.widthCm.toFixed(1)} × {item.heightCm.toFixed(1)} cm
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-foreground/80">Frame SKU:</dt>
            <dd>CF-{Math.abs(item.frameId)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onEdit}
          className="mt-3 rounded-lg border border-brand-navy/30 px-4 py-1.5 text-[13px] font-medium text-brand-navy transition hover:bg-brand-navy/5"
        >
          Edit
        </button>
      </div>

      {/* Price + qty + remove */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-right">
          <p className="text-[15px] font-bold tabular-nums text-brand-navy">
            {formatOMR(lineTotal)}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground/50">
            {formatOMR(item.pricePerItem)} per item
          </p>
        </div>

        <div className="my-3 flex items-center gap-3 rounded-full border border-black/15 px-2 py-1">
          <button
            type="button"
            aria-label={item.qty <= 1 ? 'Remove item' : 'Decrease quantity'}
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
            aria-label="Increase quantity"
            onClick={() => onQty(item.qty + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/70 hover:bg-black/5"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Remove item"
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
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] py-20 text-center">
      <p className="text-base font-medium text-brand-navy">Your cart is empty</p>
      <p className="mt-1 text-sm text-foreground/55">
        Pick a frame and design it to add it here.
      </p>
      <Button variant="gold" onClick={onBrowse} className="mt-5">
        Browse frames
      </Button>
    </div>
  )
}

function OrderPlaced({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-black/[0.07] py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/15 text-2xl text-brand-gold">
        ✓
      </div>
      <p className="mt-4 text-lg font-semibold text-brand-navy">Thank you!</p>
      <p className="mt-1 max-w-md text-sm text-foreground/60">
        We&apos;ve received your details and will be in touch shortly to confirm your order.
      </p>
      <Button variant="gold" onClick={onContinue} className="mt-6">
        Continue shopping
      </Button>
    </div>
  )
}

// ── Checkout details popup ───────────────────────────────────────────────────
function CheckoutModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [touched, setTouched] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const valid = fullName.trim() && emailOk && address.trim() && zip.trim()

  const inputCls =
    'h-10 w-full rounded-lg border border-black/15 px-3 text-sm text-foreground focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onSubmit()
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
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checkout details"
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Checkout details</h2>
              <p className="mt-0.5 text-[13px] text-foreground/55">
                Tell us where to send your order.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-foreground/50 hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
            <Field label="Full name" required error={touched && !fullName.trim() ? 'Required' : ''}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
                placeholder="Jane Doe"
              />
            </Field>
            <Field
              label="Email address"
              required
              error={touched && !emailOk ? 'Enter a valid email' : ''}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="jane@example.com"
              />
            </Field>
            <Field label="Phone number" optional>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="+968 …"
              />
            </Field>
            <Field label="Address" required error={touched && !address.trim() ? 'Required' : ''}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
                placeholder="Street, building, area"
              />
            </Field>
            <Field label="Zip code" required error={touched && !zip.trim() ? 'Required' : ''}>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={inputCls}
                placeholder="100"
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-black/15 bg-transparent text-foreground hover:bg-black/5">
                Cancel
              </Button>
              <Button type="submit" variant="navy" className="flex-1">
                Place order
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
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-foreground/80">
        {label}
        {optional && <span className="font-normal text-foreground/40"> (optional)</span>}
      </span>
      <div className="mt-1">{children}</div>
      {required && error && <span className="mt-1 block text-[11px] text-red-500">{error}</span>}
    </label>
  )
}

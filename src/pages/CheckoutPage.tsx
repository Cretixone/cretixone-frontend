import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Home, Loader2 } from 'lucide-react'
import { isValidPhoneNumber } from 'react-phone-number-input'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhoneField } from '@/components/auth/PhoneField'
import { useCartStore, cartSubtotal, SHIPPING_OMR } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders.api'
import { formatOMR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'

const inputCls =
  'h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30'

function makeSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().trim().min(1, t('checkoutPage.errors.required')).max(200),
    email: z.string().trim().toLowerCase().min(1, t('checkoutPage.errors.required')).email(t('checkoutPage.errors.invalidEmail')),
    phone: z
      .string()
      .min(1, t('checkoutPage.errors.required'))
      .refine((v) => isValidPhoneNumber(v), t('checkoutPage.errors.invalidPhone')),
    companyName: z.string().trim().max(200).optional(),
    location: z.string().trim().min(1, t('checkoutPage.errors.required')).max(500),
    address: z.string().trim().min(1, t('checkoutPage.errors.required')).max(500),
    country: z.string().min(1, t('checkoutPage.errors.required')),
    houseNumber: z.string().trim().min(1, t('checkoutPage.errors.required')).max(50),
    city: z.string().trim().min(1, t('checkoutPage.errors.required')).max(120),
    orderNotes: z.string().trim().max(2000).optional(),
    billingSameAsShipping: z.boolean(),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

export default function CheckoutPage() {
  const { t } = useTranslation('cart')
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const user = useAuthStore((s) => s.user)

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

  // An empty cart has nothing to check out — send them back. Skipped once the
  // order is placed: clear() empties the cart while this page is still
  // mounted, and without the guard this effect would fire on that change and
  // replace the just-pushed /checkout/complete route with /cart.
  const placedRef = useRef(false)
  useEffect(() => {
    if (placedRef.current) return
    if (items.length === 0) navigate('/cart', { replace: true })
  }, [items.length, navigate])

  const subtotal = cartSubtotal(items)
  const shipping = items.length ? SHIPPING_OMR : 0
  const total = subtotal + shipping

  const schema = useMemo(() => makeSchema(t), [t])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      companyName: '',
      location: '',
      address: user?.address ?? '',
      country: '',
      houseNumber: '',
      city: '',
      orderNotes: '',
      billingSameAsShipping: true,
    },
  })
  const e = form.formState.errors

  const submit = form.handleSubmit(async (v) => {
    try {
      const order = await ordersApi.create({
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
          paperTypeName: i.paperTypeName ?? null,
          laminationName: i.laminationName ?? null,
          glassTypeName: i.glassTypeName ?? null,
        })),
        customerName: v.fullName,
        customerEmail: v.email,
        customerPhone: v.phone,
        companyName: v.companyName || undefined,
        location: v.location,
        address: v.address,
        country: v.country,
        houseNumber: v.houseNumber,
        city: v.city,
        orderNotes: v.orderNotes || undefined,
        shipping,
        currency: 'OMR',
      })
      // Mark placed BEFORE clearing so the empty-cart guard above stands down.
      placedRef.current = true
      navigate(`/checkout/complete/${order.id}`, { state: { order } })
      clear()
    } catch {
      // Error toast is shown globally by the axios interceptor; keep the
      // form filled in so the user can retry.
    }
  })

  const submitting = form.formState.isSubmitting

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
          <span className="text-foreground/70">{t('checkoutPage.breadcrumbCheckout')}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {t('checkoutPage.titleCheckout')}
        </h1>

        <div className="mt-6 border-t border-black/[0.08]" />

        <form onSubmit={submit} className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10" noValidate>
          {/* Form */}
          <div className="min-w-0 space-y-8">
            {/* Customer information */}
            <section>
              <h2 className="text-lg font-semibold text-brand-navy">{t('checkoutPage.customerInfo')}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('checkoutPage.fields.fullName')} required error={e.fullName?.message}>
                  <input className={inputCls} placeholder={t('checkoutPage.fields.fullNamePlaceholder')} {...form.register('fullName')} />
                </Field>
                <Field label={t('checkoutPage.fields.email')} required error={e.email?.message}>
                  <input type="email" className={inputCls} placeholder={t('checkoutPage.fields.emailPlaceholder')} {...form.register('email')} />
                </Field>
                <Field label={t('checkoutPage.fields.phone')} required error={e.phone?.message}>
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneField value={field.value} onChange={(v) => field.onChange(v ?? '')} invalid={!!e.phone} />
                    )}
                  />
                </Field>
                <Field label={t('checkoutPage.fields.companyName')} optional>
                  <input className={inputCls} placeholder={t('checkoutPage.fields.companyNamePlaceholder')} {...form.register('companyName')} />
                </Field>
              </div>
            </section>

            {/* Shipping address */}
            <section>
              <h2 className="text-lg font-semibold text-brand-navy">{t('checkoutPage.shippingAddress')}</h2>
              <div className="mt-4 space-y-4">
                <Field label={t('checkoutPage.fields.address')} required error={e.location?.message ?? e.address?.message}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input className={inputCls} placeholder={t('checkoutPage.fields.locationPlaceholder')} {...form.register('location')} />
                    <input className={inputCls} placeholder={t('checkoutPage.fields.addressPlaceholder')} {...form.register('address')} />
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('checkoutPage.fields.country')} required error={e.country?.message}>
                    <Controller
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={cn(inputCls, 'justify-between font-normal')}>
                            <SelectValue placeholder={t('checkoutPage.fields.countryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label={t('checkoutPage.fields.houseNumber')} required error={e.houseNumber?.message}>
                    <input className={inputCls} placeholder={t('checkoutPage.fields.houseNumberPlaceholder')} {...form.register('houseNumber')} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('checkoutPage.fields.city')} required error={e.city?.message}>
                    <input className={inputCls} placeholder={t('checkoutPage.fields.cityPlaceholder')} {...form.register('city')} />
                  </Field>
                </div>

                <Field label={t('checkoutPage.fields.orderNotes')} optional>
                  <textarea
                    rows={4}
                    className={cn(inputCls, 'h-auto resize-none py-2')}
                    placeholder={t('checkoutPage.fields.orderNotesPlaceholder')}
                    {...form.register('orderNotes')}
                  />
                </Field>
              </div>
            </section>

            {/* Billing = shipping confirmation */}
            <label className="flex items-center gap-2.5 text-sm text-foreground/70">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-black/25 text-brand-gold focus:ring-brand-gold/40"
                {...form.register('billingSameAsShipping')}
              />
              {t('checkoutPage.billingSameAsShipping')}
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cart')}
                className="min-w-[140px] border-brand-gold/50 bg-transparent text-brand-gold hover:bg-brand-gold/10"
              >
                {t('checkoutPage.backToCart')}
              </Button>
              <Button type="submit" variant="gold" disabled={submitting} className="min-w-[140px]">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('checkoutPage.placeOrder')}
              </Button>
            </div>
          </div>

          {/* Purchase summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[33px] bg-white p-6 shadow-[0px_0px_21.1px_rgba(0,0,0,0.09)]">
              <h2 className="text-lg font-semibold text-brand-navy">{t('cartPage.summary.title')}</h2>

              <div className="mt-5 space-y-3 text-sm">
                <Row label={t('cartPage.summary.subtotal')} value={formatOMR(subtotal)} />
                <Row label={t('cartPage.summary.shipping')} value={formatOMR(shipping)} />
              </div>

              <div className="my-4 h-px bg-black/[0.08]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('cartPage.summary.total')}</span>
                <span className="text-lg font-bold tabular-nums text-brand-navy">{formatOMR(total)}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-foreground/45">
                {t('cartPage.summary.taxLine1')}
                <br />
                {t('cartPage.summary.taxLine2')}
              </p>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-foreground/45">
              {t('cartPage.summary.pricingPolicy')}
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </div>
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
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="font-normal text-foreground/40"> {t('checkoutPage.optional')}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-[11px] text-red-500">{error}</span>}
    </label>
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

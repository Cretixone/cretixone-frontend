import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Home, Loader2 } from 'lucide-react'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryFields, useInquiryForm } from '@/components/InquiryForm'
import { findMirrorCategory } from '@/lib/mirror-categories'

/**
 * Custom mirrors are made to order and never priced up front, so the page's
 * calls to action collect an inquiry rather than opening the frame editor.
 *
 * Uses the same form as the print inquiry page and the product-page dialog, so
 * validation, the optional image upload and the submitted payload stay
 * identical across all three entry points.
 */
export default function MirrorInquiryPage() {
  const { t } = useTranslation('pages')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sent, setSent] = useState(false)

  // A tile on /custom-mirrors passes which mirror was clicked as ?type=.
  // Landing here without one (via the page CTAs) is a general enquiry.
  const category = findMirrorCategory(searchParams.get('type'))
  const categoryLabel = category
    ? t(`customMirrors.categories.${category.titleKey}`)
    : null
  const heroImage = category?.img ?? '/images/craft-miror.png'

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

  // Canonical product name stored on the record and shown in both emails —
  // forced to English so admin always reads the same label regardless of the
  // locale the customer browsed in. Size and price are zero: nothing has been
  // chosen yet, which is exactly what the customer is writing in about.
  const recordName = category
    ? `Custom Mirror — ${t(`customMirrors.categories.${category.titleKey}`, { lng: 'en' })}`
    : 'Custom Mirror'
  const form = useInquiryForm(
    { frameName: recordName, widthCm: 0, heightCm: 0, unitPrice: 0 },
    { onSuccess: () => setSent(true) },
  )

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        <nav
          aria-label={t('customMirrors.inquiry.breadcrumbAria')}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label={t('customMirrors.inquiry.home')} className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/custom-mirrors" className="hover:text-brand-navy">
            {t('customMirrors.inquiry.customMirrors')}
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          {/* Name the mirror the visitor picked, matching how the print
              pages put the product itself in the last crumb. */}
          <span className="min-w-0 break-words text-foreground">
            {categoryLabel ?? t('customMirrors.inquiry.current')}
          </span>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          {/* Product side */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="flex h-[380px] w-full items-center justify-center md:h-[460px]">
                <img
                  src={heroImage}
                  alt={categoryLabel ?? t('customMirrors.inquiry.title')}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-brand-navy md:text-[32px]">
              {categoryLabel ?? t('customMirrors.inquiry.title')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/70">
              {t('customMirrors.inquiry.blurb')}
            </p>
          </div>

          {/* Form side */}
          <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-7">
            {sent ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-brand-gold" strokeWidth={1.6} />
                <p className="mt-4 text-lg font-semibold text-brand-navy">
                  {t('customMirrors.inquiry.sentTitle')}
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-foreground/60">
                  {t('customMirrors.inquiry.sentText')}
                </p>
                <Button
                  variant="navy"
                  className="mt-6 rounded-lg"
                  onClick={() => navigate('/custom-mirrors')}
                >
                  {t('customMirrors.inquiry.back')}
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-brand-navy">
                  {t('customMirrors.inquiry.formTitle')}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                  {t('customMirrors.inquiry.formSubtitle')}
                </p>

                <form
                  className="mt-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void form.submit()
                  }}
                  noValidate
                >
                  <InquiryFields form={form} showImage={false} />
                  <Button
                    type="submit"
                    variant="navy"
                    size="lg"
                    disabled={!form.canSubmit}
                    className="mt-6 w-full rounded-lg"
                  >
                    {form.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {form.submitting
                      ? t('customMirrors.inquiry.submitting')
                      : t('customMirrors.inquiry.submit')}
                  </Button>
                </form>
              </>
            )}
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
      </main>

      <Footer />
    </div>
  )
}

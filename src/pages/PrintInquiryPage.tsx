import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Home, Loader2 } from 'lucide-react'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryFields, useInquiryForm } from '@/components/InquiryForm'
import { printsApi, type PrintCategory } from '@/api/prints.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { useIsRtl } from '@/store/langStore'

/**
 * Full-page inquiry form for a print category flagged "Enquiry product" in
 * admin. Shareable URL (/custom-prints/<slug>/inquiry) rather than a dialog,
 * so it survives a refresh and can be linked directly. The fields and submit
 * logic are the same ones the product-page InquiryDialog uses.
 */
export default function PrintInquiryPage() {
  const { t } = useTranslation('prints')
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const isRtl = useIsRtl()

  const [category, setCategory] = useState<PrintCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sent, setSent] = useState(false)

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

  useEffect(() => {
    if (!slug) return
    let alive = true
    setLoading(true)
    setNotFound(false)
    printsApi
      .categoryBySlug(slug)
      .then((c) => alive && setCategory(c))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  const title = category ? pickLocalized(category.name, category.nameAr, isRtl) : ''
  const blurb = category
    ? pickLocalized(category.description, category.descriptionAr, isRtl)
    : ''
  const image = category?.gallery?.[0] ?? null

  // An enquiry product has no chosen size or price yet — that is the whole
  // point of the request — so the record is stored with zeroes.
  const form = useInquiryForm(
    { frameName: category?.name ?? '', widthCm: 0, heightCm: 0, unitPrice: 0 },
    { active: !!category, onSuccess: () => setSent(true) },
  )

  if (loading) {
    return (
      <Shell>
        <div className="mt-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
        </div>
      </Shell>
    )
  }

  if (notFound || !category) {
    return (
      <Shell>
        <div className="mt-16 rounded-2xl border border-black/[0.07] py-20 text-center">
          <p className="text-base font-medium text-brand-navy">{t('category.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/custom-prints')}
            className="mt-4 text-sm font-semibold text-brand-gold hover:underline"
          >
            {t('category.backToPrints')}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {/* Breadcrumb */}
      <nav
        aria-label={t('breadcrumb.aria')}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
      >
        <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-brand-navy">
          <Home className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        <ChevronRight className="h-3 w-3 text-foreground/40" />
        <Link to="/custom-prints" className="hover:text-brand-navy">{t('breadcrumb.customPrints')}</Link>
        <ChevronRight className="h-3 w-3 text-foreground/40" />
        <span className="min-w-0 break-words text-foreground">{title}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* Product side */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <div className="flex h-[380px] w-full items-center justify-center md:h-[460px]">
              {image && (
                <img
                  src={resolveAsset(image)}
                  alt={title}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-brand-navy md:text-[32px]">
            {title}
          </h1>
          {blurb && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">
              {blurb}
            </p>
          )}
        </div>

        {/* Form side */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-7">
          {sent ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-brand-gold" strokeWidth={1.6} />
              <p className="mt-4 text-lg font-semibold text-brand-navy">
                {t('inquiryPage.sentTitle')}
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-foreground/60">
                {t('inquiryPage.sentText')}
              </p>
              <Button
                variant="navy"
                className="mt-6 rounded-lg"
                onClick={() => navigate('/custom-prints')}
              >
                {t('category.backToPrints')}
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-brand-navy">{t('inquiryPage.title')}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                {t('inquiryPage.subtitle')}
              </p>

              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  void form.submit()
                }}
                noValidate
              >
                <InquiryFields form={form} />
                <Button
                  type="submit"
                  variant="navy"
                  size="lg"
                  disabled={!form.canSubmit}
                  className="mt-6 w-full rounded-lg"
                >
                  {form.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {form.submitting ? t('inquiryPage.submitting') : t('inquiryPage.submit')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />
      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {children}
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

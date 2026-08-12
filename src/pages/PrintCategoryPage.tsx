import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Home, ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Pagination } from '@/components/ui/pagination'
import { printsApi, type CustomPrint, type PrintCategory } from '@/api/prints.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { formatOMR, formatOMRRate } from '@/lib/format'
import { useLangStore } from '@/store/langStore'

const PAGE_SIZE = 12

/**
 * Products inside one print category. Mirrors the frames listing (/products)
 * layout so the two catalogues feel like one store.
 */
export default function PrintCategoryPage() {
  const { t } = useTranslation('prints')
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const isRtl = useLangStore((s) => s.isRtl)

  const [category, setCategory] = useState<PrintCategory | null>(null)
  const [items, setItems] = useState<CustomPrint[]>([])
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
    Promise.all([
      printsApi.categoryBySlug(slug),
      printsApi.list({ category: slug, page, limit: PAGE_SIZE }),
    ])
      .then(([cat, res]) => {
        if (!alive) return
        setCategory(cat)
        setItems(res.items)
        setPageCount(res.meta?.pageCount ?? 1)
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug, page])

  const title = category ? pickLocalized(category.name, category.nameAr, isRtl) : ''
  const blurb = category ? pickLocalized(category.description, category.descriptionAr, isRtl) : ''

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        <nav
          aria-label={t('breadcrumb.aria')}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <Link to="/custom-prints" className="hover:text-brand-navy">{t('breadcrumb.customPrints')}</Link>
          {title && (
            <>
              <ChevronRight className="h-3 w-3 text-foreground/40" />
              {/* Current page — same emphasis as the product breadcrumbs. */}
              <span className="min-w-0 break-words text-foreground">{title}</span>
            </>
          )}
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {title || t('category.fallbackTitle')}
        </h1>
        {blurb && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/70">{blurb}</p>}

        {loading ? (
          <div className="mt-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
          </div>
        ) : notFound ? (
          <div className="mt-12 rounded-2xl border border-black/[0.07] py-20 text-center">
            <p className="text-base font-medium text-brand-navy">{t('category.notFound')}</p>
            <button
              type="button"
              onClick={() => navigate('/custom-prints')}
              className="mt-4 text-sm font-semibold text-brand-gold hover:underline"
            >
              {t('category.backToPrints')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-black/[0.12] py-20 text-center text-sm text-foreground/50">
            {t('category.empty')}
          </div>
        ) : (
          <>
            {/* Five across on large screens, stepping down on smaller ones. */}
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((p) => (
                <PrintCard key={p.id} print={p} />
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination page={page} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

function PrintCard({ print }: { print: CustomPrint }) {
  const { t } = useTranslation('prints')
  const navigate = useNavigate()
  const isRtl = useLangStore((s) => s.isRtl)
  // Gallery-only products: the first image is the card thumbnail.
  const img = print.gallery?.[0]

  // "From" price uses the smallest allowed size so the figure is real rather
  // than a 1 cm minimum. Falls back to the per-cm rate when no range is set.
  const from = print.sizeFrom > 0
    ? print.pricePerCm * (print.sizeFrom + print.sizeFrom) * 2 + print.pricePerCm * (print.wasteValue ?? 0)
    : 0

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={() => navigate(`/custom-prints/product/${print.hashedId}`)}
      className="group cursor-pointer rounded-2xl border-[0.5px] border-transparent p-3 transition-shadow hover:border-[#F1F1F1] hover:bg-white hover:shadow-[0_18px_40px_-18px_rgba(10,31,77,0.18)]"
    >
      <div className="flex h-[203px] items-center justify-center overflow-hidden rounded-xl bg-black/[0.03]">
        {img ? (
          <img
            src={resolveAsset(img)}
            alt={pickLocalized(print.name, print.nameAr, isRtl) ?? print.name}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-foreground/20" />
        )}
      </div>

      <p className="mt-3 line-clamp-1 text-sm font-medium text-brand-navy">
        {pickLocalized(print.name, print.nameAr, isRtl)}
      </p>
      <p className="mt-1 text-[13px] tabular-nums text-foreground/60">
        {print.pricePerCm <= 0
          ? '—'
          : from > 0
            ? t('card.from', { price: formatOMR(from) })
            : `${formatOMRRate(print.pricePerCm)} / cm`}
      </p>
    </motion.div>
  )
}

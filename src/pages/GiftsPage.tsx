import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Home, ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { BannerStrip } from '@/components/product/BannerStrip'
import { Pagination } from '@/components/ui/pagination'
import { giftsApi, type Gift } from '@/api/gifts.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { formatOMR } from '@/lib/format'
import { useIsRtl } from '@/store/langStore'

const PAGE_SIZE = 12

/**
 * Gifts listing. Same grid as the frames catalogue but with no filter rail —
 * gifts are uncategorised, so there is nothing to filter on.
 */
export default function GiftsPage() {
  const { t } = useTranslation('gifts')
  const isRtl = useIsRtl()

  // URL-backed (not useState) so navigating to a gift and back preserves the
  // page you were on — a plain useState resets to 1 on remount, which is
  // exactly what happens when the browser's back button (or GiftDetailPage's
  // own back link) returns here, since that's a fresh mount of this page.
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1
  const setPage = (next: number) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next <= 1) params.delete('page')
        else params.set('page', String(next))
        return params
      },
      { replace: true },
    )

  const [items, setItems] = useState<Gift[]>([])
  const [pageCount, setPageCount] = useState(1)
  const [loading, setLoading] = useState(true)

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
    let alive = true
    setLoading(true)
    giftsApi
      .list({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (!alive) return
        setItems(res.items)
        setPageCount(res.meta?.pageCount ?? 1)
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [page])

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pb-4 pt-20 md:px-10 md:pt-24">
        <BannerStrip />

        <nav
          aria-label={t('breadcrumb.aria')}
          className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
        >
          <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-foreground/40" />
          <span className="min-w-0 break-words text-foreground">{t('title')}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/70">{t('blurb')}</p>

        {loading ? (
          <div className="mt-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-black/[0.12] py-20 text-center text-sm text-foreground/50">
            {t('empty')}
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((g) => (
                <GiftCard key={g.id} gift={g} isRtl={isRtl} />
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

function GiftCard({ gift, isRtl }: { gift: Gift; isRtl: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  // The gallery is ordered by the admin; the first image is the tile.
  const img = gift.gallery?.[0]

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={() => navigate(`/gifts/${gift.hashedId}`, { state: { from: location.search } })}
      className="group cursor-pointer rounded-2xl border-[0.5px] border-transparent p-3 transition-shadow hover:border-[#F1F1F1] hover:bg-white hover:shadow-[0_18px_40px_-18px_rgba(10,31,77,0.18)]"
    >
      <div className="flex h-[203px] items-center justify-center overflow-hidden rounded-xl bg-black/[0.03]">
        {img ? (
          <img
            src={resolveAsset(img)}
            alt={pickLocalized(gift.name, gift.nameAr, isRtl) ?? gift.name}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-foreground/20" />
        )}
      </div>

      <p className="mt-3 line-clamp-1 text-sm font-medium text-brand-navy">
        {pickLocalized(gift.name, gift.nameAr, isRtl)}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[13px] font-semibold tabular-nums text-brand-navy">
          {formatOMR(gift.price)}
        </span>
        {gift.oldPrice > gift.price && (
          <del className="text-[12px] tabular-nums text-foreground/40">
            {formatOMR(gift.oldPrice)}
          </del>
        )}
      </div>
    </motion.div>
  )
}

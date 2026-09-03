import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/product/ProductGallery'
import { giftsApi, type Gift } from '@/api/gifts.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { formatOMR } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import { useIsRtl } from '@/store/langStore'

/**
 * Gift product page. Same layout as the frame product page minus everything a
 * gift does not have: no size picker, no option groups, no custom size and no
 * inquiry — just the gallery, name, description, price and Add to cart.
 */
export default function GiftDetailPage() {
  const { t } = useTranslation('gifts')
  const { id } = useParams()
  const navigate = useNavigate()
  const isRtl = useIsRtl()
  const addItem = useCartStore((s) => s.addItem)

  const [gift, setGift] = useState<Gift | null>(null)
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
    if (!id) return
    let alive = true
    setLoading(true)
    setNotFound(false)
    giftsApi
      .byId(id)
      .then((g) => alive && setGift(g))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  // Ordered as the admin arranged it — first image is the main one.
  const gallery = useMemo(
    () => Array.from(new Set((gift?.gallery ?? []).filter(Boolean))).map(resolveAsset),
    [gift],
  )

  const title = gift ? pickLocalized(gift.name, gift.nameAr, isRtl) : ''
  const description = gift ? pickLocalized(gift.description, gift.descriptionAr, isRtl) : ''

  const handleAddToCart = () => {
    if (!gift) return
    addItem({
      kind: 'gift',
      frameId: gift.hashedId,
      name: title || gift.name,
      subtitle: '',
      thumbnail: gallery[0] ?? '',
      // A gift has no dimensions; the cart shows no size row for these lines.
      widthCm: 0,
      heightCm: 0,
      pricePerItem: gift.price,
      // None of the made-to-order options apply to a gift.
      matSizeId: null,
      matSizeName: null,
      matPrice: 0,
      matColorId: null,
      matColorName: null,
      mdfId: null,
      mdfName: null,
      mdfPrice: 0,
      paperTypeId: null,
      paperTypeName: null,
      paperTypePrice: 0,
      glassTypeId: null,
      glassTypeName: null,
      glassTypePrice: 0,
      laminationId: null,
      laminationName: null,
      laminationPrice: 0,
      canvasMaterialId: null,
      canvasMaterialName: null,
      canvasMaterialPrice: 0,
      canvasEdgeId: null,
      canvasEdgeName: null,
      canvasEdgePrice: 0,
    })
    toast.success(t('detail.addedToCart'))
  }

  if (loading) {
    return (
      <Shell>
        <div className="mt-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
        </div>
      </Shell>
    )
  }

  if (notFound || !gift) {
    return (
      <Shell>
        <div className="mt-16 rounded-2xl border border-black/[0.07] py-20 text-center">
          <p className="text-base font-medium text-brand-navy">{t('detail.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/gifts')}
            className="mt-4 text-sm font-semibold text-brand-gold hover:underline"
          >
            {t('detail.backToGifts')}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <nav
        aria-label={t('breadcrumb.aria')}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60 md:text-[13px]"
      >
        <Link to="/" aria-label={t('breadcrumb.home')} className="inline-flex items-center hover:text-brand-navy">
          <Home className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        <ChevronRight className="h-3 w-3 text-foreground/40" />
        <Link to="/gifts" className="hover:text-brand-navy">
          {t('title')}
        </Link>
        <ChevronRight className="h-3 w-3 text-foreground/40" />
        <span className="min-w-0 break-words text-foreground">{title}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-10">
        <ProductGallery images={gallery} className="lg:w-[calc(56%+10px)]" />

        {/* Buy panel — deliberately short: a gift has no options to choose. */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-navy md:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">
              {description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-black/[0.07] py-6">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-brand-navy tabular-nums">
                {formatOMR(gift.price)}
              </span>
              {gift.oldPrice > gift.price && (
                <del className="text-base font-medium text-foreground/40 tabular-nums">
                  {formatOMR(gift.oldPrice)}
                </del>
              )}
            </div>
            <Button
              variant="navy"
              size="lg"
              onClick={handleAddToCart}
              disabled={gift.price <= 0}
              className="min-w-[140px] rounded-lg"
            >
              {t('detail.addToCart')}
            </Button>
          </div>
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
      </main>
      <Footer />
    </div>
  )
}

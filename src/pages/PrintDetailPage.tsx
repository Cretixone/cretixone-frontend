import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/product/ProductGallery'
import { OptionPillGroup } from '@/components/product/OptionPillGroup'
import { ReviewsSection } from '@/components/ReviewsSection'
import { printsApi, printPrice, type CustomPrint, type PrintCategory } from '@/api/prints.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { formatOMR, formatOMRRate } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import { useIsRtl } from '@/store/langStore'

/**
 * Custom print product page. Same design as the frame product page, minus the
 * editor: prints are never composited on canvas, so there is no "Upload a
 * preview image" action and no /editor deep link.
 */
export default function PrintDetailPage() {
  const { t } = useTranslation('prints')
  const { id } = useParams()
  const navigate = useNavigate()
  const isRtl = useIsRtl()
  const addItem = useCartStore((s) => s.addItem)

  const [print, setPrint] = useState<CustomPrint | null>(null)
  const [category, setCategory] = useState<PrintCategory | null>(null)
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
    printsApi
      .byId(id)
      .then(async (p) => {
        if (!alive) return
        setPrint(p)
        // Resolve the category so the breadcrumb can link back to its listing.
        if (p.categoryId) {
          const cats = await printsApi.categories().catch(() => [])
          if (alive) setCategory(cats.find((c) => c.id === p.categoryId) ?? null)
        }
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  // Selections. Size defaults to the first allowed preset; every other option
  // starts deselected, matching the frame product page.
  const [sizeId, setSizeId] = useState<string | null>(null)
  const [canvasMaterialId, setCanvasMaterialId] = useState<string | null>(null)
  const [laminationId, setLaminationId] = useState<string | null>(null)
  const [canvasEdgeId, setCanvasEdgeId] = useState<string | null>(null)

  useEffect(() => {
    if (!sizeId && print?.frameSizes?.length) setSizeId(print.frameSizes[0].id)
  }, [print, sizeId])

  const selectedSize = useMemo(
    () => print?.frameSizes?.find((s) => s.id === sizeId) ?? null,
    [print, sizeId],
  )
  const selectedMaterial = useMemo(
    () => print?.canvasMaterials?.find((o) => o.id === canvasMaterialId) ?? null,
    [print, canvasMaterialId],
  )
  const selectedLamination = useMemo(
    () => print?.laminations?.find((o) => o.id === laminationId) ?? null,
    [print, laminationId],
  )
  const selectedEdge = useMemo(
    () => print?.canvasEdges?.find((o) => o.id === canvasEdgeId) ?? null,
    [print, canvasEdgeId],
  )

  // Each selected option contributes rate × width × height, same as frames.
  const optionsPricePerCm =
    (selectedMaterial?.pricePerCm ?? 0) +
    (selectedLamination?.pricePerCm ?? 0) +
    (selectedEdge?.pricePerCm ?? 0)

  const w = selectedSize?.widthCm ?? 0
  const h = selectedSize?.lengthCm ?? 0
  const hasSize = !!selectedSize
  const priced = !!print && print.pricePerCm > 0

  const unitPrice = print && hasSize ? printPrice(print, w, h, optionsPricePerCm) : 0

  const priceLabel = !priced
    ? '—'
    : hasSize
      ? formatOMR(unitPrice)
      : `${formatOMRRate(print!.pricePerCm)} / cm`

  // Display-only "was" price, using the same shape but the old rate.
  const oldPriceLabel = (() => {
    const old = print?.oldPricePerCm ?? 0
    if (!print || old <= 0 || old <= print.pricePerCm) return null
    if (!hasSize) return `${formatOMRRate(old)} / cm`
    return formatOMR(
      old * (w + h) * 2 + old * (print.wasteValue ?? 0) + optionsPricePerCm * w * h,
    )
  })()

  const gallery = useMemo(
    () => Array.from(new Set((print?.gallery ?? []).filter(Boolean))).map(resolveAsset),
    [print],
  )

  const title = print ? pickLocalized(print.name, print.nameAr, isRtl) : ''
  const description = print ? pickLocalized(print.description, print.descriptionAr, isRtl) : ''
  const specEntries = Object.entries(print?.specifications ?? {}).filter(([, v]) => !!v)

  const handleAddToCart = () => {
    if (!print || !priced || !hasSize) return
    const area = w * h
    addItem({
      kind: 'print',
      frameId: print.hashedId,
      name: title || print.name,
      subtitle: selectedSize?.name ?? '',
      thumbnail: gallery[0] ?? '',
      widthCm: w,
      heightCm: h,
      pricePerItem: unitPrice,
      // Frame-only options never apply to a print.
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
      // Shared with frames.
      laminationId,
      laminationName: selectedLamination?.name ?? null,
      laminationPrice: (selectedLamination?.pricePerCm ?? 0) * area,
      // Print-only.
      canvasMaterialId,
      canvasMaterialName: selectedMaterial?.name ?? null,
      canvasMaterialPrice: (selectedMaterial?.pricePerCm ?? 0) * area,
      canvasEdgeId,
      canvasEdgeName: selectedEdge?.name ?? null,
      canvasEdgePrice: (selectedEdge?.pricePerCm ?? 0) * area,
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

  if (notFound || !print) {
    return (
      <Shell>
        <div className="mt-16 rounded-2xl border border-black/[0.07] py-20 text-center">
          <p className="text-base font-medium text-brand-navy">{t('detail.notFound')}</p>
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

  const sizeItems = (print.frameSizes ?? []).map((s) => ({ id: s.id, name: s.name }))

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
        {category && (
          <>
            <ChevronRight className="h-3 w-3 text-foreground/40" />
            <Link to={`/custom-prints/${category.slug}`} className="hover:text-brand-navy">
              {pickLocalized(category.name, category.nameAr, isRtl)}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 text-foreground/40" />
        {/* Current page — same emphasis as the frame product breadcrumb. */}
        <span className="min-w-0 break-words text-foreground">{title}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-10">
        <ProductGallery images={gallery} className="lg:w-[calc(56%+10px)]" />

        {/* Buy panel */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-navy md:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">
              {description}
            </p>
          )}

          {/* Image Size */}
          {sizeItems.length > 0 && (
            <OptionPillGroup
              label={t('detail.options.imageSize')}
              items={sizeItems}
              value={sizeId}
              onChange={setSizeId}
            />
          )}

          {/* The remaining three groups render only when the admin assigned
              values to this print. */}
          <OptionPillGroup
            label={t('detail.options.canvasMaterial')}
            items={print.canvasMaterials ?? []}
            value={canvasMaterialId}
            onChange={setCanvasMaterialId}
          />
          <OptionPillGroup
            label={t('detail.options.lamination')}
            items={print.laminations ?? []}
            value={laminationId}
            onChange={setLaminationId}
          />
          <OptionPillGroup
            label={t('detail.options.canvasEdge')}
            items={print.canvasEdges ?? []}
            value={canvasEdgeId}
            onChange={setCanvasEdgeId}
          />

          {/* Finished size readout */}
          {hasSize && (
            <p className="mt-6 text-[13px] italic text-foreground/55">
              {t('detail.finishedSize', { w: w.toFixed(1), h: h.toFixed(1) })}
            </p>
          )}

          {/* Price + add to cart. No upload/editor action: prints don't use it. */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-black/[0.07] py-6">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold tabular-nums text-brand-navy">{priceLabel}</span>
              {oldPriceLabel && (
                <span className="text-sm text-foreground/40 line-through tabular-nums">
                  {oldPriceLabel}
                </span>
              )}
            </div>
            {/* variant="navy" + size="lg" matches the frame product page's
                Add to cart button exactly. */}
            <Button
              variant="navy"
              size="lg"
              onClick={handleAddToCart}
              disabled={!priced || !hasSize}
              className="min-w-[140px] rounded-lg"
            >
              {t('detail.addToCart')}
            </Button>
          </div>

        </div>
      </div>

      {/* Specifications — same layout as the frame product page. */}
      {specEntries.length > 0 && (
        <section className="mt-10 max-w-lg">
          <h2 className="text-xl font-bold text-brand-navy">{t('detail.specsHeading')}</h2>
          <dl className="mt-5 space-y-3 text-[13px]">
            {specEntries.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[150px_1fr] gap-4">
                <dt className="font-semibold text-foreground">{label}:</dt>
                <dd className="text-foreground/70">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Reviews + write-a-review form, scoped to this print. */}
      <ReviewsSection printId={print.hashedId} />
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

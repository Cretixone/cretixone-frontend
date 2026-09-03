import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Home, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/product/ProductGallery'
import { OptionPillGroup } from '@/components/product/OptionPillGroup'
import { CUSTOM_SIZE, CustomSizeDialog, SizePicker } from '@/components/product/SizePicker'
import { InquiryDialog } from '@/components/InquiryDialog'
import { ReviewsSection } from '@/components/ReviewsSection'
import { printsApi, printPrice, type CustomPrint, type PrintCategory } from '@/api/prints.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { sortByNameNatural } from '@/lib/sort'
import { formatOMR, formatOMRRate } from '@/lib/format'
import { ARTWORK_MAX_BYTES, ARTWORK_MIME, uploadArtwork } from '@/api/uploads.api'
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
  // starts deselected, matching the frame product page. Size is held by name
  // (not id) so SizePicker can drive frames and prints with one component.
  const [sizeName, setSizeName] = useState<string>('')
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [customOpen, setCustomOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  // Artwork attached from the buy panel — emailed with the inquiry, never
  // sent to the editor.
  const [artwork, setArtwork] = useState<File | null>(null)
  const artworkRef = useRef<HTMLInputElement>(null)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)
  const [artworkUploading, setArtworkUploading] = useState(false)
  const [canvasMaterialId, setCanvasMaterialId] = useState<string | null>(null)
  const [laminationId, setLaminationId] = useState<string | null>(null)
  const [canvasEdgeId, setCanvasEdgeId] = useState<string | null>(null)

  // Sorted naturally so A1, A2, A3, A10 read in order.
  const sortedSizes = useMemo(() => sortByNameNatural(print?.frameSizes ?? []), [print])

  useEffect(() => {
    if (!sizeName && sortedSizes.length) setSizeName(sortedSizes[0].name)
  }, [sortedSizes, sizeName])

  const isCustom = sizeName === CUSTOM_SIZE
  const selectedSize = useMemo(
    () => (isCustom ? null : sortedSizes.find((s) => s.name === sizeName) ?? null),
    [sortedSizes, sizeName, isCustom],
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

  const w = isCustom ? customW : selectedSize?.widthCm ?? 0
  const h = isCustom ? customH : selectedSize?.lengthCm ?? 0
  const hasSize = isCustom ? customW > 0 && customH > 0 : !!selectedSize
  const priced = !!print && print.pricePerCm > 0

  // Within the print's manufacturable range -> Add to cart; outside it -> inquiry.
  const inRange =
    !!print && print.sizeTo > 0 &&
    w >= print.sizeFrom && w <= print.sizeTo &&
    h >= print.sizeFrom && h <= print.sizeTo

  const sizeDisplay = isCustom
    ? hasSize
      ? `${t('sizePicker.customSize', { ns: 'productDetail' })} · ${w}×${h} cm`
      : t('sizePicker.customSize', { ns: 'productDetail' })
    : sizeName

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
    return formatOMR((old + optionsPricePerCm) * w * h)
  })()

  const gallery = useMemo(
    () => Array.from(new Set((print?.gallery ?? []).filter(Boolean))).map(resolveAsset),
    [print],
  )

  const title = print ? pickLocalized(print.name, print.nameAr, isRtl) : ''
  const description = print ? pickLocalized(print.description, print.descriptionAr, isRtl) : ''
  const specEntries = Object.entries(print?.specifications ?? {}).filter(([, v]) => !!v)

  // Local object URL for the thumbnail; revoked when the file changes.
  useEffect(() => {
    if (!artwork) {
      setArtworkPreview(null)
      return
    }
    const url = URL.createObjectURL(artwork)
    setArtworkPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [artwork])

  // Uploaded on pick rather than at checkout, so the cart line already has
  // a URL the order snapshot and admin can render.
  const pickArtwork = async (file: File | undefined) => {
    if (!file) return
    if (!ARTWORK_MIME.includes(file.type)) {
      toast.error(t('artwork.onlyImages'))
      return
    }
    if (file.size > ARTWORK_MAX_BYTES) {
      toast.error(t('artwork.tooLarge', { mb: ARTWORK_MAX_BYTES / (1024 * 1024) }))
      return
    }
    setArtworkUploading(true)
    try {
      const url = await uploadArtwork(file)
      setArtwork(file)
      setArtworkUrl(url)
    } catch (err) {
      // Prefer the API's reason (size / type) over the generic fallback.
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || t('artwork.uploadFailed'))
    } finally {
      setArtworkUploading(false)
    }
  }

  const clearArtwork = () => {
    setArtwork(null)
    setArtworkUrl(null)
  }

  const handleAddToCart = () => {
    if (!print || !priced || !hasSize) return
    const area = w * h
    addItem({
      kind: 'print',
      frameId: print.hashedId,
      name: title || print.name,
      subtitle: selectedSize?.name ?? '',
      thumbnail: gallery[0] ?? '',
      artworkUrl,
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

          {/* Image Size — quick pills, the rest behind "More sizes", plus a
              "Custom size" entry that opens the width x height dialog. */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-foreground">{t('detail.options.imageSize')}</p>
            <SizePicker
              sizes={sortedSizes.map((s) => s.name)}
              value={sizeName}
              displayValue={sizeDisplay}
              onChange={(v) => (v === CUSTOM_SIZE ? setCustomOpen(true) : setSizeName(v))}
            />
          </div>

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

          {/* Upload — same placement and treatment as the frame product page,
              but it never opens the editor. The file is uploaded straight away
              so its URL can ride along on the cart line and into the order; the
              File itself is also attached if the shopper requests an inquiry. */}
          <div className="mt-4">
            {artwork ? (
              <div className="flex items-center gap-3 rounded-lg border border-black/15 bg-white p-2.5">
                {artworkPreview && (
                  <img
                    src={artworkPreview}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md border border-black/10 object-cover"
                    draggable={false}
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/70">
                  {artwork.name}
                </span>
                <button
                  type="button"
                  onClick={clearArtwork}
                  aria-label={t('artwork.remove')}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/50 transition hover:bg-black/[0.06] hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => artworkRef.current?.click()}
                disabled={artworkUploading}
                className="gap-2 border-brand-navy/40 bg-transparent text-brand-navy hover:bg-brand-navy/5"
              >
                {artworkUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {t('artwork.upload')}
              </Button>
            )}
          </div>
          <input
            ref={artworkRef}
            type="file"
            accept={ARTWORK_MIME.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.currentTarget.value = ''
              void pickArtwork(file)
            }}
          />

          {/* Price + add to cart — same structure as the frame product page. */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-black/[0.07] py-6">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-brand-navy tabular-nums">{priceLabel}</span>
              {oldPriceLabel && (
                <del className="text-base font-medium text-foreground/40 tabular-nums">
                  {oldPriceLabel}
                </del>
              )}
            </div>
            {isCustom && !hasSize ? (
              <Button variant="navy" size="lg" onClick={() => setCustomOpen(true)} className="min-w-[140px] rounded-lg">
                {t('buyPanel.enterCustomSize', { ns: 'productDetail' })}
              </Button>
            ) : hasSize && !inRange ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setInquiryOpen(true)}
                className="min-w-[140px] rounded-lg border-brand-navy/40 text-brand-navy hover:bg-brand-navy/5"
              >
                {t('buyPanel.customOrder', { ns: 'productDetail' })}
              </Button>
            ) : (
              <Button
                variant="navy"
                size="lg"
                onClick={handleAddToCart}
                disabled={!priced || !hasSize}
                className="min-w-[140px] rounded-lg"
              >
                {t('detail.addToCart')}
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Description — its own section below the gallery/buy panel, same as
          the frame product page, rather than squeezed under the title. */}
      {description.trim() && (
        <section className="mt-12 max-w-4xl">
          <h2 className="text-xl font-semibold text-brand-navy">{t('detail.descriptionHeading')}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
            {description}
          </p>
        </section>
      )}

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

      <CustomSizeDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        sizeFrom={print.sizeFrom}
        sizeTo={print.sizeTo}
        initialW={customW || Math.max(1, Math.round(print.sizeFrom || 20))}
        initialH={customH || Math.max(1, Math.round(print.sizeFrom || 20))}
        canConfirm={priced}
        priceLabelFor={(cw, ch) =>
          priced ? formatOMR(printPrice(print, cw, ch, optionsPricePerCm)) : '—'
        }
        onConfirm={(cw, ch) => {
          setCustomW(cw)
          setCustomH(ch)
          setSizeName(CUSTOM_SIZE)
        }}
      />

      {/* Out-of-range sizes can't be checked out — collect the request instead. */}
      <InquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        frameName={print.name}
        displayName={title}
        thumbnail={gallery[0]}
        widthCm={w}
        heightCm={h}
        unitPrice={unitPrice}
        priceLabel={priceLabel}
        initialImage={artwork}
      />

      {/* Reviews + write-a-review form, scoped to this print. */}
      <ReviewsSection printId={print.hashedId} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000] relative">
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

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Home, Maximize2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Lightbox } from '@/components/Lightbox'
import { InquiryDialog } from '@/components/InquiryDialog'
import { ReviewsSection } from '@/components/ReviewsSection'
import { useEditorStore } from '@/store/editorStore'
import { useCartStore } from '@/store/cartStore'
import { useIsRtl } from '@/store/langStore'
import { pickLocalized } from '@/lib/localized'
import { useFetchFrameByIdQuery, useFetchFrameSizesQuery } from '@/store/api/apiSlice'
import { formatOMR, formatOMRRate } from '@/lib/format'
import { cn } from '@/lib/utils'

// Fallback gallery (bundled lifestyle slides) used only when a frame has no
// thumbnail/full-frame assets to show.
const FALLBACK_GALLERY = [
  '/images/webp/slide-1.webp',
  '/images/webp/slide-2.webp',
  '/images/webp/slide-3.webp',
]

// Titles/descriptions live in the productDetail namespace and are resolved with
// t() at render time (see BuyPanel). The `id` values are logic — keep unchanged.
const SERVICES = [
  {
    id: 'frame-only',
    titleKey: 'services.frameOnly.title',
    descKey: 'services.frameOnly.desc',
    icon: '/images/svg/frame-img-icon.svg',
  },
  {
    id: 'print-frame',
    titleKey: 'services.printFrame.title',
    descKey: 'services.printFrame.desc',
    icon: '/images/svg/frame-icon.svg',
  },
] as const

// Sentinel value for the "Custom size" entry in the size dropdown.
const CUSTOM_SIZE = '__custom__'

export default function ProductDetailPage() {
  const { t } = useTranslation('productDetail')
  const { id } = useParams()
  const navigate = useNavigate()
  const isRtl = useIsRtl()

  // Fetch just this frame by its hashed URL id (single API call, no full list).
  const { data: frame } = useFetchFrameByIdQuery(id ? Number(id) : 0, { skip: !id })
  const { data: frameSizes } = useFetchFrameSizesQuery()

  // Arabic name/description when in Arabic mode (falls back to English).
  const localizedTitle = pickLocalized(frame?.name, frame?.nameAr, isRtl)
  const localizedDescription = pickLocalized(frame?.description, frame?.descriptionAr, isRtl)

  // Gallery rule:
  //  • gallery has images → show them (thumbnail strip + 1st as the main image)
  //  • gallery empty       → show the frame's thumbnail as the single image
  //    (the strip is hidden by <Gallery> when there's only one image)
  const gallery = useMemo(() => {
    const own = Array.from(new Set((frame?.gallery ?? []).filter(Boolean)))
    if (own.length) return own
    if (frame?.imgUrl) return [frame.imgUrl]
    return FALLBACK_GALLERY
  }, [frame])

  // Size presets from the admin (shown in the "More sizes" dropdown by default).
  const sizes = useMemo(
    () => (frameSizes ?? []).map((s) => `${s.name} · ${s.widthCm}×${s.lengthCm} cm`),
    [frameSizes],
  )

  // Spec sheet — these labels are intentionally hidden from the storefront.
  const HIDDEN_SPECS = new Set(['Rabbet Depth', 'Image / Art Sizes', 'Substrates'])
  const specEntries = frame
    ? Object.entries(frame.specifications ?? {}).filter(([label]) => !HIDDEN_SPECS.has(label))
    : []

  // Match the landing/products body theme (white bg, black text).
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#000000'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  const [service, setService] = useState<string>(SERVICES[0].id)
  const [size, setSize] = useState<string>('')
  // Custom size entered via the "Custom size" dropdown option → tiny dialog.
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [customOpen, setCustomOpen] = useState(false)
  // Draft dims edited inside the dialog — only committed to customW/H on Confirm
  // (Cancel or closing the popup discards them).
  const [draftW, setDraftW] = useState(0)
  const [draftH, setDraftH] = useState(0)
  // Request-inquiry form (custom / out-of-range sizes) — opens over the page.
  const [inquiryOpen, setInquiryOpen] = useState(false)

  // Default the selected size to the first preset once they load.
  useEffect(() => {
    if (!size && sizes.length) setSize(sizes[0])
  }, [sizes, size])

  // Resolve the chosen size preset → real price.
  // Frame Price = pricePerCm × (width + length) × 2 (same formula as the editor).
  const selectedFrameSize = useMemo(
    () => (frameSizes ?? []).find((s) => `${s.name} · ${s.widthCm}×${s.lengthCm} cm` === size),
    [frameSizes, size],
  )

  // Effective dimensions + manufacturability — same rule as the editor's
  // "Checkout vs Request Inquiry": both sides within the frame's [sizeFrom,
  // sizeTo] range → Add to cart; otherwise → Custom order (inquiry).
  const isCustom = size === CUSTOM_SIZE
  const effW = isCustom ? customW : selectedFrameSize?.widthCm ?? 0
  const effH = isCustom ? customH : selectedFrameSize?.lengthCm ?? 0
  const hasSize = isCustom ? customW > 0 && customH > 0 : !!selectedFrameSize
  const inRange =
    !!frame && frame.sizeTo > 0 &&
    effW >= frame.sizeFrom && effW <= frame.sizeTo &&
    effH >= frame.sizeFrom && effH <= frame.sizeTo
  // Label shown in the size box: preset label, or "Custom · W×H cm".
  const sizeDisplay = isCustom
    ? hasSize
      ? `${t('sizePicker.customSize')} · ${effW}×${effH} cm`
      : t('sizePicker.customSize')
    : size

  // Live draft price/range shown inside the dialog while editing (pre-Confirm).
  const draftHasSize = draftW > 0 && draftH > 0
  const draftInRange =
    !!frame && frame.sizeTo > 0 &&
    draftW >= frame.sizeFrom && draftW <= frame.sizeTo &&
    draftH >= frame.sizeFrom && draftH <= frame.sizeTo
  const draftPriceLabel =
    frame && frame.pricePerCm > 0 && draftHasSize
      ? formatOMR(frame.pricePerCm * (draftW + draftH) * 2)
      : '—'
  // Price label:
  //  • a size preset is chosen → the total for that size (pricePerCm × perimeter)
  //  • no preset selectable (e.g. none exist yet) → the per-cm rate, so a
  //    meaningful price always shows instead of a misleading 1 cm minimum
  //  • frame isn't priced → em dash
  const priceLabel = (() => {
    if (!frame || frame.pricePerCm <= 0) return '—'
    if (hasSize) return formatOMR(frame.pricePerCm * (effW + effH) * 2)
    return `${formatOMRRate(frame.pricePerCm)} / cm`
  })()

  // Display-only "was" price (struck-through). Same formula as the real price
  // but from oldPricePerCm — never fed into any calculation. Only shown when
  // it's a genuine higher "was" price.
  const oldPriceLabel = (() => {
    const old = frame?.oldPricePerCm ?? 0
    if (!frame || old <= 0 || old <= frame.pricePerCm) return null
    if (hasSize) return formatOMR(old * (effW + effH) * 2)
    return `${formatOMRRate(old)} / cm`
  })()

  // "Upload a preview image" opens the editor (with this frame, when we have
  // an id) so the user can drop their artwork into the frame. The frame panel
  // opens on its tab and a freshly opened frame defaults to the Square ratio;
  // the editor's deep-link resolver selects the frame + its category from the
  // ?frame= id.
  const openEditor = () => {
    const ed = useEditorStore.getState()
    ed.setActiveSidebarTab('frames')
    ed.setFrameAspectRatio('square')
    navigate(id ? `/editor?frame=${id}` : '/editor')
  }

  const addItem = useCartStore((s) => s.addItem)
  const priced = !!frame && frame.pricePerCm > 0

  // Picking "Custom size" opens the dialog seeded with the current custom size
  // (or a default). The size isn't applied until the user hits Confirm.
  const handleSelectSize = (v: string) => {
    if (v === CUSTOM_SIZE) {
      const seed = Math.max(1, Math.round(frame?.sizeFrom || 20))
      setDraftW(customW || seed)
      setDraftH(customH || seed)
      setCustomOpen(true)
    } else {
      setSize(v)
    }
  }

  // In-range (preset or custom) → add to cart. Price = pricePerCm × perimeter ×2.
  const handleAddToCart = () => {
    if (!frame || !priced || !hasSize) return
    addItem({
      frameId: frame.id,
      name: frame.name || t('fallback.pictureFrame'),
      subtitle: isCustom ? `${effW}×${effH} cm` : selectedFrameSize?.name ?? '',
      thumbnail: frame.imgUrl || gallery[0],
      widthCm: effW,
      heightCm: effH,
      pricePerItem: frame.pricePerCm * (effW + effH) * 2,
      // No mat/MDF chosen from the product page — those are editor-only options.
      matSizeId: null,
      matSizeName: null,
      matPrice: 0,
      matColorId: null,
      matColorName: null,
      mdfId: null,
      mdfName: null,
      mdfPrice: 0,
    })
    toast.success(t('toast.addedToCart'))
  }

  // Out-of-range / custom size → open the inquiry form (frame + size are
  // carried in read-only). Submitting records it and emails the platform inbox.
  const handleCustomOrder = () => {
    if (!frame || !hasSize) return
    setInquiryOpen(true)
  }

  // Numeric estimate stored on the inquiry (0 when the frame isn't priced).
  const inquiryUnitPrice = priced && hasSize ? frame!.pricePerCm * (effW + effH) * 2 : 0

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {/* Breadcrumb */}
        <nav
          aria-label={t('aria.breadcrumb')}
          className="mb-10 flex items-center gap-2 text-sm text-foreground/70"
        >
          <Link to="/" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-foreground/40">›</span>
          <Link to="/products" className="hover:text-brand-navy">
            {t('breadcrumb.canvasPrints')}
          </Link>
        </nav>

        {/* Gallery + buy panel */}
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <Gallery images={gallery} className="lg:w-[56%]" />
          <BuyPanel
            title={localizedTitle || t('fallback.pictureFrame')}
            subtitle={frame?.categorySlug ? frame.categorySlug.replace(/-/g, ' ') : t('fallback.customPictureFrame')}
            sizes={sizes}
            priceLabel={priceLabel}
            oldPriceLabel={oldPriceLabel}
            showService={(frame?.specifications?.['Frame Type'] ?? '').toLowerCase() === 'floating'}
            service={service}
            onService={setService}
            size={size}
            sizeDisplay={sizeDisplay}
            onSize={handleSelectSize}
            onUpload={openEditor}
            onAddToCart={handleAddToCart}
            onCustomOrder={handleCustomOrder}
            onOpenCustom={() => setCustomOpen(true)}
            priced={priced}
            hasSize={hasSize}
            outOfRange={hasSize && !inRange}
            isCustom={isCustom}
            className="lg:flex-1"
          />
        </div>

        {/* Custom size dialog — enter W×H, then Confirm to apply (Cancel or
            closing discards). The Add-to-cart / Custom-order action lives on the
            main button once a size is applied. */}
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-sm">
            <DialogHeader className="border-b p-6">
              <DialogTitle>{t('customDialog.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              {frame && frame.sizeTo > 0 && (
                <p className="text-[13px] text-foreground/60">
                  {t('customDialog.range', { from: frame.sizeFrom, to: frame.sizeTo })}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">{t('customDialog.width')}</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="decimal"
                    value={draftW || ''}
                    onChange={(e) => setDraftW(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">{t('customDialog.height')}</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="decimal"
                    value={draftH || ''}
                    onChange={(e) => setDraftH(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
                  />
                </label>
              </div>
              {draftHasSize && (
                <div className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3.5 py-2.5">
                  <span className="text-sm text-foreground/70">{t('customDialog.price')}</span>
                  <span className="text-base font-bold text-brand-navy tabular-nums">{draftPriceLabel}</span>
                </div>
              )}
              {draftHasSize && !draftInRange && (
                <p className="text-[12px] leading-relaxed text-amber-600">{t('customDialog.outOfRange')}</p>
              )}
            </div>
            <DialogFooter className="border-t bg-background p-4 sm:p-6">
              <Button type="button" variant="ghost" onClick={() => setCustomOpen(false)}>
                {t('customDialog.cancel')}
              </Button>
              <Button
                type="button"
                variant="navy"
                disabled={!(frame && frame.pricePerCm > 0) || !draftHasSize}
                onClick={() => {
                  if (!draftHasSize) return
                  setCustomW(draftW)
                  setCustomH(draftH)
                  setSize(CUSTOM_SIZE)
                  setCustomOpen(false)
                }}
              >
                {t('customDialog.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request-inquiry form — frame + size are read-only (carried in from the
            current selection); only contact details are editable. */}
        <InquiryDialog
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          frameName={frame?.name || t('fallback.pictureFrame')}
          displayName={localizedTitle || t('fallback.pictureFrame')}
          thumbnail={frame?.imgUrl || gallery[0]}
          widthCm={effW}
          heightCm={effH}
          unitPrice={inquiryUnitPrice}
          priceLabel={priceLabel}
        />

        {/* Description */}
        {localizedDescription.trim() && (
          <section className="mt-12 max-w-4xl">
            <h2 className="text-xl font-semibold text-brand-navy">{t('description.heading')}</h2>
            {/* whitespace-pre-wrap preserves the line breaks + spacing the admin typed */}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
              {localizedDescription}
            </p>
          </section>
        )}

        {/* Specifications */}
        {specEntries.length > 0 && (
          <section className="mt-10 max-w-lg">
            <h2 className="text-xl font-bold text-brand-navy">{t('details.heading')}</h2>
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

        {/* Reviews + write-a-review form */}
        <ReviewsSection frameId={id ? Number(id) : 0} />
      </main>

      <Footer />
    </div>
  )
}

// ── Gallery: thumbnails + main image with fullscreen lightbox ──────────────
function Gallery({
  images,
  className,
}: {
  images: string[]
  className?: string
}) {
  const { t } = useTranslation('productDetail')
  const [active, setActive] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const src = images[active] ?? images[0]

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {/* Thumbnails — shown only when there's more than one image. Horizontal
            scroll on mobile, vertical scroll column on ≥sm. */}
        {images.length > 1 && (
          <div
            className={cn(
              'flex shrink-0 gap-2.5 overflow-x-auto pb-1',
              'sm:max-h-[480px] sm:w-[84px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0 sm:pr-1',
              '[scrollbar-width:thin]',
            )}
          >
            {images.map((img, i) => {
              const selected = i === active
              return (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t('aria.viewImage', { number: i + 1 })}
                  aria-pressed={selected}
                  className={cn(
                    'relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg transition sm:h-[78px] sm:w-full',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50',
                  )}
                  style={{
                    outline: selected
                      ? '2px solid #002365'
                      : '1px solid rgba(0,0,0,0.10)',
                    outlineOffset: '-1px',
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                </button>
              )
            })}
          </div>
        )}

        {/* Main image — static (no hover zoom); expand icon opens the lightbox */}
        <div className="relative min-w-0 flex-1">
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EDE6D6] sm:aspect-auto sm:h-[420px] lg:h-[480px]">
            <img
              src={src}
              alt={t('gallery.previewAlt')}
              draggable={false}
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={t('aria.viewFullscreen')}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-80 backdrop-blur-sm transition hover:bg-black/70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Lightbox
        images={images}
        index={active}
        open={lightboxOpen}
        onIndex={setActive}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}

// ── Buy panel ───────────────────────────────────────────────────────────────
function BuyPanel({
  title,
  subtitle,
  sizes,
  sizeDisplay,
  priceLabel,
  oldPriceLabel,
  service,
  onService,
  size,
  onSize,
  onUpload,
  onAddToCart,
  onCustomOrder,
  onOpenCustom,
  priced,
  hasSize,
  outOfRange,
  isCustom,
  showService,
  className,
}: {
  title: string
  subtitle: string
  sizes: string[]
  sizeDisplay: string
  priceLabel: string
  oldPriceLabel: string | null
  service: string
  onService: (id: string) => void
  size: string
  onSize: (s: string) => void
  onUpload: () => void
  onAddToCart: () => void
  onCustomOrder: () => void
  onOpenCustom: () => void
  priced: boolean
  hasSize: boolean
  outOfRange: boolean
  isCustom: boolean
  showService: boolean
  className?: string
}) {
  const { t } = useTranslation('productDetail')
  return (
    <div className={cn('min-w-0', className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-brand-navy md:text-[28px]">
        {title}
      </h1>
      <p className="mt-1.5 text-sm capitalize text-foreground/60">
        {subtitle}
      </p>

      {/* Service — only shown for floating frames */}
      {showService && (
        <>
          <p className="mt-6 text-base font-semibold text-foreground">
            {t('buyPanel.chooseService')}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const selected = service === s.id
              return (
            <button
              key={s.id}
              type="button"
              onClick={() => onService(s.id)}
              aria-pressed={selected}
              className="flex items-center gap-3 rounded-lg px-3.5 text-left transition"
              style={{
                height: '49px',
                background: '#F6F6F6',
                outline: selected
                  ? '1.5px solid #002365'
                  : '1.5px solid transparent',
                outlineOffset: '-1px',
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center border-black/[0.06]"
              >
                <img src={s.icon} alt="" className="h-5 w-auto" />
              </span>
              <span className="min-w-0">
                <span className="block text-[18px] font-medium leading-none text-foreground">
                  {t(s.titleKey)}
                </span>
                <span className="mt-1 block text-[11px] font-normal leading-none text-foreground/55">
                  {t(s.descKey)}
                </span>
              </span>
            </button>
              )
            })}
          </div>
        </>
      )}

      {/* Size */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground">{t('buyPanel.frameSize')}</p>
        <SizePicker sizes={sizes} value={size} displayValue={sizeDisplay} onChange={onSize} />
      </div>
      {/* Upload — shown under the frame size */}
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={onUpload}
          className="gap-2 border-brand-navy/40 bg-transparent text-brand-navy hover:bg-brand-navy/5"
        >
          <Upload className="h-4 w-4" />
          {t('buyPanel.uploadPreview')}
        </Button>
      </div>

      {/* Price + add to cart */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.07] pt-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold text-brand-navy tabular-nums">
            {priceLabel}
          </span>
          {oldPriceLabel && (
            <del className="text-base font-medium text-foreground/40 tabular-nums">
              {oldPriceLabel}
            </del>
          )}
        </div>
        {isCustom && !hasSize ? (
          <Button variant="navy" size="lg" onClick={onOpenCustom} className="min-w-[140px] rounded-lg">
            {t('buyPanel.enterCustomSize')}
          </Button>
        ) : outOfRange ? (
          <Button
            variant="outline"
            size="lg"
            onClick={onCustomOrder}
            className="min-w-[140px] rounded-lg border-brand-navy/40 text-brand-navy hover:bg-brand-navy/5"
          >
            {t('buyPanel.customOrder')}
          </Button>
        ) : (
          <Button
            variant="navy"
            size="lg"
            onClick={onAddToCart}
            disabled={!priced || !hasSize}
            className="min-w-[140px] rounded-lg"
          >
            {t('buyPanel.addToCart')}
          </Button>
        )}
      </div>
    </div>
  )
}

function SizePicker({
  sizes,
  value,
  displayValue,
  onChange,
}: {
  sizes: string[]
  value: string
  displayValue: string
  onChange: (s: string) => void
}) {
  const { t } = useTranslation('productDetail')
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium text-foreground">
          {displayValue || t('sizePicker.selectSize')}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground/70 transition hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
          >
            {t('sizePicker.moreSizes')}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            />
          </button>
          {open && (
            <>
              {/* click-away */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <ul
                role="listbox"
                className="absolute left-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-[0_18px_40px_-18px_rgba(10,31,77,0.35)]"
              >
                {sizes.map((s) => {
                  const selected = s === value
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(s)
                          setOpen(false)
                        }}
                        className={cn(
                          'block w-full rounded-md px-3 py-1.5 text-left text-sm transition hover:bg-black/[0.05]',
                          selected
                            ? 'font-semibold text-brand-gold'
                            : 'text-foreground/80',
                        )}
                      >
                        {s}
                      </button>
                    </li>
                  )
                })}
                {/* Custom size — opens the size dialog */}
                <li className={cn(sizes.length > 0 && 'mt-1 border-t border-black/10 pt-1')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === CUSTOM_SIZE}
                    onClick={() => {
                      onChange(CUSTOM_SIZE)
                      setOpen(false)
                    }}
                    className={cn(
                      'block w-full rounded-md px-3 py-1.5 text-left text-sm transition hover:bg-black/[0.05]',
                      value === CUSTOM_SIZE ? 'font-semibold text-brand-gold' : 'text-foreground/80',
                    )}
                  >
                    {t('sizePicker.customSize')}
                  </button>
                </li>
              </ul>
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
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Home, Maximize2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { ProductGallery } from '@/components/product/ProductGallery'
import { OptionPillGroup } from '@/components/product/OptionPillGroup'
import { InquiryDialog } from '@/components/InquiryDialog'
import { CUSTOM_SIZE, CustomSizeDialog, SizePicker } from '@/components/product/SizePicker'
import { ReviewsSection } from '@/components/ReviewsSection'
import { useEditorStore } from '@/store/editorStore'
import { useCartStore } from '@/store/cartStore'
import { useIsRtl } from '@/store/langStore'
import { pickLocalized } from '@/lib/localized'
import { useFetchFrameByIdQuery } from '@/store/api/apiSlice'
import { formatOMR, formatOMRRate } from '@/lib/format'
// One shared formula for frames and prints — see src/lib/pricing.ts.
import { productPrice } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { sortByNameNatural } from '@/lib/sort'

// Titles/descriptions live in the productDetail namespace and are resolved with
// t() at render time (see BuyPanel). The `id` values are logic — keep unchanged.
const SERVICES = [
  {
    id: 'frame-only',
    titleKey: 'services.frameOnly.title',
    // Floating frames are stretched, so both services are named accordingly.
    floatingTitleKey: 'services.frameOnly.titleFloating',
    descKey: 'services.frameOnly.desc',
    icon: '/images/svg/frame-img-icon.svg',
  },
  {
    id: 'print-frame',
    titleKey: 'services.printFrame.title',
    floatingTitleKey: 'services.printFrame.titleFloating',
    descKey: 'services.printFrame.desc',
    icon: '/images/svg/frame-icon.svg',
  },
] as const

// Sentinel value for the "Custom size" entry in the size dropdown.

export default function ProductDetailPage() {
  const { t } = useTranslation('productDetail')
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isRtl = useIsRtl()
  // Set by ProductCard's navigate() when arriving from /products — carries
  // that page's exact ?page=/?sort= so "back to Frames" returns to it
  // instead of resetting to page 1. Absent on a direct link/refresh, in
  // which case the breadcrumb just goes to the un-paginated /products.
  const productsBackTo = `/products${(location.state as { from?: string } | null)?.from ?? ''}`

  // Fetch just this frame by its hashed URL id (single API call, no full list).
  const { data: frame } = useFetchFrameByIdQuery(id ? Number(id) : 0, { skip: !id })

  // Arabic name/description when in Arabic mode (falls back to English).
  const localizedTitle = pickLocalized(frame?.name, frame?.nameAr, isRtl)
  const localizedDescription = pickLocalized(frame?.description, frame?.descriptionAr, isRtl)

  // Gallery rule:
  //  • gallery has images → show them (thumbnail strip + 1st as the main image)
  //  • gallery empty       → show the frame's thumbnail as the single image
  //    (the strip is hidden by <Gallery> when there's only one image)
  //  • neither             → empty, and <Gallery> renders a neutral placeholder.
  //    No stock/bundled fallback photos: showing an unrelated lifestyle image
  //    for a product with no assets misrepresents the product.
  const gallery = useMemo(() => {
    const own = Array.from(new Set((frame?.gallery ?? []).filter(Boolean)))
    if (own.length) return own
    return frame?.imgUrl ? [frame.imgUrl] : []
  }, [frame])

  // Size presets allow-listed for this frame by the admin (frame add/edit
  // form) — shown as quick pills + the "More sizes" dropdown. Just the name
  // (no dimensions) per the size badge.
  // Sorted naturally so A1, A2, A3, A10 read in order rather than A1, A10, A2.
  const sizes = useMemo(
    () => sortByNameNatural(frame?.frameSizes ?? []).map((s) => s.name),
    [frame],
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
  // Paper Type / MDF / Lamination / Glass Type — allow-listed per frame by
  // the admin (frame add/edit form). A section only renders when the frame
  // has at least one assigned value; selection is display-only for now (no
  // pricing wired in yet).
  const [paperTypeId, setPaperTypeId] = useState<string | null>(null)
  const [mdfBoardId, setMdfBoardId] = useState<string | null>(null)
  const [laminationId, setLaminationId] = useState<string | null>(null)
  const [glassTypeId, setGlassTypeId] = useState<string | null>(null)
  // Custom size entered via the "Custom size" dropdown option → tiny dialog.
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [customOpen, setCustomOpen] = useState(false)
  // Request-inquiry form (custom / out-of-range sizes) — opens over the page.
  const [inquiryOpen, setInquiryOpen] = useState(false)

  // Default the selected size to the first preset once they load.
  useEffect(() => {
    if (!size && sizes.length) setSize(sizes[0])
  }, [sizes, size])

  // Paper Type / MDF / Lamination / Glass Type start deselected — only the
  // frame size defaults to its first preset (above); these are opt-in.

  // Resolve each selected option id → its catalog record (for pricePerCm).
  const selectedPaperType = useMemo(
    () => (frame?.paperTypes ?? []).find((p) => p.id === paperTypeId) ?? null,
    [frame, paperTypeId],
  )
  const selectedMdfBoard = useMemo(
    () => (frame?.mdfBoards ?? []).find((m) => m.id === mdfBoardId) ?? null,
    [frame, mdfBoardId],
  )
  const selectedLamination = useMemo(
    () => (frame?.laminations ?? []).find((l) => l.id === laminationId) ?? null,
    [frame, laminationId],
  )
  const selectedGlassType = useMemo(
    () => (frame?.glassTypes ?? []).find((g) => g.id === glassTypeId) ?? null,
    [frame, glassTypeId],
  )
  // Combined area rate (OMR/cm²) from every selected value-add option — each
  // contributes pricePerCm × width × length, same formula as the frame's own
  // MDF/Paper/Lamination/Glass Type comment in the schema.
  const optionsPricePerCm =
    (selectedPaperType?.pricePerCm ?? 0) +
    (selectedMdfBoard?.pricePerCm ?? 0) +
    (selectedLamination?.pricePerCm ?? 0) +
    (selectedGlassType?.pricePerCm ?? 0)

  // Resolve the chosen size preset → real price.
  // Frame Price = pricePerCm × (width + length) × 2 (same formula as the editor).
  const selectedFrameSize = useMemo(
    () => (frame?.frameSizes ?? []).find((s) => s.name === size),
    [frame, size],
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

  // Price label:
  //  • a size preset is chosen → the total for that size — frame (pricePerCm
  //    × perimeter, plus the admin-configured waste allowance: pricePerCm ×
  //    wasteValue) plus each selected Paper Type / MDF / Lamination / Glass
  //    Type (pricePerCm × width × length) — waste never applies to options
  //  • no preset selectable (e.g. none exist yet) → the per-cm rate, so a
  //    meaningful price always shows instead of a misleading 1 cm minimum
  //  • frame isn't priced → em dash
  const priceLabel = (() => {
    if (!frame || frame.pricePerCm <= 0) return '—'
    if (hasSize) return formatOMR(productPrice(frame.pricePerCm, frame.wasteValue, effW, effH, optionsPricePerCm))
    return `${formatOMRRate(frame.pricePerCm)} / cm`
  })()

  // Display-only "was" price (struck-through). Same formula as the real price
  // (including the waste allowance) but from oldPricePerCm — never fed into
  // any calculation. Only shown when it's a genuine higher "was" price.
  const oldPriceLabel = (() => {
    const old = frame?.oldPricePerCm ?? 0
    if (!frame || old <= 0 || old <= frame.pricePerCm) return null
    if (hasSize) return formatOMR(productPrice(old, frame.wasteValue, effW, effH, optionsPricePerCm))
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

  // Picking "Custom size" opens the dialog; the dialog seeds itself from the
  // current custom size and nothing is applied until the user hits Confirm.
  const handleSelectSize = (v: string) => {
    if (v === CUSTOM_SIZE) setCustomOpen(true)
    else setSize(v)
  }

  // In-range (preset or custom) → add to cart. Price = frame (pricePerCm ×
  // perimeter + pricePerCm × wasteValue) + each selected Paper Type / MDF /
  // Lamination / Glass Type (pricePerCm × width × length) — waste never
  // applies to those options.
  const handleAddToCart = () => {
    if (!frame || !priced || !hasSize) return
    const area = effW * effH
    addItem({
      frameId: frame.id,
      name: frame.name || t('fallback.pictureFrame'),
      subtitle: isCustom ? `${effW}×${effH} cm` : selectedFrameSize?.name ?? '',
      thumbnail: frame.imgUrl || gallery[0],
      widthCm: effW,
      heightCm: effH,
      pricePerItem: productPrice(frame.pricePerCm, frame.wasteValue, effW, effH, optionsPricePerCm),
      // No mat chosen from the product page — mat is an editor-only option.
      matSizeId: null,
      matSizeName: null,
      matPrice: 0,
      matColorId: null,
      matColorName: null,
      mdfId: mdfBoardId,
      mdfName: selectedMdfBoard?.name ?? null,
      mdfPrice: (selectedMdfBoard?.pricePerCm ?? 0) * area,
      paperTypeId,
      paperTypeName: selectedPaperType?.name ?? null,
      paperTypePrice: (selectedPaperType?.pricePerCm ?? 0) * area,
      laminationId,
      laminationName: selectedLamination?.name ?? null,
      laminationPrice: (selectedLamination?.pricePerCm ?? 0) * area,
      glassTypeId,
      glassTypeName: selectedGlassType?.name ?? null,
      glassTypePrice: (selectedGlassType?.pricePerCm ?? 0) * area,
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
  const inquiryUnitPrice =
    priced && hasSize
      ? productPrice(frame!.pricePerCm, frame!.wasteValue, effW, effH, optionsPricePerCm)
      : 0

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
          className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/70"
        >
          <Link to="/" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-foreground/40">›</span>
          <Link to={productsBackTo} className="hover:text-brand-navy">
            {t('breadcrumb.frames')}
          </Link>
          {/* Current page: the product itself. Rendered only once the frame has
              loaded, so the trail never shows an empty trailing separator. */}
          {localizedTitle && (
            <>
              <span className="text-foreground/40">›</span>
              <span className="min-w-0 break-words text-foreground">{localizedTitle}</span>
            </>
          )}
        </nav>

        {/* Gallery + buy panel */}
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <ProductGallery images={gallery} className="lg:w-[calc(56%+10px)]" />
          <BuyPanel
            title={localizedTitle || t('fallback.pictureFrame')}
            subtitle={frame?.specifications?.['Frame Type'] ?? t('fallback.customPictureFrame')}
            sizes={sizes}
            priceLabel={priceLabel}
            oldPriceLabel={oldPriceLabel}
            isFloating={(frame?.specifications?.['Frame Type'] ?? '').toLowerCase().includes('floating')}
            service={service}
            onService={setService}
            size={size}
            sizeDisplay={sizeDisplay}
            onSize={handleSelectSize}
            paperTypes={frame?.paperTypes ?? []}
            paperTypeId={paperTypeId}
            onPaperType={setPaperTypeId}
            mdfBoards={frame?.mdfBoards ?? []}
            mdfBoardId={mdfBoardId}
            onMdfBoard={setMdfBoardId}
            laminations={frame?.laminations ?? []}
            laminationId={laminationId}
            onLamination={setLaminationId}
            glassTypes={frame?.glassTypes ?? []}
            glassTypeId={glassTypeId}
            onGlassType={setGlassTypeId}
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
        <CustomSizeDialog
          open={customOpen}
          onOpenChange={setCustomOpen}
          sizeFrom={frame?.sizeFrom ?? 0}
          sizeTo={frame?.sizeTo ?? 0}
          initialW={customW || Math.max(1, Math.round(frame?.sizeFrom || 20))}
          initialH={customH || Math.max(1, Math.round(frame?.sizeFrom || 20))}
          canConfirm={priced}
          priceLabelFor={(w, h) =>
            frame && frame.pricePerCm > 0
              ? formatOMR(productPrice(frame.pricePerCm, frame.wasteValue, w, h, optionsPricePerCm))
              : '—'
          }
          onConfirm={(w, h) => {
            setCustomW(w)
            setCustomH(h)
            setSize(CUSTOM_SIZE)
          }}
        />

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
  isFloating,
  size,
  onSize,
  paperTypes,
  paperTypeId,
  onPaperType,
  mdfBoards,
  mdfBoardId,
  onMdfBoard,
  laminations,
  laminationId,
  onLamination,
  glassTypes,
  glassTypeId,
  onGlassType,
  onUpload,
  onAddToCart,
  onCustomOrder,
  onOpenCustom,
  priced,
  hasSize,
  outOfRange,
  isCustom,
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
  /** Floating frames are stretched — their services are labelled "+ Stretch". */
  isFloating: boolean
  size: string
  onSize: (s: string) => void
  paperTypes: { id: string; name: string }[]
  paperTypeId: string | null
  onPaperType: (id: string) => void
  mdfBoards: { id: string; name: string }[]
  mdfBoardId: string | null
  onMdfBoard: (id: string) => void
  laminations: { id: string; name: string }[]
  laminationId: string | null
  onLamination: (id: string) => void
  glassTypes: { id: string; name: string }[]
  glassTypeId: string | null
  onGlassType: (id: string) => void
  onUpload: () => void
  onAddToCart: () => void
  onCustomOrder: () => void
  onOpenCustom: () => void
  priced: boolean
  hasSize: boolean
  outOfRange: boolean
  isCustom: boolean
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

      {/* Service — offered on every frame, whatever its Frame Type. */}
      <p className="mt-6 text-base font-semibold text-foreground">{t('buyPanel.chooseService')}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => {
          const selected = service === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onService(s.id)}
              aria-pressed={selected}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-left transition"
              style={{
                // min-height, not height: the labels wrap on narrow columns and
                // at browser zoom, and a fixed box made them spill out of it.
                minHeight: '49px',
                background: '#F6F6F6',
                outline: selected
                  ? '1.5px solid #002365'
                  : '1.5px solid transparent',
                outlineOffset: '-1px',
              }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border-black/[0.06]">
                <img src={s.icon} alt="" className="h-5 w-auto" />
              </span>
              <span className="min-w-0">
                {/* leading-tight/snug rather than leading-none so a wrapped
                    second line does not collide with the line above it. */}
                <span className="block text-[16px] font-medium leading-tight text-foreground">
                  {t(isFloating ? s.floatingTitleKey : s.titleKey)}
                </span>
                <span className="mt-0.5 block text-[11px] font-normal leading-snug text-foreground/55">
                  {t(s.descKey)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Size */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground">{t('buyPanel.frameSize')}</p>
        <SizePicker sizes={sizes} value={size} displayValue={sizeDisplay} onChange={onSize} />
        {/* Decorative blue wash behind the buy panel — this page only. */}
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
      </div>

      {/* Paper Type / MDF / Lamination / Glass Type — only the values the
          admin assigned to this frame; a section is hidden entirely when
          none are assigned (e.g. lamination & glass don't apply to stretched
          canvas frames). MDF + Lamination sit side by side when both exist. */}
      <OptionPillGroup label={t('buyPanel.paperType')} items={paperTypes} value={paperTypeId} onChange={onPaperType} />
      {(mdfBoards.length > 0 || laminations.length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          <OptionPillGroup label={t('buyPanel.mdfType')} items={mdfBoards} value={mdfBoardId} onChange={onMdfBoard} />
          <OptionPillGroup label={t('buyPanel.lamination')} items={laminations} value={laminationId} onChange={onLamination} />
        </div>
      )}
      <OptionPillGroup label={t('buyPanel.glassType')} items={glassTypes} value={glassTypeId} onChange={onGlassType} />

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
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-black/[0.07] py-6">
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

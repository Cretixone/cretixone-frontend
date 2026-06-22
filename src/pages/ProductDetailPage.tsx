import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Home, Upload } from 'lucide-react'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editorStore'
import { cn } from '@/lib/utils'

// ── Mock product data (specs aren't on the frame API yet — mirrors the Figma
// spec). The gallery uses the bundled lifestyle slides; with 8 images it also
// exercises the "many thumbnails" scrolling case. ──────────────────────────
const GALLERY = [
  '/images/webp/slide-1.webp',
  '/images/webp/slide-2.webp',
  '/images/webp/slide-3.webp',
  '/images/webp/slide-4.webp',
  '/images/webp/slide-5.webp',
  '/images/webp/slide-6.webp',
  '/images/webp/slide-7.webp',
  '/images/webp/slide-8.webp',
]

const SERVICES = [
  {
    id: 'frame-only',
    title: 'Frame Only',
    desc: 'Frame it yourself, effortlessly.',
    icon: '/images/svg/frame-img-icon.svg',
  },
  {
    id: 'print-frame',
    title: 'Print + Frame',
    desc: 'Printed, framed & wall-ready.',
    icon: '/images/svg/frame-icon.svg',
  },
] as const

const SIZES = ['8"x10"', '11"x14"', '16"x20"', '18"x24"', '24"x36"', '30"x40"']

const SPECS: Array<[string, string]> = [
  ['Color', 'Black'],
  ['Color Family', 'Neutral'],
  ['Decor Style', 'Modern'],
  ['Featured', 'Featured'],
  ['Finish', 'Satin'],
  ['Frame Type', 'Floating'],
  ['Frame Width', '5/16"'],
  ['Image / Art Sizes', 'Custom Sizes'],
  ['Material', 'Wood'],
  ['Rabbet Depth', '¾"'],
  ['Substrates', 'Canvas'],
  ['SKU', 'CF1'],
  ['Max Size', 'Available up to 80".'],
]

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

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
  const [size, setSize] = useState<string>(SIZES[0])
  const [added, setAdded] = useState(false)

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

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-sm text-foreground/70"
        >
          <Link to="/" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-foreground/40">›</span>
          <Link to="/products" className="hover:text-brand-navy">
            Canvas Prints
          </Link>
        </nav>

        {/* Gallery + buy panel */}
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <Gallery images={GALLERY} className="lg:w-[56%]" />
          <BuyPanel
            service={service}
            onService={setService}
            size={size}
            onSize={setSize}
            added={added}
            onAddToCart={() => setAdded(true)}
            onUpload={openEditor}
            className="lg:flex-1"
          />
        </div>

        {/* Description */}
        <section className="mt-12 max-w-4xl">
          <h2 className="text-xl font-semibold text-brand-navy">
            Product Description
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/75">
            <p>
              This satin black frame brings a distinctive gallery-ready
              presentation to your art for a truly timeless look. Made of
              natural wood by Artisans in America, this floater frame features a
              deep rabbet for up to 3/4&quot; canvas that suspends and separates
              your art from the moulding.
            </p>
            <p>
              Includes brackets and screws for attaching canvas to moulding,
              plus wire and heavy-duty D-rings for easy hanging.
            </p>
            <p>
              Tip: Stretched canvas can warp slightly, so measure dimensions at
              the corners for accurate sizing.
            </p>
          </div>
        </section>

        {/* Specifications */}
        <section className="mt-10 max-w-4xl">
          <h2 className="text-xl font-semibold text-brand-navy">
            Product Details
          </h2>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Specifications
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
            {SPECS.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-black/[0.06] py-2.5 text-sm"
              >
                <dt className="font-semibold text-foreground">{label}:</dt>
                <dd className="text-right text-foreground/70">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <Footer />
    </div>
  )
}

// ── Gallery: thumbnails + hover-zoom main image ─────────────────────────────
function Gallery({
  images,
  className,
}: {
  images: string[]
  className?: string
}) {
  const [active, setActive] = useState(0)
  const src = images[active] ?? images[0]

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {/* Thumbnails — horizontal scroll on mobile, vertical scroll column on
            ≥sm. Both scroll so any number of images stays contained. */}
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
                aria-label={`View image ${i + 1}`}
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
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>

        {/* Main image with cursor-tracking hover zoom */}
        <div className="relative min-w-0 flex-1">
          <ZoomImage src={src} alt="Product preview" />
        </div>
      </div>
    </div>
  )
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(false)
  // transform-origin follows the cursor; only `transform` is transitioned, so
  // the scale eases in/out while panning stays instant (origin isn't animated).
  const [origin, setOrigin] = useState('50% 50%')

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  return (
    <div
      className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#EDE6D6] sm:aspect-auto sm:h-[420px] lg:h-[480px]"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={onMove}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: zoom ? 'scale(2.2)' : 'scale(1)',
          transformOrigin: origin,
        }}
      />
      {/* Hover hint — fades out once zooming */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white/95 backdrop-blur-sm transition-opacity',
          zoom ? 'opacity-0' : 'opacity-100',
        )}
      >
        Hover to zoom · move to pan
      </div>
    </div>
  )
}

// ── Buy panel ───────────────────────────────────────────────────────────────
function BuyPanel({
  service,
  onService,
  size,
  onSize,
  added,
  onAddToCart,
  onUpload,
  className,
}: {
  service: string
  onService: (id: string) => void
  size: string
  onSize: (s: string) => void
  added: boolean
  onAddToCart: () => void
  onUpload: () => void
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-brand-navy md:text-[28px]">
        John - Satin Black
      </h1>
      <p className="mt-1.5 text-sm text-foreground/60">
        Modern Black Canvas Floater Frame
      </p>

      {/* Service */}
      <p className="mt-6 text-base font-semibold text-foreground">
        Choose Your Service
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
                  {s.title}
                </span>
                <span className="mt-1 block text-[11px] font-normal leading-none text-foreground/55">
                  {s.desc}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Size + upload */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Frame Size</p>
          <SizePicker sizes={SIZES} value={size} onChange={onSize} />
        </div>
        {service === 'print-frame' && (
          <Button
            variant="outline"
            onClick={onUpload}
            className="gap-2 border-brand-navy/40 bg-transparent text-brand-navy hover:bg-brand-navy/5"
          >
            <Upload className="h-4 w-4" />
            Upload a preview image
          </Button>
        )}
      </div>

      {/* Price + add to cart */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.07] pt-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold text-brand-navy">
            $156.06
          </span>
          <span className="text-sm text-foreground/40 line-through">
            $222.94
          </span>
        </div>
        <Button
          variant="navy"
          size="lg"
          onClick={onAddToCart}
          className="min-w-[140px] rounded-lg"
        >
          {added ? 'Added to cart ✓' : 'Add to cart'}
        </Button>
      </div>
    </div>
  )
}

function SizePicker({
  sizes,
  value,
  onChange,
}: {
  sizes: string[]
  value: string
  onChange: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium text-foreground">
          {value}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground/70 transition hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
          >
            More sizes
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

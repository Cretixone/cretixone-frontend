import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2 } from 'lucide-react'

import { Lightbox } from '@/components/Lightbox'
import { cn } from '@/lib/utils'

// Extracted from ProductDetailPage so the custom-print detail page renders an
// identical gallery. Strings stay in the productDetail namespace, which both
// pages load.
export function ProductGallery({
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row lg:h-full">
        {/* Thumbnails — shown only when there's more than one image. Horizontal
            scroll on mobile, vertical scroll column on ≥sm. */}
        {images.length > 1 && (
          <div
            className={cn(
              'flex shrink-0 gap-2.5 overflow-x-auto pb-1',
              'sm:max-h-[480px] sm:w-[84px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0 sm:pr-1',
              // min-h-0 overrides the flex-item default min-height:auto, which
              // otherwise forces this column to grow to fit all thumbnails
              // instead of respecting h-full + scrolling — that growth was
              // what made the main image (which mirrors this column's full
              // height) taller than the buy panel.
              'lg:h-full lg:min-h-0 lg:max-h-none',
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
        <div className="relative min-w-0 flex-1 lg:h-full">
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EDE6D6] sm:aspect-auto sm:h-[420px] lg:h-full">
            {/* absolute + inset-0 takes the img out of the flow entirely —
                otherwise its percentage height against this box (itself
                percentage-sized during flex stretch) falls back to the
                photo's intrinsic aspect ratio, inflating this whole column
                taller than the buy panel. */}
            {/* No images at all: leave the tinted box empty rather than
                rendering a broken <img> or an unrelated stock photo. The
                expand control is hidden too, since there's nothing to open. */}
            {src && (
              <>
                <img
                  src={src}
                  alt={t('gallery.previewAlt')}
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={t('aria.viewFullscreen')}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-80 backdrop-blur-sm transition hover:bg-black/70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            )}
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

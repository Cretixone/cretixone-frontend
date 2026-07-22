import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  images: string[]
  index: number
  open: boolean
  onIndex: (i: number) => void
  onClose: () => void
}

/**
 * Full-screen image lightbox with prev/next navigation. No download control by
 * design; right-click/drag are disabled to discourage saving. Keyboard: Esc to
 * close, ← / → to navigate.
 */
export function Lightbox({ images, index, open, onIndex, onClose }: Props) {
  const { t } = useTranslation('cart')
  const count = images.length
  const go = (delta: number) => onIndex((index + delta + count) % count)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, count])

  const btn =
    'flex items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onContextMenu={(e) => e.preventDefault()}
          role="dialog"
          aria-modal="true"
          aria-label={t('lightbox.viewer')}
        >
          {/* Close */}
          <button onClick={onClose} aria-label={t('lightbox.close')} className={cn(btn, 'absolute right-4 top-4 z-10 h-10 w-10')}>
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {count > 1 && (
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
              {index + 1} / {count}
            </div>
          )}

          {/* Prev / Next */}
          {count > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                aria-label={t('lightbox.prev')}
                className={cn(btn, 'absolute left-3 top-1/2 z-10 h-11 w-11 -translate-y-1/2 sm:left-6')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1) }}
                aria-label={t('lightbox.next')}
                className={cn(btn, 'absolute right-3 top-1/2 z-10 h-11 w-11 -translate-y-1/2 sm:right-6')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <motion.img
            key={index}
            src={images[index]}
            alt=""
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-h-[82vh] max-w-[92vw] select-none object-contain"
          />

          {/* Thumbnail strip */}
          {count > 1 && (
            <div
              className="absolute bottom-4 left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 gap-2 overflow-x-auto px-2 [scrollbar-width:none]"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onIndex(i)}
                  aria-label={t('lightbox.goToImage', { number: i + 1 })}
                  className={cn(
                    'h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition',
                    i === index ? 'border-white' : 'border-white/25 opacity-60 hover:opacity-100',
                  )}
                >
                  <img src={img} alt="" draggable={false} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

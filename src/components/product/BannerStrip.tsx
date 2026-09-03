import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const BANNER_IMAGES = [
  '/images/webp/slide-1.webp',
  '/images/webp/slide-2.webp',
  '/images/webp/slide-3.webp',
  '/images/webp/slide-4.webp',
]

/**
 * Four lifestyle images in a rounded panel. Shared by /products and /gifts so
 * both listing pages open with the same strip rather than two copies that
 * could drift apart.
 */
export function BannerStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mt-8 grid grid-cols-2 gap-1 overflow-hidden rounded-3xl bg-[#EDE6D6] md:grid-cols-4"
    >
      {BANNER_IMAGES.map((src, i) => (
        <div
          key={src}
          className={cn(
            'h-44 bg-cover bg-center md:h-[300px]',
            i === 0 && 'rounded-l-3xl',
            i === BANNER_IMAGES.length - 1 && 'rounded-r-3xl',
          )}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </motion.div>
  )
}

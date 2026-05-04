import { motion } from 'framer-motion'

const HERO_IMAGE = '/images/webp/photo-stocks.webp'
const STOCKS_VECTOR = '/images/svg/stocks-vector.svg'

// Tailwind arbitrary value: padding that lines up with the rest of the page's
// 1400px-centered content area on wide viewports, while never going below 2.5rem.
//   max(2.5rem, (100vw - 1400px) / 2 + 2.5rem)
const CONTENT_LEFT_PAD =
  'md:pl-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))]'

export default function PhotoStocks() {
  return (
    <section
      aria-labelledby="photostocks-title"
      className="relative w-full overflow-hidden bg-white pb-20 md:pb-24 lg:pb-28"
    >
      {/* Decorative gold "C" vector — perfectly centered in the section
          (equal distance from top/bottom and left/right). The SVG has its own
          opacity (0.25) and gold-gradient stroke baked in, so it renders as a
          soft watermark. Hidden on mobile where the columns stack and the
          vector would sit awkwardly between rows.

          Note: x/y translate is part of the motion target (not a Tailwind
          class) because framer-motion's `scale` transform would otherwise
          override `-translate-x-1/2 -translate-y-1/2`. */}
      <motion.img
        src={STOCKS_VECTOR}
        alt=""
        aria-hidden
        initial={{ opacity: 0, scale: 0.92, x: '-40%', y: '-47%' }}
        whileInView={{ opacity: 1, scale: 1, x: '-40%', y: '-47%' }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden h-auto w-[460px] md:block lg:w-[560px] xl:w-[640px]"
      />

      {/* No max-width wrapper here on purpose: the right-hand image is
          intentionally full-bleed to the page edge, while the left-hand text
          still lines up with content from the other sections. */}
      <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
        {/* Left column: copy */}
        <motion.div
          className={`relative px-6 md:pr-0 ${CONTENT_LEFT_PAD}`}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="relative z-10 max-w-xl"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
            }}
          >
            <motion.h2
              id="photostocks-title"
              className="text-4xl font-medium tracking-tight text-brand-navy lg:text-[55px]"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
              }}
            >
              Photo Stocks
            </motion.h2>
            <motion.p
              className="mt-6 max-w-md text-sm text-foreground/75 md:text-[17px]"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
              }}
            >
              A Digital platform for photographers and artist-
            </motion.p>
            <motion.p
              className=" text-3xl font-dm font-medium tracking-tight text-foreground sm:text-4xl lg:text-4xl"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
              }}
            >
              launching soon...
            </motion.p>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="relative px-6 md:px-0"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        >
          <div
            className="ml-auto aspect-[666/587] w-full max-w-[666px] overflow-hidden bg-neutral-200 bg-cover bg-center shadow-[0_24px_50px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5 rounded-[28px] md:rounded-r-none md:rounded-l-[32px]"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
            role="img"
            aria-label="Photographer and designer working with the Cretixone marketplace"
          />
        </motion.div>
      </div>
    </section>
  )
}

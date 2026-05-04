import { motion, type Variants } from 'framer-motion'
import CategoryCard from '@/components/landing/CategoryCard'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { label: 'Frames', image: '/images/webp/frames.webp', href: '#frames' },
  { label: 'Printing', image: '/images/webp/printing.webp', href: '#printing' },
  { label: 'Mirror & Glasses', image: '/images/webp/miror-galsses.webp', href: '#mirror' },
  { label: 'Gifts', image: '/images/webp/gifts.webp', href: '#gifts' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Categories() {
  return (
    <section
      aria-labelledby="categories-title"
      className="relative w-full py-20 md:py-24 lg:py-28"
    >
      {/* Blue blur — figma Ellipse 2521. 494×494 disc with heavy blur,
          positioned half off-screen on the left so only the right edge of
          the soft glow is visible behind the first (Frames) card. The
          section's `overflow-hidden` clips the off-screen-left half so it
          can't trigger horizontal scroll. */}
      <div
        aria-hidden
        className="pointer-events-none z-10 absolute top-[30%] rounded-full"
        style={{
          width: '450px',
          height: '450px',
          background: 'rgba(65, 105, 226, 0.18)',
          filter: 'blur(150px)',
          left: '-225px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          className="mx-auto max-w-6xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.h2
            id="categories-title"
            className="lg:text-[50px] font-display text-3xl tracking-tight text-brand-navy sm:text-4xl md:text-5xl font-medium"
            variants={fadeUp}
          >
            Frame Your Moments. Elevate Your Space
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xxl tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            Museum-quality frames crafted for your memories. Designed online.
            Delivered ready to hang.
          </motion.p>
        </motion.div>

        {/* "View All" CTA — right aligned above the grid */}
        <motion.div
          className="mt-10 flex justify-end md:mt-12"
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Button
            variant="gold"
            size="sm"
            className="h-9 rounded-full px-5 text-xs font-medium tracking-wide shadow-md"
          >
            View All
          </Button>
        </motion.div>

        {/* Card grid: 2 cols on mobile, 4 cols on md+ */}
        <motion.div
          className="mt-6 grid grid-cols-1 gap-5 md:mt-8 lg:grid-cols-4 md:grid-cols-2 md:gap-6 lg:gap-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
          }}
        >
          {CATEGORIES.map((c) => (
            <motion.div key={c.label} variants={fadeUp}>
              <CategoryCard label={c.label} image={c.image} href={c.href} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

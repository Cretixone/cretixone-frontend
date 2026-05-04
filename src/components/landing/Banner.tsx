import { motion } from 'framer-motion'
import Navbar from '@/components/landing/Navbar'
import { Button } from '@/components/ui/button'

const HERO_IMAGE = '/images/webp/banner.webp'

export default function Banner() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col overflow-hidden md:min-h-[min(100vh,850px)]"
    >
      {/* Background image — covers the full section, including the navbar area */}
      <motion.div
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundColor: '#EDE6D6',
        }}
      />

      {/* Soft cream gradient — lifts text contrast over the image's lighter side */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(243,239,232,0.92) 0%, rgba(243,239,232,0.72) 38%, rgba(243,239,232,0.12) 65%, rgba(243,239,232,0) 100%)',
        }}
      />

      {/* Figma blur ellipse — soft #D9D9D9 disc with heavy blur sitting behind
          the hero text content. Sized/positioned proportionally to the figma
          spec (1530×1530, left:-707, top:-374 against a ~1440-wide hero). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 hidden md:block"
        style={{
          width: '1530px',
          height: '1530px',
          left: '-707px',
          top: '-374px',
          borderRadius: '9999px',
          background: '#D9D9D9',
          filter: 'blur(303.35px)',
          opacity: 0.55,
        }}
      />

      {/* Navbar sits inside the section so it overlays the hero image */}
      <Navbar />

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 content-center items-center gap-8 px-6 py-6 md:grid-cols-12 md:px-10 md:py-10 lg:gap-12 lg:py-12">
        <motion.div
          className="md:col-span-6 lg:col-span-7"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
          }}
        >
          <motion.h1
            id="hero-title"
            className="font-display font-bold text-5xl leading-[1.05] tracking-tight text-brand-navy sm:text-6xl lg:text-[100px]"
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
            }}
          >
            Your Legacy,
            <span className="block text-foreground lg:text-[60px] mt-3">Archived in Elegance.</span>
          </motion.h1>

          <motion.p
            className="my-10 max-w-md font-normal leading-relaxed text-foreground/80 md:text-[16px]"
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
          >
            We combine museum-grade materials with modern design to create
            custom frames that don&apos;t just protect your art—they elevate it
            to gallery status.
          </motion.p>

          <motion.div
            className="mt-12"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
          >
            <Button
              variant="gold"
              size="pill"
              className="h-12 px-10 text-xs font-semibold uppercase tracking-[0.08em] shadow-lg shadow-brand-gold/30 hover:shadow-xl hover:shadow-brand-gold/40"
            >
              Buy Your Design
            </Button>
          </motion.div>
        </motion.div>

        {/* Right column intentionally empty on desktop — the background image
            occupies the right half. On mobile we drop a smaller decorative
            framed image so the hero still feels complete on phones. */}
        <div className="md:col-span-6 lg:col-span-7" aria-hidden />
      </div>

      {/* Mobile-only foreground image — keeps the hero meaningful on small
          screens where the desktop background composition isn't readable. */}
      <div className="md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="mx-6 -mt-6 mb-12 h-64 rounded-2xl bg-cover bg-center shadow-xl"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundColor: '#D6CDB8',
          }}
        />
      </div>
    </section>
  )
}

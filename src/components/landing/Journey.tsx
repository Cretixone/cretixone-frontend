import { motion, type Variants } from 'framer-motion'
import JourneyStep from '@/components/landing/JourneyStep'

const STEPS = [
  {
    iconSrc: '/images/svg/upload-icon.svg',
    iconAlt: 'Upload icon',
    title: 'Upload your photo',
    description: 'Upload your photo or artwork.',
  },
  {
    iconSrc: '/images/svg/choose-style.svg',
    iconAlt: 'Frame and matting icon',
    title: 'Choose your Style',
    description: 'Select your frame and matting',
  },
  {
    iconSrc: '/images/svg/ready-delivery.svg',
    iconAlt: 'Gift box delivery icon',
    title: 'Gallery- ready delivery',
    description: 'Receive it ready to hand',
    active: true,
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Journey() {
  return (
    <section
      aria-labelledby="journey-title"
      className="relative w-full bg-white"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          className="mx-auto text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.h2
            id="journey-title"
            className="font-display md:text-5xl font-medium tracking-tight text-brand-navy text-3xl"
            variants={fadeUp}
          >
            A Curated Journey
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-xxl font-normal tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            A thoughtfully crafted path designed to guide every step with
            purpose and precision.
          </motion.p>
        </motion.div>

        {/* Single shared row: light-blue background with rounded left/right
            ends. Three steps sit inside it without their own bg. The active
            step renders its own ring on top. On mobile the row stacks
            vertically with the same shared rounding. */}
        <motion.div
          className="mt-12 overflow-hidden rounded-[32px] bg-[#F1F7FF] md:mt-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
            }}
          >
            {STEPS.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp}>
                <JourneyStep
                  iconSrc={s.iconSrc}
                  iconAlt={s.iconAlt}
                  title={s.title}
                  description={s.description}
                  showLeftBorder={i > 0}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

import { motion, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import JourneyStep from '@/components/landing/JourneyStep'

const STEPS = [
  {
    iconSrc: '/images/svg/upload-icon.svg',
    iconAltKey: 'journey.steps.upload.iconAlt',
    titleKey: 'journey.steps.upload.title',
    descriptionKey: 'journey.steps.upload.description',
  },
  {
    iconSrc: '/images/svg/choose-style.svg',
    iconAltKey: 'journey.steps.style.iconAlt',
    titleKey: 'journey.steps.style.title',
    descriptionKey: 'journey.steps.style.description',
  },
  {
    iconSrc: '/images/svg/ready-delivery.svg',
    iconAltKey: 'journey.steps.delivery.iconAlt',
    titleKey: 'journey.steps.delivery.title',
    descriptionKey: 'journey.steps.delivery.description',
    active: true,
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Journey() {
  const { t } = useTranslation('landing')
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
            {t('journey.title')}
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-xxl font-normal tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            {t('journey.description')}
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
              <motion.div key={s.titleKey} variants={fadeUp}>
                <JourneyStep
                  iconSrc={s.iconSrc}
                  iconAlt={t(s.iconAltKey)}
                  title={t(s.titleKey)}
                  description={t(s.descriptionKey)}
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

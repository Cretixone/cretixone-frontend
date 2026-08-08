import { motion, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import StackSlider from '@/components/landing/StackSlider'

// Each label describes what's actually in its photo — StackSlider renders the
// active one as prominent copy under the slider (and keys slides by it, so
// they must stay unique).
const SPACES = [
  { labelKey: 'spaces.items.bedroom', image: '/images/spaces/bedroom.png' },
  { labelKey: 'spaces.items.livingRoom', image: '/images/spaces/living-room.png' },
  { labelKey: 'spaces.items.guestRoom', image: '/images/spaces/guest-room.png' },
  { labelKey: 'spaces.items.lounge', image: '/images/spaces/lounge.png' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Spaces() {
  const { t } = useTranslation('landing')
  return (
    <section
      aria-labelledby="spaces-title"
      className="relative w-full overflow-hidden bg-white py-20 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.h2
            id="spaces-title"
            className="font-display text-3xl leading-tight font-medium tracking-tight text-brand-navy md:text-5xl"
            variants={fadeUp}
          >
            {t('spaces.title.line1')}
            <br />
            {t('spaces.title.line2')}
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xxl tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            {t('spaces.description')}
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        >
          <StackSlider
            slides={SPACES.map((s) => ({ label: t(s.labelKey), image: s.image }))}
          />
        </motion.div>
      </div>
    </section>
  )
}

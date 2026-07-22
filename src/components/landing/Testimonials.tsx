import { motion, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import TestimonialCard from '@/components/landing/TestimonialCard'

import 'swiper/css'
import 'swiper/css/pagination'

// User-facing name/location/quote are resolved from the `landingSections`
// namespace at render time (key = `testimonials.items.<id>`); only avatar and
// rating stay hardcoded here.
const TESTIMONIALS: { id: string; avatar: string; rating: number }[] = [
  { id: 'viezh', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', rating: 4.5 },
  { id: 'yessica', avatar: 'https://randomuser.me/api/portraits/men/39.jpg', rating: 4.5 },
  { id: 'kim', avatar: 'https://randomuser.me/api/portraits/men/40.jpg', rating: 4.5 },
  { id: 'maria', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', rating: 4.5 },
  { id: 'daniel', avatar: 'https://randomuser.me/api/portraits/men/42.jpg', rating: 4.5 },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Testimonials() {
  const { t } = useTranslation('landingSections')
  const dir = useDirection()
  return (
    <section
      aria-labelledby="testimonials-title"
      className="relative w-full bg-gradient-to-b pb-20 lg:pb-24"
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
            id="testimonials-title"
            className="text-3xl tracking-tight text-brand-navy font-medium md:text-5xl"
            variants={fadeUp}
          >
            {t('testimonials.title')}
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-xxl tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            {t('testimonials.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          className="relative mt-12 md:mt-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <Swiper
            key={dir}
            dir={dir}
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={40}
            pagination={{
              clickable: true,
              el: '.testimonials-pagination',
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 32 },
              1024: { slidesPerView: 3, spaceBetween: 40 },
            }}
            className="!pb-[70px]"
          >
            {TESTIMONIALS.map((item) => (
              <SwiperSlide key={item.id} className="!h-auto">
                <TestimonialCard
                  name={t(`testimonials.items.${item.id}.name`)}
                  location={t(`testimonials.items.${item.id}.location`)}
                  quote={t(`testimonials.items.${item.id}.quote`)}
                  avatar={item.avatar}
                  rating={item.rating}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <div
            className="testimonials-pagination flex gap-2"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 20,
              left: 'auto',
              top: 'auto',
              width: 'auto',
              zIndex: 20,
            }}
          />
        </motion.div>
      </div>
      <style>{`
        .testimonials-pagination {
          position: absolute !important;
          right: 0 !important;
          bottom: 10px !important;
          left: auto !important;
          top: auto !important;
          width: auto !important;
        }
        .testimonials-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #D1D5DB;
          opacity: 1;
          border-radius: 9999px;
          margin: 0 !important;
          transition: width 200ms ease, background-color 200ms ease;
        }
        .testimonials-pagination .swiper-pagination-bullet-active {
          width: 28px;
          background: #002365;
        }
      `}</style>
    </section>
  )
}

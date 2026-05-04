import { motion, type Variants } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import TestimonialCard, {
  type TestimonialCardProps,
} from '@/components/landing/TestimonialCard'

import 'swiper/css'
import 'swiper/css/pagination'

const TESTIMONIALS: TestimonialCardProps[] = [
  {
    name: 'Viezh Robert',
    location: 'Warsaw, Poland',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 4.5,
    quote:
      'Wow… I am very happy to use this VPN, it turned out to be more than my expectations and so far there have been no problems. LaslesVPN always the best.',
  },
  {
    name: 'Yessica Christy',
    location: 'Shanxi, China',
    avatar: 'https://randomuser.me/api/portraits/men/39.jpg',
    rating: 4.5,
    quote:
      'Wow… I am very happy to use this VPN, it turned out to be more than my expectations and so far there have been no problems. LaslesVPN always the best.',
  },
  {
    name: 'Kim Young Jou',
    location: 'Seoul, South Korea',
    avatar: 'https://randomuser.me/api/portraits/men/40.jpg',
    rating: 4.5,
    quote:
      'Wow… I am very happy to use this VPN, it turned out to be more than my expectations and so far there have been no problems. LaslesVPN always the best.',
  },
  {
    name: 'Maria Stevens',
    location: 'Lisbon, Portugal',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
    rating: 4.5,
    quote:
      'Wow… I am very happy to use this VPN, it turned out to be more than my expectations and so far there have been no problems. LaslesVPN always the best.',
  },
  {
    name: 'Daniel Park',
    location: 'Vancouver, Canada',
    avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
    rating: 4.5,
    quote:
      'Wow… I am very happy to use this VPN, it turned out to be more than my expectations and so far there have been no problems. LaslesVPN always the best.',
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Testimonials() {
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
            Trusted by Thousands of Happy Customer
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-xxl tracking-[0.09em] text-sm text-foreground/80 md:text-base"
            variants={fadeUp}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut lab
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
            {TESTIMONIALS.map((t) => (
              <SwiperSlide key={t.name} className="!h-auto">
                <TestimonialCard {...t} />
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

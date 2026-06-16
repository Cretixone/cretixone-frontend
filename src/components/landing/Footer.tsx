import { Facebook, Twitter, Instagram } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Footer product links open the products screen. "All Frames" goes to the
// full listing; the rest carry a ?category= hint the products page reads to
// pre-filter the grid (unknown categories simply fall back to all frames).
const PRODUCT_LINKS = [
  { label: 'All Frames', href: '/products' },
  { label: 'Framed Prints', href: '/products?category=framed-prints' },
  { label: 'Canvas Prints', href: '/products?category=canvas-prints' },
  { label: 'Photo Prints', href: '/products?category=photo-prints' },
  { label: 'Gifts', href: '/products?category=gifts' },
  { label: 'Mirror Works', href: '/products?category=mirror-works' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Team', href: '#team' },
  { label: 'Testimonials', href: '#testimonials' },
]

const SOCIAL_LINKS = [
  { label: 'Discord', href: '#discord' },
  { label: 'Instagram', href: '#instagram' },
  { label: 'Twitter', href: '#twitter' },
  { label: 'Facebook', href: '#facebook' },
]

const SOCIAL_ICONS = [
  { Icon: Facebook, label: 'Facebook', href: '#facebook' },
  { Icon: Twitter, label: 'Twitter', href: '#twitter' },
  { Icon: Instagram, label: 'Instagram', href: '#instagram' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden text-foreground"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
        style={{
          bottom: '-186px',
          width: 'min(1560px, 140vw)',
          height: '270px',
          background: 'rgba(65, 105, 226, 0.2)',
          filter: 'blur(130px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-14 pb-6 md:px-10 md:pt-16 md:pb-8 lg:pt-20 lg:pb-10">
        {/* Top: brand + 3 link columns */}
        <motion.div
          className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8 lg:gap-12"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {/* Brand */}
          <motion.div className="md:col-span-4" variants={fadeUp}>
            <Link
              to="/"
              className="inline-flex items-center"
              aria-label="Cretixone home"
            >
              <img
                src="/images/svg/logo.svg"
                alt="Cretixone"
                className="h-8 w-auto md:h-9"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-foreground">
              Our vision is to provide convenience and help increase your sales
              business.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_ICONS.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1A202C] transition hover:text-brand-navy shadow-[0px_13px_18px_rgba(17,19,35,0.08)]"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Products */}
          <FooterColumn
            heading="Products"
            links={PRODUCT_LINKS}
            className="md:col-span-3"
          />

          {/* Company */}
          <FooterColumn
            heading="Company"
            links={COMPANY_LINKS}
            className="md:col-span-2"
          />

          {/* Socials (text links) */}
          <FooterColumn
            heading="Socials"
            links={SOCIAL_LINKS}
            className="md:col-span-3"
          />
        </motion.div>

        {/* Bottom row */}
        <motion.div
          className="mt-14 border-t border-[#486284]/[0.16] pt-6 md:mt-16 md:pt-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="flex flex-col gap-3 text-xs text-foreground sm:flex-row sm:items-center sm:justify-between md:text-[14px]">
            <p>©{new Date().getFullYear()} Cretixone. All rights reserved</p>
            <div className="flex items-center gap-8">
              <a
                href="#privacy"
                className="transition hover:text-brand-navy"
              >
                Privacy &amp; Policy
              </a>
              <Link
                to="/terms"
                className="transition hover:text-brand-navy"
              >
                Terms &amp; Condition
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

interface FooterColumnProps {
  heading: string
  links: { label: string; href: string }[]
  className?: string
}

function FooterColumn({ heading, links, className }: FooterColumnProps) {
  return (
    <motion.div className={cn(className)} variants={fadeUp}>
      <h3 className="text-[18px] font-medium text-foreground">{heading}</h3>
      <ul className="mt-5 space-y-3.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.href}
              className="text-[14px] text-[#1A202C] transition hover:text-brand-navy"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

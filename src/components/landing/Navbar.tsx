import { useEffect, useState } from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Globe,
  ShoppingBag,
  ImagePlus,
  Menu,
  X,
  ShoppingCart,
  Languages,
  User as UserIcon,
  Package,
  LogOut,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore, cartCount } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useAuthUiStore } from '@/store/authUiStore'
import { authApi } from '@/api/auth.api'
import { useUploadPhoto } from '@/hooks/useUploadPhoto'

function AccountButton() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)
  const openAuth = useAuthUiStore((s) => s.openAuth)

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        aria-label="Log in"
        onClick={() => openAuth('login')}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#B5C9F1] bg-[#4169E2] text-white"
      >
        <UserIcon className="h-4 w-4" />
      </button>
    )
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
  const logout = async () => {
    await authApi.logout()
    clear()
    navigate('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#B5C9F1] bg-[#4169E2] text-[11px] font-bold text-white"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-background border-0">
        <DropdownMenuLabel>
          <div className="truncate">{user?.firstName} {user?.lastName}</div>
          <div className="truncate text-[11px] font-normal lowercase text-foreground/50">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="border-t" />
        <DropdownMenuItem className="bg-background hover:text-brand-gold" onClick={() => navigate('/dashboard/profile')}>
          <UserIcon className="mr-2 h-4 w-4" /> My account
        </DropdownMenuItem>
        <DropdownMenuItem className="bg-background hover:text-brand-gold" onClick={() => navigate('/dashboard/orders')}>
          <Package className="mr-2 h-4 w-4" /> My orders
        </DropdownMenuItem>
        <DropdownMenuSeparator className="border-t" />
        <DropdownMenuItem onClick={logout} className="text-red-500">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const NAV_LINKS = [
  { label: 'All Frames', href: '/products' },
  { label: 'Custom Prints', href: '#prints' },
  { label: 'Stock Photo', href: '#stock' },
  { label: 'Custom Mirror', href: '#mirror' },
  { label: 'Gifts', href: '#gifts' },
  { label: 'About', href: '/about' },
]

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook', href: '#' },
  { Icon: Twitter, label: 'Twitter', href: '#'},
  { Icon: Instagram, label: 'Instagram', href: '#' },
]

const HEADER_H = 72
const STUCK_GAP = 14

interface CretixoneLogoProps {
  className?: string
}

function CretixoneLogo({ className }: CretixoneLogoProps) {
  return (
    <a
      href="/landing"
      className={cn('inline-flex items-center', className)}
      aria-label="Cretixone home"
    >
      <img
        src="/images/svg/logo.svg"
        alt="Cretixone"
        className="h-7 w-auto md:h-8"
      />
    </a>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const cartItemCount = useCartStore((s) => cartCount(s.items))
  const onUploadPhoto = useUploadPhoto()

  return (
    <>
      <motion.div
        className="relative z-30 w-full"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-10 md:py-5">
          {/* Socials */}
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ Icon, label, href }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className='flex h-7 w-7 items-center justify-center rounded-full text-white bg-[#4169E2]'
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.a>
            ))}
          </div>

          {/* Logo center */}
          <CretixoneLogo />

          {/* Right utilities */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className='flex h-7 w-7 border border-[#B5C9F1] items-center justify-center rounded-full text-white bg-[#4169E2]'
              aria-label="Language"
            >
              <Languages className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Cart"
              onClick={() => navigate('/cart')}
              className="relative text-[#4169E2]"
            >
              <ShoppingCart className="h-7 w-7" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#4169E2] px-1 text-[12px] font-semibold leading-none border border-[#B5C9F1] text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Account */}
            <AccountButton />

            {/* Mobile menu toggle — visible only below lg */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="ml-1 inline-flex items-center justify-center rounded-md p-1 text-brand-navy hover:bg-black/5 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu — drops down below the top header when opened. */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.nav
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-x-5 top-[60px] z-40 overflow-hidden rounded-2xl bg-brand-gold p-2 shadow-lg md:top-[72px] lg:hidden"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/95 hover:bg-white/15"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="mt-1.5">
                <Button
                  variant="navy"
                  size="pill"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false)
                    onUploadPhoto()
                  }}
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload Photo
                </Button>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

export function PillNav() {
  const [pillTop, setPillTop] = useState(HEADER_H)
  const [stuck, setStuck] = useState(false)
  const onUploadPhoto = useUploadPhoto()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setPillTop(Math.max(STUCK_GAP, HEADER_H - y))
      setStuck(y >= HEADER_H - STUCK_GAP)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className="pointer-events-none fixed inset-x-0 z-[60] hidden justify-center px-6 lg:flex"
      style={{ top: `${pillTop}px` }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-1 rounded-full bg-brand-gold p-1.5 pl-6 transition-shadow duration-300',
          stuck
            ? 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]'
            : 'shadow-md',
        )}
      >
        <ul className="flex items-center gap-1 pr-2">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <Link
                to={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/95 transition hover:bg-white/15"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Button
          variant="navy"
          size="pill"
          className="ml-1 gap-2 shadow-sm"
          onClick={onUploadPhoto}
        >
          <ImagePlus className="h-4 w-4" />
          Upload Photo
        </Button>
      </div>
    </motion.nav>
  )
}

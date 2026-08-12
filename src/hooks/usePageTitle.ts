import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BRAND = 'Cretixone'

/**
 * Per-route document titles. Kept in one place rather than sprinkled through the
 * pages so every route is accounted for and the brand suffix stays consistent.
 *
 * Keys are matched exactly first, then by longest prefix, so parameterised
 * routes (/product/:id, /checkout/complete/:orderId) resolve without needing an
 * entry per id.
 */
const TITLES: Record<string, string> = {
  '/': 'Custom Picture Frames & Printing in Oman',
  '/about': 'About Us',
  '/team': 'Our Team',
  '/testimonials': 'Customer Testimonials',
  '/terms': 'Terms & Conditions',
  '/privacy': 'Privacy Policy',
  '/products': 'Shop Picture Frames',
  '/product': 'Frame Details',
  '/custom-mirrors': 'Custom Mirrors',
  '/custom-prints/product': 'Print Details',
  '/custom-prints': 'Custom Prints',
  '/editor': 'Frame Designer',
  '/cart': 'Your Cart',
  '/checkout/complete': 'Order Complete',
  '/checkout': 'Checkout',
  '/dashboard/orders': 'My Orders',
  '/dashboard/profile': 'My Profile',
  '/dashboard': 'My Account',
}

function titleFor(pathname: string): string {
  const exact = TITLES[pathname]
  if (exact) return exact

  // Longest matching prefix wins, so '/checkout/complete/:id' picks
  // "Order Complete" rather than the shorter '/checkout' entry.
  let best = ''
  for (const path of Object.keys(TITLES)) {
    if (path !== '/' && pathname.startsWith(path) && path.length > best.length) best = path
  }
  return best ? TITLES[best]! : ''
}

/** Keeps document.title in sync with the active route. Mount once, in App. */
export function usePageTitle(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = titleFor(pathname)
    document.title = page ? `${page} | ${BRAND}` : `${BRAND} | Custom Picture Frames & Printing in Oman`
  }, [pathname])
}

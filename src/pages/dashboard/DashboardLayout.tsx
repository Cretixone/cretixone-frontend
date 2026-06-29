import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Package, User as UserIcon } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { to: '/dashboard/orders', label: 'My Orders', icon: Package },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    const prevBg = document.body.style.background
    document.body.style.background = '#f6f7f9'
    window.scrollTo(0, 0)
    return () => { document.body.style.background = prevBg }
  }, [])

  const logout = async () => {
    await authApi.logout()
    clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full bg-[#f6f7f9] font-sans text-[#000]">
      <header className="relative z-30 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-10 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-navy md:text-3xl">
            My Account
          </h1>
          <p className="mt-1 text-sm text-foreground/55">
            {user ? `Signed in as ${user.firstName} ${user.lastName} · ${user.email}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="flex gap-2 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-sm lg:flex-col">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-navy text-white'
                        : 'text-foreground/70 hover:bg-black/[0.04]',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </nav>
            <Link to="/products" className="mt-3 hidden text-center text-[12px] text-foreground/50 hover:text-brand-navy lg:block">
              ← Continue shopping
            </Link>
          </aside>

          {/* Content */}
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

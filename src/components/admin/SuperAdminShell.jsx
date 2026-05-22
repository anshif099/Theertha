import { LayoutDashboard, LogOut, PlusCircle, Settings2 } from 'lucide-react'
import BrandMark from '../BrandMark.jsx'

const navItems = [
  { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { label: 'Temples', href: '/superadmin#temples', icon: PlusCircle },
  { label: 'Register Temple', href: '/superadmin/temples/new', icon: Settings2 },
]

export default function SuperAdminShell({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] xl:block">
        <a href="/" aria-label="Back to THEERTHA landing page">
          <BrandMark compact />
        </a>
        <nav className="mt-10 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = window.location.pathname === item.href.split('#')[0]
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#D4A017]/14 text-[#F7D77C]'
                    : 'text-[#EFE6D3]/62 hover:bg-white/8 hover:text-[#F8F6F0]'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
          <p className="text-sm font-semibold text-[#F7D77C]">
            Super Admin Access
          </p>
          <p className="mt-2 text-xs leading-5 text-[#EFE6D3]/64">
            Temple records are stored locally for this frontend build.
          </p>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/82 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[#9C7414]">
                THEERTHA Control Room
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                Super Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="rounded-md border border-[#D4A017]/32 px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:bg-[#D4A017]/12"
              >
                View Site
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761]"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main
          id="temples"
          className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

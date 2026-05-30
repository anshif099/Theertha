import { useState } from 'react'
import { LayoutDashboard, LogOut, Menu, PlusCircle, Settings2, X } from 'lucide-react'
import BrandMark from '../BrandMark.jsx'

const navItems = [
  { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { label: 'Temples', href: '/superadmin#temples', icon: PlusCircle },
  { label: 'Register Temple', href: '/superadmin/temples/new', icon: Settings2 },
]

function SidebarContent({ onClose, showInfoCard = false }) {
  return (
    <>
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
              onClick={onClose}
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
      {showInfoCard && (
        <div className="mt-6 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
          <p className="text-sm font-semibold text-[#F7D77C]">
            Super Admin Access
          </p>
          <p className="mt-2 text-xs leading-5 text-[#EFE6D3]/64">
            Temple records sync to Firebase Realtime Database.
          </p>
        </div>
      )}
    </>
  )
}

export default function SuperAdminShell({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 xl:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SidebarContent onClose={() => setSidebarOpen(false)} showInfoCard />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 transition hover:bg-white/10 hover:text-[#F8F6F0]"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] xl:block">
        <SidebarContent onClose={undefined} />
        <div className="absolute inset-x-5 bottom-6 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
          <p className="text-sm font-semibold text-[#F7D77C]">
            Super Admin Access
          </p>
          <p className="mt-2 text-xs leading-5 text-[#EFE6D3]/64">
            Temple records sync to Firebase Realtime Database.
          </p>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/82 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Hamburger – mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] transition hover:bg-[#D4A017]/10 xl:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="pl-12 xl:pl-0">
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

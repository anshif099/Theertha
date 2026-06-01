import { useMemo } from 'react'
import {
  ArrowLeft,
  Building2,
  BedDouble,
  ClipboardList,
  Construction,
  FileText,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  PiggyBank,
  ReceiptText,
  Settings,
  Store,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useState } from 'react'
import BrandMark from '../components/BrandMark.jsx'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'

const FEATURE_META = {
  membership:    { label: 'Membership',    icon: UsersRound,  color: 'from-blue-500 to-indigo-600',   desc: 'Manage devotee memberships, subscriptions, and annual passes.' },
  temple:        { label: 'Temple',        icon: Landmark,    color: 'from-[#D4A017] to-amber-600',   desc: 'Manage temple profile, deity information, and festival calendar.' },
  devotees:      { label: 'Devotees',      icon: Heart,       color: 'from-rose-500 to-pink-600',     desc: 'Devotee database, family records, and spiritual history.' },
  elephant:      { label: 'Elephant',      icon: PawPrint,    color: 'from-emerald-500 to-teal-600',  desc: 'Manage temple elephants, mahouts, veterinary records and schedules.' },
  'guest-house': { label: 'Guest House',   icon: BedDouble,   color: 'from-sky-500 to-cyan-600',      desc: 'Room bookings, availability calendar, and guest check-in/out.' },
  store:         { label: 'Store',         icon: Store,       color: 'from-orange-500 to-red-500',    desc: 'Temple store inventory, prasadam sales, and product management.' },
  'fixed-deposit': { label: 'Fixed Deposit', icon: PiggyBank, color: 'from-violet-500 to-purple-600', desc: 'Track fixed deposits, maturity dates, and interest calculations.' },
}

const mainMenuItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter',    icon: ReceiptText,     href: '/temple/counter' },
  { label: 'Accounts',   icon: WalletCards,     href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList,   href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound,      href: '/temple/membership' },
  { label: 'Billing',    icon: FileText,        href: '/temple/billing' },
  { label: 'Temple',     icon: Landmark,        href: '/temple/profile' },
  { label: 'Assets',     icon: Building2,       href: '/temple/assets' },
  { label: 'Devotees',   icon: Heart,           href: '/temple/devotees' },
]
const addonItems = [
  { label: 'Elephant',      icon: PawPrint,  href: '/temple/under-development?f=elephant' },
  { label: 'Guest House',   icon: BedDouble, href: '/temple/under-development?f=guest-house' },
  { label: 'Store',         icon: Store,     href: '/temple/under-development?f=store' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/under-development?f=fixed-deposit' },
]

function getInitials(name = 'Temple') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
}

function SidebarContent({ session, onClose }) {
  const activeHref = window.location.pathname + window.location.search
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          const active = activeHref === item.href || activeHref.startsWith(item.href)
          return (
            <a key={item.label} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${active ? 'bg-[#D4A017]/14 text-[#F7D77C]' : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'}`}>
              <Icon size={18} aria-hidden="true" />{item.label}
            </a>
          )
        })}
      </nav>
      <p className="mt-6 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Addons</p>
      <nav className="mt-3 grid gap-2">
        {addonItems.map((item) => {
          const Icon = item.icon
          const active = activeHref === item.href
          return (
            <a key={item.label} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${active ? 'bg-[#D4A017]/14 text-[#F7D77C]' : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'}`}>
              <Icon size={18} aria-hidden="true" />{item.label}
            </a>
          )
        })}
      </nav>
      <div className="mt-6 border-t border-[#F8F6F0]/12 pt-4">
        <a href="/temple/settings" onClick={onClose}
          className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]">
          <Settings size={18} aria-hidden="true" />Settings
        </a>
      </div>
      <div className="mt-4 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
        <p className="text-sm font-semibold text-[#F7D77C]">Temple Access</p>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">{session?.loginId}</p>
      </div>
    </>
  )
}

export default function UnderDevelopmentPage() {
  const [session] = useState(getTempleSession)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const featureKey = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('f') || 'membership'
  }, [])

  const meta = FEATURE_META[featureKey] || {
    label: featureKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Construction,
    color: 'from-[#D4A017] to-amber-600',
    desc: 'This feature is currently under development.',
  }
  const Icon = meta.icon
  const initials = useMemo(() => {
    const name = session?.name || 'Temple'
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
  }, [session])

  if (!session) {
    window.location.href = '/temple-login'
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" aria-hidden="true"
          onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1"><SidebarContent session={session} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
      </aside>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent session={session} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] hover:bg-[#D4A017]/10 lg:hidden">
                <Menu size={22} />
              </button>
              <a href="/temple/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold text-[#9C7414] hover:text-[#0B1F3A] transition">
                <ArrowLeft size={15} /> Dashboard
              </a>
              <span className="text-[#9C7414]/40">/</span>
              <span className="text-sm font-semibold text-[#0B1F3A]">{meta.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-semibold text-[#F7D77C]">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); window.location.href = '/temple-login' }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16">
          <div className="w-full max-w-lg text-center">

            {/* Animated icon orb */}
            <div className="relative mx-auto mb-10 flex h-36 w-36 items-center justify-center">
              {/* Outer pulsing ring */}
              <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${meta.color} opacity-10 animate-ping`}
                style={{ animationDuration: '2.4s' }} />
              {/* Middle ring */}
              <span className={`absolute inset-3 rounded-full bg-gradient-to-br ${meta.color} opacity-15`} />
              {/* Inner solid orb */}
              <span className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${meta.color} shadow-[0_20px_60px_rgba(0,0,0,0.18)]`}>
                <Icon size={40} className="text-white drop-shadow" aria-hidden="true" />
              </span>
            </div>

            {/* Construction badge */}
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-4 py-1.5">
              <Construction size={13} className="text-[#9C7414]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#9C7414]">Under Development</span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-4xl font-bold text-[#0B1F3A] sm:text-5xl">
              {meta.label}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#42516A]">
              {meta.desc}
            </p>
            <p className="mt-2 text-sm text-[#42516A]/70">
              Our team is working hard to bring this feature to you soon.
            </p>

            {/* Progress indicator */}
            <div className="mx-auto mt-8 w-64">
              <div className="flex items-center justify-between text-xs font-semibold text-[#9C7414] mb-2">
                <span>Development progress</span>
                <span>Coming soon</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFE6D3]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${meta.color} animate-pulse`}
                  style={{ width: '35%' }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="/temple/dashboard"
                className="flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-6 py-3 text-sm font-semibold text-[#F8F6F0] shadow-[0_8px_24px_rgba(11,31,58,0.22)] transition hover:bg-[#123761] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(11,31,58,0.28)]">
                <ArrowLeft size={16} />
                Back to Dashboard
              </a>
              <a href="/temple/settings"
                className="flex items-center gap-2 rounded-xl border border-[#D4A017]/30 bg-white px-6 py-3 text-sm font-semibold text-[#9C7414] shadow-[0_4px_16px_rgba(11,31,58,0.06)] transition hover:bg-[#D4A017]/8 hover:-translate-y-0.5">
                <Settings size={16} />
                Go to Settings
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

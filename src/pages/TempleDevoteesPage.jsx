import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  Edit,
  Eye,
  FileText,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Phone,
  PiggyBank,
  ReceiptText,
  Settings,
  Store,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadMemberships } from '../lib/membershipStore.js'

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

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SidebarContent({ temple, onClose }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          const active = window.location.pathname === item.href
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
          return (
            <a key={item.label} href={item.href} onClick={onClose}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]">
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
        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">{temple?.loginId}</p>
      </div>
    </>
  )
}

export default function TempleDevoteesPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Devotees / Members list
  const [devotees, setDevotees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDevotee, setSelectedDevotee] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  // Load configuration & memberships (devotees)
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    
    loadMemberships(session.id)
      .then((list) => {
        setDevotees(list)
        if (list.length > 0) {
          setSelectedDevotee(list[0]) // Select first by default
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  // Search filter
  const filteredDevotees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return devotees
    return devotees.filter((d) =>
      d.devoteeName.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      (d.address || '').toLowerCase().includes(q)
    )
  }, [devotees, searchTerm])

  function handleEditRedirect(memberId) {
    window.location.href = `/temple/membership?edit=${memberId}`
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" aria-hidden="true"
          onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1"><SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10"><X size={20} /></button>
        </div>
      </aside>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent temple={temple} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] hover:bg-[#D4A017]/10 lg:hidden">
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#9C7414]">
                <Heart size={15} />
                <a href="/temple/dashboard" className="hover:text-[#0B1F3A] transition">Dashboard</a>
                <span className="text-[#9C7414]/40">/</span>
                <span className="text-[#0B1F3A]">Devotee Database (Members)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-semibold text-[#F7D77C]">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); window.location.href = '/temple-login' }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 space-y-8">
          
          {/* Main layout split */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            
            {/* ── LEFT PANEL: Devotees List ── */}
            <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden flex flex-col h-[650px]">
              
              {/* Header with Search */}
              <div className="p-5 border-b border-[#EFE6D3] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Devotee Directory</h2>
                  <p className="text-xs text-[#42516A]">Total registered members active in database</p>
                </div>
                {/* Search box */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search by name or phone…"
                  className="w-full sm:w-64 rounded-lg border border-[#D4A017]/30 bg-white px-3 py-2 text-xs font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]/20"
                />
              </div>

              {/* Devotees roster list */}
              <div className="flex-grow overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-center text-sm text-[#42516A]">Syncing devotee records…</p>
                ) : filteredDevotees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <Heart size={36} className="text-[#D4A017]/30" />
                    <p className="font-semibold text-[#0B1F3A]">No devotees found</p>
                    <p className="text-xs text-[#42516A]/80">Register a new member to see them in the database.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EFE6D3]">
                    {filteredDevotees.map((devotee) => {
                      const isSelected = selectedDevotee?.id === devotee.id
                      return (
                        <div
                          key={devotee.id}
                          onClick={() => setSelectedDevotee(devotee)}
                          className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition ${isSelected ? 'bg-[#D4A017]/8 border-l-4 border-l-[#D4A017]' : 'hover:bg-[#F8F6F0]/65 border-l-4 border-l-transparent'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-[#D4A017] text-white' : 'bg-[#D4A017]/10 text-[#9C7414]'}`}>
                              {devotee.devoteeName[0]?.toUpperCase() || 'D'}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-[#0B1F3A] truncate">{devotee.devoteeName}</h3>
                              <p className="text-[11px] text-[#42516A] flex items-center gap-1 font-semibold">
                                <Phone size={10} />
                                {devotee.mobile}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${devotee.plan === 'Yearly' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                              {devotee.plan}
                            </span>
                            <Eye size={14} className="text-[#9C7414]/70 hover:text-[#0B1F3A] transition" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ── RIGHT PANEL: Devotee Details (Glassmorphic) ── */}
            <section className="h-fit">
              {selectedDevotee ? (
                <div className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden">
                  
                  {/* Decorative Banner */}
                  <div className="relative h-20 bg-gradient-to-r from-[#07172D] to-[#123761] flex items-center px-6">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10% 50%, #D4A017 0%, transparent 60%)' }} />
                    <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-[#D4A017] text-2xl font-bold text-white shadow-md">
                      {selectedDevotee.devoteeName[0]?.toUpperCase() || 'D'}
                    </span>
                  </div>

                  {/* Devotee Info */}
                  <div className="p-6 space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight">{selectedDevotee.devoteeName}</h2>
                      <p className="text-xs text-[#9C7414] font-semibold mt-0.5">Status: <strong className="text-emerald-600 uppercase">● Active Member</strong></p>
                    </div>

                    <div className="border-t border-[#EFE6D3] pt-4 grid gap-3.5 text-sm">
                      {/* Mobile */}
                      <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Mobile number</p>
                          <p className="mt-1 flex items-center gap-1.5 font-semibold text-[#0B1F3A]">
                            <Phone size={12} className="text-[#D4A017]" />
                            {selectedDevotee.mobile}
                          </p>
                        </div>
                        <a href={`tel:${selectedDevotee.mobile}`} className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#0B1F3A] text-white hover:bg-[#123761] transition">
                          <Phone size={13} />
                        </a>
                      </div>

                      {/* Address */}
                      <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Residential Address</p>
                        <p className="mt-1.5 font-semibold text-[#0B1F3A] leading-relaxed whitespace-pre-line">{selectedDevotee.address}</p>
                      </div>

                      {/* Subscription details */}
                      <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Plan select</p>
                          <p className="mt-1 font-extrabold text-indigo-700">{selectedDevotee.plan} Plan</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Contribution amount</p>
                          <p className="mt-1 font-extrabold text-[#9C7414]">₹{Number(selectedDevotee.amount).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Joined Date */}
                      <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Joined Date</p>
                          <p className="mt-1 font-semibold text-[#0B1F3A]">{fmtDate(selectedDevotee.joinedAt)}</p>
                        </div>
                        {selectedDevotee.updatedAt && (
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Last Updated</p>
                            <p className="mt-1 font-semibold text-[#0B1F3A] text-xs">{fmtDate(selectedDevotee.updatedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions button */}
                    <div className="border-t border-[#EFE6D3] pt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditRedirect(selectedDevotee.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#D4A017]/30 px-4 py-2 text-xs font-bold text-[#9C7414] hover:bg-[#D4A017]/8 transition"
                      >
                        <Edit size={12} />
                        Edit Devotee Info
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D4A017]/30 p-10 text-center flex flex-col items-center justify-center gap-3">
                  <UsersRound size={36} className="text-[#D4A017]/30" />
                  <p className="text-sm font-semibold text-[#42516A]">Select a devotee from the roster list to see full details.</p>
                </div>
              )}
            </section>

          </div>

        </main>
      </div>
    </div>
  )
}

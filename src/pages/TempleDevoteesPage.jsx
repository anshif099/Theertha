import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HandCoins,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Phone,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadMemberships, deleteMembership } from '../lib/membershipStore.js'
import { loadDevotees, deleteDevotee } from '../lib/settingsStore.js'

const mainMenuItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter',    icon: ReceiptText,     href: '/temple/counter' },
  { label: 'Booking',    icon: CalendarCheck,   href: '/temple/booking' },
  { label: 'Accounts',   icon: WalletCards,     href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList,   href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound,      href: '/temple/membership' },
  { label: 'Billing',    icon: FileText,        href: '/temple/billing' },
  { label: 'Temple',     icon: Landmark,        href: '/temple/profile' },
  { label: 'Assets',     icon: Building2,       href: '/temple/assets' },
  { label: 'Devotees',   icon: Heart,           href: '/temple/devotees' },
]

const addonItems = [
  { label: 'Daily Schedule', icon: CalendarDays, href: '/temple/daily-schedule' },
  { label: 'Donation', icon: HandCoins, href: '/temple/donations' },
  { label: 'Fixed Deposit',  icon: PiggyBank,    href: '/temple/fixed-deposit' },
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

  // Devotees/Members list
  const [activeTab, setActiveTab] = useState('members') // 'members' or 'general'
  const [generalFilter, setGeneralFilter] = useState('All') // 'All', 'Unpaid', 'Paid'
  const [devotees, setDevotees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // View details modal
  const [activeDevotee, setActiveDevotee] = useState(null)

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  function refreshDevoteesList() {
    if (!session) return
    setLoading(true)
    if (activeTab === 'members') {
      loadMemberships(session.id)
        .then((list) => setDevotees(list))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      loadDevotees(session.id)
        .then((list) => setDevotees(list))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  // Load members or general devotees when activeTab changes
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    refreshDevoteesList()
  }, [session, activeTab])

  // Filter devotees list
  const filteredDevotees = useMemo(() => {
    let list = devotees

    // Apply paid/unpaid status filter if general tab is active
    if (activeTab === 'general' && generalFilter !== 'All') {
      list = list.filter((d) => {
        const receiptsArr = d.receipts ? Object.values(d.receipts) : []
        const hasUnpaid = receiptsArr.some(r => r.paymentStatus === 'Unpaid')
        if (generalFilter === 'Unpaid') return hasUnpaid
        if (generalFilter === 'Paid') return !hasUnpaid
        return true
      })
    }

    const q = search.trim().toLowerCase()
    if (!q) return list

    if (activeTab === 'members') {
      return list.filter((d) =>
        [d.devoteeName, d.mobile, d.address, d.plan].join(' ').toLowerCase().includes(q)
      )
    } else {
      return list.filter((d) =>
        [d.devoteeName, d.mobile, d.starName].join(' ').toLowerCase().includes(q)
      )
    }
  }, [devotees, search, activeTab, generalFilter])

  // Delete handler
  async function handleDeleteDevotee(id, name) {
    if (activeTab === 'members') {
      if (!window.confirm(`Are you sure you want to delete membership record for "${name}"?`)) return
      try {
        await deleteMembership(session.id, id)
        setDevotees((prev) => prev.filter((d) => d.id !== id))
      } catch {
        alert('Failed to delete devotee record. Please try again.')
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete general devotee record for "${name}" (mobile: ${id})?`)) return
      try {
        await deleteDevotee(session.id, id)
        setDevotees((prev) => prev.filter((d) => d.mobile !== id))
      } catch {
        alert('Failed to delete devotee record. Please try again.')
      }
    }
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
                <span className="text-[#0B1F3A]">Devotee Roster</span>
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

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 space-y-6">
          
          {/* Table section */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden">
            
            {/* Table header bar with search */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
                  {activeTab === 'members' ? 'Devotee Members Roster' : 'General Devotees Roster'}
                </h1>
                <p className="text-xs text-[#42516A]">
                  {activeTab === 'members' 
                    ? 'View and manage all registered devotee members with active subscriptions' 
                    : 'View counter-registered devotees, their nakshatras, and transaction status'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={activeTab === 'members' ? 'Search members…' : 'Search by name, mobile, star…'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-[#D4A017]/30 bg-[#F8F6F0]/50 px-3 py-2 text-xs font-semibold text-[#0B1F3A] outline-none placeholder:text-[#9A9A9A] focus:border-[#D4A017] w-full sm:w-60"
                />
                {activeTab === 'members' && (
                  <a href="/temple/membership" className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-[#F8F6F0] hover:bg-[#123761] transition w-full sm:w-auto">
                    <PlusCircle size={14} /> Register Devotee
                  </a>
                )}
              </div>
            </div>

            {/* Tab switch buttons */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#EFE6D3] bg-[#F8F6F0]/40 px-6 gap-2">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => { setActiveTab('members'); setSearch(''); setGeneralFilter('All') }}
                  className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 outline-none ${
                    activeTab === 'members'
                      ? 'border-[#D4A017] text-[#9C7414]'
                      : 'border-transparent text-[#42516A]/70 hover:text-[#0B1F3A]'
                  }`}
                >
                  Members (Subscriptions)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('general'); setSearch(''); setGeneralFilter('All') }}
                  className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 outline-none ${
                    activeTab === 'general'
                      ? 'border-[#D4A017] text-[#9C7414]'
                      : 'border-transparent text-[#42516A]/70 hover:text-[#0B1F3A]'
                  }`}
                >
                  General Devotees (Counter)
                </button>
              </div>

              {activeTab === 'general' && (
                <div className="flex items-center gap-1.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => setGeneralFilter('All')}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                      generalFilter === 'All'
                        ? 'bg-[#0B1F3A] text-[#F7D77C]'
                        : 'bg-[#0B1F3A]/5 text-[#42516A] hover:bg-[#0B1F3A]/10'
                    }`}
                  >
                    All Devotees
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneralFilter('Unpaid')}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                      generalFilter === 'Unpaid'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200'
                    }`}
                  >
                    Unpaid Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneralFilter('Paid')}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                      generalFilter === 'Paid'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200'
                    }`}
                  >
                    Paid Only
                  </button>
                </div>
              )}
            </div>

            {/* Table data */}
            <div className="overflow-x-auto">
              {loading ? (
                <p className="py-12 text-center text-sm text-[#42516A]">Loading devotee roster…</p>
              ) : filteredDevotees.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Heart size={36} className="text-[#D4A017]/30" />
                  <p className="font-semibold text-[#0B1F3A]">No devotees found</p>
                  <p className="text-xs text-[#42516A]/80">Try adjusting your search or register a new devotee.</p>
                </div>
              ) : (
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-bold uppercase tracking-wider text-[#42516A]">
                      <th className="px-6 py-4">Devotee Name</th>
                      <th className="px-6 py-4">Mobile</th>
                      {activeTab === 'members' ? (
                        <>
                          <th className="px-6 py-4">Address</th>
                          <th className="px-6 py-4">Plan</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Joined Date</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4">Star (Nakshatra)</th>
                          <th className="px-6 py-4 text-right">Paid (₹)</th>
                          <th className="px-6 py-4 text-right">Unpaid (₹)</th>
                          <th className="px-6 py-4">Payment Status</th>
                          <th className="px-6 py-4">Last Active</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevotees.map((devotee) => {
                      const key = activeTab === 'members' ? devotee.id : devotee.mobile
                      return (
                        <tr key={key} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]/50">
                          <td className="px-6 py-4 font-semibold text-[#0B1F3A]">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/10 text-xs font-bold text-[#9C7414]">
                                {devotee.devoteeName[0]?.toUpperCase() || 'D'}
                              </span>
                              <span>{devotee.devoteeName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-[#42516A]">
                            <div className="flex items-center gap-1.5">
                              <Phone size={13} className="text-[#D4A017]" />
                              {devotee.mobile}
                            </div>
                          </td>
                          
                          {activeTab === 'members' ? (
                            <>
                              <td className="px-6 py-4 text-[#42516A] max-w-xs truncate" title={devotee.address}>
                                {devotee.address}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${devotee.plan === 'Yearly' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                                  {devotee.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-extrabold text-[#9C7414]">
                                ₹{Number(devotee.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 font-semibold text-[#42516A]">
                                {fmtDate(devotee.joinedAt)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 font-semibold text-[#42516A]">
                                {devotee.starName || '—'}
                              </td>
                              <td className="px-6 py-4 text-right font-extrabold text-emerald-600">
                                {(() => {
                                  const receiptsArr = devotee.receipts ? Object.values(devotee.receipts) : []
                                  const paidSum = receiptsArr.filter(r => r.paymentStatus !== 'Unpaid').reduce((sum, r) => sum + Number(r.total || 0), 0)
                                  return paidSum > 0 ? `₹${paidSum.toLocaleString('en-IN')}` : '—'
                                })()}
                              </td>
                              <td className="px-6 py-4 text-right font-extrabold text-rose-600">
                                {(() => {
                                  const receiptsArr = devotee.receipts ? Object.values(devotee.receipts) : []
                                  const unpaidSum = receiptsArr.filter(r => r.paymentStatus === 'Unpaid').reduce((sum, r) => sum + Number(r.total || 0), 0)
                                  return unpaidSum > 0 ? `₹${unpaidSum.toLocaleString('en-IN')}` : '—'
                                })()}
                              </td>
                              <td className="px-6 py-4">
                                {(() => {
                                  const receiptsArr = devotee.receipts ? Object.values(devotee.receipts) : []
                                  const unpaidCount = receiptsArr.filter(r => r.paymentStatus === 'Unpaid').length
                                  return unpaidCount > 0 ? (
                                    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
                                      Has Unpaid ({unpaidCount})
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                                      All Paid
                                    </span>
                                  )
                                })()}
                              </td>
                              <td className="px-6 py-4 font-semibold text-[#42516A]">
                                {fmtDate(devotee.lastActive)}
                              </td>
                            </>
                          )}
                          
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveDevotee(devotee)}
                                className="p-1.5 rounded-lg border border-[#D4A017]/25 text-[#9C7414] hover:bg-[#D4A017]/10 transition"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              {activeTab === 'members' && (
                                <a
                                  href={`/temple/membership?edit=${devotee.id}`}
                                  className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                                  title="Edit Devotee"
                                >
                                  <Pencil size={14} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDevotee(activeTab === 'members' ? devotee.id : devotee.mobile, devotee.devoteeName)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                title="Delete Devotee"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Table Footer */}
            <div className="bg-[#F8F6F0]/40 border-t border-[#EFE6D3] px-6 py-3.5 flex items-center justify-between text-xs text-[#42516A] font-semibold">
              <span>Showing {filteredDevotees.length} of {devotees.length} devotees</span>
              <span>All records synced with Realtime DB</span>
            </div>

          </section>
        </main>
      </div>

      {/* ── View Details Modal ── */}
      {activeDevotee && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={() => setActiveDevotee(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EFE6D3] px-6 py-4">
                <h3 className="font-display text-lg font-bold text-[#0B1F3A]">Devotee Profile Card</h3>
                <button type="button" onClick={() => setActiveDevotee(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#42516A] hover:bg-[#EFE6D3]"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A017]/10 text-xl font-bold text-[#9C7414]">
                    {activeDevotee.devoteeName[0]?.toUpperCase() || 'D'}
                  </span>
                  <div>
                    <h4 className="text-lg font-bold text-[#0B1F3A]">{activeDevotee.devoteeName}</h4>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      activeTab === 'members'
                        ? activeDevotee.plan === 'Yearly'
                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                    }`}>
                      {activeTab === 'members' ? `${activeDevotee.plan} Plan` : 'General Devotee'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 pt-2 border-t border-[#EFE6D3]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Mobile Contact</span>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A]">
                      <Phone size={13} className="text-[#D4A017]" />
                      {activeDevotee.mobile}
                    </p>
                  </div>
                  {activeTab === 'members' ? (
                    <>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Residential Address</span>
                        <p className="mt-0.5 text-sm font-semibold text-[#0B1F3A] leading-relaxed">
                          {activeDevotee.address || '—'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Fee Paid</span>
                          <p className="mt-0.5 text-sm font-bold text-[#9C7414]">
                            ₹{Number(activeDevotee.amount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Joined Date</span>
                          <p className="mt-0.5 text-sm font-semibold text-[#42516A]">
                            {fmtDate(activeDevotee.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Star (Nakshatra)</span>
                          <p className="mt-0.5 text-sm font-semibold text-[#0B1F3A]">
                            {activeDevotee.starName || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Last Active</span>
                          <p className="mt-0.5 text-sm font-semibold text-[#42516A]">
                            {fmtDate(activeDevotee.lastActive)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-[#EFE6D3]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] block">Past Receipt History</span>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                          {activeDevotee.receipts && Object.values(activeDevotee.receipts).length > 0 ? (
                            Object.values(activeDevotee.receipts).reverse().map((r, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-[#F8F6F0] px-3 py-2 rounded-lg border border-[#EFE6D3]">
                                <div className="font-mono text-xs text-[#0B1F3A]">
                                  {r.receiptNo} <span className="text-[#42516A]/75 text-[10px]">({r.date})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#9C7414]">₹{r.total}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    r.paymentStatus === 'Unpaid'
                                      ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  }`}>
                                    {r.paymentStatus || 'Paid'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[#42516A]/60 italic">No past receipts recorded</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#EFE6D3] px-6 py-4 bg-[#F8F6F0]/40">
                <button type="button" onClick={() => setActiveDevotee(null)}
                  className="rounded-lg border border-[#D4A017]/20 px-5 py-2 text-sm font-bold text-[#42516A] hover:bg-[#F8F6F0] transition">Close Card</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

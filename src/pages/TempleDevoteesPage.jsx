import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Pencil,
  Phone,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Store,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadMemberships, deleteMembership } from '../lib/membershipStore.js'

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

  // Devotees/Members list
  const [devotees, setDevotees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // View details modal
  const [activeDevotee, setActiveDevotee] = useState(null)

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  function refreshDevoteesList() {
    if (!session) return
    setLoading(true)
    loadMemberships(session.id)
      .then((list) => setDevotees(list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Load members
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    refreshDevoteesList()
  }, [session])

  // Filter devotees list
  const filteredDevotees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return devotees
    return devotees.filter((d) =>
      [d.devoteeName, d.mobile, d.address, d.plan].join(' ').toLowerCase().includes(q)
    )
  }, [devotees, search])

  // Delete handler
  async function handleDeleteDevotee(id, name) {
    if (!window.confirm(`Are you sure you want to delete membership record for "${name}"?`)) return
    try {
      await deleteMembership(session.id, id)
      setDevotees((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Failed to delete devotee record. Please try again.')
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
                <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">Devotee Members Roster</h1>
                <p className="text-xs text-[#42516A]">View and manage all registered devotee members</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search devotees…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-[#D4A017]/30 bg-[#F8F6F0]/50 px-3 py-2 text-xs font-semibold text-[#0B1F3A] outline-none placeholder:text-[#9A9A9A] focus:border-[#D4A017] w-full sm:w-60"
                />
                <a href="/temple/membership" className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-[#F8F6F0] hover:bg-[#123761] transition w-full sm:w-auto">
                  <PlusCircle size={14} /> Register Devotee
                </a>
              </div>
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
                      <th className="px-6 py-4">Address</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevotees.map((devotee) => (
                      <tr key={devotee.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]/50">
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
                            <a
                              href={`/temple/membership?edit=${devotee.id}`}
                              className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Devotee"
                            >
                              <Pencil size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDevotee(devotee.id, devotee.devoteeName)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                              title="Delete Devotee"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${activeDevotee.plan === 'Yearly' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                      {activeDevotee.plan} Plan
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
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Residential Address</span>
                    <p className="mt-0.5 text-sm font-semibold text-[#0B1F3A] leading-relaxed">
                      {activeDevotee.address}
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

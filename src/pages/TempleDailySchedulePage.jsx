import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  HandCoins,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Printer,
  ReceiptText,
  Search,
  Settings,
  User,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadTodayReceipts } from '../lib/settingsStore.js'

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
  { label: 'Daily Schedule', icon: CalendarDays, href: '/temple/daily-schedule' },
  { label: 'Donation', icon: HandCoins, href: '/temple/donations' },
  { label: 'Fixed Deposit',  icon: PiggyBank,    href: '/temple/fixed-deposit' },
]

function getInitials(name = 'Temple') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const matches = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!matches) {
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    }
    return 0
  }
  let hours = parseInt(matches[1], 10)
  const minutes = parseInt(matches[2], 10)
  const ampm = matches[3].toUpperCase()
  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function SidebarContent({ temple, onClose }) {
  const activeHref = window.location.pathname
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
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
        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">{temple?.loginId}</p>
      </div>
    </>
  )
}

export default function TempleDailySchedulePage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Daily bookings schedule states
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  const refreshScheduleList = () => {
    if (!session) return
    setLoading(true)
    loadTodayReceipts(session.id, scheduleDate)
      .then((list) => {
        // Sort strictly by their scheduled time
        const sortedList = [...list].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        setBookings(sortedList)
      })
      .catch((err) => {
        console.error('Failed to load schedule:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
      return
    }
    getRegisteredTemple(session.id)
      .then((t) => { if (t) setTemple(t) })
      .catch(() => {})
    Promise.resolve().then(() => {
      refreshScheduleList()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, scheduleDate])

  // Computed statistics
  const stats = useMemo(() => {
    let total = bookings.length
    let paid = 0
    let unpaid = 0
    let collection = 0

    bookings.forEach((b) => {
      if (b.paymentStatus === 'Unpaid') {
        unpaid += 1
      } else {
        paid += 1
        collection += Number(b.total || 0)
      }
    })

    return { total, paid, unpaid, collection }
  }, [bookings])

  // Filtered list based on search term
  const filteredBookings = useMemo(() => {
    const q = searchText.toLowerCase().trim()
    if (!q) return bookings

    return bookings.filter((b) => {
      const matchReceipt = b.receiptNo?.toLowerCase().includes(q)
      const matchDevotee = b.devoteeName?.toLowerCase().includes(q)
      const matchStar = b.starName?.toLowerCase().includes(q)
      const matchMobile = b.mobile?.includes(q)
      const matchPriest = b.priestName?.toLowerCase().includes(q)
      const matchItems = b.items && b.items.some(item => item.name?.toLowerCase().includes(q))
      return matchReceipt || matchDevotee || matchStar || matchMobile || matchPriest || matchItems
    })
  }, [bookings, searchText])

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A] font-sans selection:bg-[#D4A017] selection:text-[#0B1F3A]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden no-print" aria-hidden="true"
          onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden no-print ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1"><SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10"><X size={20} /></button>
        </div>
      </aside>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block no-print">
        <SidebarContent temple={temple} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8 no-print">
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
              <span className="text-sm font-semibold text-[#0B1F3A]">Daily Schedule</span>
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

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          
          {/* Printable Header - HIDE on screen, SHOW on print */}
          <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black">{temple?.name || 'Temple Schedule'}</h1>
            <p className="text-md text-gray-700 mt-1">Daily Pooja & Offering Schedule</p>
            <p className="text-lg font-bold text-black mt-2">Date: {fmtDate(scheduleDate)}</p>
          </div>

          {/* Top Control Bar (date selection + print actions) */}
          <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0B1F3A]">Daily Pooja Schedule</h1>
              <p className="text-sm text-[#42516A] mt-0.5">Manage daily poojas, offerings, devotee records, and timings</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Input */}
              <div className="flex items-center gap-2 rounded-lg border border-[#D4A017]/20 bg-white px-3 py-2">
                <CalendarDays size={16} className="text-[#9C7414]" />
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#0B1F3A] outline-none"
                />
              </div>

              {/* Print PDF Action */}
              <button
                type="button"
                onClick={() => window.print()}
                disabled={bookings.length === 0}
                className="flex items-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#07172D] transition hover:bg-[#F7D77C] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Printer size={16} /> Export PDF / Print
              </button>
            </div>
          </div>

          {/* Statistics summary blocks */}
          <div className="no-print mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-[#D4A017]/12 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Total Bookings</p>
              <p className="mt-2 text-2xl font-black text-[#0B1F3A]">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/12 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">Paid Bookings</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{stats.paid}</p>
            </div>
            <div className="rounded-xl border border-rose-500/12 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600/70">Unpaid Bookings</p>
              <p className="mt-2 text-2xl font-black text-rose-600">{stats.unpaid}</p>
            </div>
            <div className="rounded-xl border border-[#D4A017]/12 bg-[#07172D] p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#F7D77C]/70">Total Collections</p>
              <p className="mt-2 text-2xl font-black text-[#F7D77C]">₹{stats.collection.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Search bar & schedule list container */}
          <div className="rounded-xl border border-[#D4A017]/12 bg-white shadow-sm overflow-hidden">
            
            {/* Filter bar */}
            <div className="no-print flex items-center gap-3 border-b border-[#D4A017]/12 bg-[#FBFBFA] px-5 py-4">
              <Search size={18} className="text-[#9A9A9A]" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by devotee name, star, receipt no, or pooja item..."
                className="w-full bg-transparent text-sm font-semibold text-[#0B1F3A] outline-none placeholder:text-[#9D9D9D]"
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText('')} className="text-[#9A9A9A] hover:text-[#0B1F3A]">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Bookings Schedule Table */}
            {loading ? (
              <div className="p-12 text-center text-[#42516A]/70 font-semibold">
                Loading daily schedule...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-16 text-center">
                <CalendarDays size={48} className="mx-auto mb-4 text-[#D4A017]/40" />
                <h3 className="text-base font-bold text-[#0B1F3A]">No Poojas Scheduled</h3>
                <p className="text-sm text-[#42516A] mt-1">No matching bookings recorded for {fmtDate(scheduleDate)}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm print:text-black">
                  <thead>
                    <tr className="border-b border-[#D4A017]/12 bg-[#FBFBFA]/60 text-xs font-bold uppercase tracking-wider text-[#9C7414] print:bg-gray-100 print:text-black">
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Receipt No.</th>
                      <th className="px-6 py-4">Devotee Name</th>
                      <th className="px-6 py-4">Star</th>
                      <th className="px-6 py-4">Pooja / Sevas</th>
                      <th className="px-6 py-4">Priest</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4A017]/6">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FDFCFB]/60 transition print:hover:bg-transparent">
                        <td className="whitespace-nowrap px-6 py-4.5 font-bold font-mono text-[#0B1F3A] print:text-black">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#D4A017]/70 no-print" />
                            {b.time}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 font-mono text-xs font-bold text-[#9C7414] print:text-black">
                          {b.receiptNo}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="font-bold text-[#0B1F3A] print:text-black">{b.devoteeName}</div>
                          {b.mobile && (
                            <div className="text-[11px] font-semibold text-[#42516A]/70 mt-0.5 print:text-black print:text-[10px]">
                              Mob: {b.mobile}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 font-bold text-[#42516A] print:text-black">
                          {b.starName || '—'}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col gap-1">
                            {b.items && b.items.map((item, idx) => (
                              <span key={idx} className="font-semibold text-[#0B1F3A] print:text-black">
                                {item.name} <span className="text-xs text-[#42516A]/60">x{item.qty}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-1.5 text-[#42516A] font-semibold print:text-black">
                            <User size={14} className="text-[#9A9A9A]/60 no-print" />
                            {b.priestName || 'General Priest'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold print:border print:bg-transparent ${
                            b.paymentStatus === 'Unpaid'
                              ? 'bg-rose-500/10 text-rose-600 print:text-rose-700 print:border-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 print:text-emerald-700 print:border-emerald-400'
                          }`}>
                            {b.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-right font-bold font-mono text-[#0B1F3A] print:text-black">
                          ₹{Number(b.total || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Embedded High Fidelity Stylesheet for Print */}
      <style>{`
        @media print {
          /* Hide all screen interface elements */
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12pt !important;
            margin: 0;
            padding: 0;
          }
          .no-print, header, aside, button, .flex-wrap, .no-print * {
            display: none !important;
          }
          .lg\\:pl-72 {
            padding-left: 0 !important;
          }
          main {
            margin: 0 !important;
            padding: 20mm !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: black !important;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
        }
      `}</style>
    </div>
  )
}

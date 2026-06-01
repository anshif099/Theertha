import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Flame,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  PawPrint,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Shield,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadPriests } from '../lib/settingsStore.js'
import { loadFestivals, addFestival, deleteFestival, loadMonthPL } from '../lib/templeProfileStore.js'

/* ── Constants ── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const MALAYALAM_MONTHS = [
  'Chingam','Kanni','Thulam','Vrischikam','Dhanu','Makaram',
  'Kumbham','Meenam','Medam','Edavam','Mithunam','Karkidakam',
]

const FESTIVAL_TYPES = [
  { value: 'Utsavam', icon: '🎺', color: 'bg-red-50 text-red-700 ring-red-200' },
  { value: 'Ekadasi', icon: '🌙', color: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  { value: 'Navratri', icon: '🪔', color: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { value: 'Pooja', icon: '🙏', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'Vishu', icon: '🌼', color: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
  { value: 'Onam', icon: '🌺', color: 'bg-green-50 text-green-700 ring-green-200' },
  { value: 'Other', icon: '✨', color: 'bg-slate-50 text-slate-700 ring-slate-200' },
]

function festivalMeta(type) {
  return FESTIVAL_TYPES.find((f) => f.value === type) || FESTIVAL_TYPES.at(-1)
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
function fmtINR(n) {
  const v = Number(n || 0)
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr'
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + ' L'
  return '₹' + v.toLocaleString('en-IN')
}
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Sidebar ── */
function SidebarContent({ temple, onClose }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          const active = window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '?')
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

/* ── Info field ── */
function ProfileField({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A]">
        {Icon && <Icon size={12} className="shrink-0 text-[#D4A017]" />}
        {value || <span className="italic text-[#9A9A9A]">Not set</span>}
      </p>
    </div>
  )
}

/* ── Calendar grid helper ── */
function buildCalendarDays(year, month) {
  // month is 1-indexed
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startDay = first.getDay() // 0=Sun
  const days = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  return days
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function TempleProfilePage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [priests, setPriests] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Monthly P&L
  const now = new Date()
  const [plYear, setPlYear]   = useState(now.getFullYear())
  const [plMonth, setPlMonth] = useState(now.getMonth() + 1)
  const [pl, setPl]           = useState(null)
  const [plLoading, setPlLoading] = useState(true)

  // Festival Calendar
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)
  const [festivals, setFestivals] = useState([])
  const [festLoading, setFestLoading] = useState(true)

  // Add festival form
  const [showAddFest, setShowAddFest] = useState(false)
  const [festForm, setFestForm] = useState({ name: '', date: '', type: 'Utsavam', note: '' })
  const [festSaving, setFestSaving] = useState(false)

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  /* ── Load temple data ── */
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    loadPriests(session.id).then(setPriests).catch(() => {})
  }, [session])

  /* ── Load P&L ── */
  useEffect(() => {
    if (!session) return
    setPlLoading(true)
    loadMonthPL(session.id, plYear, plMonth)
      .then(setPl)
      .catch(() => setPl(null))
      .finally(() => setPlLoading(false))
  }, [session, plYear, plMonth])

  /* ── Load festivals ── */
  useEffect(() => {
    if (!session) return
    setFestLoading(true)
    loadFestivals(session.id)
      .then(setFestivals)
      .catch(() => {})
      .finally(() => setFestLoading(false))
  }, [session])

  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth])
  const calPad = String(calMonth).padStart(2, '0')
  const calPrefix = `${calYear}-${calPad}`

  /* Festivals for the current calendar month */
  const monthFestivals = useMemo(() =>
    festivals.filter((f) => (f.date || '').startsWith(calPrefix))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  , [festivals, calPrefix])

  /* Map of day → festivals for rendering dots */
  const festByDay = useMemo(() => {
    const map = {}
    monthFestivals.forEach((f) => {
      const d = parseInt(f.date?.slice(8), 10)
      if (!d) return
      ;(map[d] = map[d] || []).push(f)
    })
    return map
  }, [monthFestivals])

  function prevMonth(year, month, setY, setM) {
    if (month === 1) { setM(12); setY(year - 1) }
    else { setM(month - 1) }
  }
  function nextMonth(year, month, setY, setM) {
    if (month === 12) { setM(1); setY(year + 1) }
    else { setM(month + 1) }
  }

  async function handleAddFestival() {
    if (!festForm.name.trim() || !festForm.date) return
    setFestSaving(true)
    try {
      const rec = await addFestival(session.id, {
        name: festForm.name.trim(),
        date: festForm.date,
        type: festForm.type,
        note: festForm.note.trim(),
      })
      setFestivals((prev) => [...prev, rec].sort((a, b) => (a.date || '').localeCompare(b.date || '')))
      setFestForm({ name: '', date: '', type: 'Utsavam', note: '' })
      setShowAddFest(false)
    } catch {} finally { setFestSaving(false) }
  }

  async function handleDeleteFest(id) {
    if (!window.confirm('Delete this festival entry?')) return
    await deleteFestival(session.id, id)
    setFestivals((prev) => prev.filter((f) => f.id !== id))
  }

  if (!session) return null

  const planColors = { Enterprise: 'bg-[#D4A017]/10 text-[#9C7414] ring-[#D4A017]/30', Professional: 'bg-blue-50 text-blue-700 ring-blue-200', Basic: 'bg-slate-50 text-slate-600 ring-slate-200' }
  const planBadge = planColors[temple?.plan] || planColors.Basic

  const inputCls = 'w-full rounded-lg border border-[#D4A017]/20 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20'
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A9A9A]'

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" aria-hidden="true"
          onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1"><SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10"><X size={20} /></button>
        </div>
      </aside>
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
                <Landmark size={15} />
                <a href="/temple/dashboard" className="hover:text-[#0B1F3A] transition">Dashboard</a>
                <span className="text-[#9C7414]/40">/</span>
                <span className="text-[#0B1F3A]">Temple Profile</span>
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

          {/* ══════════════════════════ TEMPLE PROFILE ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden">
            {/* Hero banner */}
            <div className="relative h-28 bg-gradient-to-r from-[#07172D] via-[#0B1F3A] to-[#123761]">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #D4A017 0%, transparent 60%), radial-gradient(circle at 80% 30%, #F7D77C 0%, transparent 50%)' }} />
              <div className="absolute bottom-0 left-6 translate-y-1/2">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#D4A017] text-3xl font-bold text-white shadow-xl">
                  {initials}
                </span>
              </div>
              <div className="absolute right-6 top-4 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${planBadge}`}>
                  {temple?.plan || 'Basic'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${temple?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                  {temple?.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="px-6 pt-14 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0B1F3A] sm:text-3xl">{temple?.name || 'Temple'}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#42516A]">
                    <Flame size={13} className="text-[#D4A017]" />
                    Main deity: <strong>{temple?.deity || '—'}</strong>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#42516A]">
                    <MapPin size={13} className="text-[#D4A017]" />
                    {temple?.district || '—'}, Kerala
                  </p>
                </div>
                <a href="/temple/settings"
                  className="flex items-center gap-2 rounded-lg border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#9C7414] hover:bg-[#D4A017]/8 transition">
                  <Settings size={14} />Edit profile
                </a>
              </div>

              {temple?.description && (
                <p className="mt-4 rounded-xl bg-[#F8F6F0] px-4 py-3 text-sm leading-relaxed text-[#42516A] border border-[#EFE6D3]">
                  {temple.description}
                </p>
              )}

              {/* Info grid */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ProfileField label="Login ID" value={temple?.loginId} icon={Shield} />
                <ProfileField label="Contact" value={temple?.contact} />
                <ProfileField label="District" value={temple?.district} icon={MapPin} />
                <ProfileField label="Last updated" value={temple?.updatedAt ? fmtDate(temple.updatedAt) : '—'} />
              </div>

              {/* Priest strip */}
              {priests.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Priests on record</p>
                  <div className="flex flex-wrap gap-3">
                    {priests.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] px-3 py-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A017]/10 text-xs font-bold text-[#9C7414]">
                          {p.name?.[0]?.toUpperCase() || 'P'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0B1F3A]">{p.name}</p>
                          {p.phone && <p className="text-xs text-[#42516A]">{p.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════ MONTHLY P&L ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <WalletCards size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Monthly P &amp; L</h2>
                  <p className="text-xs text-[#42516A]">Income vs Expenses — change month to compare</p>
                </div>
              </div>
              {/* Month navigator */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => prevMonth(plYear, plMonth, setPlYear, setPlMonth)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] text-[#9C7414] hover:bg-[#D4A017]/10 transition">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex min-w-[140px] flex-col items-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] px-4 py-1.5 text-center">
                  <span className="text-sm font-bold text-[#0B1F3A]">{MONTHS[plMonth - 1]}</span>
                  <span className="text-xs text-[#42516A]">{plYear}</span>
                </div>
                <button type="button" onClick={() => nextMonth(plYear, plMonth, setPlYear, setPlMonth)}
                  disabled={plYear === now.getFullYear() && plMonth === now.getMonth() + 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 bg-[#F8F6F0] text-[#9C7414] hover:bg-[#D4A017]/10 transition disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {plLoading ? (
                <p className="py-8 text-center text-sm text-[#42516A]">Loading P&L…</p>
              ) : (
                <>
                  {/* 3 metric cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Income</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-emerald-700">{fmtINR(pl?.income)}</p>
                      <p className="mt-1 text-xs text-emerald-600/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-red-600" />
                        <p className="text-xs font-bold uppercase tracking-wider text-red-700">Total Expenses</p>
                      </div>
                      <p className="mt-3 text-3xl font-bold text-red-600">{fmtINR(pl?.expense)}</p>
                      <p className="mt-1 text-xs text-red-500/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                    <div className={`rounded-xl border p-5 ${(pl?.net || 0) >= 0 ? 'border-[#D4A017]/30 bg-[#D4A017]/8' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        <WalletCards size={16} className={(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wider ${(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-700'}`}>Net {(pl?.net || 0) >= 0 ? 'Surplus' : 'Deficit'}</p>
                      </div>
                      <p className={`mt-3 text-3xl font-bold ${(pl?.net || 0) >= 0 ? 'text-[#9C7414]' : 'text-red-600'}`}>
                        {(pl?.net || 0) >= 0 ? '+' : ''}{fmtINR(pl?.net)}
                      </p>
                      <p className="mt-1 text-xs text-[#42516A]/70">{MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  {(pl?.income > 0 || pl?.expense > 0) ? (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#42516A]">
                        <span>Income vs Expense ratio</span>
                        <span className={(pl?.net || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {pl?.income > 0 ? ((pl?.expense / pl?.income) * 100).toFixed(1) : 0}% expense ratio
                        </span>
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded-full bg-[#EFE6D3]">
                        <div className="flex h-full">
                          <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
                            style={{ width: `${pl?.income > 0 ? Math.min(100, ((pl?.income - pl?.expense) / pl?.income) * 100) : 0}%` }} />
                          <div className="h-full bg-red-400 flex-1 rounded-r-full" />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-[#42516A]">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Surplus</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Expense portion</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#D4A017]/30 py-10 text-center">
                      <WalletCards size={28} className="text-[#D4A017]/30" />
                      <p className="text-sm font-semibold text-[#42516A]">No transactions recorded for {MONTHS[plMonth - 1]} {plYear}</p>
                    </div>
                  )}

                  {/* Expense breakdown */}
                  {pl?.expenseBreakdown && Object.keys(pl.expenseBreakdown).length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Expense breakdown</p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(pl.expenseBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                          <div key={cat} className="flex items-center justify-between rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] px-4 py-3">
                            <span className="text-sm font-semibold text-[#0B1F3A]">{cat}</span>
                            <span className="font-bold text-red-600">{fmtINR(amt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ══════════════════════════ FESTIVAL CALENDAR ══════════════════════════ */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A017]/10 text-[#D4A017]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Festival Calendar</h2>
                  <p className="text-xs text-[#42516A]">Manage temple festivals and auspicious days</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddFest(true)}
                className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761] transition">
                <PlusCircle size={14} />Add festival
              </button>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1fr_320px]">
              {/* Calendar grid */}
              <div className="border-r-0 p-6 xl:border-r xl:border-[#EFE6D3]">
                {/* Month navigator */}
                <div className="mb-5 flex items-center justify-between">
                  <button type="button" onClick={() => prevMonth(calYear, calMonth, setCalYear, setCalMonth)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 text-[#9C7414] hover:bg-[#D4A017]/8 transition">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-[#0B1F3A]">{MONTHS[calMonth - 1]} {calYear}</p>
                    <p className="text-xs text-[#42516A]">{MALAYALAM_MONTHS[(calMonth - 1 + (calYear % 2 === 0 ? 1 : 0)) % 12]} — Malayalam month</p>
                  </div>
                  <button type="button" onClick={() => nextMonth(calYear, calMonth, setCalYear, setCalMonth)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4A017]/20 text-[#9C7414] hover:bg-[#D4A017]/8 transition">
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Day header */}
                <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />
                    const todayD = now.getDate(), todayM = now.getMonth() + 1, todayY = now.getFullYear()
                    const isToday = day === todayD && calMonth === todayM && calYear === todayY
                    const dayFests = festByDay[day] || []
                    return (
                      <div key={day}
                        className={`relative flex min-h-[52px] flex-col items-center rounded-lg border p-1 text-center transition
                          ${isToday ? 'border-[#D4A017] bg-[#D4A017]/8' : dayFests.length > 0 ? 'border-[#D4A017]/30 bg-[#FFFBF0]' : 'border-transparent hover:border-[#EFE6D3] hover:bg-[#F8F6F0]'}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-[#D4A017] text-white' : 'text-[#0B1F3A]'}`}>
                          {day}
                        </span>
                        {dayFests.length > 0 && (
                          <div className="mt-1 flex flex-col items-center gap-0.5">
                            {dayFests.slice(0, 2).map((f) => (
                              <span key={f.id} className="w-full truncate rounded px-1 py-0.5 text-[9px] font-bold leading-tight text-[#9C7414] bg-[#D4A017]/15">
                                {festivalMeta(f.type).icon} {f.name.slice(0, 8)}
                              </span>
                            ))}
                            {dayFests.length > 2 && (
                              <span className="text-[9px] text-[#9C7414]">+{dayFests.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Festival list for selected month */}
              <div className="border-t border-[#EFE6D3] p-6 xl:border-t-0">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
                  {MONTHS[calMonth - 1]} {calYear} — {monthFestivals.length} festival{monthFestivals.length !== 1 ? 's' : ''}
                </p>
                {festLoading ? (
                  <p className="py-6 text-center text-sm text-[#42516A]">Loading…</p>
                ) : monthFestivals.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CalendarDays size={28} className="text-[#D4A017]/25" />
                    <p className="text-sm font-semibold text-[#42516A]">No festivals this month</p>
                    <button type="button" onClick={() => setShowAddFest(true)}
                      className="mt-1 text-xs font-semibold text-[#9C7414] hover:underline">
                      + Add one
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {monthFestivals.map((f) => {
                      const meta = festivalMeta(f.type)
                      return (
                        <div key={f.id} className="group flex items-start gap-3 rounded-xl border border-[#EFE6D3] bg-[#F8F6F0] p-3 transition hover:border-[#D4A017]/30 hover:bg-[#FFFBF0]">
                          <span className="mt-0.5 text-xl">{meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#0B1F3A]">{f.name}</p>
                            <p className="text-xs text-[#42516A]">{fmtDate(f.date)}</p>
                            <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${meta.color}`}>
                              {f.type}
                            </span>
                            {f.note && <p className="mt-1 text-xs text-[#42516A]/80 leading-snug">{f.note}</p>}
                          </div>
                          <button type="button" onClick={() => handleDeleteFest(f.id)}
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Add Festival modal ── */}
      {showAddFest && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowAddFest(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-[#EFE6D3] px-6 py-4">
                <h3 className="font-display text-lg font-bold text-[#0B1F3A]">Add Festival / Auspicious Day</h3>
                <button type="button" onClick={() => setShowAddFest(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#42516A] hover:bg-[#EFE6D3]"><X size={16} /></button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className={labelCls}>Festival name *</label>
                  <input type="text" value={festForm.name} onChange={(e) => setFestForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Karthika Thirunal" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Date *</label>
                    <input type="date" value={festForm.date} onChange={(e) => setFestForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <select value={festForm.type} onChange={(e) => setFestForm((p) => ({ ...p, type: e.target.value }))} className={inputCls}>
                      {FESTIVAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Note / description</label>
                  <textarea rows={2} value={festForm.note} onChange={(e) => setFestForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Optional details…" className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#EFE6D3] px-6 py-4">
                <button type="button" onClick={() => setShowAddFest(false)}
                  className="rounded-lg border border-[#D4A017]/20 px-4 py-2 text-sm font-semibold text-[#42516A] hover:bg-[#F8F6F0]">Cancel</button>
                <button type="button" disabled={festSaving || !festForm.name.trim() || !festForm.date} onClick={handleAddFestival}
                  className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761] disabled:opacity-50">
                  <CheckCircle2 size={14} />{festSaving ? 'Saving…' : 'Save festival'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

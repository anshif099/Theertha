import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PawPrint,
  Pencil,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Store,
  Trash2,
  TrendingDown,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadAssets, deleteAsset } from '../lib/assetStore.js'

/* ── Category icon + colour map ── */
const CAT_META = {
  'Land & buildings':       { color: 'text-blue-400',   bar: 'bg-blue-500',   icon: '🏛️' },
  'Jewellery & valuables':  { color: 'text-yellow-400', bar: 'bg-yellow-400', icon: '💎' },
  Vehicles:                 { color: 'text-green-400',  bar: 'bg-green-500',  icon: '🚗' },
  'Equipment & furniture':  { color: 'text-purple-400', bar: 'bg-purple-500', icon: '⚙️' },
  'Pooja utensils':         { color: 'text-red-400',    bar: 'bg-red-500',    icon: '🪔' },
  'Agricultural land':      { color: 'text-emerald-400',bar: 'bg-emerald-500',icon: '🌾' },
}

const mainMenuItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter',    icon: ReceiptText,     href: '/temple/counter' },
  { label: 'Accounts',   icon: WalletCards,     href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList,   href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound,      href: '/temple/dashboard' },
  { label: 'Billing',    icon: FileText,        href: '/temple/billing' },
  { label: 'Temple',     icon: Landmark,        href: '/temple/dashboard' },
  { label: 'Assets',     icon: Building2,       href: '/temple/assets' },
  { label: 'Devotees',   icon: Heart,           href: '/temple/dashboard' },
]
const addonItems = [
  { label: 'Elephant',      icon: PawPrint, href: '/temple/dashboard' },
  { label: 'Guest House',   icon: BedDouble, href: '/temple/dashboard' },
  { label: 'Store',         icon: Store,    href: '/temple/dashboard' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/dashboard' },
]

function getInitials(name = 'Temple') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
}

function fmtINR(n) {
  if (!n && n !== 0) return '—'
  const v = Number(n)
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr'
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + ' L'
  return '₹' + v.toLocaleString('en-IN')
}

function fmtINRFull(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── Sidebar ─── */
function SidebarContent({ temple, onClose }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA landing page"><BrandMark compact /></a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">Main Menu</p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/temple/assets'
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

/* ── Condition badge ── */
function ConditionBadge({ status }) {
  const map = {
    Active:              'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Draft:               'bg-gray-100 text-gray-500 ring-gray-200',
    'Under maintenance': 'bg-red-50 text-red-700 ring-red-200',
    Disposed:            'bg-slate-100 text-slate-500 ring-slate-200',
  }
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${map[status] || map.Draft}`}>
      {status || 'Draft'}
    </span>
  )
}

/* ── Check if insurance due soon ── */
function insuranceDueSoon(expiry) {
  if (!expiry) return false
  const diff = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)
  return diff > 0 && diff < 60
}

/* ─── MAIN PAGE ─── */
export default function TempleAssetsPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState('')

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])
  const fyLabel = useMemo(() => {
    const now = new Date()
    const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `FY ${yr}–${String(yr + 1).slice(2)}`
  }, [])

  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    loadAssets(session.id)
      .then((list) => setAssets(list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  /* ── Derived metrics ── */
  const { grossBlock, accumulated, netBook, categories } = useMemo(() => {
    const gross = assets.reduce((s, a) => s + Number(a.totalCost || a.purchaseCost || 0), 0)
    const acc = assets.reduce((s, a) => {
      const dep = Number(a.totalCost || a.purchaseCost || 0) - Number(a.bookValue || a.totalCost || a.purchaseCost || 0)
      return s + Math.max(0, dep)
    }, 0)
    const net = gross - acc

    // By category
    const catMap = {}
    assets.forEach((a) => {
      if (!a.category) return
      catMap[a.category] = catMap[a.category] || { total: 0, count: 0 }
      catMap[a.category].total += Number(a.totalCost || a.purchaseCost || 0)
      catMap[a.category].count += 1
    })
    return { grossBlock: gross, accumulated: acc, netBook: net, categories: catMap }
  }, [assets])

  const insuranceDue = useMemo(() => assets.filter((a) => insuranceDueSoon(a.insuranceExpiry)), [assets])
  const recentAssets = useMemo(() => [...assets].slice(0, 3), [assets])
  const tableAssets = useMemo(() => [...assets].slice(0, 8), [assets])

  async function handleDelete(assetId) {
    if (!window.confirm('Delete this asset permanently?')) return
    try {
      await deleteAsset(session.id, assetId)
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
    } catch { setDeleteError('Failed to delete asset.') }
  }

  if (!session) return null

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
          <div className="flex-1"><SidebarContent temple={temple} onClose={() => setSidebarOpen(false)} /></div>
          <button type="button" onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10 hover:text-[#F8F6F0]">
            <X size={20} />
          </button>
        </div>
      </aside>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent temple={temple} onClose={undefined} />
      </aside>

      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] hover:bg-[#D4A017]/10 lg:hidden">
              <Menu size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-sm text-[#9C7414] font-semibold">
                <Package size={15} /> Asset Management <span className="text-[#9C7414]/50">/</span>
                <span className="text-[#0B1F3A]">Dashboard</span>
                <span className="ml-2 rounded-md bg-[#D4A017]/10 px-2 py-0.5 text-xs font-bold text-[#9C7414]">{fyLabel}</span>
                <span className="text-xs text-[#42516A]">· As of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button"
                className="flex items-center gap-2 rounded-lg border border-[#D4A017]/30 bg-white px-4 py-2 text-sm font-semibold text-[#9C7414] transition hover:bg-[#D4A017]/10">
                <Download size={15} />Export register
              </button>
              <a href="/temple/assets/register"
                className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761]">
                <PlusCircle size={15} />Add asset
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] font-semibold text-[#F7D77C] text-sm">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); window.location.href = '/temple-login' }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">

          {/* ── Summary metrics ── */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Gross block */}
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFE6D3] text-[#9C7414]">
                  <Package size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Gross block value</p>
                  <p className="mt-1 text-2xl font-bold text-[#0B1F3A]">{loading ? '—' : fmtINR(grossBlock)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">Across {Object.keys(categories).length} categories</p>
                </div>
              </div>
            </article>
            {/* Accumulated depreciation */}
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <TrendingDown size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Accumulated depreciation</p>
                  <p className="mt-1 text-2xl font-bold text-red-500">{loading ? '—' : fmtINR(accumulated)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">
                    {grossBlock > 0 ? ((accumulated / grossBlock) * 100).toFixed(1) : '0'}% of gross block
                  </p>
                </div>
              </div>
            </article>
            {/* Net book value */}
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <WalletCards size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Net book value</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? '—' : fmtINR(netBook)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">
                    {grossBlock > 0 ? ((netBook / grossBlock) * 100).toFixed(1) : '100'}% retained value
                  </p>
                </div>
              </div>
            </article>
            {/* Insurance / maintenance due */}
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Maintenance due</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {loading ? '—' : `${assets.filter(a => a.status === 'Under maintenance').length} assets`}
                  </p>
                  <p className="mt-1 text-xs text-[#42516A]">
                    {insuranceDue.length} insurance expiring soon
                  </p>
                </div>
              </div>
            </article>
          </section>

          {/* ── Two-column: categories + alerts ── */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* Assets by category */}
            <section className="rounded-xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <h2 className="mb-5 font-display text-lg font-semibold">Assets by Category</h2>
              {loading ? (
                <p className="text-sm text-[#42516A]">Loading…</p>
              ) : Object.keys(categories).length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Package size={36} className="text-[#D4A017]/30" />
                  <p className="font-semibold text-[#0B1F3A]">No assets registered yet</p>
                  <p className="text-sm text-[#42516A]">Click "Add asset" to register your first asset.</p>
                  <a href="/temple/assets/register"
                    className="mt-2 flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                    <PlusCircle size={15} />Register new asset
                  </a>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(categories).map(([cat, data]) => {
                    const meta = CAT_META[cat] || { color: 'text-gray-400', bar: 'bg-gray-400', icon: '📦' }
                    const pct = grossBlock > 0 ? ((data.total / grossBlock) * 100).toFixed(1) : 0
                    return (
                      <div key={cat} className="rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] p-4">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold ${meta.color}`}>{cat}</p>
                            <p className="mt-1 text-xl font-bold text-[#0B1F3A]">{fmtINR(data.total)}</p>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE6D3]">
                              <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1.5 text-xs text-[#42516A]">{pct}% of total · {data.count} record{data.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Maintenance & Alerts + Recent Additions */}
            <div className="flex flex-col gap-6">
              <section className="rounded-xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
                <h2 className="mb-4 font-display text-lg font-semibold">Maintenance &amp; Alerts</h2>
                {loading ? <p className="text-sm text-[#42516A]">Loading…</p> :
                 insuranceDue.length === 0 && assets.filter(a => a.status === 'Under maintenance').length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CalendarCheck size={28} className="text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-700">All assets in good standing</p>
                    <p className="text-xs text-[#42516A]">No alerts at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {assets.filter(a => a.status === 'Under maintenance').map((a) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-red-700">{a.name} — maintenance</p>
                          <p className="text-xs text-red-600/80">{a.location || a.category}</p>
                        </div>
                      </div>
                    ))}
                    {insuranceDue.map((a) => (
                      <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-amber-800">{a.name} — insurance renewal</p>
                          <p className="text-xs text-amber-700/80">Insurance expires: {fmtDate(a.insuranceExpiry)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                          Due soon
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent additions */}
              {recentAssets.length > 0 && (
                <section className="rounded-xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
                  <h2 className="mb-4 font-display text-lg font-semibold">Recent Additions</h2>
                  <div className="grid gap-3">
                    {recentAssets.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-[#0B1F3A]">{a.name}</span>
                          <span className="mx-1.5 text-[#42516A]">—</span>
                          <span className="text-sm text-[#42516A]">{a.subCategory || a.category}</span>
                        </div>
                        <span className="shrink-0 font-semibold text-[#0B1F3A]">{fmtINRFull(a.totalCost || a.purchaseCost)}</span>
                        <ConditionBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ── Asset register table ── */}
          <section className="mt-6 mb-10 rounded-xl border border-[#D4A017]/18 bg-white shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
              <h2 className="font-display text-xl font-semibold">Asset Register</h2>
              <a href="/temple/assets/register"
                className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <PlusCircle size={14} />Register new asset
              </a>
            </div>

            {deleteError && (
              <p className="border-b border-red-100 bg-red-50 px-6 py-2 text-sm font-semibold text-red-600">{deleteError}</p>
            )}

            <div className="overflow-x-auto">
              {loading ? (
                <p className="px-6 py-10 text-sm text-[#42516A]">Loading assets…</p>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Package size={48} className="text-[#D4A017]/25" />
                  <p className="text-lg font-semibold text-[#0B1F3A]">No assets registered</p>
                  <p className="text-sm text-[#42516A]">Start by registering your temple's first asset.</p>
                  <a href="/temple/assets/register"
                    className="mt-2 flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                    <PlusCircle size={15} />Register new asset
                  </a>
                </div>
              ) : (
                <>
                  <table className="w-full min-w-[780px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-xs font-semibold uppercase tracking-wide text-[#42516A]">
                        <th className="px-5 py-3">Asset ID</th>
                        <th className="px-5 py-3">Name &amp; category</th>
                        <th className="px-5 py-3 text-right">Cost ₹</th>
                        <th className="px-5 py-3 text-right">Book value ₹</th>
                        <th className="px-5 py-3">Last verified</th>
                        <th className="px-5 py-3">Condition</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableAssets.map((a) => (
                        <tr key={a.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-semibold text-[#D4A017]">{a.assetId || a.id?.slice(0, 10)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#0B1F3A]">{a.name}</p>
                            <p className="text-xs text-[#42516A]">{a.category}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold">{(a.totalCost || a.purchaseCost || 0).toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-right font-semibold text-[#9C7414]">{(a.bookValue || a.totalCost || a.purchaseCost || 0).toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-sm text-[#42516A]">{fmtDate(a.createdAt)}</td>
                          <td className="px-5 py-4"><ConditionBadge status={a.status} /></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <button type="button" aria-label="View asset"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-[#42516A] hover:bg-[#EFE6D3] hover:text-[#0B1F3A]">
                                <Eye size={14} />
                              </button>
                              <button type="button" aria-label="Edit asset"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-[#42516A] hover:bg-[#EFE6D3] hover:text-[#0B1F3A]">
                                <Pencil size={14} />
                              </button>
                              <button type="button" aria-label="Delete asset" onClick={() => handleDelete(a.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between border-t border-[#EFE6D3] px-6 py-3">
                    <p className="text-sm text-[#42516A]">
                      Showing {tableAssets.length} of {assets.length} total assets across {Object.keys(categories).length} categories
                    </p>
                    {assets.length > 8 && (
                      <button type="button"
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#9C7414] hover:text-[#0B1F3A]">
                        View full register →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

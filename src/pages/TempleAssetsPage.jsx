import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  HandCoins,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Pencil,
  Phone,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
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
  'Land & buildings':       { color: 'text-blue-500',   bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 ring-blue-200',   icon: '🏛️' },
  'Jewellery & valuables':  { color: 'text-yellow-600', bar: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 ring-yellow-200', icon: '💎' },
  Vehicles:                 { color: 'text-green-600',  bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700 ring-green-200',  icon: '🚗' },
  'Equipment & furniture':  { color: 'text-purple-600', bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 ring-purple-200', icon: '⚙️' },
  'Pooja utensils':         { color: 'text-red-500',    bar: 'bg-red-500',    badge: 'bg-red-50 text-red-700 ring-red-200',       icon: '🪔' },
  'Agricultural land':      { color: 'text-emerald-600',bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: '🌾' },
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
  { label: 'Daily Schedule', icon: CalendarDays, href: '/temple/daily-schedule' },
  { label: 'Donation', icon: HandCoins, href: '/temple/donations' },
  { label: 'Fixed Deposit',  icon: PiggyBank,    href: '/temple/fixed-deposit' },
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
function fmtINRFull(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function insuranceDueSoon(expiry) {
  if (!expiry) return false
  const diff = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)
  return diff > 0 && diff < 60
}

/* ── Sidebar ── */
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

/* ══════════════════════════════════════════════
   Category Detail Slide-over Panel
══════════════════════════════════════════════ */
function CategoryDetailPanel({ category, assets, grossBlock, onClose }) {
  const meta = CAT_META[category] || { color: 'text-gray-500', bar: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 ring-gray-200', icon: '📦' }
  const catAssets = assets.filter((a) => a.category === category)
  const catTotal = catAssets.reduce((s, a) => s + Number(a.totalCost || a.purchaseCost || 0), 0)
  const pct = grossBlock > 0 ? ((catTotal / grossBlock) * 100).toFixed(1) : 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-[−32px_0_80px_rgba(11,31,58,0.18)] animate-[slideInRight_0.25s_ease-out]"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(.22,.68,0,1.2)' }}
        aria-label={`${category} assets details`}
      >
        {/* Panel header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EFE6D3] bg-[#F8F6F0] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>Category Detail</p>
              <h2 className="mt-0.5 font-display text-2xl font-bold text-[#0B1F3A]">{category}</h2>
              <p className="mt-1 text-sm text-[#42516A]">
                {catAssets.length} asset{catAssets.length !== 1 ? 's' : ''} · {pct}% of total register
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#42516A] transition hover:bg-[#EFE6D3] hover:text-[#0B1F3A]">
            <X size={20} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-[#EFE6D3] border-b border-[#EFE6D3] bg-white">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-[#42516A]">Total value</p>
            <p className="mt-1 text-xl font-bold text-[#0B1F3A]">{fmtINRFull(catTotal)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-[#42516A]">% of gross block</p>
            <p className={`mt-1 text-xl font-bold ${meta.color}`}>{pct}%</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-[#42516A]">Records</p>
            <p className="mt-1 text-xl font-bold text-[#0B1F3A]">{catAssets.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-[#EFE6D3]">
          <div className={`h-full ${meta.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>

        {/* Asset list */}
        <div className="flex-1 overflow-y-auto">
          {catAssets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Package size={40} className="text-[#D4A017]/25" />
              <p className="font-semibold text-[#0B1F3A]">No assets in this category</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFE6D3]">
              {catAssets.map((a) => {
                const insExpiring = insuranceDueSoon(a.insuranceExpiry)
                return (
                  <div key={a.id} className="px-6 py-5 transition hover:bg-[#F8F6F0]">
                    {/* Row top: ID + name + badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#D4A017]">
                            {a.assetId || a.id?.slice(0, 12)}
                          </span>
                          <ConditionBadge status={a.status} />
                          {insExpiring && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                              Insurance expiring
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-semibold text-[#0B1F3A]">{a.name}</p>
                        {a.subCategory && (
                          <p className="text-xs text-[#42516A]">{a.subCategory}</p>
                        )}
                      </div>
                    </div>

                    {/* Detail grid */}
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                      <DetailField label="Purchase cost" value={fmtINRFull(a.purchaseCost)} icon={IndianRupee} />
                      <DetailField label="Total cost" value={fmtINRFull(a.totalCost || a.purchaseCost)} icon={IndianRupee} />
                      <DetailField label="Book value" value={fmtINRFull(a.bookValue || a.totalCost || a.purchaseCost)} icon={IndianRupee} highlight />
                      <DetailField label="Purchase date" value={fmtDate(a.purchaseDate)} />
                      <DetailField label="Depreciation" value={a.depMethod ? a.depMethod.split(' ').slice(0, 3).join(' ') : '—'} />
                      <DetailField label="Annual rate" value={a.annualRate ? `${a.annualRate}%` : '—'} />
                      {a.supplier && <DetailField label="Supplier" value={a.supplier} />}
                      {a.invoiceNo && <DetailField label="Invoice no." value={a.invoiceNo} />}
                      {a.location && <DetailField label="Location" value={a.location} icon={MapPin} />}
                      {a.insurancePolicyNo && <DetailField label="Insurance policy" value={a.insurancePolicyNo} />}
                      {a.insuranceExpiry && <DetailField label="Insurance expiry" value={fmtDate(a.insuranceExpiry)} />}
                    </div>

                    {a.description && (
                      <p className="mt-3 rounded-lg bg-[#EFE6D3]/40 px-3 py-2 text-xs text-[#42516A]">
                        {a.description}
                      </p>
                    )}

                    {a.fileName && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#9C7414]">
                        <FileText size={12} />
                        <span className="font-semibold">{a.fileName}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#EFE6D3] bg-[#F8F6F0] px-6 py-4 flex items-center justify-between gap-3">
          <a href="/temple/assets/register"
            className="flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
            <PlusCircle size={14} />Add to this category
          </a>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#42516A] hover:bg-[#EFE6D3]">
            Close
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── Asset Detail Slide-over (single asset) ── */
function AssetDetailPanel({ asset, onClose }) {
  const meta = CAT_META[asset?.category] || { color: 'text-gray-500', bar: 'bg-gray-400', icon: '📦' }
  if (!asset) return null
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-[−32px_0_80px_rgba(11,31,58,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EFE6D3] bg-[#F8F6F0] px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#D4A017]">{asset.assetId || 'ASSET'}</span>
              <ConditionBadge status={asset.status} />
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-[#0B1F3A]">{asset.name}</h2>
            <p className="mt-0.5 text-sm text-[#42516A]">{asset.category}{asset.subCategory ? ` · ${asset.subCategory}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#42516A] hover:bg-[#EFE6D3]">
            <X size={20} />
          </button>
        </div>

        {/* Value strip */}
        <div className="grid grid-cols-3 divide-x divide-[#EFE6D3] border-b border-[#EFE6D3] bg-white">
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-[#42516A]">Purchase cost</p>
            <p className="mt-0.5 text-base font-bold text-[#0B1F3A]">{fmtINRFull(asset.purchaseCost)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-[#42516A]">Total cost</p>
            <p className="mt-0.5 text-base font-bold text-[#0B1F3A]">{fmtINRFull(asset.totalCost || asset.purchaseCost)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-[#42516A]">Book value</p>
            <p className={`mt-0.5 text-base font-bold ${meta.color}`}>{fmtINRFull(asset.bookValue || asset.totalCost || asset.purchaseCost)}</p>
          </div>
        </div>

        {/* Details scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EFE6D3]">
          {/* Basic info */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9C7414]">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Purchase date"    value={fmtDate(asset.purchaseDate)} />
              <DetailField label="Supplier"         value={asset.supplier || '—'} />
              <DetailField label="Invoice no."      value={asset.invoiceNo || '—'} />
              <DetailField label="Location"         value={asset.location || '—'} icon={MapPin} />
            </div>
            {asset.description && (
              <p className="mt-3 rounded-lg bg-[#EFE6D3]/50 px-3 py-2 text-xs text-[#42516A] leading-relaxed">{asset.description}</p>
            )}
          </div>
          {/* Depreciation */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9C7414]">Depreciation</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Method"           value={asset.depMethod || '—'} />
              <DetailField label="Annual rate"      value={asset.annualRate ? `${asset.annualRate}%` : '—'} />
              <DetailField label="Useful life"      value={asset.usefulLife ? `${asset.usefulLife} years` : '—'} />
              <DetailField label="Residual value"   value={fmtINRFull(asset.residualValue)} />
            </div>
          </div>
          {/* Insurance & docs */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9C7414]">Insurance &amp; Documents</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Policy no."       value={asset.insurancePolicyNo || '—'} />
              <DetailField label="Expiry"           value={fmtDate(asset.insuranceExpiry)} />
            </div>
            {asset.fileName && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#D4A017]/20 bg-[#D4A017]/5 px-3 py-2 text-xs text-[#9C7414]">
                <FileText size={12} /><span className="font-semibold">{asset.fileName}</span>
              </div>
            )}
          </div>
          {/* Meta */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9C7414]">Record Info</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Registered on"   value={fmtDate(asset.createdAt)} />
              <DetailField label="Posted to ledger" value={asset.postedToLedger ? 'Yes' : 'No (Draft)'} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#EFE6D3] bg-[#F8F6F0] px-6 py-4 flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#42516A] hover:bg-[#EFE6D3]">
            Close
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── Small field component ── */
function DetailField({ label, value, icon: Icon, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A9A9A]">{label}</p>
      <p className={`mt-0.5 flex items-center gap-1 text-sm font-semibold ${highlight ? 'text-[#9C7414]' : 'text-[#0B1F3A]'}`}>
        {Icon && <Icon size={11} className="shrink-0" />}
        {value || '—'}
      </p>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function TempleAssetsPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState('')

  /* panel state */
  const [categoryPanel, setCategoryPanel] = useState(null)   // category name string
  const [assetPanel, setAssetPanel] = useState(null)         // asset object

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

  const { grossBlock, accumulated, netBook, categories } = useMemo(() => {
    const gross = assets.reduce((s, a) => s + Number(a.totalCost || a.purchaseCost || 0), 0)
    const acc = assets.reduce((s, a) => {
      const dep = Number(a.totalCost || a.purchaseCost || 0) - Number(a.bookValue || a.totalCost || a.purchaseCost || 0)
      return s + Math.max(0, dep)
    }, 0)
    const net = gross - acc
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
  const tableAssets  = useMemo(() => [...assets].slice(0, 8), [assets])

  async function handleDelete(assetId) {
    if (!window.confirm('Delete this asset permanently?')) return
    try {
      await deleteAsset(session.id, assetId)
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
      setAssetPanel(null)
    } catch { setDeleteError('Failed to delete asset.') }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* ── Category detail slide-over ── */}
      {categoryPanel && (
        <CategoryDetailPanel
          category={categoryPanel}
          assets={assets}
          grossBlock={grossBlock}
          onClose={() => setCategoryPanel(null)}
        />
      )}

      {/* ── Single asset detail slide-over ── */}
      {assetPanel && (
        <AssetDetailPanel
          asset={assetPanel}
          onClose={() => setAssetPanel(null)}
        />
      )}

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
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 hover:bg-white/10">
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
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFE6D3] text-[#9C7414]"><Package size={18} /></span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Gross block value</p>
                  <p className="mt-1 text-2xl font-bold text-[#0B1F3A]">{loading ? '—' : fmtINR(grossBlock)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">Across {Object.keys(categories).length} categories</p>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500"><TrendingDown size={18} /></span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Accumulated depreciation</p>
                  <p className="mt-1 text-2xl font-bold text-red-500">{loading ? '—' : fmtINR(accumulated)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">{grossBlock > 0 ? ((accumulated / grossBlock) * 100).toFixed(1) : '0'}% of gross block</p>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><WalletCards size={18} /></span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Net book value</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? '—' : fmtINR(netBook)}</p>
                  <p className="mt-1 text-xs text-[#42516A]">{grossBlock > 0 ? ((netBook / grossBlock) * 100).toFixed(1) : '100'}% retained value</p>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-[#D4A017]/18 bg-white p-5 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertTriangle size={18} /></span>
                <div>
                  <p className="text-xs font-semibold text-[#42516A]">Maintenance due</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{loading ? '—' : `${assets.filter(a => a.status === 'Under maintenance').length} assets`}</p>
                  <p className="mt-1 text-xs text-[#42516A]">{insuranceDue.length} insurance expiring soon</p>
                </div>
              </div>
            </article>
          </section>

          {/* ── Two-column: categories + alerts ── */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* Assets by Category — each card is clickable */}
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
                    const meta = CAT_META[cat] || { color: 'text-gray-500', bar: 'bg-gray-400', icon: '📦' }
                    const pct = grossBlock > 0 ? ((data.total / grossBlock) * 100).toFixed(1) : 0
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryPanel(cat)}
                        className="group w-full rounded-lg border border-[#EFE6D3] bg-[#F8F6F0] p-4 text-left transition hover:border-[#D4A017]/40 hover:bg-[#FFFBF0] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                        aria-label={`View details for ${cat}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-bold ${meta.color}`}>{cat}</p>
                              <span className="flex items-center gap-1 text-xs font-semibold text-[#9C7414] opacity-0 transition group-hover:opacity-100">
                                View details <ChevronRight size={12} />
                              </span>
                            </div>
                            <p className="mt-1 text-xl font-bold text-[#0B1F3A]">{fmtINR(data.total)}</p>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE6D3]">
                              <div className={`h-full rounded-full transition-all ${meta.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1.5 text-xs text-[#42516A]">{pct}% of total · {data.count} record{data.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </button>
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
                      <button key={a.id} type="button" onClick={() => setAssetPanel(a)}
                        className="flex w-full items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left hover:bg-red-100 transition">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-red-700">{a.name} — maintenance</p>
                          <p className="text-xs text-red-600/80">{a.location || a.category}</p>
                        </div>
                        <ChevronRight size={14} className="mt-0.5 shrink-0 text-red-400" />
                      </button>
                    ))}
                    {insuranceDue.map((a) => (
                      <button key={a.id} type="button" onClick={() => setAssetPanel(a)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100 transition">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-amber-800">{a.name} — insurance renewal</p>
                          <p className="text-xs text-amber-700/80">Insurance expires: {fmtDate(a.insuranceExpiry)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Due soon</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {recentAssets.length > 0 && (
                <section className="rounded-xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_12px_32px_rgba(11,31,58,0.07)]">
                  <h2 className="mb-4 font-display text-lg font-semibold">Recent Additions</h2>
                  <div className="grid gap-3">
                    {recentAssets.map((a) => (
                      <button key={a.id} type="button" onClick={() => setAssetPanel(a)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-[#F8F6F0]">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-[#0B1F3A]">{a.name}</span>
                          <span className="mx-1.5 text-[#42516A]">—</span>
                          <span className="text-sm text-[#42516A]">{a.subCategory || a.category}</span>
                        </div>
                        <span className="shrink-0 font-semibold text-[#0B1F3A]">{fmtINRFull(a.totalCost || a.purchaseCost)}</span>
                        <ConditionBadge status={a.status} />
                      </button>
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
                              <button type="button" aria-label="View asset details" onClick={() => setAssetPanel(a)}
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

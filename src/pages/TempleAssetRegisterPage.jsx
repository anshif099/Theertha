import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Store,
  Upload,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { addAsset, getNextAssetId } from '../lib/assetStore.js'

/* ── Category / sub-category map ── */
const CATEGORY_MAP = {
  'Land & buildings': ['Main building', 'Gopuram', 'Mandapam', 'Residential', 'Agricultural plot', 'Other'],
  Vehicles: ['Motor vehicle', 'Two-wheeler', 'Boat / vessel', 'Other'],
  'Equipment & furniture': ['Generator', 'Electrical', 'CCTV / security', 'Furniture', 'Kitchen', 'Other'],
  'Jewellery & valuables': ['Gold ornament', 'Silver ornament', 'Precious stones', 'Deity jewellery', 'Other'],
  'Pooja utensils': ['Bronze', 'Silver', 'Gold-plated', 'Copper', 'Other'],
  'Agricultural land': ['Wet land', 'Dry land', 'Plantation', 'Other'],
}
const CATEGORIES = Object.keys(CATEGORY_MAP)

const DEPRECIATION_METHODS = [
  'Written down value (WDV)',
  'Straight line method (SLM)',
  'No depreciation',
]

const STATUS_OPTIONS = ['Draft', 'Active', 'Under maintenance', 'Disposed']

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound, href: '/temple/membership' },
  { label: 'Billing', icon: FileText, href: '/temple/billing' },
  { label: 'Temple', icon: Landmark, href: '/temple/profile' },
  { label: 'Assets', icon: Building2, href: '/temple/assets' },
  { label: 'Devotees', icon: Heart, href: '/temple/devotees' },
]
const addonItems = [
  { label: 'Elephant', icon: PawPrint, href: '/temple/under-development?f=elephant' },
  { label: 'Guest House', icon: BedDouble, href: '/temple/under-development?f=guest-house' },
  { label: 'Store', icon: Store, href: '/temple/under-development?f=store' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/under-development?f=fixed-deposit' },
]

function getInitials(name = 'Temple') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.at(0)).join('').toUpperCase()
}

function fmtINR(n) {
  if (!n && n !== 0) return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

/* ── Depreciation schedule computation ── */
function buildDepreciationSchedule(cost, rate, method, usefulLife, residual) {
  const schedule = []
  let wdv = cost
  const annualRate = Number(rate) / 100
  const life = Number(usefulLife) || 10
  const res = Number(residual) || 0
  const year = new Date().getFullYear()

  if (method === 'No depreciation') return []

  for (let i = 0; i < life; i++) {
    let dep = 0
    if (method === 'Straight line method (SLM)') {
      dep = (cost - res) / life
    } else {
      // WDV
      dep = wdv * annualRate
    }
    wdv = Math.max(wdv - dep, res)
    const accum = cost - wdv
    const fy = `FY ${year + i}–${String(year + i + 1).slice(2)}`
    schedule.push({ fy, dep: Math.round(dep), accum: Math.round(accum), wdv: Math.round(wdv) })
    if (wdv <= res) break
  }
  return schedule
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

/* ─── MAIN PAGE ─── */
export default function TempleAssetRegisterPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

  // Auto-generated Asset ID
  const [assetId, setAssetId] = useState('AST-Auto')

  // Form state
  const [form, setForm] = useState({
    name: '',
    category: '',
    subCategory: '',
    purchaseDate: '',
    supplier: '',
    invoiceNo: '',
    location: '',
    description: '',
    purchaseCost: '',
    installation: '',
    depMethod: 'Written down value (WDV)',
    annualRate: '15',
    usefulLife: '10',
    residualValue: '',
    insurancePolicyNo: '',
    insuranceExpiry: '',
    status: 'Draft',
    fileName: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const subCategories = CATEGORY_MAP[form.category] || []

  // Auto-generate asset ID when category changes
  useEffect(() => {
    if (!session || !form.category) { setAssetId('AST-Auto'); return }
    getNextAssetId(session.id, form.category)
      .then((id) => setAssetId(id))
      .catch(() => setAssetId('AST-Auto'))
  }, [session, form.category])

  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    getRegisteredTemple(session.id)
      .then((t) => { if (t) setTemple(t) })
      .catch(() => {})
  }, [session])

  const totalCost = useMemo(() => {
    const p = Number(form.purchaseCost) || 0
    const i = Number(form.installation) || 0
    return p + i
  }, [form.purchaseCost, form.installation])

  const depSchedule = useMemo(() => {
    if (!totalCost) return []
    return buildDepreciationSchedule(
      totalCost,
      form.annualRate,
      form.depMethod,
      form.usefulLife,
      form.residualValue,
    )
  }, [totalCost, form.annualRate, form.depMethod, form.usefulLife, form.residualValue])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'category') next.subCategory = ''
      return next
    })
    setError('')
    setSuccess('')
  }

  async function handleSave(postToLedger) {
    if (!form.name.trim()) { setError('Asset name is required.'); return }
    if (!form.category) { setError('Category is required.'); return }
    if (!form.purchaseCost || Number(form.purchaseCost) <= 0) { setError('Purchase cost is required.'); return }

    setSaving(true); setError(''); setSuccess('')
    try {
      const record = {
        assetId,
        name: form.name.trim(),
        category: form.category,
        subCategory: form.subCategory,
        purchaseDate: form.purchaseDate,
        supplier: form.supplier.trim(),
        invoiceNo: form.invoiceNo.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        purchaseCost: Number(form.purchaseCost),
        installation: Number(form.installation) || 0,
        totalCost,
        depMethod: form.depMethod,
        annualRate: Number(form.annualRate),
        usefulLife: Number(form.usefulLife),
        residualValue: Number(form.residualValue) || 0,
        insurancePolicyNo: form.insurancePolicyNo.trim(),
        insuranceExpiry: form.insuranceExpiry,
        fileName: form.fileName,
        status: postToLedger ? 'Active' : 'Draft',
        postedToLedger: postToLedger,
        bookValue: totalCost,
      }
      await addAsset(session.id, record)
      setSuccess(postToLedger
        ? `Asset "${form.name}" registered and posted to ledger.`
        : `Draft saved for "${form.name}".`)
      setTimeout(() => { window.location.href = '/temple/assets' }, 1500)
    } catch {
      setError('Failed to save asset. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!session) return null

  const inputCls = 'w-full rounded-lg border border-[#3A3A3A] bg-[#1E1E1E] px-3 py-2.5 text-sm font-semibold text-[#F0EDE8] outline-none transition placeholder:text-[#666] focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20'
  const labelCls = 'mb-1.5 block text-xs font-semibold text-[#9A9A9A]'
  const sectionHeadCls = 'mb-4 text-xs font-bold uppercase tracking-widest text-[#9A9A9A]'

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
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
            <button type="button" onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] hover:bg-[#D4A017]/10 lg:hidden">
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <a href="/temple/assets" className="flex items-center gap-1.5 text-sm font-semibold text-[#9C7414] hover:text-[#0B1F3A] transition">
                <ArrowLeft size={16} /> Asset Management
              </a>
              <span className="text-[#9C7414]/50">/</span>
              <span className="text-sm font-semibold text-[#0B1F3A] truncate">Register New Asset</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] font-semibold text-[#F7D77C] text-sm">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); window.location.href = '/temple-login' }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </header>

        {/* ── FORM body (dark card, matching screenshot) ── */}
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="rounded-2xl border border-[#D4A017]/18 bg-[#141414] text-[#F0EDE8] shadow-[0_32px_80px_rgba(0,0,0,0.32)]">

            {/* Form header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2A] px-6 py-4">
              <div className="flex items-center gap-3">
                <PlusCircle size={20} className="text-[#D4A017]" />
                <span className="font-semibold text-[#F0EDE8]">Register new asset</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#9A9A9A]">Asset ID: <strong className="text-[#F0EDE8]">{assetId}</strong> · Auto</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${form.status === 'Draft' ? 'bg-[#2A2A2A] text-[#9A9A9A]' : 'bg-emerald-900/60 text-emerald-400'}`}>
                  {form.status}
                </span>
              </div>
            </div>

            {/* Two-column grid */}
            <div className="grid gap-0 xl:grid-cols-2">

              {/* ── LEFT COLUMN ── */}
              <div className="border-b border-[#2A2A2A] p-6 xl:border-b-0 xl:border-r">
                {/* Basic info */}
                <p className={sectionHeadCls}>Basic Information</p>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls}>Asset name / description</label>
                    <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="e.g. Ambulance van — KL-11-CD-9820" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Category</label>
                      <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                        <option value="">Select…</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Sub-category</label>
                      <select name="subCategory" value={form.subCategory} onChange={handleChange} className={inputCls} disabled={!form.category}>
                        <option value="">Select…</option>
                        {subCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Date of purchase</label>
                      <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Supplier / vendor</label>
                      <input name="supplier" type="text" value={form.supplier} onChange={handleChange} placeholder="e.g. Kairali Motors" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Invoice / bill no.</label>
                      <input name="invoiceNo" type="text" value={form.invoiceNo} onChange={handleChange} placeholder="e.g. KM/2026/04/1182" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Location / custody</label>
                      <input name="location" type="text" value={form.location} onChange={handleChange} placeholder="e.g. Temple garage — North" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description / remarks</label>
                    <textarea name="description" rows={3} value={form.description} onChange={handleChange}
                      placeholder="e.g. KL-11-CD-9820 · TATA Winger · White · Seating 8"
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>

                {/* Valuation */}
                <p className={`${sectionHeadCls} mt-8`}>Valuation</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Purchase cost (₹)</label>
                    <input name="purchaseCost" type="number" min="0" value={form.purchaseCost} onChange={handleChange} placeholder="9,80,000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Installation / freight</label>
                    <input name="installation" type="number" min="0" value={form.installation} onChange={handleChange} placeholder="12,000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Total cost (₹)</label>
                    <div className="flex items-center rounded-lg border border-[#3A3A3A] bg-[#111] px-3 py-2.5 text-sm font-bold text-[#D4A017]">
                      {totalCost ? totalCost.toLocaleString('en-IN') : '—'}
                    </div>
                  </div>
                </div>

                {/* Ledger notice */}
                {totalCost > 0 && form.category && (
                  <div className="mt-4 flex gap-3 rounded-lg border border-[#1E3A5F] bg-[#0D2840] p-4">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#4A9EFF]" />
                    <p className="text-sm text-[#8BBFFF] leading-relaxed">
                      Total cost <strong className="text-[#B8D8FF]">{fmtINR(totalCost)}</strong> will be posted to the{' '}
                      <strong className="text-[#B8D8FF]">{form.category} account</strong> in the ledger on save.
                      Depreciation will be computed annually.
                    </p>
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="p-6">
                {/* Depreciation setup */}
                <p className={sectionHeadCls}>Depreciation Setup</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Depreciation method</label>
                    <select name="depMethod" value={form.depMethod} onChange={handleChange} className={inputCls}>
                      {DEPRECIATION_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Annual rate (%)</label>
                    <input name="annualRate" type="number" min="0" max="100" value={form.annualRate} onChange={handleChange} placeholder="15" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Useful life (years)</label>
                    <input name="usefulLife" type="number" min="1" value={form.usefulLife} onChange={handleChange} placeholder="10" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Residual / scrap value (₹)</label>
                    <input name="residualValue" type="number" min="0" value={form.residualValue} onChange={handleChange} placeholder="50,000" className={inputCls} />
                  </div>
                </div>

                {/* Depreciation schedule preview */}
                {depSchedule.length > 0 && (
                  <div className="mt-6">
                    <p className={sectionHeadCls}>Depreciation Schedule Preview</p>
                    <div className="overflow-hidden rounded-lg border border-[#2A2A2A]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2A2A2A] bg-[#1A1A1A] text-xs font-semibold text-[#9A9A9A]">
                            <th className="px-4 py-2 text-left">Year</th>
                            <th className="px-4 py-2 text-right">Dep. ₹</th>
                            <th className="px-4 py-2 text-right">Accum. ₹</th>
                            <th className="px-4 py-2 text-right">WDV ₹</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depSchedule.slice(0, 4).map((row, i) => (
                            <tr key={i} className="border-b border-[#1E1E1E] hover:bg-[#1A1A1A] transition">
                              <td className="px-4 py-3 text-[#9A9A9A] text-xs">{row.fy}</td>
                              <td className="px-4 py-3 text-right font-semibold">{row.dep.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-right font-semibold">{row.accum.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-right font-semibold text-[#D4A017]">{row.wdv.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {depSchedule.length > 4 && (
                        <div className="border-t border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-xs text-[#666]">
                          + {depSchedule.length - 4} more years until residual {fmtINR(Number(form.residualValue) || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Insurance & Documents */}
                <p className={`${sectionHeadCls} mt-8`}>Insurance &amp; Documents</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Insurance policy no.</label>
                    <input name="insurancePolicyNo" type="text" value={form.insurancePolicyNo} onChange={handleChange} placeholder="e.g. OIC/2026/VH/00441" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Insurance expiry</label>
                    <input name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
                {/* File upload */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#3A3A3A] px-4 py-3 text-sm font-semibold text-[#9A9A9A] transition hover:border-[#D4A017]/60 hover:text-[#D4A017]">
                    <Upload size={15} />Upload invoice / RC
                    <input type="file" accept=".pdf,.jpg,.png" className="hidden"
                      onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.files?.[0]?.name || '' }))} />
                  </label>
                  {form.fileName ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[#3A3A3A] bg-[#1E1E1E] px-3 py-2.5 text-sm text-[#9A9A9A]">
                      <FileText size={13} className="shrink-0 text-[#D4A017]" />
                      <span className="truncate text-xs">{form.fileName}</span>
                      <button type="button" onClick={() => setForm((p) => ({ ...p, fileName: '' }))}
                        className="ml-auto text-[#666] hover:text-red-400"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-[#2A2A2A] px-3 py-2.5 text-xs text-[#555]">
                      No file selected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2A2A] px-6 py-4">
              <div className="flex-1">
                {error && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
                    <AlertCircle size={14} />{error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 size={14} />{success}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" disabled={saving} onClick={() => handleSave(false)}
                  className="rounded-lg border border-[#3A3A3A] bg-[#1E1E1E] px-5 py-2.5 text-sm font-semibold text-[#F0EDE8] transition hover:bg-[#2A2A2A] disabled:opacity-50">
                  Save draft
                </button>
                <button type="button" disabled={saving} onClick={() => handleSave(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#F0EDE8] px-5 py-2.5 text-sm font-semibold text-[#141414] transition hover:bg-white disabled:opacity-50">
                  <CheckCircle2 size={15} className="text-emerald-700" />
                  {saving ? 'Saving…' : 'Register asset & post to ledger'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
  IndianRupee,
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
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadMembershipConfig, registerMembership, loadSingleMembership, updateMembership } from '../lib/membershipStore.js'

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

export default function TempleMembershipPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Config & Edit state
  const [config, setConfig] = useState({ monthlyAmount: 120, yearlyAmount: 1200 })
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)

  // Form state
  const [form, setForm] = useState({ devoteeName: '', address: '', mobile: '', plan: 'Monthly', amount: '120' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  // Load configuration
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    
    loadMembershipConfig(session.id)
      .then((cfg) => {
        setConfig(cfg)
        
        // Check if editing
        const params = new URLSearchParams(window.location.search)
        const id = params.get('edit')
        if (id) {
          setEditId(id)
          loadSingleMembership(session.id, id).then((m) => {
            if (m) {
              setForm({
                devoteeName: m.devoteeName || '',
                address: m.address || '',
                mobile: m.mobile || '',
                plan: m.plan || 'Monthly',
                amount: (m.amount || '').toString()
              })
            }
          })
        } else {
          // Set initial form amount based on config
          setForm((prev) => ({ ...prev, amount: cfg.monthlyAmount.toString() }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => {
      const nextForm = { ...prev, [name]: value }
      if (name === 'plan') {
        nextForm.amount = value === 'Monthly' ? config.monthlyAmount.toString() : config.yearlyAmount.toString()
      }
      return nextForm
    })
    setError('')
    setSuccess('')
  }

  async function handleRegisterMember(e) {
    e.preventDefault()
    const name = form.devoteeName.trim()
    const addr = form.address.trim()
    const mob = form.mobile.trim()
    const amt = Number(form.amount)

    if (!name || !addr || !mob || !amt || amt <= 0) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editId) {
        await updateMembership(session.id, editId, {
          devoteeName: name,
          address: addr,
          mobile: mob,
          plan: form.plan,
          amount: amt,
        })
        setSuccess(`Membership for devotee "${name}" updated successfully!`)
        setTimeout(() => {
          window.location.href = '/temple/devotees'
        }, 1500)
      } else {
        await registerMembership(session.id, {
          devoteeName: name,
          address: addr,
          mobile: mob,
          plan: form.plan,
          amount: amt,
        })
        setForm({
          devoteeName: '',
          address: '',
          mobile: '',
          plan: 'Monthly',
          amount: config.monthlyAmount.toString()
        })
        setSuccess(`Member Devotee "${name}" registered successfully! Fee logged in Accounts.`)
        setTimeout(() => {
          window.location.href = '/temple/devotees'
        }, 1500)
      }
    } catch {
      setError('Failed to save member devotee. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!session) return null

  const inputCls = 'w-full rounded-lg border border-[#D4A017]/20 bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1F3A] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20'
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9A9A9A]'

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
                <UsersRound size={15} />
                <a href="/temple/dashboard" className="hover:text-[#0B1F3A] transition">Dashboard</a>
                <span className="text-[#9C7414]/40">/</span>
                <span className="text-[#0B1F3A]">{editId ? 'Update Membership' : 'Membership Form'}</span>
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

        <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
          
          {/* Centered Form */}
          <section className="rounded-2xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_16px_48px_rgba(11,31,58,0.08)] flex flex-col h-fit">
            <div className="flex items-center gap-3 border-b border-[#EFE6D3] pb-4 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                <UsersRound size={20} />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
                  {editId ? 'Update Devotee Membership' : 'Register New Devotee Member'}
                </h2>
                <p className="text-xs text-[#42516A]">
                  {editId ? 'Update details of this membership subscription' : 'Enter devotee details and select a subscription plan'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                ✗ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleRegisterMember} className="grid gap-5">
              <div>
                <label htmlFor="devoteeName" className={labelCls}>Devotee Name *</label>
                <input
                  id="devoteeName"
                  name="devoteeName"
                  type="text"
                  required
                  value={form.devoteeName}
                  onChange={handleFormChange}
                  placeholder="e.g. Gopinathan Pillai"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="address" className={labelCls}>Devotee Address *</label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Full residential address…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="mobile" className={labelCls}>Mobile Number *</label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={handleFormChange}
                    placeholder="e.g. 9876543210"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="plan" className={labelCls}>Plan Type *</label>
                  <select
                    id="plan"
                    name="plan"
                    value={form.plan}
                    onChange={handleFormChange}
                    className={inputCls}
                  >
                    <option value="Monthly">Monthly Plan (₹{config.monthlyAmount}/mo)</option>
                    <option value="Yearly">Yearly Plan (₹{config.yearlyAmount}/yr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Subscription Amount (₹) — Auto Populate</label>
                <div className="flex items-center rounded-lg border border-[#D4A017]/30 bg-[#F8F6F0] px-4 py-3 text-base font-extrabold text-[#9C7414]">
                  <IndianRupee size={16} className="mr-1.5 shrink-0" />
                  {Number(form.amount).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <a href="/temple/devotees" className="w-1/3 flex items-center justify-center gap-1.5 rounded-lg border border-[#D4A017]/30 bg-white text-center text-sm font-bold text-[#9C7414] hover:bg-[#D4A017]/8 transition py-3">
                  <ArrowLeft size={15} /> Roster
                </a>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="w-2/3 flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] py-3 text-sm font-bold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {saving ? 'Saving…' : editId ? 'Update Member & Save' : 'Register Member & Log Fee'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}

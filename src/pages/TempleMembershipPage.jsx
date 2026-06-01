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
  Phone,
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
import { loadMembershipConfig, registerMembership, loadMemberships } from '../lib/membershipStore.js'

const mainMenuItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter',    icon: ReceiptText,     href: '/temple/counter' },
  { label: 'Accounts',   icon: WalletCards,     href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList,   href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound,      href: '/temple/membership' },
  { label: 'Billing',    icon: FileText,        href: '/temple/billing' },
  { label: 'Temple',     icon: Landmark,        href: '/temple/profile' },
  { label: 'Assets',     icon: Building2,       href: '/temple/assets' },
  { label: 'Devotees',   icon: Heart,           href: '/temple/under-development?f=devotees' },
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

export default function TempleMembershipPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Config & Members list
  const [config, setConfig] = useState({ monthlyAmount: 120, yearlyAmount: 1200 })
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState({ devoteeName: '', address: '', mobile: '', plan: 'Monthly', amount: '120' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  // Load configuration & memberships
  useEffect(() => {
    if (!session) { window.location.href = '/temple-login'; return }
    
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    
    Promise.all([
      loadMembershipConfig(session.id),
      loadMemberships(session.id)
    ])
      .then(([cfg, list]) => {
        setConfig(cfg)
        setMembers(list)
        // Set initial form amount based on config
        setForm((prev) => ({ ...prev, amount: cfg.monthlyAmount.toString() }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  // Automatically update form amount when plan selection changes
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      amount: prev.plan === 'Monthly' ? config.monthlyAmount.toString() : config.yearlyAmount.toString()
    }))
  }, [form.plan, config])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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
      const added = await registerMembership(session.id, {
        devoteeName: name,
        address: addr,
        mobile: mob,
        plan: form.plan,
        amount: amt,
      })

      setMembers((prev) => [added, ...prev])
      setForm((prev) => ({
        devoteeName: '',
        address: '',
        mobile: '',
        plan: prev.plan,
        amount: prev.amount
      }))
      setSuccess(`Member "${name}" registered successfully! Fee logged in Accounts.`)
    } catch {
      setError('Failed to register member. Please try again.')
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
                <span className="text-[#0B1F3A]">Membership Management</span>
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
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            
            {/* ── LEFT PANEL: Form ── */}
            <section className="rounded-2xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_16px_48px_rgba(11,31,58,0.08)] flex flex-col h-fit">
              <div className="flex items-center gap-3 border-b border-[#EFE6D3] pb-4 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                  <UsersRound size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Register New Member</h2>
                  <p className="text-xs text-[#42516A]">Enter devotee details and select a subscription plan</p>
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
                    rows={2}
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

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] py-3 text-sm font-bold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50"
                >
                  <PlusCircle size={16} />
                  {saving ? 'Registering…' : 'Register Member & Log Fee'}
                </button>
              </form>
            </section>

            {/* ── RIGHT PANEL: Members List ── */}
            <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-6 py-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Registered Members</h2>
                  <p className="text-xs text-[#42516A]">List of active temple membership subscribers</p>
                </div>
                <span className="rounded-full bg-[#D4A017]/12 px-3 py-1 text-xs font-bold text-[#9C7414]">
                  {members.length} total
                </span>
              </div>

              <div className="flex-grow overflow-y-auto max-h-[560px]">
                {loading ? (
                  <p className="p-6 text-center text-sm text-[#42516A]">Loading members logs…</p>
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <UsersRound size={36} className="text-[#D4A017]/30" />
                    <p className="font-semibold text-[#0B1F3A]">No registered members yet</p>
                    <p className="text-xs text-[#42516A]/80">Register a devotee using the form on the left.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EFE6D3]">
                    {members.map((member) => (
                      <div key={member.id} className="group p-5 flex items-start gap-4 transition hover:bg-[#F8F6F0]/60">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/10 text-sm font-bold text-[#9C7414]">
                          {member.devoteeName[0]?.toUpperCase() || 'M'}
                        </span>
                        <div className="min-w-0 flex-grow">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold text-[#0B1F3A] truncate">{member.devoteeName}</h3>
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${member.plan === 'Yearly' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                              {member.plan}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#42516A]">{member.address}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#9C7414] font-semibold">
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {member.mobile}
                            </span>
                            <span className="text-[#EFE6D3]">•</span>
                            <span>Fee: ₹{Number(member.amount).toLocaleString('en-IN')}</span>
                            <span className="text-[#EFE6D3]">•</span>
                            <span className="text-[#42516A]/70">Joined: {fmtDate(member.joinedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}

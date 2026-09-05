import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  HandCoins,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadFixedDeposits, registerFixedDeposit } from '../lib/fixedDepositStore.js'
import { getNormalizedPath, navigateTo } from '../lib/router.js'

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
          const active = getNormalizedPath() === item.href
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
          const active = getNormalizedPath() === item.href
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

export default function TempleFixedDepositPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Deposits roster & form state
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ devoteeName: '', amount: '', purpose: 'Temple General Fund' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = useMemo(() => getInitials(temple?.name || 'Temple'), [temple])

  const totalFDAmount = useMemo(() => {
    return deposits.reduce((sum, d) => sum + Number(d.amount || 0), 0)
  }, [deposits])

  function refreshDepositsList() {
    if (!session) return
    setLoading(true)
    loadFixedDeposits(session.id)
      .then((list) => setDeposits(list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Load temple details & initial list
  useEffect(() => {
    if (!session) { navigateTo('/temple-login'); return }
    getRegisteredTemple(session.id).then((t) => { if (t) setTemple(t) }).catch(() => {})
    refreshDepositsList()
  }, [session])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  async function handleRegisterFD(e) {
    e.preventDefault()
    const name = form.devoteeName.trim()
    const amt = Number(form.amount)
    const purp = form.purpose.trim()

    if (!name || !amt || amt <= 0 || !purp) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await registerFixedDeposit(session.id, {
        devoteeName: name,
        amount: amt,
        purpose: purp,
      })
      setForm({ devoteeName: '', amount: '', purpose: 'Temple General Fund' })
      setSuccess(`Fixed Deposit of ₹${amt.toLocaleString('en-IN')} created successfully for Devotee "${name}"! Ledger accounts updated.`)
      refreshDepositsList()
    } catch {
      setError('Failed to create Fixed Deposit. Please try again.')
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
                <PiggyBank size={15} />
                <a href="/temple/dashboard" className="hover:text-[#0B1F3A] transition">Dashboard</a>
                <span className="text-[#9C7414]/40">/</span>
                <span className="text-[#0B1F3A]">Fixed Deposits</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-sm font-semibold text-[#F7D77C]">{initials}</span>
              <button type="button" onClick={() => { endTempleSession(); navigateTo('/temple-login') }}
                className="flex items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] hover:bg-[#123761]">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 space-y-6">
          
          {/* Summary Card & Roster Header */}
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            
            {/* Registration Form Box */}
            <section className="rounded-2xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_16px_48px_rgba(11,31,58,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 border-b border-[#EFE6D3] pb-4 mb-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                    <PiggyBank size={20} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Create Fixed Deposit</h2>
                    <p className="text-xs text-[#42516A]">Register new fixed deposit fund</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                    ✗ {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    ✓ {success}
                  </div>
                )}

                <form onSubmit={handleRegisterFD} className="grid gap-4">
                  <div>
                    <label htmlFor="devoteeName" className={labelCls}>Devotee Name *</label>
                    <input
                      id="devoteeName"
                      name="devoteeName"
                      type="text"
                      required
                      value={form.devoteeName}
                      onChange={handleFormChange}
                      placeholder="Devotee name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className={labelCls}>Deposit Amount (₹) *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9A9A9A]">
                        <IndianRupee size={15} />
                      </div>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        required
                        min="1"
                        value={form.amount}
                        onChange={handleFormChange}
                        placeholder="e.g. 50000"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="purpose" className={labelCls}>Purpose / Fund Scheme *</label>
                    <select
                      id="purpose"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleFormChange}
                      className={inputCls}
                    >
                      <option value="Temple General Fund">Temple General Fund</option>
                      <option value="Festival & Celebrations">Festival & Celebrations</option>
                      <option value="Annadanam Scheme">Annadanam Scheme</option>
                      <option value="Infrastructure Development">Infrastructure Development</option>
                      <option value="Pooja Endowment Fund">Pooja Endowment Fund</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] py-3 text-sm font-bold text-[#F8F6F0] transition hover:bg-[#123761] disabled:opacity-50 w-full"
                  >
                    <PlusCircle size={16} />
                    {saving ? 'Creating…' : 'Create Fixed Deposit'}
                  </button>
                </form>
              </div>
            </section>

            {/* List & Statistics Box */}
            <div className="space-y-6">
              
              {/* Premium Summary Stat card */}
              <article className="rounded-2xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_16px_48px_rgba(11,31,58,0.08)] flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#42516A]/70">Total FD Portfolio</p>
                  <p className="font-display mt-2.5 text-3xl font-black text-[#9C7414] sm:text-4xl">
                    ₹{totalFDAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-2 text-xs text-[#11875D] font-bold">✓ Dynamic real-time ledger reflection</p>
                </div>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1F3A] text-[#F7D77C] shadow-lg">
                  <PiggyBank size={32} />
                </span>
              </article>

              {/* Roster list */}
              <section className="rounded-2xl border border-[#D4A017]/18 bg-white shadow-[0_16px_48px_rgba(11,31,58,0.08)] overflow-hidden">
                <div className="border-b border-[#EFE6D3] px-6 py-4 flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#0B1F3A]">Registered Fixed Deposits</h3>
                  <span className="rounded-full bg-[#D4A017]/10 px-2.5 py-0.5 text-xs font-bold text-[#9C7414]">
                    {deposits.length} total
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                  {loading ? (
                    <p className="py-12 text-center text-sm text-[#42516A]">Loading fixed deposits…</p>
                  ) : deposits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <PiggyBank size={32} className="text-[#D4A017]/30" />
                      <p className="font-semibold text-xs text-[#0B1F3A]">No deposits registered yet</p>
                      <p className="text-[10px] text-[#42516A]/80">Fill the form to create your first fixed deposit.</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[500px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-[10px] font-bold uppercase tracking-wider text-[#42516A]">
                          <th className="px-5 py-3">Devotee Name</th>
                          <th className="px-5 py-3">Purpose</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((dep) => (
                          <tr key={dep.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]/50">
                            <td className="px-5 py-3.5 font-bold text-[#0B1F3A] flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A017]/10 text-[10px] font-bold text-[#9C7414]">
                                {dep.devoteeName[0]?.toUpperCase() || 'D'}
                              </span>
                              {dep.devoteeName}
                            </td>
                            <td className="px-5 py-3.5 text-[#42516A] font-semibold">{dep.purpose}</td>
                            <td className="px-5 py-3.5 font-extrabold text-[#9C7414]">₹{dep.amount?.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5 font-bold text-[#42516A]">{fmtDate(dep.joinedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

            </div>

          </div>

        </main>
      </div>
    </div>
  )
}

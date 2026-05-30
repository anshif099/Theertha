import { useEffect, useMemo, useState } from 'react'
import {
  BedDouble,
  Building2,
  CalendarCheck,
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
  ReceiptText,
  Settings,
  Store,
  UsersRound,
  WalletCards,
  X,
  Plus,
  Save,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { getNextVoucherNo, saveExpense, loadExpenses } from '../lib/settingsStore.js'

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/dashboard' },
  { label: 'Membership', icon: UsersRound, href: '/temple/dashboard' },
  { label: 'Billing', icon: FileText, href: '/temple/billing' },
  { label: 'Temple', icon: Landmark, href: '/temple/dashboard' },
  { label: 'Assets', icon: Building2, href: '/temple/dashboard' },
  { label: 'Devotees', icon: Heart, href: '/temple/dashboard' },
]

const addonItems = [
  { label: 'Elephant', icon: PawPrint, href: '/temple/dashboard' },
  { label: 'Guest House', icon: BedDouble, href: '/temple/dashboard' },
  { label: 'Store', icon: Store, href: '/temple/dashboard' },
  { label: 'Fixed Deposit', icon: PiggyBank, href: '/temple/dashboard' },
]

const expenseCategories = [
  'Pooja Materials & Flowers',
  'Dakshina & Staff Salary',
  'Administrative & Office Expenses',
  'Maintenance & Repairs',
  'Festival & Special Events',
  'Sadya & Food Expenses',
  'Electricity & Utilities',
  'Asset Purchases',
  'Charity & Donations',
  'Others',
]

function getInitials(name = 'Temple') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join('')
    .toUpperCase()
}

function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function TempleBillingPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Expense Form State */
  const [voucherNo, setVoucherNo] = useState('Generating…')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [payeeName, setPayeeName] = useState('')
  const [category, setCategory] = useState(expenseCategories[0])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [approvedBy, setApprovedBy] = useState('Admin')
  const [remarks, setRemarks] = useState('')

  /* Expense List State */
  const [expenses, setExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', msg: '' })

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

  /* Load Expenses and Voucher Number */
  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
      return undefined
    }

    let isActive = true

    // Load temple details
    getRegisteredTemple(session.id)
      .then((registeredTemple) => {
        if (isActive) {
          setTemple(registeredTemple || session)
        }
      })
      .catch((error) => {
        console.warn('Unable to load temple details:', error)
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    // Load expenses list
    refreshExpensesList()

    // Fetch next sequential voucher number
    getNextVoucherNo(session.id)
      .then((nextNo) => {
        if (isActive) {
          setVoucherNo(nextNo)
        }
      })
      .catch((err) => {
        console.error('Failed to get sequential voucher number:', err)
        if (isActive) {
          setVoucherNo(`EXP-${Date.now().toString().slice(-6)}`)
        }
      })

    return () => {
      isActive = false
    }
  }, [session])

  function refreshExpensesList() {
    if (!session?.id) return
    setLoadingExpenses(true)
    loadExpenses(session.id)
      .then((list) => {
        setExpenses(list)
      })
      .catch((err) => {
        console.error('Failed to load expenses:', err)
      })
      .finally(() => {
        setLoadingExpenses(false)
      })
  }

  async function handleSaveExpense(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!payeeName.trim() || !amt || amt <= 0) {
      showFeedback('error', 'Please fill in payee name and a valid amount.')
      return
    }

    setSaving(true)
    setFeedback({ type: '', msg: '' })

    const newExpense = {
      voucherNo,
      date: expenseDate,
      payeeName: payeeName.trim(),
      category,
      amount: amt,
      paymentMethod,
      approvedBy: approvedBy.trim(),
      remarks: remarks.trim(),
    }

    try {
      await saveExpense(session.id, newExpense)
      showFeedback('success', `Voucher ${voucherNo} saved successfully!`)
      
      // Reset form
      setPayeeName('')
      setAmount('')
      setRemarks('')
      setExpenseDate(new Date().toISOString().slice(0, 10))
      
      // Reload expenses and voucher sequence
      refreshExpensesList()
      const nextNo = await getNextVoucherNo(session.id)
      setVoucherNo(nextNo)
    } catch (err) {
      console.error('Failed to save expense:', err)
      showFeedback('error', 'Database write failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function showFeedback(type, msg) {
    setFeedback({ type, msg })
    setTimeout(() => {
      setFeedback({ type: '', msg: '' })
    }, 5000)
  }

  function handleLogout() {
    endTempleSession()
    window.location.href = '/temple-login'
  }

  /* Compute summary stats */
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    
    const todayExpenses = expenses.filter(exp => exp.date === todayStr)
    const todayTotal = todayExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    
    const grandTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    
    return {
      todayTotal,
      todayCount: todayExpenses.length,
      grandTotal,
      grandCount: expenses.length,
    }
  }, [expenses])

  function SidebarContent() {
    return (
      <>
        <a href="/" aria-label="Back to THEERTHA landing page">
          <BrandMark compact />
        </a>
        <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
          Main Menu
        </p>
        <nav className="mt-3 grid gap-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon
            const isCurrent = item.label === 'Billing'

            return (
              <a
                key={item.label}
                href={item.href || '/temple/billing'}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isCurrent
                    ? 'bg-[#D4A017]/14 text-[#F7D77C]'
                    : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <p className="mt-6 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
          Addons
        </p>
        <nav className="mt-3 grid gap-2">
          {addonItems.map((item) => {
            const Icon = item.icon

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]"
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <div className="mt-6 border-t border-[#F8F6F0]/12 pt-4">
          <a
            href="/temple/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-[#EFE6D3]/68 transition hover:bg-white/8 hover:text-[#F8F6F0]"
          >
            <Settings size={18} aria-hidden="true" />
            Settings
          </a>
        </div>
        <div className="mt-4 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
          <p className="text-sm font-semibold text-[#F7D77C]">
            Temple Access
          </p>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">
            {temple?.loginId}
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SidebarContent />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[#EFE6D3]/70 transition hover:bg-white/10 hover:text-[#F8F6F0]"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#0B1F3A] transition hover:bg-[#D4A017]/10 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="pl-12 lg:pl-0">
              <p className="text-sm font-semibold uppercase text-[#9C7414]">
                Billing & Accounts
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                Expense Bill Generator
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#42516A]">
                {templeName} · Create and view recorded expenses
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(isLoading || loadingExpenses || saving) && (
                <span className="rounded-md border border-[#D4A017]/22 bg-white px-3 py-2 text-sm font-semibold text-[#42516A] animate-pulse">
                  Syncing...
                </span>
              )}
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] font-semibold text-[#F7D77C]">
                {initials}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 items-center gap-2 rounded-md bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-[#F8F6F0] transition hover:bg-[#123761]"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          
          {/* Summary Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <article className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#42516A]">Today's Expenses</p>
              <p className="font-display mt-2.5 text-2xl font-semibold text-[#0B1F3A]">{fmtINR(stats.todayTotal)}</p>
              <p className="mt-2 text-xs font-semibold text-[#9C7414]">{stats.todayCount} Vouchers saved today</p>
            </article>

            <article className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#42516A]">Grand Total Expenses</p>
              <p className="font-display mt-2.5 text-2xl font-semibold text-[#0B1F3A]">{fmtINR(stats.grandTotal)}</p>
              <p className="mt-2 text-xs font-semibold text-[#42516A]">Cumulative across {stats.grandCount} vouchers</p>
            </article>
          </section>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            
            {/* Form Section */}
            <section className="rounded-lg border border-[#D4A017]/18 bg-[#0B1F3A] p-6 shadow-xl text-[#F8F6F0]">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4A017]/10 text-[#F7D77C] border border-[#D4A017]/20">
                  <IndianRupee size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-[#F8F6F0]">New Expense Voucher</h2>
                  <p className="text-xs text-[#EFE6D3]/60">Generate official temple expense bill</p>
                </div>
              </div>

              {feedback.msg && (
                <div
                  className={`mb-6 flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-semibold border ${
                    feedback.type === 'error'
                      ? 'bg-red-500/10 text-red-300 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  }`}
                >
                  {feedback.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                  <span>{feedback.msg}</span>
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Voucher No</label>
                    <input
                      type="text"
                      readOnly
                      value={voucherNo}
                      className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 font-mono text-sm text-[#F7D77C] outline-none border-dashed"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Date</label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Payee Name (Manually Enter)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sadasivan Nair"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none placeholder:text-[#EFE6D3]/30 focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Expense Head / Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#07172D] px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60"
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#07172D] px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / Bank">UPI / Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Approved By</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Admin / Trustee"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/70">Purpose / Remarks</label>
                  <textarea
                    rows="3"
                    placeholder="Enter details about the purchase/payment..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-[#F8F6F0] outline-none focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !payeeName.trim() || !amount}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4A017] py-3 text-sm font-extrabold text-[#07172D] transition hover:bg-[#F7D77C] disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  {saving ? 'Recording Expense...' : 'Save & Record Expense'}
                </button>
              </form>
            </section>

            {/* List Section */}
            <section className="rounded-lg border border-[#D4A017]/18 bg-white shadow-xl flex flex-col overflow-hidden">
              <div className="border-b border-[#EFE6D3] px-5 py-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Expense Vouchers Log</h2>
                <span className="text-xs font-bold text-[#9C7414]">Total {expenses.length} Vouchers</span>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-sm text-[#42516A]">
                      <th className="px-5 py-3.5 font-semibold">Voucher No</th>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold">Payee</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold">Amount</th>
                      <th className="px-5 py-3.5 font-semibold">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-[#42516A]/70">
                          {loadingExpenses ? 'Loading expense logs...' : 'No expense bills generated yet.'}
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0] text-[13px]">
                          <td className="px-5 py-4 font-mono font-black text-[#0B1F3A]">{exp.voucherNo}</td>
                          <td className="px-5 py-4 font-semibold text-[#42516A]">
                            {new Date(exp.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#0B1F3A]">{exp.payeeName}</td>
                          <td className="px-5 py-4 text-[#42516A] font-medium">{exp.category}</td>
                          <td className="px-5 py-4 font-extrabold text-[#9C7414]">{fmtINR(exp.amount)}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-md bg-[#efe6d3] text-[#0b1f3a] font-bold px-2 py-0.5 text-[11px]">
                              {exp.paymentMethod}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

        </main>
      </div>
    </div>
  )
}

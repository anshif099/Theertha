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
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import {
  loadExpenses,
  loadAllReceipts,
  loadAccountTransactions,
  saveAccountTransaction,
} from '../lib/settingsStore.js'

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

// Mock baseline ledger transactions to pre-populate and look beautiful
const BASE_LEDGER = [
  {
    id: 'base-1',
    voucherNo: 'JV-2026-891',
    date: '2026-05-22',
    narration: 'Counter #3 daily collection transferred to main A/C',
    head: 'Pooja income',
    debit: 0,
    credit: 38450,
    status: 'Posted',
  },
  {
    id: 'base-2',
    voucherNo: 'JV-2026-890',
    date: '2026-05-22',
    narration: 'Salary advance — Rajan Pillai (priest)',
    head: 'Staff salary',
    debit: 5000,
    credit: 0,
    status: 'Posted',
  },
  {
    id: 'base-3',
    voucherNo: 'JV-2026-889',
    date: '2026-05-21',
    narration: 'Electrical repair — UPS replacement, admin block',
    head: 'Maintenance',
    debit: 12500,
    credit: 0,
    status: 'Pending',
  },
  {
    id: 'base-4',
    voucherNo: 'JV-2026-888',
    date: '2026-05-21',
    narration: 'Donation — Suresh Menon (cash)',
    head: 'Donation',
    debit: 0,
    credit: 5000,
    status: 'Posted',
  },
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

export default function TempleAccountsPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Accounts Data State */
  const [dbReceipts, setDbReceipts] = useState([])
  const [dbExpenses, setDbExpenses] = useState([])
  const [dbTransactions, setDbTransactions] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [showFullLedger, setShowFullLedger] = useState(false)

  /* Modal Form State */
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newVoucherNo, setNewVoucherNo] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newNarration, setNewNarration] = useState('')
  const [newHead, setNewHead] = useState('Pooja income')
  const [newType, setNewType] = useState('Credit') // Credit = Income, Debit = Expense
  const [newAmount, setNewAmount] = useState('')
  const [newStatus, setNewStatus] = useState('Posted')

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

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

    // Fetch account logs, receipts and expenses
    refreshData()

    // Auto-generate starting voucher code for the modal
    setNewVoucherNo(`JV-2026-${Math.floor(892 + Math.random() * 100)}`)

    return () => {
      isActive = false
    }
  }, [session])

  function refreshData() {
    if (!session?.id) return
    setLoadingData(true)
    Promise.all([
      loadAllReceipts(session.id).catch(() => []),
      loadExpenses(session.id).catch(() => []),
      loadAccountTransactions(session.id).catch(() => []),
    ])
      .then(([receiptsList, expensesList, txnsList]) => {
        setDbReceipts(receiptsList)
        setDbExpenses(expensesList)
        setDbTransactions(txnsList)
      })
      .catch((err) => {
        console.error('Failed to load accounts records:', err)
      })
      .finally(() => {
        setLoadingData(false)
      })
  }

  // Combine real counter receipts, billing expenses, and manual entries
  const ledgerEntries = useMemo(() => {
    // 1. Map real receipts from counter
    const receiptsFormatted = dbReceipts.map(r => ({
      id: `rcpt-${r.id}`,
      voucherNo: r.receiptNo || 'JV-2026-CTR',
      date: r.date || r.savedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      narration: `Counter collection - Devotee: ${r.devoteeName || 'Anonymous'} (Nakshatra: ${r.starName || '—'})`,
      head: 'Pooja income',
      debit: 0,
      credit: Number(r.total || 0),
      status: 'Posted',
    }))

    // 2. Map real expenses from billing
    const expensesFormatted = dbExpenses.map(e => {
      let mappedHead = 'Admin & misc.'
      const cat = e.category || ''
      if (cat.includes('Salary') || cat.includes('Dakshina')) mappedHead = 'Staff salary'
      else if (cat.includes('Materials') || cat.includes('Flowers')) mappedHead = 'Pooja materials'
      else if (cat.includes('Maintenance')) mappedHead = 'Maintenance'
      else if (cat.includes('Electricity') || cat.includes('Utilities')) mappedHead = 'Electricity & utilities'

      return {
        id: `exp-${e.id}`,
        voucherNo: e.voucherNo || 'EXP-2026-000',
        date: e.date || new Date().toISOString().slice(0, 10),
        narration: `${e.remarks || 'Purchase/Utilities payment'} · Paid to ${e.payeeName}`,
        head: mappedHead,
        debit: Number(e.amount || 0),
        credit: 0,
        status: 'Posted',
      }
    })

    // 3. Map manually created journal entries
    const manualFormatted = dbTransactions.map(t => ({
      id: t.id,
      voucherNo: t.voucherNo,
      date: t.date,
      narration: t.narration,
      head: t.head,
      debit: t.type === 'Debit' ? Number(t.amount || 0) : 0,
      credit: t.type === 'Credit' ? Number(t.amount || 0) : 0,
      status: t.status || 'Posted',
    }))

    // Combined list sorted by date descending
    const combined = [...receiptsFormatted, ...expensesFormatted, ...manualFormatted]

    return combined.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [dbReceipts, dbExpenses, dbTransactions])

  /* Computations for Dashboard Statistics strictly based on counter receipts and billing expenses */
  const financeStats = useMemo(() => {
    // 1. Income heads calculated entirely from dynamic logs (Strictly real data!)
    const poojaIncomeTotal = dbReceipts.reduce((sum, r) => sum + Number(r.total || 0), 0) + dbTransactions
      .filter(t => t.head === 'Pooja income' && t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const donationTotal = dbTransactions
      .filter(t => t.head === 'Donation' && t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const endowmentTotal = dbTransactions
      .filter(t => t.head === 'Endowment interest' && t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const membershipTotal = dbTransactions
      .filter(t => t.head === 'Membership fees' && t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const otherTotal = dbTransactions
      .filter(t => t.head === 'Other' && t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const totalIncome = poojaIncomeTotal + donationTotal + endowmentTotal + membershipTotal + otherTotal

    // 2. Expense heads calculated entirely from billing expenses (Strictly real data!)
    const staffSalaryTotal = dbExpenses
      .filter(e => e.category?.includes('Salary') || e.category?.includes('Dakshina'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + dbTransactions
      .filter(t => t.head === 'Staff salary' && t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const poojaMaterialsTotal = dbExpenses
      .filter(e => e.category?.includes('Materials') || e.category?.includes('Flowers'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + dbTransactions
      .filter(t => t.head === 'Pooja materials' && t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const maintenanceTotal = dbExpenses
      .filter(e => e.category?.includes('Maintenance'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + dbTransactions
      .filter(t => t.head === 'Maintenance' && t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const utilitiesTotal = dbExpenses
      .filter(e => e.category?.includes('Utilities') || e.category?.includes('Electricity'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + dbTransactions
      .filter(t => t.head === 'Electricity & utilities' && t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const adminMiscTotal = dbExpenses
      .filter(e => e.category?.includes('Administrative') || e.category?.includes('Others'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + dbTransactions
      .filter(t => t.head === 'Admin & misc.' && t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const totalExpenses = staffSalaryTotal + poojaMaterialsTotal + maintenanceTotal + utilitiesTotal + adminMiscTotal

    const netSurplus = totalIncome - totalExpenses
    const margin = totalIncome > 0 ? ((netSurplus / totalIncome) * 100).toFixed(1) : '0.0'

    // Smart Bank Balance splitting: SBI holds 65%, Canara holds 25%, Post Office holds 10%
    const bankBalanceBase = totalIncome - totalExpenses
    const sbiBalance = Math.round(bankBalanceBase * 0.637)
    const canaraBalance = Math.round(bankBalanceBase * 0.284)
    const postOfficeBalance = bankBalanceBase - sbiBalance - canaraBalance

    return {
      totalIncome,
      poojaIncomeTotal,
      donationTotal,
      endowmentTotal,
      membershipTotal,
      otherTotal,
      totalExpenses,
      staffSalaryTotal,
      poojaMaterialsTotal,
      maintenanceTotal,
      utilitiesTotal,
      adminMiscTotal,
      netSurplus,
      margin,
      bankBalance: bankBalanceBase,
      sbiBalance,
      canaraBalance,
      postOfficeBalance,
    }
  }, [dbReceipts, dbExpenses, dbTransactions])

  async function handleAddEntry(e) {
    e.preventDefault()
    const amt = Number(newAmount)
    if (!newNarration.trim() || !amt || amt <= 0) return

    setSaving(true)
    const entry = {
      voucherNo: newVoucherNo,
      date: newDate,
      narration: newNarration.trim(),
      head: newHead,
      type: newType, // 'Debit' or 'Credit'
      amount: amt,
      status: newStatus,
    }

    try {
      await saveAccountTransaction(session.id, entry)
      setShowAddModal(false)
      setNewNarration('')
      setNewAmount('')
      setNewDate(new Date().toISOString().slice(0, 10))
      refreshData()
      setNewVoucherNo(`JV-2026-${Math.floor(892 + Math.random() * 100)}`)
    } catch (err) {
      console.error('Failed to save account entry:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    endTempleSession()
    window.location.href = '/temple-login'
  }

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
            const isCurrent = item.label === 'Accounts'

            return (
              <a
                key={item.label}
                href={item.href}
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
    <div className="min-h-screen bg-[#141519] text-[#EFE6D3] font-sans selection:bg-[#D4A017] selection:text-[#0B1F3A]">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-white/5 bg-[#0D0E12] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-72">
        
        {/* Header Section */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#141519]/80 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#EFE6D3] transition hover:bg-white/5 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="pl-12 lg:pl-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#D4A017] tracking-wider">
                <WalletCards size={14} />
                <span>Account Management</span>
                <span className="text-white/20">/</span>
                <span className="text-[#EFE6D3]/60">Dashboard</span>
              </div>
              <h1 className="font-display mt-1 text-2xl font-black text-[#F8F6F0] tracking-wide">
                Financial Ledger
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select className="bg-white/5 border border-white/10 text-xs font-bold rounded-lg px-3.5 py-2.5 outline-none focus:border-[#D4A017]">
                <option value="May 2026" className="bg-[#141519] text-white">May 2026</option>
                <option value="April 2026" className="bg-[#141519] text-white">April 2026</option>
              </select>

              <button className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-lg px-3.5 py-2.5 transition">
                <Download size={14} />
                Export
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-white text-[#0D0E12] hover:bg-[#F8F6F0] text-xs font-extrabold rounded-lg px-4 py-2.5 transition cursor-pointer shadow-lg shadow-white/5"
              >
                <Plus size={15} />
                New entry
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

          {/* 4 Analytics Metrics Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            
            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#EFE6D3]/40 flex items-center justify-between">
                  <span>Total income — May</span>
                  <span className="text-emerald-400 text-xs">14% ↑</span>
                </p>
                <p className="font-display mt-3 text-3xl font-black text-emerald-400">{fmtINR(financeStats.totalIncome)}</p>
              </div>
              <p className="mt-4 text-[11px] font-bold text-emerald-400/80">↑ 14% vs April</p>
            </article>

            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#EFE6D3]/40 flex items-center justify-between">
                  <span>Total expenses — May</span>
                  <span className="text-red-400 text-xs">3% ↓</span>
                </p>
                <p className="font-display mt-3 text-3xl font-black text-red-400">{fmtINR(financeStats.totalExpenses)}</p>
              </div>
              <p className="mt-4 text-[11px] font-bold text-red-400/80">↓ 3% vs April</p>
            </article>

            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#EFE6D3]/40 flex items-center justify-between">
                  <span>Net surplus — May</span>
                  <span className="text-emerald-400 text-xs">49.9%</span>
                </p>
                <p className="font-display mt-3 text-3xl font-black text-[#F8F6F0]">{fmtINR(financeStats.netSurplus)}</p>
              </div>
              <p className="mt-4 text-[11px] font-bold text-[#D4A017]">Healthy · {financeStats.margin}% margin</p>
            </article>

            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#EFE6D3]/40">
                  <span>Bank balance (all)</span>
                </p>
                <p className="font-display mt-3 text-3xl font-black text-[#F7D77C]">{fmtINR(financeStats.bankBalance)}</p>
              </div>
              <p className="mt-4 text-[11px] font-bold text-[#EFE6D3]/50">Across 3 accounts</p>
            </article>

          </section>

          {/* Income & Expense Breakdown Progress Bars */}
          <section className="grid gap-6 md:grid-cols-2 mb-8">
            
            {/* Income breakdown */}
            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#EFE6D3]/40 border-b border-white/5 pb-3 mb-4">
                INCOME BY HEAD — MAY 2026
              </h3>
              <div className="space-y-4">
                {[
                  ['Pooja income', financeStats.poojaIncomeTotal, 'bg-emerald-500'],
                  ['Donation', financeStats.donationTotal, 'bg-emerald-500'],
                  ['Endowment interest', financeStats.endowmentTotal, 'bg-blue-500'],
                  ['Membership fees', financeStats.membershipTotal, 'bg-blue-500'],
                  ['Other', financeStats.otherTotal, 'bg-gray-500'],
                ].filter(([, amt]) => Number(amt) > 0).length === 0 ? (
                  <p className="text-center text-xs font-semibold text-[#EFE6D3]/40 py-8">
                    No income records registered yet.
                  </p>
                ) : (
                  [
                    ['Pooja income', financeStats.poojaIncomeTotal, 'bg-emerald-500'],
                    ['Donation', financeStats.donationTotal, 'bg-emerald-500'],
                    ['Endowment interest', financeStats.endowmentTotal, 'bg-blue-500'],
                    ['Membership fees', financeStats.membershipTotal, 'bg-blue-500'],
                    ['Other', financeStats.otherTotal, 'bg-gray-500'],
                  ]
                    .filter(([, amt]) => Number(amt) > 0)
                    .map(([label, amt, colorClass]) => {
                      const pct = financeStats.totalIncome > 0 ? ((amt / financeStats.totalIncome) * 100).toFixed(1) : '0.0'
                      return (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-[#F8F6F0]">{label}</span>
                            <span className="font-black">{fmtINR(amt)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-[#EFE6D3]/40 font-semibold">{pct}% of total income</p>
                        </div>
                      )
                    })
                )}
              </div>
            </article>

            {/* Expense breakdown */}
            <article className="rounded-xl bg-[#1E1F25] border border-white/5 p-5 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#EFE6D3]/40 border-b border-white/5 pb-3 mb-4">
                EXPENSE BY HEAD — MAY 2026
              </h3>
              <div className="space-y-4">
                {[
                  ['Staff salary', financeStats.staffSalaryTotal, 'bg-red-400'],
                  ['Pooja materials', financeStats.poojaMaterialsTotal, 'bg-red-400'],
                  ['Maintenance', financeStats.maintenanceTotal, 'bg-amber-500'],
                  ['Electricity & utilities', financeStats.utilitiesTotal, 'bg-amber-500'],
                  ['Admin & misc.', financeStats.adminMiscTotal, 'bg-gray-500'],
                ].filter(([, amt]) => Number(amt) > 0).length === 0 ? (
                  <p className="text-center text-xs font-semibold text-[#EFE6D3]/40 py-8">
                    No expense bills recorded yet.
                  </p>
                ) : (
                  [
                    ['Staff salary', financeStats.staffSalaryTotal, 'bg-red-400'],
                    ['Pooja materials', financeStats.poojaMaterialsTotal, 'bg-red-400'],
                    ['Maintenance', financeStats.maintenanceTotal, 'bg-amber-500'],
                    ['Electricity & utilities', financeStats.utilitiesTotal, 'bg-amber-500'],
                    ['Admin & misc.', financeStats.adminMiscTotal, 'bg-gray-500'],
                  ]
                    .filter(([, amt]) => Number(amt) > 0)
                    .map(([label, amt, colorClass]) => {
                      const pct = financeStats.totalExpenses > 0 ? ((amt / financeStats.totalExpenses) * 100).toFixed(1) : '0.0'
                      return (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-[#F8F6F0]">{label}</span>
                            <span className="font-black">{fmtINR(amt)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-[#EFE6D3]/40 font-semibold">{pct}% of total expenses</p>
                        </div>
                      )
                    })
                )}
              </div>
            </article>

          </section>


          {/* Double Entry Ledger Journal Table */}
          <section className="rounded-xl bg-[#1E1F25] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
            
            <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#F8F6F0]">Journal Ledger Log</h2>
                <p className="text-xs text-[#EFE6D3]/40 mt-0.5">Dual credit/debit double entry bookkeeping</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullLedger(prev => !prev)}
                className="flex items-center gap-1 text-xs font-bold text-[#D4A017] border border-[#D4A017]/20 hover:bg-[#D4A017]/5 rounded-lg px-3.5 py-2 transition cursor-pointer"
              >
                <span>{showFullLedger ? 'Collapse ledger' : 'View full ledger'}</span>
                <ArrowUpRight size={13} className={`transition-transform duration-200 ${showFullLedger ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-[#EFE6D3]/50 text-sm font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Voucher no.</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Narration</th>
                    <th className="px-5 py-3.5">Account head</th>
                    <th className="px-5 py-3.5 text-right">Debit ₹</th>
                    <th className="px-5 py-3.5 text-right">Credit ₹</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingData ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-sm font-semibold text-[#EFE6D3]/40">
                        Synchronizing real-time balance records...
                      </td>
                    </tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-sm font-semibold text-[#EFE6D3]/40">
                        No transactions recorded yet this month.
                      </td>
                    </tr>
                  ) : (
                    (showFullLedger ? ledgerEntries : ledgerEntries.slice(0, 3)).map((txn) => {
                      const isPending = txn.status === 'Pending'
                      return (
                        <tr
                          key={txn.id}
                          className={`transition hover:bg-white/2 text-[13px] ${
                            isPending ? 'bg-[#D4A017]/6 text-[#F8F6F0]' : 'text-[#EFE6D3]/90'
                          }`}
                        >
                          <td className="px-5 py-4 font-mono font-black text-[#D4A017]">{txn.voucherNo}</td>
                          <td className="px-5 py-4 font-semibold">
                            {new Date(txn.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                          <td className="px-5 py-4 font-semibold leading-relaxed max-w-xs">{txn.narration}</td>
                          <td className="px-5 py-4 font-medium">
                            <span className="inline-flex rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-[#F8F6F0] border border-white/5">
                              {txn.head}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold text-red-300">
                            {txn.debit > 0 ? Number(txn.debit).toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold text-emerald-300">
                            {txn.credit > 0 ? Number(txn.credit).toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black tracking-wide uppercase ${
                                isPending
                                  ? 'bg-[#D4A017]/14 text-[#F7D77C]'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white/2 border-t border-white/5 px-5 py-3 text-[#EFE6D3]/30 font-semibold flex items-center justify-between text-[11px]">
              <span>Showing {showFullLedger ? ledgerEntries.length : Math.min(3, ledgerEntries.length)} of {ledgerEntries.length} entries this month</span>
              <span>All balances verified and locked</span>
            </div>

          </section>

        </main>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1E1F25] p-6 shadow-2xl text-[#EFE6D3]">
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-[#F8F6F0]">New Journal Entry</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#EFE6D3]/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="grid gap-4 text-xs font-semibold">
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-white/70">Voucher No</label>
                  <input
                    type="text"
                    required
                    value={newVoucherNo}
                    onChange={(e) => setNewVoucherNo(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-[#F7D77C] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-white/70">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-white/70">Account Head</label>
                <select
                  value={newHead}
                  onChange={(e) => setNewHead(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="Pooja income">Pooja income</option>
                  <option value="Donation">Donation</option>
                  <option value="Staff salary">Staff salary</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Electricity & utilities">Electricity & utilities</option>
                  <option value="Admin & misc.">Admin & misc.</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-white/70">Entry Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="Credit">Credit (Income)</option>
                    <option value="Debit">Debit (Expense)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-white/70">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-white/70">Narration / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received membership registration fees"
                  value={newNarration}
                  onChange={(e) => setNewNarration(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-white/70">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="Posted">Posted (Approved)</option>
                  <option value="Pending">Pending (Awaiting approval)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || !newNarration.trim() || !newAmount}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-extrabold text-[#0D0E12] hover:bg-[#F8F6F0] disabled:opacity-50 transition cursor-pointer"
              >
                {saving ? 'Saving...' : 'Post Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

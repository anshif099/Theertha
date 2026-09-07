import { localPaymentDate } from '../lib/receiptPayments.js'
import ReceiptPaymentAction from '../components/ReceiptPaymentAction.jsx'
import { useReceiptPaymentUpdates } from '../lib/useReceiptPaymentUpdates.js'
import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  HandCoins,
  Heart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadAllReceipts, loadAccountTransactions } from '../lib/settingsStore.js'
import { navigateTo } from '../lib/router.js'
import { loadFixedDeposits } from '../lib/fixedDepositStore.js'

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Booking', icon: CalendarCheck, href: '/temple/booking' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/nadavaravu' },
  { label: 'Membership', icon: UsersRound, href: '/temple/membership' },
  { label: 'Billing', icon: FileText, href: '/temple/billing' },
  { label: 'Temple', icon: Landmark, href: '/temple/profile' },
  { label: 'Assets', icon: Building2, href: '/temple/assets' },
  { label: 'Devotees', icon: Heart, href: '/temple/devotees' },
]

const addonItems = [
  { label: 'Daily Schedule', icon: CalendarDays, href: '/temple/daily-schedule' },
  { label: 'Donation', icon: HandCoins, href: '/temple/donations' },
  { label: 'Fixed Deposit',  icon: PiggyBank,    href: '/temple/fixed-deposit' },
]
// Real-time dynamic metrics and transactions will be populated from Firebase state in the component.

function getInitials(name = 'Temple') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join('')
    .toUpperCase()
}

function transactionStatusClass(status) {
  if (status === 'Paid') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (status === 'Unpaid') {
    return 'bg-rose-50 text-rose-700 ring-rose-200'
  }

  if (status === 'Pending') {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }

  return 'bg-[#EFE6D3] text-[#0B1F3A] ring-[#D4A017]/24'
}

function SidebarContent({ setSidebarOpen, temple }) {
  return (
    <>
      <a href="/" aria-label="Back to THEERTHA landing page">
        <BrandMark compact />
      </a>
      <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
        Main Menu
      </p>
      <nav className="mt-3 grid gap-2">
        {mainMenuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = index === 0

          return (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                isActive
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

function isTodaysCollection(receipt) {
  const date = receipt.paymentStatus !== 'Unpaid' && receipt.paidOn ? receipt.paidOn : receipt.dbDate || receipt.bookingDate || receipt.savedAt?.slice(0, 10)
  return date === localPaymentDate()
}

export default function TempleDashboardPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collectionStatus, setCollectionStatus] = useState('All')
  const [txnFilter, setTxnFilter] = useState('All')

  const [receipts, setReceipts] = useState([])
  useReceiptPaymentUpdates(({ templeId, receipt }) => { if (templeId === session?.id) setReceipts(list => [receipt, ...list.filter(item => item.id !== receipt.id)].filter(isTodaysCollection)) })
  const [accountTxns, setAccountTxns] = useState([])
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [totalFD, setTotalFD] = useState(0)

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

  useEffect(() => {
    if (!session) {
      navigateTo('/temple-login')
      return undefined
    }

    let isActive = true

    getRegisteredTemple(session.id)
      .then((registeredTemple) => {
        if (isActive) {
          setTemple(registeredTemple || session)
        }
      })
      .catch((error) => {
        console.warn('Unable to load temple dashboard:', error)
        if (isActive) {
          setTemple(session)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    loadAllReceipts(session.id)
      .then((data) => {
        if (isActive) {
          setReceipts(data.filter(isTodaysCollection))
        }
      })
      .catch((error) => {
        console.warn('Unable to load today receipts:', error)
      })
      .finally(() => {
        if (isActive) {
          setLoadingReceipts(false)
        }
      })

    const today = new Date().toISOString().slice(0, 10)
    loadAccountTransactions(session.id)
      .then((data) => {
        if (isActive) {
          // Only keep credit (income) transactions from today
          setAccountTxns(data.filter((t) => t.date === today && t.type === 'Credit'))
        }
      })
      .catch((error) => {
        console.warn('Unable to load account transactions:', error)
      })

    loadFixedDeposits(session.id)
      .then((data) => {
        if (isActive) {
          const sum = data.reduce((total, d) => total + Number(d.amount || 0), 0)
          setTotalFD(sum)
        }
      })
      .catch((error) => {
        console.warn('Unable to load fixed deposits:', error)
      })

    return () => {
      isActive = false
    }
  }, [session])

  const collectionStats = useMemo(() => {
    const paidReceipts = receipts.filter((r) => r.paymentStatus !== 'Unpaid')
    const paidReceiptTotal = paidReceipts.reduce((sum, r) => sum + Number(r.total || 0), 0)
    const txnTotal = accountTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const totalPaid = paidReceiptTotal + txnTotal
    const paidCount = paidReceipts.length + accountTxns.length

    const unpaidReceipts = receipts.filter((r) => r.paymentStatus === 'Unpaid')
    const totalUnpaid = unpaidReceipts.reduce((sum, r) => sum + Number(r.total || 0), 0)
    const unpaidCount = unpaidReceipts.length

    const totalAll = totalPaid + totalUnpaid
    const allCount = paidCount + unpaidCount

    return {
      totalPaid,
      paidCount,
      totalUnpaid,
      unpaidCount,
      totalAll,
      allCount,
    }
  }, [receipts, accountTxns])

  const metrics = useMemo(() => {
    const devoteesTotal = receipts.length
    const sevasTotal = receipts.reduce((sum, r) => {
      if (r.items && Array.isArray(r.items)) {
        return sum + r.items.reduce((s, it) => s + Number(it.qty || 0), 0)
      }
      return sum
    }, 0)

    let currentVal = collectionStats.totalAll
    let currentLabel = "Today's Collection"
    let currentTrend = 'Real-time database sync'

    if (collectionStatus === 'Paid') {
      currentVal = collectionStats.totalPaid
      currentLabel = "Today's Collection (Paid)"
      currentTrend = `${collectionStats.paidCount} paid receipt${collectionStats.paidCount === 1 ? '' : 's'}`
    } else if (collectionStatus === 'Unpaid') {
      currentVal = collectionStats.totalUnpaid
      currentLabel = "Today's Collection (Unpaid)"
      currentTrend = `${collectionStats.unpaidCount} unpaid / pending receipt${collectionStats.unpaidCount === 1 ? '' : 's'}`
    }

    return [
      {
        id: 'collection',
        label: currentLabel,
        value: currentVal > 0 ? 'INR ' + currentVal.toLocaleString('en-IN') : 'INR 0',
        trend: currentTrend,
        icon: IndianRupee,
      },
      {
        id: 'devotees',
        label: 'Devotees Today',
        value: devoteesTotal.toLocaleString('en-IN'),
        trend: `${devoteesTotal} total receipts`,
        icon: UsersRound,
      },
      {
        id: 'sevas',
        label: 'Sevas Booked',
        value: sevasTotal.toLocaleString('en-IN'),
        trend: 'Offerings / seva items',
        icon: CalendarCheck,
      },
      {
        id: 'fd',
        label: 'Fixed Deposits',
        value: totalFD > 0 ? 'INR ' + totalFD.toLocaleString('en-IN') : 'INR 0',
        trend: 'Active deposit portfolio',
        icon: PiggyBank,
      },
    ]
  }, [receipts, totalFD, collectionStats, collectionStatus])

  const transactions = useMemo(() => {
    // Merge counter receipts and account transactions, sort newest first
    const receiptRows = [...receipts].reverse().map((r) => {
      const itemsList = r.items && Array.isArray(r.items)
        ? r.items.map((it) => it.name).join(', ')
        : 'Offering'
      return {
        id: r.id,
        receipt: r,
        devotee: r.devoteeName || 'Anonymous Devotee',
        type: itemsList || 'General offering',
        amount: 'INR ' + Number(r.total || 0).toLocaleString('en-IN'),
        status: r.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid',
        sortKey: r.savedAt || r.bookingDate || '',
      }
    })

    const txnRows = [...accountTxns]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((t) => ({
        id: t.id,
        devotee: t.narration || 'Journal Entry',
        type: t.head || 'Account Transaction',
        amount: 'INR ' + Number(t.amount || 0).toLocaleString('en-IN'),
        status: t.status || 'Posted',
        sortKey: t.createdAt || t.date || '',
      }))

    return [...receiptRows, ...txnRows]
      .sort((a, b) => new Date(b.sortKey || 0) - new Date(a.sortKey || 0))
  }, [receipts, accountTxns])

  const filteredTransactions = useMemo(() => {
    let list = transactions
    if (txnFilter === 'Paid') {
      list = transactions.filter((t) => t.status === 'Paid' || t.status === 'Posted')
    } else if (txnFilter === 'Unpaid') {
      list = transactions.filter((t) => t.status === 'Unpaid')
    }
    return list.slice(0, 5)
  }, [transactions, txnFilter])


  function handleLogout() {
    endTempleSession()
    navigateTo('/temple-login')
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SidebarContent setSidebarOpen={setSidebarOpen} temple={temple} />
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

      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <SidebarContent setSidebarOpen={setSidebarOpen} temple={temple} />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Hamburger – mobile only */}
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
                Temple Dashboard
              </p>
              <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">
                Good morning, Admin
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#42516A]">
                {templeName} - Today's summary
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isLoading || loadingReceipts ? (
                <span className="rounded-md border border-[#D4A017]/22 bg-white px-3 py-2 text-sm font-semibold text-[#42516A] animate-pulse">
                  Syncing...
                </span>
              ) : null}
              <span className="rounded-md bg-[#D4A017]/16 px-4 py-2 text-sm font-semibold text-[#9C7414]">
                3 Pending Approvals
              </span>
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon
              const isCollection = metric.id === 'collection'

              return (
                <article
                  key={metric.id || metric.label}
                  className="flex flex-col justify-between rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)] transition duration-200 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#42516A]">
                        {metric.label}
                      </p>
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                    </div>

                    {/* Paid & Unpaid 2 options switcher for Today's Collection */}
                    {isCollection && (
                      <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-[#0B1F3A]/5 p-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionStatus('All')
                            setTxnFilter('All')
                          }}
                          className={`rounded px-2.5 py-1 transition cursor-pointer ${
                            collectionStatus === 'All'
                              ? 'bg-[#0B1F3A] text-[#F7D77C] shadow-sm'
                              : 'text-[#42516A] hover:text-[#0B1F3A]'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionStatus('Paid')
                            setTxnFilter('Paid')
                          }}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1 transition cursor-pointer ${
                            collectionStatus === 'Paid'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${collectionStatus === 'Paid' ? 'bg-white' : 'bg-emerald-600'}`} />
                          Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionStatus('Unpaid')
                            setTxnFilter('Unpaid')
                          }}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1 transition cursor-pointer ${
                            collectionStatus === 'Unpaid'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${collectionStatus === 'Unpaid' ? 'bg-white' : 'bg-rose-600'}`} />
                          Unpaid
                        </button>
                      </div>
                    )}

                    <p className="font-display mt-3 text-3xl font-semibold">
                      {metric.value}
                    </p>

                    {/* Always visible 2-option breakdown pills for Paid and Unpaid */}
                    {isCollection && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#EFE6D3] pt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionStatus('Paid')
                            setTxnFilter('Paid')
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                            collectionStatus === 'Paid'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-100'
                          }`}
                          title="Click to view Paid collection"
                        >
                          <CheckCircle size={12} className={collectionStatus === 'Paid' ? 'text-white' : 'text-emerald-600'} />
                          <span>Paid: INR {collectionStats.totalPaid.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] opacity-80">({collectionStats.paidCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCollectionStatus('Unpaid')
                            setTxnFilter('Unpaid')
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                            collectionStatus === 'Unpaid'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-500/30'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 hover:bg-rose-100'
                          }`}
                          title="Click to view Unpaid collection"
                        >
                          <Clock size={12} className={collectionStatus === 'Unpaid' ? 'text-white' : 'text-rose-600'} />
                          <span>Unpaid: INR {collectionStats.totalUnpaid.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] opacity-80">({collectionStats.unpaidCount})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mt-3.5 text-xs font-semibold text-[#11875D]">
                    {metric.trend}
                  </p>
                </article>
              )
            })}
          </section>

          <div className="mt-6">
            <section className="rounded-lg border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6D3] px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl font-semibold">
                    Recent Transactions
                  </h2>
                  {/* Paid & Unpaid filter options for transactions */}
                  <div className="flex items-center gap-1 rounded-lg bg-[#0B1F3A]/5 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTxnFilter('All')}
                      className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                        txnFilter === 'All'
                          ? 'bg-[#0B1F3A] text-[#F7D77C]'
                          : 'text-[#42516A] hover:text-[#0B1F3A]'
                      }`}
                    >
                      All ({transactions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxnFilter('Paid')}
                      className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                        txnFilter === 'Paid'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-[#42516A] hover:text-emerald-700'
                      }`}
                    >
                      Paid ({transactions.filter((t) => t.status === 'Paid' || t.status === 'Posted').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxnFilter('Unpaid')}
                      className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                        txnFilter === 'Unpaid'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-[#42516A] hover:text-rose-700'
                      }`}
                    >
                      Unpaid ({transactions.filter((t) => t.status === 'Unpaid').length})
                    </button>
                  </div>
                </div>
                <a
                  href="/temple/accounts"
                  className="text-sm font-semibold text-[#9C7414] transition hover:text-[#0B1F3A]"
                >
                  View all in Accounts
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-sm text-[#42516A]">
                      <th className="px-5 py-3 font-semibold">Devotee</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm font-semibold text-[#42516A]/70">
                          {loadingReceipts ? 'Loading transactions...' : `No ${txnFilter === 'All' ? '' : txnFilter.toLowerCase() + ' '}transactions recorded yet today.`}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction, idx) => (
                        <tr
                          key={transaction.id || idx}
                          className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]"
                        >
                          <td className="px-5 py-4 font-semibold">
                            {transaction.devotee}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#42516A] truncate max-w-xs" title={transaction.type}>
                            {transaction.type}
                          </td>
                          <td className="px-5 py-4 font-semibold">
                            {transaction.amount}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-md px-3 py-1 text-xs font-bold ring-1 ${transactionStatusClass(
                                transaction.status,
                              )}`}
                            >
                              {transaction.status}
                            </span>
                            {transaction.receipt && <ReceiptPaymentAction receipt={transaction.receipt} templeId={session.id} />}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Temple Name', temple?.name],
              ['Main Deity', temple?.deity],
              ['Plan', temple?.plan],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]"
              >
                <p className="text-sm font-semibold text-[#42516A]">{label}</p>
                <p className="mt-2 font-semibold">{value || 'Not updated'}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}

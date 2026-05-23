import { useEffect, useMemo, useState } from 'react'
import {
  BedDouble,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Store,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Counter', icon: ReceiptText },
  { label: 'Accounts', icon: WalletCards },
  { label: 'Nadavaravu', icon: ClipboardList },
  { label: 'Membership', icon: UsersRound },
  { label: 'Guest House', icon: BedDouble },
  { label: 'Store', icon: Store },
]

const metrics = [
  {
    label: "Today's Collection",
    value: 'INR 84,230',
    trend: '12% vs yesterday',
    icon: IndianRupee,
  },
  {
    label: 'Devotees Today',
    value: '1,247',
    trend: '8% vs avg',
    icon: UsersRound,
  },
  {
    label: 'Sevas Booked',
    value: '38',
    trend: 'Normal day',
    icon: CalendarCheck,
  },
  {
    label: 'Rooms Occupied',
    value: '14/20',
    trend: '70% occupancy',
    icon: BedDouble,
  },
]

const transactions = [
  {
    devotee: 'Rajesh Kumar',
    type: 'Abhishekam',
    amount: 'INR 1,100',
    status: 'Paid',
  },
  {
    devotee: 'Priya Nair',
    type: 'Membership',
    amount: 'INR 2,500',
    status: 'Paid',
  },
  {
    devotee: 'Suresh Menon',
    type: 'Donation',
    amount: 'INR 5,000',
    status: 'Pending',
  },
  {
    devotee: 'Anitha Krishnan',
    type: 'Pooja',
    amount: 'INR 750',
    status: 'Paid',
  },
  {
    devotee: 'Manoj Pillai',
    type: 'Guest Room',
    amount: 'INR 1,800',
    status: 'New',
  },
]

const poojaSchedule = [
  { time: '5:30 AM', name: 'Nirmalyam', status: 'Done' },
  { time: '6:30 AM', name: 'Usha Pooja', status: 'Done' },
  { time: '10:00 AM', name: 'Pantheeradi', status: 'Now' },
  { time: '12:00 PM', name: 'Ucha Pooja', status: 'Upcoming' },
  { time: '6:30 PM', name: 'Deeparadhana', status: 'Upcoming' },
  { time: '8:30 PM', name: 'Athazha Pooja', status: 'Upcoming' },
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

function transactionStatusClass(status) {
  if (status === 'Paid') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (status === 'Pending') {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }

  return 'bg-[#EFE6D3] text-[#0B1F3A] ring-[#D4A017]/24'
}

function scheduleStatusClass(status) {
  if (status === 'Done') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'Now') {
    return 'border-[#D4A017] bg-[#D4A017]/14 text-[#0B1F3A]'
  }

  return 'border-[#EFE6D3] bg-[#F8F6F0] text-[#42516A]'
}

export default function TempleDashboardPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))

  const templeName = temple?.name || 'Temple'
  const initials = useMemo(() => getInitials(templeName), [templeName])

  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
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

    return () => {
      isActive = false
    }
  }, [session])

  function handleLogout() {
    endTempleSession()
    window.location.href = '/temple-login'
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0B1F3A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#D4A017]/18 bg-[#07172D] px-5 py-6 text-[#F8F6F0] lg:block">
        <a href="/" aria-label="Back to THEERTHA landing page">
          <BrandMark compact />
        </a>
        <p className="mt-9 px-4 text-xs font-semibold uppercase text-[#F7D77C]">
          Main Menu
        </p>
        <nav className="mt-3 grid gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = index === 0

            return (
              <a
                key={item.label}
                href="/temple/dashboard"
                className={`flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#D4A017]/14 text-[#F7D77C]'
                    : 'text-[#EFE6D3]/68 hover:bg-white/8 hover:text-[#F8F6F0]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </span>
                {isActive ? <ChevronRight size={16} aria-hidden="true" /> : null}
              </a>
            )
          })}
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-lg border border-[#F8F6F0]/12 bg-white/6 p-4">
          <p className="text-sm font-semibold text-[#F7D77C]">
            Temple Access
          </p>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-[#EFE6D3]/70">
            {temple?.loginId}
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#F8F6F0]/88 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
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
              {isLoading ? (
                <span className="rounded-md border border-[#D4A017]/22 bg-white px-3 py-2 text-sm font-semibold text-[#42516A]">
                  Syncing
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

              return (
                <article
                  key={metric.label}
                  className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_16px_42px_rgba(11,31,58,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#42516A]">
                        {metric.label}
                      </p>
                      <p className="font-display mt-3 text-3xl font-semibold">
                        {metric.value}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#F7D77C]">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#11875D]">
                    {metric.trend}
                  </p>
                </article>
              )
            })}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <section className="rounded-lg border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-[#EFE6D3] px-5 py-4">
                <h2 className="font-display text-2xl font-semibold">
                  Recent Transactions
                </h2>
                <a
                  href="/temple/dashboard"
                  className="text-sm font-semibold text-[#9C7414] transition hover:text-[#0B1F3A]"
                >
                  View all
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
                    {transactions.map((transaction) => (
                      <tr
                        key={`${transaction.devotee}-${transaction.type}`}
                        className="border-b border-[#EFE6D3] transition hover:bg-[#F8F6F0]"
                      >
                        <td className="px-5 py-4 font-semibold">
                          {transaction.devotee}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#42516A]">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-[#D4A017]/18 bg-white p-5 shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold">
                  Today's Pooja Schedule
                </h2>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFE6D3] text-[#9C7414]">
                  <UserRoundCheck size={20} aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {poojaSchedule.map((pooja) => (
                  <div
                    key={`${pooja.time}-${pooja.name}`}
                    className={`grid grid-cols-[76px_1fr_auto] items-center gap-3 rounded-md border px-3 py-3 text-sm font-semibold ${scheduleStatusClass(
                      pooja.status,
                    )}`}
                  >
                    <span>{pooja.time}</span>
                    <span className="text-[#0B1F3A]">{pooja.name}</span>
                    <span className="text-xs">{pooja.status}</span>
                  </div>
                ))}
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

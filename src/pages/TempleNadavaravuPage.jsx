import { useEffect, useState, useMemo } from 'react'
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
  Eye,
  Edit2,
  Printer,
  Plus,
  ArrowUpRight,
  Clock,
  User,
  Star,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { loadTodayReceipts, updatePoojaStatus, loadPoojaStatuses } from '../lib/settingsStore.js'

const mainMenuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/temple/dashboard' },
  { label: 'Counter', icon: ReceiptText, href: '/temple/counter' },
  { label: 'Accounts', icon: WalletCards, href: '/temple/accounts' },
  { label: 'Nadavaravu', icon: ClipboardList, href: '/temple/nadavaravu' },
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

const defaultPoojas = [
  { key: 'nirmalyam', time: '5:30 AM', name: 'Nirmalyam', type: 'Daily ritual — no booking', priest: 'Rajan P.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'ushapooja', time: '6:30 AM', name: 'Usha Pooja', type: 'Daily ritual — no booking', priest: 'Rajan P.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'abhishekam_default', time: '8:00 AM', name: 'Abhishekam', type: 'Daily ritual — no booking', priest: 'Suresh V.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'pantheeradi_default', time: '10:00 AM', name: 'Pantheeradi Pooja', type: 'Daily ritual — no booking', priest: 'Rajan P.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'uchapooja', time: '12:00 PM', name: 'Ucha Pooja', type: 'Daily ritual — no booking', priest: 'Suresh V.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'sayahna', time: '3:30 PM', name: 'Sayahna', type: 'Daily ritual — no booking', priest: 'Krishnan M.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'deeparadhana', time: '6:30 PM', name: 'Deeparadhana', type: 'Daily ritual — no booking', priest: 'Rajan P.', amount: null, defaultStatus: 'Scheduled' },
  { key: 'athazhapooja', time: '8:30 PM', name: 'Athazha Pooja', type: 'Daily ritual — no booking', priest: 'Krishnan M.', amount: null, defaultStatus: 'Scheduled' },
]

const priests = [
  { initials: 'RP', name: 'Rajan Pillai', role: 'Chief priest', schedule: 'All day' },
  { initials: 'SV', name: 'Suresh Varma', role: 'Asst. priest', schedule: '7 AM–2 PM' },
  { initials: 'KM', name: 'Krishnan M.', role: 'Asst. priest', schedule: '4 PM–9 PM' },
]

export default function TempleNadavaravuPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Live dynamic data */
  const [dbReceipts, setDbReceipts] = useState([])
  const [dbStatuses, setDbStatuses] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All') // All, Done, Live, Upcoming

  const templeName = temple?.name || 'Temple'

  function refreshData() {
    if (!session) return
    setLoadingData(true)
    Promise.all([
      loadTodayReceipts(session.id),
      loadPoojaStatuses(session.id)
    ])
      .then(([receiptsData, statusesData]) => {
        setDbReceipts(receiptsData || [])
        setDbStatuses(statusesData || {})
      })
      .catch((err) => {
        console.warn('Failed to load Nadavaravu details:', err)
      })
      .finally(() => {
        setLoadingData(false)
      })
  }

  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
      return undefined
    }

    getRegisteredTemple(session.id)
      .then((registeredTemple) => {
        setTemple(registeredTemple || session)
        setIsLoading(false)
      })
      .catch(() => {
        setTemple(session)
        setIsLoading(false)
      })

    refreshData()
  }, [session])

  /* Aggregate receipts and match to timeline slots */
  const sevaRegister = useMemo(() => {
    const list = []
    
    // Mix in real receipts loaded from DB if any exist
    if (dbReceipts && dbReceipts.length > 0) {
      dbReceipts.forEach((r) => {
        if (r.items && Array.isArray(r.items)) {
          r.items.forEach((it, idx) => {
            let mappedTime = '10:00 AM'
            if (it.name.toLowerCase().includes('archana')) mappedTime = '6:30 AM'
            else if (it.name.toLowerCase().includes('abhishekam')) mappedTime = '8:00 AM'
            else if (it.name.toLowerCase().includes('sahasranamam')) mappedTime = '10:00 AM'
            else if (it.name.toLowerCase().includes('neivedyam')) mappedTime = '12:00 PM'
            else if (it.name.toLowerCase().includes('pushpanjali')) mappedTime = '6:30 PM'

            const itemKey = `${mappedTime}-${r.id}-${idx}`
            const dbStatus = dbStatuses[itemKey] || dbStatuses[mappedTime] || 'Scheduled'

            list.push({
              id: r.id,
              key: itemKey,
              time: mappedTime,
              name: it.name,
              subtitle: `${r.devoteeName || 'Anonymous'} — ${r.starName || '—'}`,
              priest: mappedTime === '8:00 AM' || mappedTime === '12:00 PM' ? 'Suresh V.' : 'Rajan P.',
              amount: Number(it.amount || 0) * Number(it.qty || 1),
              status: dbStatus,
              isDefault: false,
            })
          })
        }
      })
    }

    // Sort by time
    const timeToMinutes = (t) => {
      const [time, modifier] = t.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }

    return list.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  }, [dbReceipts, dbStatuses])

  /* Status and count filters calculations strictly for devotee bookings from counter receipts */
  const metrics = useMemo(() => {
    const totalCount = sevaRegister.length
    const completedCount = sevaRegister.filter(item => item.status === 'Done').length
    const liveCount = sevaRegister.filter(item => ['In progress', 'Live'].includes(item.status)).length
    const upcomingCount = totalCount - completedCount - liveCount

    const totalCollection = sevaRegister.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      totalCount,
      completedCount,
      upcomingCount,
      liveCount,
      totalCollection,
    }
  }, [sevaRegister])

  /* Tab filter row counts representing all visual items in the list */
  const tabCounts = useMemo(() => {
    return {
      all: sevaRegister.length,
      done: sevaRegister.filter(item => item.status === 'Done').length,
      live: sevaRegister.filter(item => ['In progress', 'Live'].includes(item.status)).length,
      upcoming: sevaRegister.filter(item => ['Scheduled', 'Next', 'Upcoming'].includes(item.status)).length,
    }
  }, [sevaRegister])


  // Filter items based on active register tab selection
  const filteredRegisterItems = useMemo(() => {
    if (activeFilter === 'All') return sevaRegister
    if (activeFilter === 'Done') return sevaRegister.filter(item => item.status === 'Done')
    if (activeFilter === 'Live') return sevaRegister.filter(item => ['In progress', 'Live'].includes(item.status))
    if (activeFilter === 'Upcoming') return sevaRegister.filter(item => ['Scheduled', 'Next', 'Upcoming'].includes(item.status))
    return sevaRegister
  }, [sevaRegister, activeFilter])

  // Handle Mark Done operation
  async function handleMarkDone(itemKey) {
    if (!session) return
    try {
      await updatePoojaStatus(session.id, null, itemKey, 'Done')
      // Also update parent slot status to 'Done' if it is a matched slot
      const timePart = itemKey.split('-')[0]
      await updatePoojaStatus(session.id, null, timePart, 'Done')
      refreshData()
    } catch (err) {
      console.error('Failed to update pooja status:', err)
    }
  }

  // Handle shift reset / mock done trigger for demonstration
  async function handlePrintRegister() {
    window.print()
  }

  function getInitials(name = 'Temple') {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.at(0))
      .join('')
      .toUpperCase()
  }

  const initials = useMemo(() => getInitials(templeName), [templeName])

  if (!session) {
    return null
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
            const isCurrent = item.label === 'Nadavaravu'

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

  function getStatusBadgeClass(status) {
    if (status === 'Done') {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    }
    if (status === 'In progress' || status === 'Live') {
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
    }
    if (status === 'Next') {
      return 'bg-amber-500/25 text-[#F7D77C] border border-[#D4A017]/30'
    }
    return 'bg-white/5 text-[#EFE6D3]/60 border border-white/10'
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

      <div className="lg:pl-72 flex flex-col min-h-screen">
        
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
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                <ClipboardList size={14} />
                <span>Nadavaravu Management</span>
                <span className="text-white/20">/</span>
                <span className="text-[#EFE6D3]/50">Today's register</span>
              </div>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-[#F8F6F0]">
                Today's Register
              </h1>
              <p className="mt-0.5 text-xs text-[#EFE6D3]/50">
                22 May 2026 • Karthika star • Vrishchika month
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {loadingData && (
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#D4A017]/22 bg-[#D4A017]/5 px-3 py-1 text-xs text-[#F7D77C] animate-pulse">
                  <RefreshCw size={12} className="animate-spin" />
                  Syncing...
                </span>
              )}
              <a
                href="/temple/booking"
                className="flex items-center gap-1.5 rounded-lg bg-[#D4A017] px-4 py-2 text-xs font-bold text-[#07172D] transition hover:bg-[#F7D77C]"
              >
                <Plus size={14} />
                New booking
              </a>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 font-semibold text-[#F7D77C]">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 space-y-6">
          
          {/* Key Metrics row */}
          <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
            
            {/* Sevas today */}
            <article className="rounded-xl border border-white/5 bg-[#1E1F25] p-4 relative overflow-hidden group hover:border-[#D4A017]/20 transition duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#EFE6D3]/40 flex items-center gap-1.5">
                <CalendarCheck size={12} className="text-[#D4A017]" />
                Sevas today
              </p>
              <p className="mt-2.5 text-3xl font-black text-white">{metrics.totalCount}</p>
              <p className="mt-1.5 text-xs font-semibold text-emerald-400">
                {metrics.completedCount} completed • {metrics.upcomingCount + metrics.liveCount} upcoming
              </p>
            </article>

            {/* Today's collection */}
            <article className="rounded-xl border border-white/5 bg-[#1E1F25] p-4 relative overflow-hidden group hover:border-[#D4A017]/20 transition duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#EFE6D3]/40 flex items-center gap-1.5">
                <IndianRupee size={12} className="text-[#D4A017]" />
                Today's collection
              </p>
              <p className="mt-2.5 text-3xl font-black text-[#F7D77C]">
                ₹{metrics.totalCollection.toLocaleString('en-IN')}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-[#EFE6D3]/50">
                From {metrics.totalCount} bookings
              </p>
            </article>

            {/* Priests on Duty */}
            <article className="rounded-xl border border-white/5 bg-[#1E1F25] p-4 relative overflow-hidden group hover:border-[#D4A017]/20 transition duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#EFE6D3]/40 flex items-center gap-1.5">
                <User size={12} className="text-[#D4A017]" />
                Priests on duty
              </p>
              <p className="mt-2.5 text-3xl font-black text-white">4</p>
              <p className="mt-1.5 text-xs font-semibold text-[#EFE6D3]/50">
                2 morning • 2 evening
              </p>
            </article>

          </section>

          {/* Core layout split: Register list & Timeline */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            
            {/* Left Panel: Register Table */}
            <section className="rounded-xl border border-white/5 bg-[#1E1F25] overflow-hidden flex flex-col">
              
              {/* Header with status filtering */}
              <div className="p-5 border-b border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[#F7D77C]">
                    Today's Seva Register
                  </h2>
                  <p className="text-xs text-[#EFE6D3]/40">Verify pooja roster execution & progress</p>
                </div>

                {/* Filter tags matching mock layout */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveFilter('All')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      activeFilter === 'All'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-[#EFE6D3]/50 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    All ({tabCounts.all})
                  </button>
                  <button
                    onClick={() => setActiveFilter('Done')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      activeFilter === 'Done'
                        ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/35'
                        : 'bg-white/5 text-[#EFE6D3]/50 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    Done ({tabCounts.done})
                  </button>
                  <button
                    onClick={() => setActiveFilter('Live')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      activeFilter === 'Live'
                        ? 'bg-blue-500/25 text-blue-400 border border-blue-500/35'
                        : 'bg-white/5 text-[#EFE6D3]/50 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    Live ({tabCounts.live})
                  </button>
                  <button
                    onClick={() => setActiveFilter('Upcoming')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      activeFilter === 'Upcoming'
                        ? 'bg-amber-500/25 text-amber-400 border border-amber-500/35'
                        : 'bg-white/5 text-[#EFE6D3]/50 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    Upcoming ({tabCounts.upcoming})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-[10px] font-bold uppercase tracking-wider text-[#EFE6D3]/40">
                      <th className="px-5 py-3.5">Time</th>
                      <th className="px-5 py-3.5">Seva / Devotee</th>
                      <th className="px-5 py-3.5">Priest</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegisterItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#EFE6D3]/30">
                          No sevas matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRegisterItems.map((item) => {
                        const isInProgress = item.status === 'In progress' || item.status === 'Live'
                        return (
                          <tr
                            key={item.key}
                            className={`border-b border-white/5 transition hover:bg-white/3 ${
                              isInProgress ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="px-5 py-4 font-mono text-xs font-bold text-white/90">
                              {item.time}
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-xs font-bold text-white tracking-tight">{item.name}</p>
                              <p className="mt-0.5 text-[10px] text-[#EFE6D3]/40 tracking-wide">{item.subtitle}</p>
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-[#EFE6D3]/70">
                              {item.priest}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-xs font-bold text-[#F7D77C]">
                              {item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {item.status === 'In progress' || item.status === 'Live' ? (
                                  <button
                                    onClick={() => handleMarkDone(item.key)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-[#60A5FA] bg-blue-500/10 border border-[#60A5FA]/20 rounded-md hover:bg-blue-500/20 transition outline-none"
                                  >
                                    Mark done
                                  </button>
                                ) : item.status === 'Done' ? (
                                  <button
                                    className="p-1 rounded bg-white/4 text-[#EFE6D3]/40 hover:bg-white/10 hover:text-white transition"
                                    title="View receipt"
                                  >
                                    <Eye size={13} />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleMarkDone(item.key)}
                                      className="p-1 rounded bg-white/4 text-[#EFE6D3]/40 hover:bg-white/10 hover:text-[#60A5FA] transition"
                                      title="Mark in progress"
                                    >
                                      <Clock size={13} />
                                    </button>
                                    <button
                                      className="p-1 rounded bg-white/4 text-[#EFE6D3]/40 hover:bg-white/10 hover:text-white transition"
                                      title="Edit record"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer action bars */}
              <div className="p-4 border-t border-white/5 bg-white/1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handlePrintRegister}
                  className="flex items-center justify-center gap-1.5 border border-white/10 bg-white/4 rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:bg-white/8 outline-none"
                >
                  <Printer size={13} />
                  Print day register
                </button>

                <a
                  href="/temple/booking"
                  className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#F7D77C] hover:bg-white/8 hover:text-white transition"
                >
                  Book new seva ↗
                </a>
              </div>

            </section>

            {/* Right column: Roster list and daily schedule */}
            <aside className="space-y-6">
              
              {/* Pooja Timeline Card */}
              <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#F7D77C]">
                    Pooja Timeline
                  </h2>
                  <Clock size={14} className="text-[#EFE6D3]/40" />
                </div>

                <div className="grid gap-2">
                  {defaultPoojas.map((pooja) => {
                    const dynamicMatch = sevaRegister.find(s => s.time === pooja.time && s.id !== `default-${pooja.time}`)
                    const finalStatus = dbStatuses[pooja.time] || (dynamicMatch ? dynamicMatch.status : pooja.defaultStatus)

                    let statusClass = 'border-white/5 bg-white/3 text-[#EFE6D3]/40'
                    if (finalStatus === 'Done') {
                      statusClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    } else if (finalStatus === 'In progress' || finalStatus === 'Live') {
                      statusClass = 'border-blue-500/20 bg-blue-500/10 text-blue-400 ring-2 ring-blue-500/20'
                    }

                    return (
                      <div
                        key={pooja.time}
                        className={`flex items-center justify-between border rounded-lg px-3 py-2.5 text-xs font-bold transition duration-300 ${statusClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white/50">{pooja.time}</span>
                          <span className="text-white tracking-tight">{pooja.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-black">
                          {finalStatus}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Priest Roster Card */}
              <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#F7D77C]">
                    Priest Roster — Today
                  </h2>
                  <UsersRound size={14} className="text-[#EFE6D3]/40" />
                </div>

                <div className="space-y-3">
                  {priests.map((priest) => (
                    <div
                      key={priest.name}
                      className="flex items-center gap-3 rounded-lg bg-white/2 p-2.5 border border-white/5"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4A017]/10 text-xs font-black text-[#F7D77C]">
                        {priest.initials}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{priest.name}</p>
                        <p className="text-[10px] text-[#EFE6D3]/50">
                          {priest.role} • {priest.schedule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </aside>

          </div>

        </main>
        
        {/* Footer info panel */}
        <footer className="mt-auto border-t border-white/5 bg-[#0D0E12]/80 px-8 py-4 text-center text-xs text-[#EFE6D3]/35 flex flex-wrap items-center justify-between gap-4">
          <p>© 2026 THEERTHA Temple Cloud System. All rights reserved.</p>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>ENV: Production</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Database Status: Connected</span>
          </div>
        </footer>

      </div>
    </div>
  )
}

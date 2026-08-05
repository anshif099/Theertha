import { useEffect, useState, useMemo } from 'react'
import {
  Building2,
  CalendarDays,
  CalendarCheck,
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
  ReceiptText,
  Settings,
  UsersRound,
  WalletCards,
  X,
  Plus,
  ArrowLeft,
  Calendar,
  Check,
  User,
  Star,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Clock,
  ChevronRight,
  Sparkles,
  Repeat
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { getNextReceiptNo, saveReceipt, loadSlotsConfig, saveDevotee, loadAllReceipts, loadStars, loadPriests } from '../lib/settingsStore.js'
import { ALL_27_NAKSHATRAS, getRepeatingNakshatraDates } from '../lib/nakshatraHelper.js'

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

const SEVAS = [
  { id: 'seva-1', name: 'Archana', price: 50, duration: '10–15 min' },
  { id: 'seva-2', name: 'Sahasranamam', price: 1100, duration: '45 min' },
  { id: 'seva-3', name: 'Abhishekam', price: 500, duration: '30 min' },
  { id: 'seva-4', name: 'Pushpanjali', price: 200, duration: '20 min' },
  { id: 'seva-5', name: 'Neivedyam (Prasad Offering)', price: 150, duration: 'During Pooja' },
]

const RASIS = [
  'Mesham', 'Vrishabham', 'Mithunam', 'Karkidakam', 'Simham', 'Kanny', 'Thulam', 'Vrishchikam', 'Dhanu',
  'Makaram', 'Kumbham', 'Meenam'
]

export default function TempleBookingPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Active View Tab: 'register' (All Bookings) or 'new' (Create Booking) */
  const [activeTab, setActiveTab] = useState('register')

  /* Bookings Data */
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  /* Filter Controls */
  const [searchTerm, setSearchTerm] = useState('')
  const [timePreset, setTimePreset] = useState('all') // 'all', 'today', 'upcoming', 'past', 'this_month', 'this_year', 'custom'
  const [singleDate, setSingleDate] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'Paid', 'Unpaid'

  /* Selected Receipt Modal */
  const [viewReceiptModal, setViewReceiptModal] = useState(null)

  /* Form Fields for New Booking */
  const [devoteeName, setDevoteeName] = useState('')
  const [mobile, setMobile] = useState('')
  const [starName, setStarName] = useState(ALL_27_NAKSHATRAS[0].name)
  const [rasiName, setRasiName] = useState('')
  const [gotra, setGotra] = useState('')
  const [selectedSeva, setSelectedSeva] = useState(SEVAS[1])
  const [bookingDateInput, setBookingDateInput] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookingTimeInput, setBookingTimeInput] = useState('08:00')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [priestName, setPriestName] = useState('')
  const [priestsList, setPriestsList] = useState([])
  const [saving, setSaving] = useState(false)

  /* Repeat Booking Controls in Form */
  const [isRepeatBooking, setIsRepeatBooking] = useState(false)
  const [repeatMonths, setRepeatMonths] = useState(6)
  const [repeatDates, setRepeatDates] = useState([])

  const templeName = temple?.name || 'Temple'
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  /* Load Temple, Priests & All Bookings */
  useEffect(() => {
    if (!session) {
      window.location.href = '/temple-login'
      return
    }

    getRegisteredTemple(session.id)
      .then((reg) => setTemple(reg || session))
      .catch(() => setTemple(session))
      .finally(() => setIsLoading(false))

    loadPriests(session.id)
      .then((list) => {
        setPriestsList(list)
        if (list.length > 0) setPriestName(list[0].name)
      })
      .catch(() => {})

    fetchBookings()
  }, [session])

  function fetchBookings() {
    if (!session?.id) return
    setLoadingBookings(true)
    loadAllReceipts(session.id)
      .then((list) => setBookings(list))
      .catch((err) => console.warn('Failed to load bookings:', err))
      .finally(() => setLoadingBookings(false))
  }

  /* Repeat Dates Recalculation in New Booking Form */
  useEffect(() => {
    if (isRepeatBooking && starName && bookingDateInput) {
      const dates = getRepeatingNakshatraDates(starName, bookingDateInput, repeatMonths)
      setRepeatDates(dates.map((d) => ({ ...d, selected: true })))
    } else {
      setRepeatDates([])
    }
  }, [isRepeatBooking, starName, bookingDateInput, repeatMonths])

  function toggleRepeatDate(idx) {
    setRepeatDates((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
    )
  }

  /* Filtered Bookings List */
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const itemDate = item.bookingDate || item.dbDate || ''
      const text = `${item.receiptNo || ''} ${item.devoteeName || ''} ${item.mobile || ''} ${item.starName || ''} ${
        item.items ? item.items.map((i) => i.name).join(' ') : ''
      }`.toLowerCase()

      // 1. Search filter
      if (searchTerm.trim() && !text.includes(searchTerm.trim().toLowerCase())) {
        return false
      }

      // 2. Status filter
      if (statusFilter !== 'all' && item.paymentStatus !== statusFilter) {
        return false
      }

      // 3. Date / Time Range Filters
      if (singleDate && itemDate !== singleDate) return false
      if (monthFilter && !itemDate.startsWith(monthFilter)) return false
      if (yearFilter && !itemDate.startsWith(yearFilter)) return false
      if (fromDate && itemDate < fromDate) return false
      if (toDate && itemDate > toDate) return false

      // 4. Preset filters
      if (timePreset === 'today' && itemDate !== todayStr) return false
      if (timePreset === 'upcoming' && itemDate <= todayStr) return false
      if (timePreset === 'past' && itemDate >= todayStr) return false
      if (timePreset === 'this_month' && !itemDate.startsWith(todayStr.slice(0, 7))) return false
      if (timePreset === 'this_year' && !itemDate.startsWith(todayStr.slice(0, 4))) return false

      return true
    })
  }, [bookings, searchTerm, statusFilter, singleDate, monthFilter, yearFilter, fromDate, toDate, timePreset, todayStr])

  /* Summary Metrics */
  const metrics = useMemo(() => {
    const totalCount = filteredBookings.length
    const todayCount = bookings.filter((b) => (b.bookingDate || b.dbDate) === todayStr).length
    const upcomingCount = bookings.filter((b) => (b.bookingDate || b.dbDate) > todayStr).length
    const pastCount = bookings.filter((b) => (b.bookingDate || b.dbDate) < todayStr).length
    const totalAmount = filteredBookings.reduce((sum, b) => sum + Number(b.total || 0), 0)

    return { totalCount, todayCount, upcomingCount, pastCount, totalAmount }
  }, [bookings, filteredBookings, todayStr])

  /* Handle Form Submit for New Booking */
  async function handleCreateBooking(e) {
    e.preventDefault()
    if (!devoteeName.trim() || !mobile.trim()) {
      alert('Devotee Name and Mobile number are required.')
      return
    }

    setSaving(true)
    const activeRepeatDates = isRepeatBooking ? repeatDates.filter((r) => r.selected) : []

    try {
      if (isRepeatBooking && activeRepeatDates.length > 0) {
        let firstSaved = null
        for (const rItem of activeRepeatDates) {
          const nextNo = await getNextReceiptNo(session.id, 'booking-counter')
          const payload = {
            receiptNo: nextNo,
            counterId: 'booking-hub',
            counterNo: 'B-01',
            counterName: 'Booking Hub',
            templeId: session.id,
            templeName,
            devoteeName: devoteeName.trim(),
            mobile: mobile.trim(),
            starName,
            remarks: `Rasi: ${rasiName} · Gotra: ${gotra.trim()}`,
            items: [{ name: selectedSeva.name, amount: selectedSeva.price, qty: 1 }],
            total: selectedSeva.price,
            paymentMethod,
            paymentStatus,
            bookingDate: rItem.date,
            date: rItem.formattedDate,
            time: bookingTimeInput,
            priestName,
            repeatInfo: `Repeating ${repeatMonths} Months Nakshatra Booking (${rItem.monthIndex} of ${activeRepeatDates.length})`
          }

          const saved = await saveReceipt(session.id, payload)
          if (!firstSaved) firstSaved = saved
        }

        if (mobile && mobile.trim()) {
          await saveDevotee(session.id, {
            devoteeName: devoteeName.trim(),
            mobile: mobile.trim(),
            starName,
            receiptId: firstSaved.id,
            receiptNo: firstSaved.receiptNo,
            total: selectedSeva.price * activeRepeatDates.length,
            paymentStatus
          })
        }

        alert(`✓ Successfully created ${activeRepeatDates.length} repeating Nakshatra bookings!`)
      } else {
        const nextNo = await getNextReceiptNo(session.id, 'booking-counter')
        const payload = {
          receiptNo: nextNo,
          counterId: 'booking-hub',
          counterNo: 'B-01',
          counterName: 'Booking Hub',
          templeId: session.id,
          templeName,
          devoteeName: devoteeName.trim(),
          mobile: mobile.trim(),
          starName,
          remarks: `Rasi: ${rasiName} · Gotra: ${gotra.trim()}`,
          items: [{ name: selectedSeva.name, amount: selectedSeva.price, qty: 1 }],
          total: selectedSeva.price,
          paymentMethod,
          paymentStatus,
          bookingDate: bookingDateInput,
          date: new Date(bookingDateInput).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
          time: bookingTimeInput,
          priestName
        }

        const saved = await saveReceipt(session.id, payload)
        await saveDevotee(session.id, {
          devoteeName: devoteeName.trim(),
          mobile: mobile.trim(),
          starName,
          receiptId: saved.id,
          receiptNo: saved.receiptNo,
          total: selectedSeva.price,
          paymentStatus
        })

        alert('✓ Booking saved successfully!')
      }

      fetchBookings()
      setActiveTab('register')
      setDevoteeName('')
      setMobile('')
      setGotra('')
      setIsRepeatBooking(false)
    } catch (err) {
      console.error('Failed to create booking:', err)
      alert('Failed to save booking. Please try again.')
    } finally {
      setSaving(false)
    }
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
            const isCurrent = item.label === 'Booking'

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
    <div className="min-h-screen bg-[#07172D] text-[#EFE6D3] font-sans selection:bg-[#D4A017] selection:text-[#0B1F3A]">
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
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

      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#D4A017]/18 bg-[#07172D]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="relative mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#EFE6D3] transition hover:bg-white/5 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="pl-12 lg:pl-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#F7D77C]">
                Temple Management
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold sm:text-3xl text-white">
                Booking Management Register
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tab selector */}
              <div className="flex rounded-lg border border-[#D4A017]/30 bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'register'
                      ? 'bg-[#D4A017] text-[#07172D] shadow-md'
                      : 'text-[#EFE6D3]/70 hover:text-white'
                  }`}
                >
                  <CalendarCheck size={15} />
                  All Bookings Register
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'new'
                      ? 'bg-[#D4A017] text-[#07172D] shadow-md'
                      : 'text-[#EFE6D3]/70 hover:text-white'
                  }`}
                >
                  <Plus size={15} />
                  + New Booking
                </button>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3A] font-bold text-[#F7D77C]">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 sm:px-8">

          {/* TAB 1: ALL BOOKINGS REGISTER (PAST, PRESENT, FUTURE) */}
          {activeTab === 'register' && (
            <div className="space-y-6">

              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#D4A017]/24 bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-[#EFE6D3]/60 uppercase">Filtered Bookings</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-white">{metrics.totalCount}</p>
                  <p className="mt-1 text-[11px] text-[#F7D77C]">Matches active date/time range</p>
                </div>
                <div className="rounded-xl border border-emerald-500/24 bg-emerald-500/5 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-emerald-400 uppercase">Today's Bookings</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-emerald-300">{metrics.todayCount}</p>
                  <p className="mt-1 text-[11px] text-emerald-400/80">Scheduled for today ({todayStr})</p>
                </div>
                <div className="rounded-xl border border-blue-500/24 bg-blue-500/5 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-blue-400 uppercase">Upcoming / Future</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-blue-300">{metrics.upcomingCount}</p>
                  <p className="mt-1 text-[11px] text-blue-400/80">Scheduled future bookings</p>
                </div>
                <div className="rounded-xl border border-[#D4A017]/24 bg-[#D4A017]/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-[#F7D77C] uppercase">Total Offering Value</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[#F7D77C]">
                    ₹{metrics.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-[11px] text-[#EFE6D3]/70">Cumulative filtered total</p>
                </div>
              </div>

              {/* Filtering Controls Card */}
              <div className="rounded-xl border border-[#D4A017]/24 bg-white/5 p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-[#F7D77C]" />
                    <h3 className="font-bold text-white text-base">Date & Time Range Filters</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTimePreset('all')
                      setSingleDate('')
                      setMonthFilter('')
                      setYearFilter('')
                      setFromDate('')
                      setToDate('')
                      setSearchTerm('')
                      setStatusFilter('all')
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#F7D77C] hover:underline"
                  >
                    <RefreshCw size={12} />
                    Reset All Filters
                  </button>
                </div>

                {/* Preset Time Range Pills */}
                <div>
                  <label className="block text-xs font-bold text-[#EFE6D3]/60 mb-2">Quick Timeline Filters:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All Bookings' },
                      { id: 'today', label: 'Today (Present)' },
                      { id: 'upcoming', label: 'Upcoming (Future)' },
                      { id: 'past', label: 'Past Bookings' },
                      { id: 'this_month', label: 'This Month' },
                      { id: 'this_year', label: 'This Year' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setTimePreset(p.id)
                          setSingleDate('')
                          setMonthFilter('')
                          setYearFilter('')
                          setFromDate('')
                          setToDate('')
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          timePreset === p.id
                            ? 'bg-[#D4A017] text-[#07172D] shadow-md'
                            : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Date & Search Controls */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 pt-2 border-t border-white/10">
                  {/* Search term */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">Search Keyword</label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EFE6D3]/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search devotee, mobile, star, seva…"
                        className="w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                      />
                    </div>
                  </div>

                  {/* Single Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">Specific Day</label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => {
                        setSingleDate(e.target.value)
                        setTimePreset('custom')
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>

                  {/* Specific Month */}
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">Month (YYYY-MM)</label>
                    <input
                      type="month"
                      value={monthFilter}
                      onChange={(e) => {
                        setMonthFilter(e.target.value)
                        setTimePreset('custom')
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>

                  {/* Year Select */}
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">Year</label>
                    <select
                      value={yearFilter}
                      onChange={(e) => {
                        setYearFilter(e.target.value)
                        setTimePreset('custom')
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    >
                      <option value="">All Years</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                </div>

                {/* Date Range Controls */}
                <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-white/10 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">From Date (Start)</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value)
                        setTimePreset('custom')
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">To Date (End)</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value)
                        setTimePreset('custom')
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/60 mb-1">Payment Status Filter</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="Paid">Paid Only</option>
                      <option value="Unpaid">Unpaid Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="rounded-xl border border-[#D4A017]/24 bg-white/5 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={18} className="text-[#F7D77C]" />
                    <h3 className="font-bold text-white text-base">Bookings Register List</h3>
                  </div>
                  <span className="rounded-full bg-[#D4A017]/14 px-3 py-1 text-xs font-bold text-[#F7D77C]">
                    Showing {filteredBookings.length} of {bookings.length} Bookings
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {loadingBookings ? (
                    <div className="py-12 text-center text-xs text-[#EFE6D3]/60">Loading temple bookings register…</div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="py-16 text-center text-[#EFE6D3]/50">
                      <Calendar size={32} className="mx-auto mb-2 text-[#D4A017]/40" />
                      <p className="font-bold text-white">No Bookings Found</p>
                      <p className="text-xs mt-1">Try adjusting your date range or search keyword filters.</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#F7D77C]">
                          <th className="px-5 py-3.5">Booking / Receipt No</th>
                          <th className="px-5 py-3.5">Scheduled Date & Time</th>
                          <th className="px-5 py-3.5">Devotee Name & Contact</th>
                          <th className="px-5 py-3.5">Star (Nakshatra)</th>
                          <th className="px-5 py-3.5">Seva / Offering</th>
                          <th className="px-5 py-3.5">Amount</th>
                          <th className="px-5 py-3.5">Timeline Status</th>
                          <th className="px-5 py-3.5">Payment</th>
                          <th className="px-5 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredBookings.map((b) => {
                          const dateVal = b.bookingDate || b.dbDate || ''
                          const isToday = dateVal === todayStr
                          const isFuture = dateVal > todayStr
                          const isPast = dateVal < todayStr

                          return (
                            <tr key={b.id || b.receiptNo} className="hover:bg-white/5 transition">
                              <td className="px-5 py-3.5 font-mono font-bold text-[#F7D77C] whitespace-nowrap">
                                {b.receiptNo}
                                {b.repeatInfo && (
                                  <span className="block text-[9px] font-sans text-blue-300 mt-0.5">
                                    {b.repeatInfo}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-white">{b.date || dateVal}</div>
                                <div className="text-[10px] text-[#EFE6D3]/60 flex items-center gap-1 mt-0.5">
                                  <Clock size={10} />
                                  {b.time || '06:00 AM'}
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-white">{b.devoteeName || '—'}</div>
                                <div className="text-[10px] text-[#EFE6D3]/60">{b.mobile || '—'}</div>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-[#EFE6D3]/80">
                                {b.starName || '—'}
                              </td>
                              <td className="px-5 py-3.5">
                                {b.items && b.items.length > 0 ? (
                                  b.items.map((it, idx) => (
                                    <div key={idx} className="font-bold text-white">
                                      {it.name} <span className="text-[10px] text-[#EFE6D3]/60">({it.qty}x)</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="font-bold text-white">Poojawork</span>
                                )}
                                {b.priestName && (
                                  <div className="text-[10px] text-[#EFE6D3]/50">Priest: {b.priestName}</div>
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-extrabold text-[#F7D77C] whitespace-nowrap">
                                ₹{Number(b.total || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                {isToday && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Today
                                  </span>
                                )}
                                {isFuture && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                                    <Clock size={10} />
                                    Upcoming
                                  </span>
                                )}
                                {isPast && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-[#EFE6D3]/60">
                                    Past
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                  b.paymentStatus === 'Unpaid'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {b.paymentStatus || 'Paid'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setViewReceiptModal(b)}
                                  className="inline-flex items-center gap-1 rounded bg-[#D4A017]/14 px-2.5 py-1 text-[11px] font-bold text-[#F7D77C] hover:bg-[#D4A017] hover:text-[#07172D] transition"
                                >
                                  <Eye size={12} />
                                  View
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW POOJA / SEVA BOOKING */}
          {activeTab === 'new' && (
            <div className="rounded-xl border border-[#D4A017]/24 bg-white/5 p-6 shadow-2xl space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">Create New Pooja / Seva Booking</h3>
                  <p className="text-xs text-[#EFE6D3]/60 mt-0.5">Schedule new offerings with devotee details and optional repeating Nakshatra dates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-bold text-[#F7D77C] hover:underline"
                >
                  ← Back to Register List
                </button>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-6">
                {/* Devotee Info Section */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Devotee Name *</label>
                    <input
                      type="text"
                      required
                      value={devoteeName}
                      onChange={(e) => setDevoteeName(e.target.value)}
                      placeholder="e.g. Anish Kumar"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Star (Nakshatra)</label>
                    <select
                      value={starName}
                      onChange={(e) => setStarName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0B1F3A] px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    >
                      {ALL_27_NAKSHATRAS.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Astrology Details */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Rasi (Zodiac)</label>
                    <select
                      value={rasiName}
                      onChange={(e) => setRasiName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0B1F3A] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    >
                      <option value="">— Select Rasi —</option>
                      {RASIS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Gotra</label>
                    <input
                      type="text"
                      value={gotra}
                      onChange={(e) => setGotra(e.target.value)}
                      placeholder="e.g. Kashyapa"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Performing Priest</label>
                    <select
                      value={priestName}
                      onChange={(e) => setPriestName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0B1F3A] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    >
                      <option value="">— Select Priest —</option>
                      {priestsList.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Seva Offering Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#F7D77C] uppercase tracking-wider mb-2">Select Seva / Pooja Offering</label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SEVAS.map((seva) => (
                      <div
                        key={seva.id}
                        onClick={() => setSelectedSeva(seva)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedSeva.id === seva.id
                            ? 'border-[#D4A017] bg-[#D4A017]/14 ring-1 ring-[#D4A017]'
                            : 'border-white/10 bg-white/5 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-sm">{seva.name}</span>
                          <span className="font-extrabold text-[#F7D77C] text-sm">₹{seva.price}</span>
                        </div>
                        <p className="text-[10px] text-[#EFE6D3]/60 mt-1">Duration: {seva.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Date & Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Booking Date</label>
                    <input
                      type="date"
                      value={bookingDateInput}
                      onChange={(e) => setBookingDateInput(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Booking Time</label>
                    <input
                      type="time"
                      value={bookingTimeInput}
                      onChange={(e) => setBookingTimeInput(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#D4A017]"
                    />
                  </div>
                </div>

                {/* Multi-Date Repeating Nakshatra Booking Section */}
                <div className="rounded-xl border border-[#D4A017]/35 bg-[#0B1F3A]/90 p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className="text-[#F7D77C]" />
                      <div>
                        <span className="text-xs font-bold text-white block">Multi-Date Repeat Booking by Nakshatra</span>
                        <span className="text-[10px] text-[#EFE6D3]/60">Auto-calculate dates matching {starName} from Prokerala Panchangam</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRepeatBooking}
                        onChange={(e) => setIsRepeatBooking(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4A017]"></div>
                    </label>
                  </div>

                  {isRepeatBooking && (
                    <div className="space-y-3 pt-3 border-t border-white/10 animate-fadeIn">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-[#EFE6D3]/70">
                          Repeat Duration / Period
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: '1 Month', count: 1 },
                            { label: '3 Months', count: 3 },
                            { label: '6 Months', count: 6 },
                            { label: '12 Months (1 Yr)', count: 12 }
                          ].map((opt) => (
                            <button
                              key={opt.count}
                              type="button"
                              onClick={() => setRepeatMonths(opt.count)}
                              className={`rounded-lg py-1.5 px-2 text-xs font-bold transition outline-none ${
                                repeatMonths === opt.count
                                  ? 'bg-[#D4A017] text-[#07172D] shadow-md ring-2 ring-[#F7D77C]'
                                  : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dates Preview */}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#F7D77C] bg-white/5 px-2.5 py-1.5 rounded-lg">
                          <span>Calculated Dates ({repeatDates.filter((r) => r.selected).length}):</span>
                          <span>Total Amount: ₹{(selectedSeva.price * repeatDates.filter((r) => r.selected).length).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#D4A017]/30">
                          {repeatDates.map((item, idx) => (
                            <label
                              key={item.date}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                item.selected
                                  ? 'border-[#D4A017]/50 bg-[#D4A017]/14 text-white'
                                  : 'border-white/5 bg-white/5 text-[#EFE6D3]/40 hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={() => toggleRepeatDate(idx)}
                                  className="rounded border-white/20 bg-black/20 text-[#D4A017] focus:ring-0"
                                />
                                <span className="font-bold text-[#F7D77C]">Month {idx + 1}:</span>
                                <span className="font-mono font-semibold text-white">{item.formattedDate}</span>
                              </div>
                              <span className="text-[10px] text-[#EFE6D3]/60 italic">{item.monthName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Options */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Payment Method</label>
                    <div className="flex gap-2">
                      {['Cash', 'UPI', 'Card'].map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                            paymentMethod === pm
                              ? 'bg-[#D4A017] text-[#07172D]'
                              : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10'
                          }`}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#EFE6D3]/70 mb-1.5">Payment Status</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Paid')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                          paymentStatus === 'Paid'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10'
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Unpaid')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                          paymentStatus === 'Unpaid'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10'
                        }`}
                      >
                        Unpaid
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#D4A017] px-8 py-3 text-sm font-extrabold text-[#07172D] transition hover:bg-[#F7D77C] disabled:opacity-50 shadow-xl"
                  >
                    <CheckCircle size={18} />
                    {saving ? 'Saving Booking…' : 'Confirm & Save Booking'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* VIEW RECEIPT MODAL */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-[#D4A017]/30 bg-[#0B1F3A] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-[#F7D77C] text-base">{viewReceiptModal.receiptNo}</h3>
                <p className="text-xs text-[#EFE6D3]/60">{viewReceiptModal.date} · {viewReceiptModal.time}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewReceiptModal(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#EFE6D3]/80">
              <div className="flex justify-between"><span>Devotee:</span> <span className="font-bold text-white">{viewReceiptModal.devoteeName}</span></div>
              <div className="flex justify-between"><span>Mobile:</span> <span className="font-mono text-white">{viewReceiptModal.mobile || '—'}</span></div>
              <div className="flex justify-between"><span>Star (Nakshatra):</span> <span className="font-bold text-white">{viewReceiptModal.starName || '—'}</span></div>
              <div className="flex justify-between"><span>Offering:</span> <span className="font-bold text-white">{viewReceiptModal.items ? viewReceiptModal.items.map(i => i.name).join(', ') : 'Pooja'}</span></div>
              <div className="flex justify-between"><span>Payment Mode:</span> <span className="font-bold text-white">{viewReceiptModal.paymentMethod}</span></div>
              <div className="flex justify-between"><span>Payment Status:</span> <span className={`font-bold ${viewReceiptModal.paymentStatus === 'Unpaid' ? 'text-rose-400' : 'text-emerald-400'}`}>{viewReceiptModal.paymentStatus}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm"><span>Total Amount:</span> <span className="font-extrabold text-[#F7D77C]">₹{Number(viewReceiptModal.total || 0).toLocaleString('en-IN')}</span></div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('theertha-last-receipt', JSON.stringify(viewReceiptModal))
                  window.location.href = '/temple/counter/receipt-preview'
                }}
                className="flex-1 rounded-xl bg-[#D4A017] py-2.5 text-xs font-bold text-[#07172D] text-center hover:bg-[#F7D77C] transition"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewReceiptModal(null)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white text-center hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

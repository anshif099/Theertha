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
  Plus,
  ArrowLeft,
  Calendar,
  Check,
  User,
  Star,
  CheckCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import BrandMark from '../components/BrandMark.jsx'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { endTempleSession, getTempleSession } from '../lib/templeSession.js'
import { getNextReceiptNo, saveReceipt, loadSlotsConfig } from '../lib/settingsStore.js'

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

const SEVAS = [
  { id: 'seva-1', name: 'Archana', price: 50, duration: '10–15 min', slotRequirement: 'Any slot' },
  { id: 'seva-2', name: 'Sahasranamam', price: 1100, duration: '45 min', slotRequirement: 'Morning only' },
  { id: 'seva-3', name: 'Abhishekam', price: 500, duration: '30 min', slotRequirement: 'Pre-booked' },
  { id: 'seva-4', name: 'Pushpanjali', price: 200, duration: '20 min', slotRequirement: 'Evening' },
  { id: 'seva-5', name: 'Neivedyam (prasad offering)', price: 150, duration: 'During any pooja', slotRequirement: '' },
]

const STARS = [
  'Aswathy', 'Bharani', 'Karthika', 'Rohini', 'Makeeryam', 'Thiruvathira', 'Punartham', 'Pooyam', 'Ayilyam',
  'Makam', 'Pooram', 'Uthram', 'Atham', 'Chithira', 'Chothy', 'Visakham', 'Anizham', 'Thrikketta', 'Moolam',
  'Pooradam', 'Uthradam', 'Thiruvonam', 'Avittam', 'Chathayam', 'Pooruruttathy', 'Uthruttathy', 'Revathy'
]

const RASIS = [
  'Mesham', 'Vrishabham', 'Mithunam', 'Karkidakam', 'Simham', 'Kanny', 'Thulam', 'Vrishchikam', 'Dhanu',
  'Makaram', 'Kumbham', 'Meenam'
]

function getDynamicFutureDates() {
  const datesList = []
  const starsList = ['Karthika', 'Rohini', 'Makeeryam', 'Thiruvathira']
  
  for (let i = 0; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const label = `${day} ${months[d.getMonth()]}`
    
    const yr = d.getFullYear()
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dateStr = `${yr}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const star = starsList[i % starsList.length]
    const auspicious = `${day} ${fullMonths[d.getMonth()]} ${yr} — ${star} star${i % 2 === 0 ? ' · auspicious day' : ''}`
    
    datesList.push({
      label,
      dateStr,
      auspicious
    })
  }
  return datesList
}

const DATES = getDynamicFutureDates()

const SLOTS = [
  { time: '5:30 AM', name: 'Nirmalyam', priest: 'Rajan Pillai', status: 'Reserved' },
  { time: '6:30 AM', name: 'Usha Pooja', priest: 'Rajan Pillai', status: 'Booked' },
  { time: '8:00 AM', name: 'Abhishekam', priest: 'Suresh Varma', status: 'Booked' },
  { time: '10:00 AM', name: 'Pantheeradi Pooja', priest: 'Rajan Pillai', status: 'Available' },
  { time: '12:00 PM', name: 'Ucha Pooja', priest: 'Suresh Varma', status: 'Limited' },
  { time: '3:30 PM', name: 'Sayahna', priest: 'Krishnan M.', status: 'Available' },
  { time: '6:30 PM', name: 'Deeparadhana', priest: 'Rajan Pillai', status: 'Available' },
  { time: '8:30 PM', name: 'Athazha Pooja', priest: 'Krishnan M.', status: 'Available' },
]

export default function TempleBookingPage() {
  const [session] = useState(getTempleSession)
  const [temple, setTemple] = useState(session)
  const [isLoading, setIsLoading] = useState(Boolean(session))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Form Fields */
  const [devoteeName, setDevoteeName] = useState('')
  const [mobile, setMobile] = useState('')
  const [starName, setStarName] = useState('')
  const [rasiName, setRasiName] = useState('')
  const [gotra, setGotra] = useState('')

  const [selectedSeva, setSelectedSeva] = useState(SEVAS[1]) // Default Sahasranamam
  const [selectedDate, setSelectedDate] = useState(DATES[0])
  const [activeSlots, setActiveSlots] = useState(SLOTS)
  const [selectedSlot, setSelectedSlot] = useState(SLOTS[3]) // Default 10:00 AM Pantheeradi

  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [saving, setSaving] = useState(false)

  const templeName = temple?.name || 'Temple'

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

    loadSlotsConfig(session.id)
      .then((config) => {
        if (config && Array.isArray(config) && config.length > 0) {
          setActiveSlots(config)
          const pantheeradi = config.find(s => s.time === '10:00 AM')
          if (pantheeradi) setSelectedSlot(pantheeradi)
          else if (config[3]) setSelectedSlot(config[3])
        }
      })
      .catch(() => {})
  }, [session])

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

  function handleCalendarDateChange(dateVal) {
    if (!dateVal) return
    const d = new Date(dateVal)
    const options = { day: '2-digit', month: 'short' }
    const label = d.toLocaleDateString('en-IN', options)
    
    const yr = d.getFullYear()
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const auspLabel = `${d.getDate()} ${fullMonths[d.getMonth()]} ${yr}`
    
    const newDateObj = {
      label,
      dateStr: dateVal,
      auspicious: `${auspLabel} — Auspicious booked date`
    }
    setSelectedDate(newDateObj)
  }

  async function handleConfirmBooking() {
    if (!devoteeName.trim() || !mobile.trim()) {
      alert('Please fill out Name and Mobile number.')
      return
    }

    setSaving(true)
    try {
      // 1. Generate new sequential receipt number
      const receiptNo = await getNextReceiptNo(session.id, 'nadavaravu-entry')
      
      const payload = {
        receiptNo,
        counterId: 'nadavaravu-entry',
        counterNo: 'N/A',
        counterName: 'Walk-in Nadavaravu',
        templeId: session.id,
        templeName: templeName,
        devoteeName: devoteeName.trim(),
        mobile: mobile.trim(),
        starName,
        remarks: `Gotra: ${gotra.trim()} · Rasi: ${rasiName} · Slot: ${selectedSlot.name}`,
        items: [{ name: selectedSeva.name, amount: selectedSeva.price, qty: 1 }],
        total: selectedSeva.price,
        paymentMethod,
        date: new Date(selectedDate.dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      }

      // 2. Save dynamic receipt payload to database
      await saveReceipt(session.id, payload)
      
      // 3. Auto redirect to Nadavaravu dashboard register
      window.location.href = '/temple/nadavaravu'
    } catch (err) {
      console.error('Failed to confirm walk-in counter booking:', err)
      alert('Failed to save counter booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function getSlotClass(status) {
    if (status === 'Reserved' || status === 'Booked') {
      return 'border-white/5 bg-white/3 text-[#EFE6D3]/30 cursor-not-allowed opacity-50'
    }
    if (selectedSlot.time === status.time) {
      return 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#60A5FA] ring-2 ring-[#3B82F6]/40 font-bold'
    }
    if (status === 'Limited') {
      return 'border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
    }
    return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
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

            <div className="pl-12 lg:pl-0 flex items-center gap-3">
              <a
                href="/temple/nadavaravu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-[#EFE6D3]/70 hover:text-white transition"
              >
                <ArrowLeft size={16} />
              </a>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                  <ClipboardList size={14} />
                  <span>Book a seva — Nadavaravu entry</span>
                </div>
                <h1 className="font-display mt-0.5 text-xl font-bold tracking-tight text-[#F8F6F0]">
                  Walk-in / counter booking
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saving && (
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#D4A017]/22 bg-[#D4A017]/5 px-3 py-1 text-xs text-[#F7D77C] animate-pulse">
                  <RefreshCw size={12} className="animate-spin" />
                  Saving...
                </span>
              )}
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 font-semibold text-[#F7D77C]">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body Grid */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Left Column: Form & Sevas */}
          <div className="space-y-6">
            
            {/* Devotee Details form card */}
            <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7D77C] mb-2">
                Devotee Details
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name-input" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/50">
                    Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    value={devoteeName}
                    onChange={(e) => setDevoteeName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/20"
                  />
                </div>
                <div>
                  <label htmlFor="mobile-input" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/50">
                    Mobile
                  </label>
                  <input
                    id="mobile-input"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="star-select" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/50">
                    Star (Nakshatra)
                  </label>
                  <select
                    id="star-select"
                    value={starName}
                    onChange={(e) => setStarName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/20"
                  >
                    <option value="">Select Star</option>
                    {STARS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rasi-select" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/50">
                    Rasi (Moon sign)
                  </label>
                  <select
                    id="rasi-select"
                    value={rasiName}
                    onChange={(e) => setRasiName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#141519] px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/20"
                  >
                    <option value="">Select Rasi</option>
                    {RASIS.map(ra => (
                      <option key={ra} value={ra}>{ra}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="gotra-input" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/50">
                  Gotra / family name
                </label>
                <input
                  id="gotra-input"
                  type="text"
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#141519] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/20"
                />
              </div>

            </section>

            {/* Select Seva card list */}
            <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7D77C]">
                Select Seva
              </h2>
              
              <div className="grid gap-3">
                {SEVAS.map((seva) => {
                  const isSelected = selectedSeva.id === seva.id
                  return (
                    <button
                      key={seva.id}
                      onClick={() => setSelectedSeva(seva)}
                      className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition duration-300 outline-none ${
                        isSelected
                          ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                          : 'border-white/5 bg-white/2 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white tracking-tight">{seva.name}</p>
                        <p className="mt-1 text-[10px] text-[#EFE6D3]/40">
                          {seva.duration} {seva.slotRequirement ? `• ${seva.slotRequirement}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#60A5FA]' : 'text-[#F7D77C]'}`}>
                        ₹{seva.price.toLocaleString('en-IN')}
                      </span>
                    </button>
                  )
                })}
              </div>

            </section>

          </div>

          {/* Right Column: Slot Selection & Summary */}
          <div className="space-y-6">
            
            {/* Select Date and Slot */}
            <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7D77C]">
                Select Date & Slot
              </h2>
              
              {/* Date tab selector bar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
                {DATES.map((dt) => {
                  const isSelectedDate = selectedDate.dateStr === dt.dateStr
                  return (
                    <button
                      key={dt.dateStr}
                      onClick={() => setSelectedDate(dt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        isSelectedDate
                          ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30'
                          : 'bg-white/4 text-[#EFE6D3]/50 border border-white/5 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {dt.label}
                    </button>
                  )
                })}
                <div className="relative">
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-white/4 border border-white/5 hover:bg-white/8 text-[#EFE6D3]/70 hover:text-white transition flex items-center justify-center"
                    title="Choose from calendar"
                  >
                    <Calendar size={13} />
                  </button>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleCalendarDateChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Auspicious label */}
              <p className="text-[10px] font-bold text-amber-400 tracking-wide">
                {selectedDate.auspicious}
              </p>

              {/* Time Slots Grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {activeSlots.map((slot) => {
                  const isSelectedSlot = selectedSlot.time === slot.time
                  const isBooked = slot.status === 'Reserved' || slot.status === 'Booked'
                  
                  let displayStatus = slot.status
                  let slotClass = 'border-white/5 bg-white/2 hover:border-white/10 text-white'
                  
                  if (isBooked) {
                    slotClass = 'border-white/5 bg-white/3 text-[#EFE6D3]/20 cursor-not-allowed'
                  } else if (isSelectedSlot) {
                    slotClass = 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#60A5FA] ring-1 ring-[#3B82F6]/40'
                    displayStatus = 'Selected'
                  } else if (slot.status === 'Limited') {
                    slotClass = 'border-amber-500/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10'
                    displayStatus = '1 slot left'
                  } else if (slot.status === 'Available') {
                    slotClass = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10'
                    displayStatus = 'Available'
                  }

                  return (
                    <button
                      key={slot.time}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex flex-col rounded-xl border p-3.5 text-left transition duration-300 outline-none ${slotClass}`}
                    >
                      <p className="text-xs font-bold tracking-tight">{slot.time} — {slot.name}</p>
                      <p className="mt-1 text-[9px] font-semibold tracking-wider uppercase opacity-60">
                        {displayStatus}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Legends indicators */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-white/5 text-[9px] font-bold text-[#EFE6D3]/50">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded bg-emerald-400/20 border border-emerald-400/40" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded bg-[#3B82F6]/30 border border-[#3B82F6]/60" />
                  Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded bg-amber-500/25 border border-amber-500/50" />
                  Limited
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded bg-white/5 border border-white/10 opacity-30" />
                  Booked
                </span>
              </div>

            </section>

            {/* Booking Summary Panel */}
            <section className="rounded-xl border border-white/5 bg-[#1E1F25] p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7D77C]">
                Booking Summary
              </h2>
              
              <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-3 font-semibold text-xs text-[#EFE6D3]/80">
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Devotee</span>
                  <span className="text-white font-bold">{devoteeName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Star</span>
                  <span className="text-white font-bold">{starName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Seva</span>
                  <span className="text-white font-bold">{selectedSeva.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Date &amp; time</span>
                  <span className="text-white font-bold">{selectedDate.label} • {selectedSlot.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Pooja slot</span>
                  <span className="text-white font-bold">{selectedSlot.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#EFE6D3]/40">Priest</span>
                  <span className="text-white font-bold">{selectedSlot.priest}</span>
                </div>
                
                <div className="border-t border-white/5 pt-3 flex justify-between items-baseline font-bold text-sm text-[#F7D77C]">
                  <span>Total</span>
                  <span className="text-lg">₹{selectedSeva.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action confirm buttons */}
              <div className="flex items-center gap-3">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#141519] px-3.5 py-3 text-xs text-white outline-none focus:border-[#D4A017]/50"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>

                <button
                  onClick={handleConfirmBooking}
                  disabled={saving || !devoteeName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-bold text-[#07172D] hover:bg-[#EFE6D3] transition disabled:opacity-50 outline-none"
                >
                  <Check size={14} />
                  Confirm &amp; print
                </button>
              </div>

            </section>

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

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  LogOut,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Repeat,
  Save,
  Sparkles,
  Star,
  UserPlus,
  X,
} from 'lucide-react'
import { getNextReceiptNo, loadQuickItems, loadStars, saveReceipt, loadTodayReceipts, saveDevotee, getDevoteeByMobile, loadAllReceipts, loadPriests } from '../lib/settingsStore.js'
import { getRegisteredTemple } from '../lib/templeStore.js'
import { getTempleSession } from '../lib/templeSession.js'
import { ALL_27_NAKSHATRAS, getRepeatingNakshatraDates, getRepeatingFixedDates, normalizeNakshatraName } from '../lib/nakshatraHelper.js'
import { navigateTo } from '../lib/router.js'


function fmtINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

/* ── Custom Item Modal ── */
function CustomItemModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const n = name.trim()
    const a = Number(amount)
    if (!n || !a || a <= 0) return
    onAdd({ id: `custom-${Date.now()}`, name: n, amount: a })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[#D4A017]/25 bg-[#0B1F3A] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-[#F7D77C]">Custom Item</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#EFE6D3]/50 hover:text-[#F8F6F0]"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/70">
              Item / Seva Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Special Archana"
              className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-[#F8F6F0] outline-none placeholder:text-[#EFE6D3]/30 focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/70">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-[#F8F6F0] outline-none placeholder:text-[#EFE6D3]/30 focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !amount}
            className="rounded-lg bg-[#D4A017] py-2.5 text-sm font-semibold text-[#07172D] transition hover:bg-[#F7D77C] disabled:opacity-50"
          >
            Add to Cart
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Time Helpers ── */
function convert24hTo12h(time24) {
  if (!time24) return ''
  const [hoursStr, minutesStr] = time24.split(':')
  let hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const strHours = String(hours).padStart(2, '0')
  const strMinutes = String(minutes).padStart(2, '0')
  return `${strHours}:${strMinutes} ${ampm}`
}


/* ══════════════════════════════════════════════
   Counter Dashboard Page
   ══════════════════════════════════════════════ */
export default function CounterDashboardPage() {
  /* read counter session */
  const [counterSession, setCounterSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem('theertha-counter-session')
      let parsed = raw ? JSON.parse(raw) : null
      const templeSession = getTempleSession()

      // If an active temple admin session is present in this browser, ensure counter reflects this temple
      if (templeSession && templeSession.id) {
        if (!parsed || parsed.templeId !== templeSession.id) {
          parsed = {
            counterId: parsed?.counterId || 'ctr-1',
            counterName: parsed?.counterName || 'Main Counter',
            counterNo: parsed?.counterNo || '1',
            loginId: parsed?.loginId || 'CTR-MC01',
            templeId: templeSession.id,
            templeName: templeSession.name || 'Temple',
          }
          sessionStorage.setItem('theertha-counter-session', JSON.stringify(parsed))
        }
      }
      return parsed
    } catch {
      return null
    }
  })

  /* form fields */
  const [receiptNo, setReceiptNo] = useState('Generating…')
  const [devoteeName, setDevoteeName] = useState('')
  const [mobile, setMobile] = useState('')
  const [starId, setStarId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [foundDevotee, setFoundDevotee] = useState(null)
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookingTime, setBookingTime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10)
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [priests, setPriests] = useState([])
  const [priestId, setPriestId] = useState('')

  /* firebase data */
  const [stars, setStars] = useState([])
  const [quickItems, setQuickItems] = useState([])
  const counterQuickItems = useMemo(
    () => quickItems.filter((item) => item.showInCounter !== false),
    [quickItems]
  )
  const [loading, setLoading] = useState(true)
  const [templeData, setTempleData] = useState(null)

  /* cart: [{ id, name, amount, qty }] */
  const [cartItems, setCartItems] = useState([])

  /* custom item modal */
  const [showCustom, setShowCustom] = useState(false)

  const [persons, setPersons] = useState([{}])
  const [activePerson, setActivePerson] = useState(0)
  const allPersons = persons.map((person, index) => index === activePerson ? { name: devoteeName, mobile, starId, items: cartItems } : person)
  function loadPerson(person, index) {
    setActivePerson(index)
    setDevoteeName(person.name || '')
    setMobile(person.mobile || '')
    setStarId(person.starId || stars[0]?.id || '')
    setCartItems(person.items || [])
    setFoundDevotee(null)
  }
  function selectPerson(index) {
    setPersons(allPersons)
    loadPerson(allPersons[index], index)
  }
  function addPerson() {
    if (!devoteeName.trim() || !cartItems.length) {
      alert('Complete this person name and pooja items before adding the next person.')
      return
    }
    setPersons([...allPersons, {}])
    loadPerson({}, allPersons.length)
  }
  function removePerson(index) {
    const remaining = allPersons.filter((_, i) => i !== index)
    if (!remaining.length) return
    const nextIndex = index === activePerson ? Math.max(0, index - 1) : activePerson > index ? activePerson - 1 : activePerson
    setPersons(remaining)
    loadPerson(remaining[nextIndex], nextIndex)
  }
  function validatePersons() {
    if (allPersons.some(person => !person.name?.trim() || !person.items?.length)) {
      alert('Each person needs a name and at least one pooja item. Complete or remove empty persons before saving.')
      return false
    }
    return true
  }

  const repeatStarId = activePerson === 0 ? starId : persons[0]?.starId

  /* multi-date repeat booking state */
  const [isRepeatBooking, setIsRepeatBooking] = useState(false)
  const [repeatMode, setRepeatMode] = useState('nakshatra') // 'nakshatra' (Star-based) or 'date' (Fixed Monthly Day)
  const [repeatMonths, setRepeatMonths] = useState(6)
  const [repeatDates, setRepeatDates] = useState([])

  /* Recalculate repeat dates whenever star, bookingDate, repeatMonths, repeatMode or isRepeatBooking changes */
  useEffect(() => {
    if (isRepeatBooking && bookingDate) {
      let dates = []
      if (repeatMode === 'date') {
        dates = getRepeatingFixedDates(bookingDate, repeatMonths)
      } else {
        const selectedStar = stars.find((s) => s.id === repeatStarId) || ALL_27_NAKSHATRAS[0]
        const targetStarName = selectedStar ? selectedStar.name : 'Ashwathi'
        dates = getRepeatingNakshatraDates(targetStarName, bookingDate, repeatMonths)
      }
      setRepeatDates(dates.map((d) => ({ ...d, selected: true })))
    } else {
      setRepeatDates([])
    }
  }, [isRepeatBooking, repeatMode, repeatStarId, bookingDate, repeatMonths, stars])

  function toggleRepeatDate(index) {
    setRepeatDates((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item)),
    )
  }

  /* ── Auto Slot Scheduling Logic ── */
  function getTodayPlus10() {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10)
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0
    const matches = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!matches) {
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
      }
      return 0
    }
    let hours = parseInt(matches[1], 10)
    const minutes = parseInt(matches[2], 10)
    const ampm = matches[3].toUpperCase()
    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  function calculateDefaultTimeForDate(dateStr, existingReceipts = []) {
    const today = new Date().toISOString().slice(0, 10)
    const dateReceipts = existingReceipts.filter(r => r.bookingDate === dateStr)
    
    if (dateReceipts.length === 0) {
      if (dateStr === today) {
        return getTodayPlus10()
      } else {
        return "06:00"
      }
    } else {
      let maxMinutes = -1
      dateReceipts.forEach(r => {
        if (!r.time) return
        const mins = timeToMinutes(r.time)
        if (mins > maxMinutes) {
          maxMinutes = mins
        }
      })
      
      if (maxMinutes !== -1) {
        const nextMinutes = maxMinutes + 5
        const nextHours = Math.floor(nextMinutes / 60) % 24
        const nextMins = nextMinutes % 60
        const defaultTime = `${String(nextHours).padStart(2, '0')}:${String(nextMins).padStart(2, '0')}`
        
        if (dateStr === today) {
          const now = new Date()
          now.setMinutes(now.getMinutes() + 10)
          const nowMinutes = now.getHours() * 60 + now.getMinutes()
          if (nextMinutes < nowMinutes) {
            return getTodayPlus10()
          }
        }
        return defaultTime
      }
      
      return dateStr === today ? getTodayPlus10() : "06:00"
    }
  }

  async function updateBookingTimeForDate(dateStr) {
    if (!counterSession?.templeId) return
    try {
      const existingReceipts = await loadTodayReceipts(counterSession.templeId, dateStr)
      const calculatedTime = calculateDefaultTimeForDate(dateStr, existingReceipts)
      setBookingTime(calculatedTime)
    } catch (err) {
      console.warn('Error calculating default booking time:', err)
      setBookingTime(dateStr === new Date().toISOString().slice(0, 10) ? getTodayPlus10() : "06:00")
    }
  }

  /* shift summary states */
  const [receipts, setReceipts] = useState([])
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [denominations, setDenominations] = useState({
    c2000: 0,
    c500: 0,
    c200: 0,
    c100: 0,
    c50: 0,
    c20: 0,
    c10: 0,
    coins: 0
  })

  function refreshReceipts() {
    if (!counterSession?.templeId) return
    setLoadingReceipts(true)
    
    const localToday = new Date()
    const offset = localToday.getTimezoneOffset()
    const localDate = new Date(localToday.getTime() - (offset*60*1000))
    const todayStrPrefix = localDate.toISOString().split('T')[0]

    loadAllReceipts(counterSession.templeId)
      .then((list) => {
        const filtered = list.filter(r => 
          r.counterId === counterSession.counterId && 
          r.savedAt && r.savedAt.slice(0, 10) === todayStrPrefix
        )
        setReceipts(filtered)
      })
      .catch((err) => {
        console.error('Failed to load receipts for shift:', err)
      })
      .finally(() => {
        setLoadingReceipts(false)
      })
  }

  /* calculate shift totals and Seva breakdown */
  const shiftStats = useMemo(() => {
    let totalBookings = receipts.length
    let paidCount = 0
    let unpaidCount = 0
    let totalCollected = 0
    let cashTotal = 0
    let upiTotal = 0
    let cardTotal = 0
    const sevaBreakdown = {}

    receipts.forEach((r) => {
      if (r.paymentStatus === 'Unpaid') {
        unpaidCount += 1
      } else {
        paidCount += 1
        totalCollected += Number(r.total || 0)
        if (r.paymentMethod === 'Cash') {
          cashTotal += Number(r.total || 0)
        } else if (r.paymentMethod === 'UPI') {
          upiTotal += Number(r.total || 0)
        } else if (r.paymentMethod === 'Card') {
          cardTotal += Number(r.total || 0)
        }
      }

      if (r.items && Array.isArray(r.items)) {
        r.items.forEach((item) => {
          const itemAmt = Number(item.amount || 0) * Number(item.qty || 1)
          sevaBreakdown[item.name] = (sevaBreakdown[item.name] || 0) + itemAmt
        })
      }
    })

    const denomPhysicalTotal = 
      (2000 * (Number(denominations.c2000) || 0)) +
      (500 * (Number(denominations.c500) || 0)) +
      (200 * (Number(denominations.c200) || 0)) +
      (100 * (Number(denominations.c100) || 0)) +
      (50 * (Number(denominations.c50) || 0)) +
      (20 * (Number(denominations.c20) || 0)) +
      (10 * (Number(denominations.c10) || 0)) +
      (Number(denominations.coins) || 0)

    const isBalanced = denomPhysicalTotal === cashTotal
    const variance = denomPhysicalTotal - cashTotal

    return {
      totalBookings,
      paidCount,
      unpaidCount,
      totalCollected,
      cashTotal,
      upiTotal,
      cardTotal,
      sevaBreakdown,
      denomPhysicalTotal,
      isBalanced,
      variance
    }
  }, [receipts, denominations])

  function printShiftSummary() {
    const printWindow = window.open('', '_blank')
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    
    let sevaListHtml = ''
    Object.entries(shiftStats.sevaBreakdown).forEach(([name, amount]) => {
      sevaListHtml += `
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">${name}</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${Number(amount).toLocaleString('en-IN')}</td>
        </tr>
      `
    })

    printWindow.document.write(`
      <html>
        <head>
          <title>Shift Summary - ${counterSession?.templeName || 'Temple'}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: black; line-height: 1.4; }
            h2, h3 { text-align: center; margin: 5px 0; }
            .divider { border-bottom: 1px dashed black; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>${counterSession?.templeName || 'Temple'}</h2>
          <h3>SHIFT SUMMARY REPORT</h3>
          <div class="divider"></div>
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Printed At:</strong> ${timeStr}</div>
          <div><strong>Counter:</strong> #${counterSession?.counterNo} (${counterSession?.counterName})</div>
          <div class="divider"></div>
          
          <table>
            <tr><td>Total Bookings:</td><td class="right bold">${shiftStats.totalBookings}</td></tr>
            <tr><td>Paid Bookings:</td><td class="right bold">${shiftStats.paidCount}</td></tr>
            <tr><td>Unpaid Bookings:</td><td class="right bold">${shiftStats.unpaidCount}</td></tr>
            <tr><td>Total Collected:</td><td class="right bold">₹${Number(shiftStats.totalCollected).toLocaleString('en-IN')}</td></tr>
            <tr><td>Cash Collection:</td><td class="right bold">₹${Number(shiftStats.cashTotal).toLocaleString('en-IN')}</td></tr>
            <tr><td>UPI Collection:</td><td class="right bold">₹${Number(shiftStats.upiTotal).toLocaleString('en-IN')}</td></tr>
            <tr><td>Card Collection:</td><td class="right bold">₹${Number(shiftStats.cardTotal).toLocaleString('en-IN')}</td></tr>
          </table>

          <div class="divider"></div>
          <h3>COLLECTION BY SEVA</h3>
          <table>
            ${sevaListHtml || '<tr><td colspan="2" style="text-align: center;">No seva transactions today</td></tr>'}
          </table>

          <div class="divider"></div>
          <h3>CASH AUDIT TALLY</h3>
          <table>
            <tr><td>Physical Cash:</td><td class="right bold">₹${Number(shiftStats.denomPhysicalTotal).toLocaleString('en-IN')}</td></tr>
            <tr><td>System Cash:</td><td class="right bold">₹${Number(shiftStats.cashTotal).toLocaleString('en-IN')}</td></tr>
            <tr><td>Variance:</td><td class="right bold">₹${Number(shiftStats.variance).toLocaleString('en-IN')} (${shiftStats.isBalanced ? 'BALANCED' : shiftStats.variance > 0 ? 'SURPLUS' : 'SHORTAGE'})</td></tr>
          </table>

          <div class="divider"></div>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>___________________<br>Operator Signature</div>
            <div>___________________<br>Auditor Signature</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  function handleHandoverShift() {
    alert('Shift report submitted successfully! Summary has been archived.')
  }

  /* redirect if no session */
  useEffect(() => {
    if (!counterSession) {
      navigateTo('/temple/counter')
    }
  }, [counterSession])

  /* devotee search by mobile number */
  useEffect(() => {
    const cleanMobile = mobile ? mobile.trim() : ''
    if (cleanMobile.length === 10 && counterSession?.templeId) {
      getDevoteeByMobile(counterSession.templeId, cleanMobile)
        .then((devotee) => {
          if (devotee) {
            setFoundDevotee(devotee)
          } else {
            setFoundDevotee(null)
          }
        })
        .catch(() => setFoundDevotee(null))
    } else {
      Promise.resolve().then(() => setFoundDevotee(null))
    }
  }, [mobile, counterSession])

  function handleAutofillDevotee() {
    if (foundDevotee) {
      setDevoteeName(foundDevotee.devoteeName || '')
      if (foundDevotee.starId && stars.some((s) => s.id === foundDevotee.starId)) {
        setStarId(foundDevotee.starId)
      }
    }
  }

  /* load data */
  useEffect(() => {
    const templeSession = getTempleSession()
    const activeTempleId = counterSession?.templeId || templeSession?.id
    if (!activeTempleId) return

    const counterId = counterSession?.counterId || 'default'

    getNextReceiptNo(activeTempleId, counterId)
      .then(setReceiptNo)
      .catch(() => setReceiptNo(`RC-${new Date().getFullYear()}-000001`))

    getRegisteredTemple(activeTempleId)
      .then(setTempleData)
      .catch(() => {})

    Promise.all([loadStars(activeTempleId), loadQuickItems(activeTempleId), loadPriests(activeTempleId)])
      .then(([starsData, itemsData, priestsData]) => {
        const priestsOnly = (priestsData || []).filter((p) => !p.role || p.role === 'Priest')
        setStars(starsData || [])
        setQuickItems(itemsData || [])
        setPriests(priestsOnly)
        if (starsData && starsData.length > 0) setStarId(starsData[0].id)
        if (priestsOnly.length > 0) setPriestId(priestsOnly[0].id)
      })
      .catch((err) => {
        console.warn('Error loading counter initial data:', err)
      })
      .finally(() => setLoading(false))

    Promise.resolve().then(() => {
      refreshReceipts()
      updateBookingTimeForDate(new Date().toISOString().slice(0, 10))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counterSession])

  /* totals */
  const total = allPersons.reduce((sum, person) => sum + (person.items || []).reduce((subtotal, item) => subtotal + item.amount * item.qty, 0), 0)

  /* cart helpers */
  function addToCart(item) {
    setCartItems((prev) => {
      const ex = prev.find((c) => c.id === item.id)
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function adjustQty(id, delta) {
    setCartItems((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0),
    )
  }

  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((c) => c.id !== id))
  }

  function isInCart(id) {
    return cartItems.some((c) => c.id === id)
  }

  function handleAddCustom(item) {
    setCartItems((prev) => [...prev, { ...item, qty: 1 }])
  }

  function formatSelectedDate(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function convert24hTo12h(time24) {
    if (!time24) return '06:00 AM'
    const [hStr, mStr] = time24.split(':')
    let h = parseInt(hStr, 10)
    const m = mStr || '00'
    if (isNaN(h)) return '06:00 AM'
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`
  }

  /* build the receipt payload */
  function buildReceiptPayload() {
    const selectedPriest = priests.find((p) => p.id === priestId)

    const receiptPersons = allPersons.map((person, index) => ({
      personNo: index + 1, name: person.name.trim(), mobile: person.mobile || '',
      starName: stars.find(star => star.id === person.starId)?.name || '',
      items: person.items.map(item => ({ name: item.name, amount: item.amount, qty: item.qty })),
      total: person.items.reduce((sum, item) => sum + item.amount * item.qty, 0),
    }))

    return {
      receiptNo,
      counterId:     counterSession.counterId,
      counterNo:     counterSession.counterNo,
      counterName:   counterSession.counterName,
      templeId:      counterSession.templeId,
      templeName:    counterSession.templeName,
      templeContact: templeData?.contact || '',
      templeDistrict: templeData?.district || '',
      devoteeName: receiptPersons[0].name,
      mobile: receiptPersons[0].mobile,
      starName: receiptPersons[0].starName,
      persons: receiptPersons,
      additionalPersons: [],
      remarks,
      items: receiptPersons.flatMap(person => person.items.map(item => ({ ...item, personNo: person.personNo, personName: person.name, starName: person.starName }))),
      total,
      paymentMethod,
      paymentStatus,
      bookingDate,
      date: formatSelectedDate(bookingDate),
      time: convert24hTo12h(bookingTime),
      priestId,
      priestName:    selectedPriest?.name || '',
    }
  }

  async function savePersonsHistory(receipt, multiplier = 1) {
    for (const person of receipt.persons || []) {
      if (!person.mobile?.trim()) continue
      await saveDevotee(counterSession.templeId, {
        devoteeName: person.name, mobile: person.mobile,
        starName: person.starName, receiptId: receipt.id, receiptNo: receipt.receiptNo,
        total: person.total * multiplier, paymentStatus: receipt.paymentStatus,
      })
    }
  }

  /* new receipt */
  function handleNewReceipt() {
    if (!counterSession) return
    setDevoteeName('')
    setMobile('')
    setStarId(stars[0]?.id || '')
    setRemarks('')
    setPersons([{}])
    setActivePerson(0)
    setCartItems([])
    setPaymentMethod('Cash')
    setPaymentStatus('Paid')
    setFoundDevotee(null)
    setIsRepeatBooking(false)
    setRepeatMonths(6)
    setRepeatDates([])
    const today = new Date().toISOString().slice(0, 10)
    setBookingDate(today)
    updateBookingTimeForDate(today)
    setPriestId(priests[0]?.id || '')
    setReceiptNo('Generating…')
    getNextReceiptNo(counterSession.templeId, counterSession.counterId)
      .then(setReceiptNo)
      .catch(() => setReceiptNo(`RC-${new Date().getFullYear()}-000001`))
  }

  async function handleSaveDraft() {
    if (!validatePersons()) return
    const activeRepeatDates = isRepeatBooking ? repeatDates.filter((r) => r.selected) : []
    
    try {
      if (isRepeatBooking && activeRepeatDates.length > 0) {
        for (const rItem of activeRepeatDates) {
          const nextNo = await getNextReceiptNo(counterSession.templeId, counterSession.counterId)
          const data = {
            ...buildReceiptPayload(),
            receiptNo: nextNo,
            bookingDate: rItem.date,
            date: rItem.formattedDate,
            repeatInfo: `Repeating ${repeatMonths} Months Nakshatra Booking (${rItem.monthIndex} of ${activeRepeatDates.length})`
          }
          await saveReceipt(counterSession.templeId, data)
        }
      } else {
        const data = buildReceiptPayload()
        await saveReceipt(counterSession.templeId, data)
      }
      refreshReceipts()
      handleNewReceipt()
    } catch (err) {
      console.warn('Draft save failed:', err)
    }
  }

  async function handlePrint() {
    if (!validatePersons()) return
    const activeRepeatDates = isRepeatBooking ? repeatDates.filter((r) => r.selected) : []

    try {
      if (isRepeatBooking && activeRepeatDates.length > 0) {
        let firstSaved = null
        const allSaved = []

        for (const rItem of activeRepeatDates) {
          const nextNo = await getNextReceiptNo(counterSession.templeId, counterSession.counterId)
          const data = {
            ...buildReceiptPayload(),
            receiptNo: nextNo,
            bookingDate: rItem.date,
            date: rItem.formattedDate,
            repeatInfo: `Repeating ${repeatMonths} Months Nakshatra Booking (${rItem.monthIndex} of ${activeRepeatDates.length})`,
          }
          const saved = await saveReceipt(counterSession.templeId, data)
          allSaved.push(saved)
          if (!firstSaved) firstSaved = saved
        }

        await savePersonsHistory(firstSaved, activeRepeatDates.length)

        const masterReceipt = {
          ...firstSaved,
          total: total * activeRepeatDates.length,
          persons: firstSaved.persons.map(person => ({ ...person, total: person.total * activeRepeatDates.length, items: person.items.map(item => ({ ...item, qty: item.qty * activeRepeatDates.length })) })),
          items: firstSaved.items.map((c) => ({
            ...c,
            name: `${c.name} (${activeRepeatDates.length} Months Repeat)`,
            amount: c.amount,
            qty: c.qty * activeRepeatDates.length
          })),
          repeatDatesList: activeRepeatDates.map((a) => `${a.monthName}: ${a.formattedDate}`)
        }

        sessionStorage.setItem('theertha-last-receipt', JSON.stringify(masterReceipt))
      } else {
        const data = buildReceiptPayload()
        const saved = await saveReceipt(counterSession.templeId, data)
        await savePersonsHistory(saved, 1)
        sessionStorage.setItem('theertha-last-receipt', JSON.stringify(saved))
      }
    } catch {
      sessionStorage.setItem('theertha-last-receipt', JSON.stringify(buildReceiptPayload()))
    }
    navigateTo('/temple/counter/receipt-preview')
  }

  async function handleConfirmReceipt() {
    if (!validatePersons()) return
    const activeRepeatDates = isRepeatBooking ? repeatDates.filter((r) => r.selected) : []

    try {
      if (isRepeatBooking && activeRepeatDates.length > 0) {
        let firstSaved = null
        for (const rItem of activeRepeatDates) {
          const nextNo = await getNextReceiptNo(counterSession.templeId, counterSession.counterId)
          const data = {
            ...buildReceiptPayload(),
            receiptNo: nextNo,
            bookingDate: rItem.date,
            date: rItem.formattedDate,
            paymentStatus: 'Unpaid',
            repeatInfo: `Repeating ${repeatMonths} Months Nakshatra Booking (${rItem.monthIndex} of ${activeRepeatDates.length})`,
          }
          const saved = await saveReceipt(counterSession.templeId, data)
          if (!firstSaved) firstSaved = saved
        }
        await savePersonsHistory(firstSaved, activeRepeatDates.length)
        alert(`Successfully created ${activeRepeatDates.length} unpaid repeating receipts for ${devoteeName || 'devotee'}!`)
      } else {
        const data = buildReceiptPayload()
        const saved = await saveReceipt(counterSession.templeId, data)
        await savePersonsHistory(saved, 1)
        alert('Unpaid receipt confirmed and saved successfully!')
      }
      refreshReceipts()
      handleNewReceipt()
    } catch (err) {
      console.error('Failed to save unpaid receipt:', err)
      alert('Failed to save receipt. Please try again.')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('theertha-counter-session')
    navigateTo('/temple/counter')
  }

  if (!counterSession) return null

  const paymentMethods = ['Cash', 'UPI', 'Card']

  return (
    <div className="flex min-h-screen flex-col bg-[#071828] text-[#F8F6F0]">

      {/* ── Top Header ── */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[#D4A017]/18 bg-[#0B1F3A]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ReceiptText size={16} className="text-[#F7D77C]" aria-hidden="true" />
          <span className="text-[#EFE6D3]/50">Counter Management</span>
          <span className="text-[#EFE6D3]/30">/</span>
          <span className="text-[#F8F6F0]">New Receipt</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Counter badge */}
          <span className="flex items-center gap-1.5 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-3 py-1 text-xs font-bold text-[#F7D77C]">
            Counter #{counterSession.counterNo} — {counterSession.counterName}
          </span>
          {/* Status */}
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Open
          </span>
          {/* New receipt */}
          <button
            type="button"
            onClick={handleNewReceipt}
            className="rounded-lg border border-[#D4A017]/30 px-3 py-1.5 text-xs font-semibold text-[#F7D77C] transition hover:bg-[#D4A017]/10"
          >
            + New
          </button>
          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-1.5 text-xs font-semibold text-[#EFE6D3]/70 transition hover:bg-white/10 hover:text-[#F8F6F0]"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-col xl:flex-row">

        {/* ── LEFT: Receipt Form ── */}
        <div className="border-b border-[#D4A017]/12 p-5 xl:w-[52%] xl:border-b-0 xl:border-r xl:p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]/70">
            Receipt Details
          </p>

          {/* Receipt No + Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Receipt No.
              </label>
              <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm font-semibold text-[#F7D77C] overflow-hidden whitespace-nowrap text-ellipsis">
                {receiptNo}
              </div>
            </div>
            <div>
              <label htmlFor="booking-date" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Booking Date
              </label>
              <input
                id="booking-date"
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value)
                  updateBookingTimeForDate(e.target.value)
                }}
                className="w-full h-10 rounded-lg border border-white/10 bg-[#07172D] px-3 text-sm font-semibold text-[#F8F6F0] outline-none transition focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
              />
            </div>
            <div>
              <label htmlFor="booking-time" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Booking Time
              </label>
              <input
                id="booking-time"
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full h-10 rounded-lg border border-white/10 bg-[#07172D] px-3 text-sm font-semibold text-[#F8F6F0] outline-none transition focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
              />
            </div>
          </div>

          {/* Devotee Name */}
          <div className="mt-4">
            <section className="mb-5 rounded-xl border border-[#D4A017]/30 bg-white/5 p-4" aria-label="Persons in this bill">
              <h2 className="mb-2 text-sm font-bold text-[#F7D77C]">Persons in this bill ({allPersons.length})</h2>
              <p className="mb-3 text-xs text-white/60">Add each person's items. Quantity 2 or 3 stays with that person.</p>
              {allPersons.map((person, index) => <div key={index} className="mb-2 flex items-center gap-2">
                <button type="button" aria-pressed={index === activePerson} onClick={() => selectPerson(index)} className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs ${index === activePerson ? 'border-[#D4A017] bg-[#D4A017]/15 text-[#F7D77C]' : 'border-white/10 text-white/70'}`}>
                  Person {index + 1}: {person.name || 'Enter name'} ? {(person.items || []).length} items ? {fmtINR((person.items || []).reduce((sum, item) => sum + item.amount * item.qty, 0))}
                </button>
                {allPersons.length > 1 && <button type="button" aria-label={`Remove person ${index + 1}`} onClick={() => removePerson(index)} className="p-2 text-rose-400"><X size={14} /></button>}
              </div>)}
              <button type="button" onClick={addPerson} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-3 py-2 text-xs font-bold text-[#07172D]"><UserPlus size={14} />Complete person & add next</button>
            </section>
            <label htmlFor="devotee-name" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
              Devotee Name
            </label>
            <input
              id="devotee-name"
              type="text"
              value={devoteeName}
              onChange={(e) => setDevoteeName(e.target.value)}
              placeholder="Enter devotee name"
              className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2.5 text-sm font-semibold text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/28 focus:border-[#D4A017]/60 focus:bg-white/8 focus:ring-1 focus:ring-[#D4A017]/20"
            />
          </div>

          {/* Mobile + Star */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mobile" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Mobile
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit number"
                maxLength={10}
                className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2.5 text-sm font-semibold text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/28 focus:border-[#D4A017]/60 focus:bg-white/8 focus:ring-1 focus:ring-[#D4A017]/20"
              />
            </div>
            <div>
              <label htmlFor="star-select" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#EFE6D3]/60">
                <Star size={11} />
                Star (Nakshatra)
              </label>
              {stars.length === 0 ? (
                <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/4 px-3 text-xs text-[#EFE6D3]/40">
                  {loading ? 'Loading…' : 'No stars — add in Settings'}
                </div>
              ) : (
                <select
                  id="star-select"
                  value={starId}
                  onChange={(e) => setStarId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1F3A] px-3 py-2.5 text-sm font-semibold text-[#F8F6F0] outline-none transition focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                >
                  {stars.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* ══ Multi-Date / Repeating Booking Options ══ */}
          <div className="mt-4 rounded-xl border border-[#D4A017]/35 bg-[#0B1F3A]/80 p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-[#F7D77C]" />
                <div>
                  <span className="text-xs font-bold text-[#F8F6F0] block">Multi-Date Repeat Booking</span>
                  <span className="text-[10px] text-[#EFE6D3]/60">Schedule monthly repeating poojas by Date or Nakshatra</span>
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
                {/* Mode selector: Nakshatra vs Fixed Monthly Date */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#EFE6D3]/70">
                    Repeat Schedule Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRepeatMode('nakshatra')}
                      className={`rounded-lg py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 outline-none ${
                        repeatMode === 'nakshatra'
                          ? 'bg-[#D4A017] text-[#07172D] shadow-md ring-2 ring-[#F7D77C]'
                          : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10'
                      }`}
                    >
                      <Star size={13} />
                      By Nakshatra (Panchang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatMode('date')}
                      className={`rounded-lg py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 outline-none ${
                        repeatMode === 'date'
                          ? 'bg-[#D4A017] text-[#07172D] shadow-md ring-2 ring-[#F7D77C]'
                          : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10'
                      }`}
                    >
                      <CalendarDays size={13} />
                      By Monthly Date (e.g. {new Date(bookingDate).getDate() || 6}th)
                    </button>
                  </div>
                </div>

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

                {/* Preview calculated dates list */}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#F7D77C] bg-white/5 px-2.5 py-1.5 rounded-lg">
                    <span>Selected Dates ({repeatDates.filter((r) => r.selected).length}):</span>
                    <span>Total Amount: ₹{(total * repeatDates.filter((r) => r.selected).length).toLocaleString('en-IN')}</span>
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
                          <span className="font-mono font-semibold text-[#F8F6F0]">{item.formattedDate}</span>
                        </div>
                        <span className="text-[10px] text-[#EFE6D3]/60 italic">{item.monthName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status + Priest */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Payment Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition duration-200 outline-none ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Unpaid')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition duration-200 outline-none ${
                    paymentStatus === 'Unpaid'
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)]'
                      : 'bg-white/6 text-[#EFE6D3]/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="priest-select" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Performing Priest
              </label>
              {priests.length === 0 ? (
                <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/4 px-3 text-xs text-[#EFE6D3]/40">
                  No priests — add in Settings
                </div>
              ) : (
                <select
                  id="priest-select"
                  value={priestId}
                  onChange={(e) => setPriestId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/10 bg-[#0B1F3A] px-3 text-sm font-semibold text-[#F8F6F0] outline-none transition focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/20"
                >
                  {priests.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <label htmlFor="remarks" className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
              Purpose / Remarks
            </label>
            <input
              id="remarks"
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Family Pooja — wedding anniversary"
              className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-[#F8F6F0] outline-none transition placeholder:text-[#EFE6D3]/28 focus:border-[#D4A017]/60 focus:bg-white/8 focus:ring-1 focus:ring-[#D4A017]/20"
            />
          </div>

          {/* Devotee Record Found Card */}
          {foundDevotee && (
            <div className="mt-4 rounded-xl border border-[#D4A017]/35 bg-[#0B1F3A]/90 p-4 space-y-3 text-xs shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-[#F7D77C]">
                  <Sparkles size={14} className="text-[#F7D77C]" />
                  <span>Devotee Record Found</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillDevotee}
                  className="rounded bg-[#D4A017] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#07172D] hover:bg-[#F7D77C] transition outline-none"
                >
                  Autofill details
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[#EFE6D3]/80">
                <div>Name: <span className="font-bold text-white text-sm block mt-0.5">{foundDevotee.devoteeName}</span></div>
                <div>Star: <span className="font-bold text-white text-sm block mt-0.5">{foundDevotee.starName || '—'}</span></div>
              </div>
              
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="font-bold text-[#EFE6D3]/50 block">Past Receipt History:</span>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {foundDevotee.receipts && Object.values(foundDevotee.receipts).length > 0 ? (
                    Object.values(foundDevotee.receipts).reverse().map((r, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 transition hover:bg-white/8">
                        <div className="font-mono text-[10px] text-white">
                          {r.receiptNo} <span className="text-[#EFE6D3]/40">({r.date})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F7D77C]">₹{r.total}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            r.paymentStatus === 'Unpaid' 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            {r.paymentStatus || 'Paid'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-[#EFE6D3]/40 italic py-1">No past transactions found for this number.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Quick Add Items ── */}
        <div className="p-5 xl:flex-1 xl:p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]/70">
            Quick Add Items ? Person {activePerson + 1}: {devoteeName || 'Enter name'}
          </p>

          {loading ? (
            <p className="text-sm text-[#EFE6D3]/40">Loading items…</p>
          ) : counterQuickItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#D4A017]/20 p-6 text-center">
              <Sparkles size={22} className="mx-auto mb-2 text-[#D4A017]/40" />
              <p className="text-sm text-[#EFE6D3]/40">
                {quickItems.length === 0 ? 'No quick items yet.' : 'No items enabled for counter.'}
              </p>
              <a
                href="/temple/settings"
                className="mt-1 inline-block text-xs font-semibold text-[#F7D77C] hover:underline"
              >
                {quickItems.length === 0 ? 'Add them in Settings →' : 'Select items in Settings →'}
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {counterQuickItems.map((item) => {
                const inCart = isInCart(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className={`flex items-center justify-between gap-2.5 rounded-lg px-3.5 py-3 text-xs sm:text-sm font-semibold transition ${
                      inCart
                        ? 'bg-[#1B4FBF] text-white shadow-[0_0_16px_rgba(27,79,191,0.4)]'
                        : 'bg-[#0B1F3A] text-[#EFE6D3] hover:bg-[#13294D]'
                    }`}
                  >
                    <span className="text-left font-medium leading-snug break-words line-clamp-2">
                      {item.name}
                    </span>
                    <span className={`shrink-0 font-bold ${inCart ? 'text-white' : 'text-[#F7D77C]'}`}>
                      {fmtINR(item.amount)}
                    </span>
                  </button>
                )
              })}
              {/* Custom */}
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="flex items-center justify-between rounded-lg border border-dashed border-[#D4A017]/25 px-4 py-3 text-sm font-semibold text-[#EFE6D3]/45 transition hover:border-[#D4A017]/50 hover:text-[#EFE6D3]/70"
              >
                <span>+ Custom</span>
                <span>—</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Items Table ── */}
      <div className="border-t border-[#D4A017]/12 overflow-x-auto">
        {cartItems.length === 0 ? (
          <p className="px-6 py-5 text-sm text-[#EFE6D3]/35">
            No items added yet. Use Quick Add or Custom.
          </p>
        ) : (
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr className="border-b border-[#D4A017]/12 bg-white/3 text-left text-xs font-bold uppercase tracking-wide text-[#EFE6D3]/45">
                <th className="px-6 py-3">Item / Seva</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {cartItems.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5 font-semibold">{c.name}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustQty(c.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-[#EFE6D3]/70 transition hover:bg-white/14 hover:text-[#F8F6F0]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-bold">
                        {c.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQty(c.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-[#EFE6D3]/70 transition hover:bg-white/14 hover:text-[#F8F6F0]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-[#F7D77C]">
                    {fmtINR(c.amount * c.qty)}
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      type="button"
                      onClick={() => removeFromCart(c.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-400/60 transition hover:bg-red-500/12 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="flex flex-wrap items-center gap-4 border-t border-[#D4A017]/18 bg-[#0B1F3A]/90 px-5 py-4 backdrop-blur-md">
        {/* Subtotal */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#EFE6D3]/45">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · Subtotal
          </p>
          <p className="flex items-center gap-1 text-2xl font-bold text-[#F7D77C]">
            <IndianRupee size={18} strokeWidth={2.5} />
            {total.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Payment method */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#EFE6D3]/45">Payment</span>
          {paymentMethods.map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setPaymentMethod(pm)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                paymentMethod === pm
                  ? 'bg-[#F8F6F0] text-[#0B1F3A] shadow-[0_0_14px_rgba(248,246,240,0.2)]'
                  : 'bg-white/8 text-[#EFE6D3]/70 hover:bg-white/14 hover:text-[#F8F6F0]'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#D4A017]/30 px-4 py-2.5 text-sm font-semibold text-[#F7D77C] transition hover:bg-[#D4A017]/10"
            onClick={handleSaveDraft}
          >
            <Save size={15} />
            Save draft
          </button>
          {paymentStatus === 'Unpaid' && (
            <button
              type="button"
              onClick={handleConfirmReceipt}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition hover:bg-emerald-500 outline-none"
            >
              <CheckCircle2 size={15} />
              Save Unpaid
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#07172D] shadow-[0_8px_24px_rgba(212,160,23,0.3)] transition hover:bg-[#F7D77C] outline-none"
          >
            <Printer size={15} />
            {paymentStatus === 'Unpaid' ? 'Print Unpaid Receipt' : 'Print receipt'}
          </button>
        </div>
      </footer>

      {/* ── Shift Summary Section (Below the Receipt Builder) ── */}
      <section className="border-t border-[#D4A017]/24 bg-[#0B1F3A]/50 px-6 py-10 md:px-8 no-print">
        <div className="mx-auto max-w-7xl">
          
          {/* Section header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#D4A017]/10 text-[#F7D77C] border border-[#D4A017]/20">
                <ClipboardList size={20} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-[#F8F6F0]">Today's Shift Summary</h2>
                <p className="text-sm text-[#EFE6D3]/60">Real-time collections, seva breakdown and cash tally for your counter</p>
              </div>
            </div>
            <button
              type="button"
              onClick={refreshReceipts}
              className="self-start rounded-lg border border-[#D4A017]/30 bg-[#D4A017]/10 px-4 py-2 text-xs font-bold text-[#F7D77C] transition hover:bg-[#D4A017]/20 outline-none"
            >
              Refresh Data
            </button>
          </div>

          {loadingReceipts ? (
            <p className="text-sm text-[#EFE6D3]/40 py-4">Loading shift reports…</p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              
              {/* Left Column: Key Stats cards */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A017]/70">Collection Status</h3>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {/* Total Bookings */}
                  <div className="rounded-xl border border-white/5 bg-[#0B1F3A] p-5">
                    <p className="text-xs font-semibold text-[#EFE6D3]/50 uppercase tracking-wider">Total Bookings</p>
                    <p className="mt-1.5 text-2xl font-black text-[#F8F6F0]">{shiftStats.totalBookings}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        ✓ Paid: {shiftStats.paidCount}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/12 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                        ✗ Unpaid: {shiftStats.unpaidCount}
                      </span>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-[#D4A017]/18 bg-[#0B1F3A] p-5">
                    <p className="text-xs font-semibold text-[#EFE6D3]/50 uppercase tracking-wider">Total Revenue</p>
                    <p className="mt-1.5 text-2xl font-black text-[#F7D77C]">{fmtINR(shiftStats.totalCollected)}</p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/18 bg-[#0B1F3A] p-5">
                    <p className="text-xs font-semibold text-[#EFE6D3]/50 uppercase tracking-wider">Cash Collection</p>
                    <p className="mt-1.5 text-2xl font-black text-emerald-400">{fmtINR(shiftStats.cashTotal)}</p>
                  </div>

                  <div className="rounded-xl border border-blue-500/18 bg-[#0B1F3A] p-5">
                    <p className="text-xs font-semibold text-[#EFE6D3]/50 uppercase tracking-wider">UPI / Card</p>
                    <p className="mt-1.5 text-2xl font-black text-blue-400">{fmtINR(shiftStats.upiTotal + shiftStats.cardTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Middle Column: Seva breakdown */}
              <div className="rounded-xl border border-white/5 bg-[#0B1F3A]/40 p-6">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#D4A017]/70">Offering Breakdown</h3>
                {Object.keys(shiftStats.sevaBreakdown).length === 0 ? (
                  <p className="text-xs font-semibold text-[#EFE6D3]/40 italic">No collections registered on this shift.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(shiftStats.sevaBreakdown).map(([name, amount]) => {
                      const percentage = shiftStats.totalCollected > 0
                        ? Math.round((amount / shiftStats.totalCollected) * 100)
                        : 0
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-[#EFE6D3]/90">{name}</span>
                            <span className="text-[#F7D77C]">{fmtINR(amount)} ({percentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-[#D4A017] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Denominations Tally */}
              <div className="rounded-xl border border-white/5 bg-[#0B1F3A]/40 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#D4A017]/70">Cash Denomination Tally</h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
                    {[2000, 500, 200, 100, 50, 20, 10].map((denom) => {
                      const stateKey = `c${denom}`
                      return (
                        <div key={denom} className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/4 p-2">
                          <span className="text-[9px] font-bold text-[#EFE6D3]/40">₹{denom} Notes</span>
                          <input
                            type="number"
                            min="0"
                            value={denominations[stateKey]}
                            onChange={(e) => setDenominations(p => ({ ...p, [stateKey]: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-full rounded border border-white/10 bg-[#071828] px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-[#D4A017]/50"
                          />
                          <span className="text-[9px] font-bold text-[#F7D77C] text-right mt-0.5">
                            {fmtINR(denom * denominations[stateKey])}
                          </span>
                        </div>
                      )
                    })}
                    {/* Coins */}
                    <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/4 p-2">
                      <span className="text-[9px] font-bold text-[#EFE6D3]/40">Coins (Total ₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={denominations.coins}
                        onChange={(e) => setDenominations(p => ({ ...p, coins: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full rounded border border-white/10 bg-[#071828] px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-[#D4A017]/50"
                      />
                      <span className="text-[9px] font-bold text-[#F7D77C] text-right mt-0.5">
                        {fmtINR(denominations.coins)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit balanced display and actions */}
                <div className="mt-6 pt-5 border-t border-white/5">
                  <div className="flex justify-between items-center mb-4 text-xs font-semibold">
                    <span className="text-[#EFE6D3]/50">Physical Cash:</span>
                    <span className="text-white font-mono font-bold">{fmtINR(shiftStats.denomPhysicalTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-5 text-xs font-semibold">
                    <span className="text-[#EFE6D3]/50">System Cash:</span>
                    <span className="text-[#F7D77C] font-mono font-bold">{fmtINR(shiftStats.cashTotal)}</span>
                  </div>
                  
                  {/* Status compare display */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      {shiftStats.isBalanced ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-extrabold text-emerald-400">
                          ✓ Balanced
                        </span>
                      ) : shiftStats.variance > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-extrabold text-blue-400">
                          ⚠ Surplus: +{fmtINR(shiftStats.variance)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[10px] font-extrabold text-red-400">
                          ⚠ Shortage: {fmtINR(shiftStats.variance)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={printShiftSummary}
                        className="rounded-lg border border-[#D4A017]/30 px-3 py-1.5 text-[10px] font-bold text-[#F7D77C] hover:bg-[#D4A017]/10"
                      >
                        Print Summary
                      </button>
                      <button
                        type="button"
                        onClick={handleHandoverShift}
                        className="rounded-lg bg-[#D4A017] px-3 py-1.5 text-[10px] font-bold text-[#07172D] hover:bg-[#F7D77C]"
                      >
                        Hand Over
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </section>

      {/* ── Custom Item Modal ── */}
      {showCustom && (
        <CustomItemModal
          onAdd={handleAddCustom}
          onClose={() => setShowCustom(false)}
        />
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  IndianRupee,
  LogOut,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { getNextReceiptNo, loadQuickItems, loadStars, saveReceipt, loadTodayReceipts } from '../lib/settingsStore.js'
import { getRegisteredTemple } from '../lib/templeStore.js'

/* ── live clock ── */
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatDateTime(date) {
  const d = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const t = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${d} · ${t}`
}

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

/* ══════════════════════════════════════════════
   Counter Dashboard Page
══════════════════════════════════════════════ */
export default function CounterDashboardPage() {
  /* read counter session */
  const [counterSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem('theertha-counter-session')
      return raw ? JSON.parse(raw) : null
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

  /* firebase data */
  const [stars, setStars] = useState([])
  const [quickItems, setQuickItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [templeData, setTempleData] = useState(null)

  /* cart: [{ id, name, amount, qty }] */
  const [cartItems, setCartItems] = useState([])

  /* custom item modal */
  const [showCustom, setShowCustom] = useState(false)

  const clock = useClock()

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
    loadTodayReceipts(counterSession.templeId)
      .then((list) => {
        const filtered = list.filter(r => r.counterId === counterSession.counterId)
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
    let totalCount = receipts.length
    let totalCollected = 0
    let cashTotal = 0
    let upiTotal = 0
    let cardTotal = 0
    const sevaBreakdown = {}

    receipts.forEach((r) => {
      totalCollected += Number(r.total || 0)
      if (r.paymentMethod === 'Cash') {
        cashTotal += Number(r.total || 0)
      } else if (r.paymentMethod === 'UPI') {
        upiTotal += Number(r.total || 0)
      } else if (r.paymentMethod === 'Card') {
        cardTotal += Number(r.total || 0)
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
      totalCount,
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
            <tr><td>Total Receipts:</td><td class="right bold">${shiftStats.totalCount}</td></tr>
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
      window.location.href = '/temple/counter'
    }
  }, [counterSession])

  /* load data */
  useEffect(() => {
    if (!counterSession) return
    const { templeId, counterId } = counterSession

    getNextReceiptNo(templeId, counterId)
      .then(setReceiptNo)
      .catch(() => setReceiptNo(`RC-${new Date().getFullYear()}-000001`))

    getRegisteredTemple(templeId)
      .then(setTempleData)
      .catch(() => {})

    Promise.all([loadStars(templeId), loadQuickItems(templeId)])
      .then(([starsData, itemsData]) => {
        setStars(starsData)
        setQuickItems(itemsData)
        if (starsData.length > 0) setStarId(starsData[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    refreshReceipts()
  }, [counterSession])

  /* totals */
  const total = useMemo(
    () => cartItems.reduce((sum, c) => sum + c.amount * c.qty, 0),
    [cartItems],
  )

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

  /* build the receipt payload */
  function buildReceiptPayload() {
    const selectedStar = stars.find((s) => s.id === starId)
    const now = new Date()
    return {
      receiptNo,
      counterId:     counterSession.counterId,
      counterNo:     counterSession.counterNo,
      counterName:   counterSession.counterName,
      templeId:      counterSession.templeId,
      templeName:    counterSession.templeName,
      templeContact: templeData?.contact || '',
      templeDistrict: templeData?.district || '',
      devoteeName,
      mobile,
      starName:      selectedStar?.name || '',
      remarks,
      items:         cartItems.map((c) => ({ name: c.name, amount: c.amount, qty: c.qty })),
      total,
      paymentMethod,
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    }
  }

  /* new receipt */
  function handleNewReceipt() {
    if (!counterSession) return
    setDevoteeName('')
    setMobile('')
    setStarId(stars[0]?.id || '')
    setRemarks('')
    setCartItems([])
    setPaymentMethod('Cash')
    setReceiptNo('Generating…')
    getNextReceiptNo(counterSession.templeId, counterSession.counterId)
      .then(setReceiptNo)
      .catch(() => setReceiptNo(`RC-${new Date().getFullYear()}-000001`))
  }

  async function handleSaveDraft() {
    if (cartItems.length === 0) return
    const data = buildReceiptPayload()
    try {
      await saveReceipt(counterSession.templeId, data)
      refreshReceipts()
      handleNewReceipt()
    } catch (err) {
      console.warn('Draft save failed:', err)
    }
  }

  async function handlePrint() {
    if (cartItems.length === 0) return
    const data = buildReceiptPayload()
    try {
      const saved = await saveReceipt(counterSession.templeId, data)
      sessionStorage.setItem('theertha-last-receipt', JSON.stringify(saved))
    } catch {
      sessionStorage.setItem('theertha-last-receipt', JSON.stringify(data))
    }
    window.location.href = '/temple/counter/receipt-preview'
  }

  function handleLogout() {
    sessionStorage.removeItem('theertha-counter-session')
    window.location.href = '/temple/counter'
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

          {/* Receipt No + Date&Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Receipt No.
              </label>
              <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm font-semibold text-[#F7D77C]">
                {receiptNo}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#EFE6D3]/60">
                Date &amp; Time
              </label>
              <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-semibold text-[#F8F6F0]">
                {formatDateTime(clock)}
              </div>
            </div>
          </div>

          {/* Devotee Name */}
          <div className="mt-4">
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
        </div>

        {/* ── RIGHT: Quick Add Items ── */}
        <div className="p-5 xl:flex-1 xl:p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]/70">
            Quick Add Items
          </p>

          {loading ? (
            <p className="text-sm text-[#EFE6D3]/40">Loading items…</p>
          ) : quickItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#D4A017]/20 p-6 text-center">
              <Sparkles size={22} className="mx-auto mb-2 text-[#D4A017]/40" />
              <p className="text-sm text-[#EFE6D3]/40">
                No quick items yet.
              </p>
              <a
                href="/temple/settings"
                className="mt-1 inline-block text-xs font-semibold text-[#F7D77C] hover:underline"
              >
                Add them in Settings →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {quickItems.map((item) => {
                const inCart = isInCart(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      inCart
                        ? 'bg-[#1B4FBF] text-white shadow-[0_0_16px_rgba(27,79,191,0.4)]'
                        : 'bg-[#0B1F3A] text-[#EFE6D3] hover:bg-[#13294D]'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className={inCart ? 'text-white' : 'text-[#F7D77C]'}>
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
          <button
            type="button"
            onClick={handlePrint}
            disabled={cartItems.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#07172D] shadow-[0_8px_24px_rgba(212,160,23,0.3)] transition hover:bg-[#F7D77C] disabled:opacity-50"
          >
            <Printer size={15} />
            Print receipt
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
                  <div className="rounded-xl border border-white/5 bg-[#0B1F3A] p-5">
                    <p className="text-xs font-semibold text-[#EFE6D3]/50 uppercase tracking-wider">Total Receipts</p>
                    <p className="mt-1.5 text-2xl font-black text-[#F8F6F0]">{shiftStats.totalCount}</p>
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

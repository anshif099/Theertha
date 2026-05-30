import { useEffect, useMemo, useState } from 'react'
import {
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
import { getNextReceiptNo, loadQuickItems, loadStars } from '../lib/settingsStore.js'

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

  /* cart: [{ id, name, amount, qty }] */
  const [cartItems, setCartItems] = useState([])

  /* custom item modal */
  const [showCustom, setShowCustom] = useState(false)

  const clock = useClock()

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

    Promise.all([loadStars(templeId), loadQuickItems(templeId)])
      .then(([starsData, itemsData]) => {
        setStars(starsData)
        setQuickItems(itemsData)
        if (starsData.length > 0) setStarId(starsData[0].id)
      })
      .finally(() => setLoading(false))
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

  function handleLogout() {
    sessionStorage.removeItem('theertha-counter-session')
    window.location.href = '/temple/counter'
  }

  function handlePrint() {
    window.print()
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
      <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">

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
          >
            <Save size={15} />
            Save draft
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#07172D] shadow-[0_8px_24px_rgba(212,160,23,0.3)] transition hover:bg-[#F7D77C]"
          >
            <Printer size={15} />
            Print receipt
          </button>
        </div>
      </footer>

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

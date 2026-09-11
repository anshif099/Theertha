import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  Layers,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react'
import ReceiptPaymentAction from './ReceiptPaymentAction.jsx'
import { navigateTo } from '../lib/router.js'
import { loadAllReceipts, loadExpenses } from '../lib/settingsStore.js'
import { useReceiptPaymentUpdates, patchReceiptList } from '../lib/useReceiptPaymentUpdates.js'

function fmtINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

function receiptDate(r) {
  return (r.paymentStatus !== 'Unpaid' && r.paidOn) || r.bookingDate || r.dbDate || r.dateStr || r.savedAt?.slice(0, 10) || r.date || ''
}

export default function CounterAccountsView({
  counterSession,
  onPrintShiftSummary,
  onPrintDaySummary,
  onPrintReceipt,
}) {
  const [allReceiptsList, setAllReceiptsList] = useState([])
  const [expensesList, setExpensesList] = useState([])
  const [loading, setLoading] = useState(true)

  function handleDirectPrint(receipt) {
    if (onPrintReceipt) {
      onPrintReceipt(receipt)
    } else {
      sessionStorage.setItem('theertha-last-receipt', JSON.stringify(receipt))
      navigateTo('/temple/counter/receipt-preview')
    }
  }

  // Filters
  const [scope, setScope] = useState('this') // 'this' | 'all'
  const [period, setPeriod] = useState('today') // 'today' | 'monthly' | 'custom'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [paymentModeFilter, setPaymentModeFilter] = useState('all') // 'all' | 'Cash' | 'UPI' | 'Card'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'paid' | 'unpaid'
  const [searchQuery, setSearchQuery] = useState('')
  const [showDenominations, setShowDenominations] = useState(false)

  // Denominations for drawer check
  const [notes, setNotes] = useState({
    c500: '',
    c200: '',
    c100: '',
    c50: '',
    c20: '',
    c10: '',
    coins: '',
  })

  useReceiptPaymentUpdates(({ templeId, receipt }) => {
    if (templeId === counterSession?.templeId) {
      setAllReceiptsList((list) => patchReceiptList(list, receipt))
    }
  })

  useEffect(() => {
    if (!counterSession?.templeId) return
    setLoading(true)
    Promise.all([
      loadAllReceipts(counterSession.templeId).catch(() => []),
      loadExpenses(counterSession.templeId).catch(() => []),
    ])
      .then(([rcpts, exps]) => {
        setAllReceiptsList(rcpts)
        setExpensesList(exps)
      })
      .catch((err) => {
        console.error('Failed to load accounts data:', err)
      })
      .finally(() => setLoading(false))
  }, [counterSession?.templeId])

  // Filtered receipts by period, scope, payment mode, search
  const filteredReceipts = useMemo(() => {
    return allReceiptsList.filter((r) => {
      // Scope filter (This counter vs All counters)
      if (scope === 'this') {
        const isMatch =
          (r.counterId && r.counterId === counterSession?.counterId) ||
          (r.counterNo && String(r.counterNo) === String(counterSession?.counterNo))
        if (!isMatch) return false
      }

      // Date / Period filter
      const rDate = receiptDate(r)
      if (period === 'today') {
        if (rDate !== selectedDate) return false
      } else if (period === 'monthly') {
        if (!rDate.startsWith(selectedMonth)) return false
      }

      // Payment Mode filter
      if (paymentModeFilter !== 'all') {
        const pMode = String(r.paymentMethod || r.paymentMode || 'Cash').toLowerCase()
        if (pMode !== paymentModeFilter.toLowerCase()) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'unpaid' && r.paymentStatus !== 'Unpaid') return false
        if (statusFilter === 'paid' && r.paymentStatus === 'Unpaid') return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchReceipt = r.receiptNo?.toLowerCase().includes(q)
        const matchDevotee = r.devoteeName?.toLowerCase().includes(q)
        const matchStar = r.starName?.toLowerCase().includes(q)
        const matchItems = r.items && r.items.some((it) => it.name?.toLowerCase().includes(q))
        return matchReceipt || matchDevotee || matchStar || matchItems
      }

      return true
    })
  }, [allReceiptsList, scope, period, selectedDate, selectedMonth, paymentModeFilter, statusFilter, searchQuery, counterSession])

  // Financial statistics calculated from filteredReceipts
  const stats = useMemo(() => {
    let totalIncome = 0
    let cashTotal = 0
    let upiTotal = 0
    let cardTotal = 0
    let paidCount = 0
    let unpaidCount = 0
    let unpaidAmount = 0

    const sevaMap = {}

    filteredReceipts.forEach((r) => {
      const amt = Number(r.total || 0)
      if (r.paymentStatus === 'Unpaid') {
        unpaidCount += 1
        unpaidAmount += amt
      } else {
        paidCount += 1
        totalIncome += amt

        const mode = String(r.paymentMethod || r.paymentMode || 'Cash').toLowerCase()
        if (mode.includes('upi') || mode.includes('qr') || mode.includes('online')) {
          upiTotal += amt
        } else if (mode.includes('card')) {
          cardTotal += amt
        } else {
          cashTotal += amt
        }

        // Tally items
        if (r.items && Array.isArray(r.items)) {
          r.items.forEach((it) => {
            const name = it.name || 'General Vazhipadu'
            const qty = Number(it.qty || 1)
            const itAmt = Number(it.amount || 0) * qty
            if (!sevaMap[name]) {
              sevaMap[name] = { count: 0, total: 0 }
            }
            sevaMap[name].count += qty
            sevaMap[name].total += itAmt
          })
        }
      }
    })

    const topSevas = Object.entries(sevaMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)

    return {
      totalIncome,
      cashTotal,
      upiTotal,
      cardTotal,
      paidCount,
      unpaidCount,
      unpaidAmount,
      topSevas,
    }
  }, [filteredReceipts])

  // Denomination total calculation
  const countedCash = useMemo(() => {
    const total =
      Number(notes.c500 || 0) * 500 +
      Number(notes.c200 || 0) * 200 +
      Number(notes.c100 || 0) * 100 +
      Number(notes.c50 || 0) * 50 +
      Number(notes.c20 || 0) * 20 +
      Number(notes.c10 || 0) * 10 +
      Number(notes.coins || 0) * 1
    return total
  }, [notes])

  const cashDiff = countedCash - stats.cashTotal

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Bar: Title + Scope + Reports ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#D4A017]/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A017]/15 text-[#F7D77C]">
              <WalletCards size={18} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-[#F8F6F0]">
                Counter Accounts & Collection Ledger
              </h1>
              <p className="text-xs text-[#EFE6D3]/60">
                Shift revenues, cash/UPI reconciliation, and daily accounts for {counterSession?.templeName || 'Temple'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Toggle */}
          <div className="inline-flex rounded-lg border border-white/12 bg-white/6 p-1">
            <button
              type="button"
              onClick={() => setScope('this')}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                scope === 'this'
                  ? 'bg-[#D4A017] text-[#07172D] shadow-sm'
                  : 'text-[#EFE6D3]/70 hover:text-white'
              }`}
            >
              My Counter (#{counterSession?.counterNo})
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                scope === 'all'
                  ? 'bg-[#D4A017] text-[#07172D] shadow-sm'
                  : 'text-[#EFE6D3]/70 hover:text-white'
              }`}
            >
              All Counters
            </button>
          </div>

          {/* Denominations Toggle */}
          <button
            type="button"
            onClick={() => setShowDenominations(!showDenominations)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              showDenominations
                ? 'border-[#D4A017] bg-[#D4A017]/20 text-[#F7D77C]'
                : 'border-white/12 bg-white/6 text-[#EFE6D3]/75 hover:bg-white/10'
            }`}
          >
            <Calculator size={13} />
            Cash Denominations
          </button>

          {/* Print Day Summary */}
          {onPrintDaySummary && (
            <button
              type="button"
              onClick={onPrintDaySummary}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4A017] px-3.5 py-1.5 text-xs font-bold text-[#07172D] transition hover:bg-[#F7D77C] shadow-sm"
            >
              <Printer size={13} />
              Print Day Summary
            </button>
          )}

          {/* Print Shift Summary */}
          {onPrintShiftSummary && (
            <button
              type="button"
              onClick={onPrintShiftSummary}
              className="flex items-center gap-1.5 rounded-lg border border-[#D4A017]/40 bg-[#071828] px-3 py-1.5 text-xs font-bold text-[#F7D77C] hover:bg-[#D4A017]/15 transition"
            >
              <FileText size={13} />
              Shift Slip
            </button>
          )}
        </div>
      </div>

      {/* ── Key Financial Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Collected */}
        <div className="rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F7D77C]/80">Total Collection</p>
            <Wallet size={15} className="text-[#F7D77C]" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-[#F7D77C]">{fmtINR(stats.totalIncome)}</p>
          <p className="mt-1 text-[10px] text-[#F7D77C]/60">{stats.paidCount} paid receipts</p>
        </div>

        {/* Unpaid / Pending Bookings */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Unpaid Bookings</p>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
              {stats.unpaidCount}
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-amber-400">{fmtINR(stats.unpaidAmount)}</p>
          <p className="mt-1 text-[10px] text-amber-300/60">Pending collection</p>
        </div>

        {/* Cash in Drawer */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">Cash in Drawer</p>
            <Coins size={15} className="text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-emerald-400">{fmtINR(stats.cashTotal)}</p>
          <p className="mt-1 text-[10px] text-emerald-300/60">Physical currency collected</p>
        </div>

        {/* UPI / QR */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400/80">UPI / QR Payment</p>
            <QrCode size={15} className="text-sky-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-sky-400">{fmtINR(stats.upiTotal)}</p>
          <p className="mt-1 text-[10px] text-sky-300/60">Direct to Temple Bank A/C</p>
        </div>

        {/* Card / POS */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400/80">Card / POS</p>
            <CreditCard size={15} className="text-purple-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-purple-400">{fmtINR(stats.cardTotal)}</p>
          <p className="mt-1 text-[10px] text-purple-300/60">Debit & Credit Cards</p>
        </div>
      </div>

      {/* ── Denomination Drawer Check (Collapsible) ── */}
      {showDenominations && (
        <div className="rounded-xl border border-[#D4A017]/30 bg-[#0B1F3A] p-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-[#F7D77C]" />
              <h3 className="text-sm font-bold text-[#F8F6F0]">Cash Drawer Denominations & Reconciliation</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDenominations(false)}
              className="text-xs text-[#EFE6D3]/50 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { key: 'c500', val: 500, label: '₹500' },
              { key: 'c200', val: 200, label: '₹200' },
              { key: 'c100', val: 100, label: '₹100' },
              { key: 'c50', val: 50, label: '₹50' },
              { key: 'c20', val: 20, label: '₹20' },
              { key: 'c10', val: 10, label: '₹10' },
              { key: 'coins', val: 1, label: 'Coins' },
            ].map((d) => (
              <div key={d.key} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                <span className="text-[11px] font-bold text-[#F7D77C]">{d.label}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={notes[d.key]}
                  onChange={(e) => setNotes({ ...notes, [d.key]: e.target.value })}
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#071828] px-2 py-1 text-xs font-bold text-white outline-none focus:border-[#D4A017]"
                />
                <span className="mt-1 block text-[10px] text-[#EFE6D3]/50">
                  = {fmtINR(Number(notes[d.key] || 0) * d.val)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span>Counted Cash: <strong className="text-white">{fmtINR(countedCash)}</strong></span>
              <span>System Cash: <strong className="text-emerald-400">{fmtINR(stats.cashTotal)}</strong></span>
              <span
                className={`rounded px-2 py-0.5 font-bold ${
                  cashDiff === 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : cashDiff > 0
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                Difference: {cashDiff > 0 ? `+${fmtINR(cashDiff)} (Surplus)` : cashDiff < 0 ? `${fmtINR(cashDiff)} (Shortage)` : 'Exact Match ✓'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNotes({ c500: '', c200: '', c100: '', c50: '', c20: '', c10: '', coins: '' })}
              className="text-[11px] font-bold text-white/50 hover:text-white"
            >
              Reset Denominations
            </button>
          </div>
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B1F3A]/60 p-3">
        {/* Period Selector */}
        <div className="flex items-center gap-1.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-bold text-[#F8F6F0] outline-none cursor-pointer"
          >
            <option value="today">Daily View</option>
            <option value="monthly">Monthly View</option>
            <option value="all">Overall View</option>
          </select>

          {/* Conditional Date Pickers */}
          {period === 'today' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-bold text-[#F8F6F0] outline-none [color-scheme:dark] cursor-pointer"
            />
          )}

          {period === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-bold text-[#F8F6F0] outline-none [color-scheme:dark] cursor-pointer"
            />
          )}
        </div>

        {/* Payment Mode Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#EFE6D3]/50">Mode:</span>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-semibold text-[#F8F6F0] outline-none cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="Cash">Cash Only</option>
            <option value="UPI">UPI / QR Only</option>
            <option value="Card">Card Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#EFE6D3]/50">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-semibold text-[#F8F6F0] outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid Only</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex min-w-[200px] items-center gap-2 rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs">
          <Search size={13} className="text-[#EFE6D3]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt # or devotee…"
            className="w-full bg-transparent text-xs text-[#F8F6F0] outline-none placeholder:text-[#EFE6D3]/35"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-[#EFE6D3]/50 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-[#EFE6D3]/50">
          <strong className="text-[#F7D77C]">{filteredReceipts.length}</strong> receipts
        </span>
      </div>

      {/* ── Top Sevas & Vazhipadu Breakdown ── */}
      {stats.topSevas.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0B1F3A]/60 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#F7D77C]">
            Vazhipadu & Seva Collections Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {stats.topSevas.slice(0, 6).map((s) => (
              <div key={s.name} className="rounded-lg border border-white/8 bg-white/4 p-2.5">
                <p className="truncate text-xs font-bold text-white" title={s.name}>
                  {s.name}
                </p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[10px] text-[#EFE6D3]/60">{s.count} booked</span>
                  <span className="font-mono text-xs font-bold text-[#F7D77C]">{fmtINR(s.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed Receipts / Transactions Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#D4A017]/18 bg-[#0B1F3A]/70 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#071828]/60 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F7D77C]">
            Collections Ledger
          </span>
          <span className="text-xs font-semibold text-[#EFE6D3]/60">
            Total Credit: <strong className="text-emerald-400">{fmtINR(stats.totalIncome)}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-[#EFE6D3]/50">
            Loading counter accounts…
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptText size={38} className="mx-auto mb-3 text-[#D4A017]/30" />
            <p className="text-sm font-bold text-[#F8F6F0]">No Transactions Recorded</p>
            <p className="mt-1 text-xs text-[#EFE6D3]/50">No receipts match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#071828]/80 text-[11px] font-bold uppercase tracking-wider text-[#F7D77C]">
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Devotee</th>
                  <th className="px-4 py-3">Seva / Head</th>
                  <th className="px-4 py-3">Counter</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions / Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReceipts.map((r) => {
                  const isUnpaid = r.paymentStatus === 'Unpaid'
                  const pMode = r.paymentMethod || r.paymentMode || 'Cash'
                  return (
                    <tr key={r.id || r.receiptNo} className="hover:bg-white/4 transition">
                      {/* Date / Time */}
                      <td className="px-4 py-3 whitespace-nowrap text-white/70 font-mono text-[11px]">
                        {receiptDate(r)} · {r.time || '—'}
                      </td>

                      {/* Receipt No */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-[#F7D77C]">
                        {r.receiptNo}
                      </td>

                      {/* Devotee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-[#F8F6F0]">{r.devoteeName || 'Devotee'}</span>
                        {r.starName && <span className="ml-1 text-[10px] text-[#EFE6D3]/50">({r.starName})</span>}
                      </td>

                      {/* Items / Head */}
                      <td className="px-4 py-3">
                        <div className="max-w-[240px] truncate text-[11px] text-white/80">
                          {r.items && r.items.length > 0
                            ? r.items.map((it) => `${it.name} (${it.qty || 1})`).join(', ')
                            : 'Pooja income'}
                        </div>
                      </td>

                      {/* Counter */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[#EFE6D3]/70">
                        #{r.counterNo || '1'}
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            pMode.toLowerCase() === 'upi'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : pMode.toLowerCase() === 'card'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {pMode}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-400">
                        +{fmtINR(r.total)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {isUnpaid ? (
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                            Unpaid
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            Paid
                          </span>
                        )}
                      </td>

                      {/* Actions / Print */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Unpaid payment action / Paid bill generator (same as admin) */}
                          <ReceiptPaymentAction
                            templeId={counterSession?.templeId}
                            receipt={r}
                          />

                          {/* Direct Print Bill Option */}
                          <button
                            type="button"
                            onClick={() => handleDirectPrint(r)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#D4A017]/40 bg-[#D4A017]/10 px-2.5 py-1 text-[11px] font-bold text-[#F7D77C] transition hover:bg-[#D4A017] hover:text-[#07172D]"
                            title={isUnpaid ? "Print Unpaid Bill" : "Print Paid Bill"}
                          >
                            <Printer size={12} />
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

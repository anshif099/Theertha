import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  IndianRupee,
  Printer,
  ReceiptText,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import ReceiptPaymentAction from './ReceiptPaymentAction.jsx'
import { useReceiptPaymentUpdates, patchReceiptList } from '../lib/useReceiptPaymentUpdates.js'
import { loadTodayReceipts } from '../lib/settingsStore.js'

function fmtINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
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

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CounterScheduleView({ counterSession, onPrintReceipt }) {
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [counterFilter, setCounterFilter] = useState('all') // 'all' | 'this'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'paid' | 'unpaid'

  useReceiptPaymentUpdates(({ templeId, receipt }) => {
    if (templeId === counterSession?.templeId) {
      setBookings((list) => patchReceiptList(list, receipt))
    }
  })

  useEffect(() => {
    if (!counterSession?.templeId) return
    setLoading(true)
    loadTodayReceipts(counterSession.templeId, scheduleDate)
      .then((list) => {
        const sorted = [...list].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        setBookings(sorted)
      })
      .catch((err) => {
        console.error('Failed to load daily schedule:', err)
      })
      .finally(() => setLoading(false))
  }, [counterSession?.templeId, scheduleDate])

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Counter filter
      if (counterFilter === 'this') {
        const matchCounter =
          (b.counterId && b.counterId === counterSession?.counterId) ||
          (b.counterNo && String(b.counterNo) === String(counterSession?.counterNo))
        if (!matchCounter) return false
      }

      // Status filter
      if (statusFilter === 'paid' && b.paymentStatus === 'Unpaid') return false
      if (statusFilter === 'unpaid' && b.paymentStatus !== 'Unpaid') return false

      // Search filter
      if (searchText.trim()) {
        const q = searchText.toLowerCase().trim()
        const matchReceipt = b.receiptNo?.toLowerCase().includes(q)
        const matchDevotee = b.devoteeName?.toLowerCase().includes(q)
        const matchStar = b.starName?.toLowerCase().includes(q)
        const matchMobile = b.mobile?.includes(q)
        const matchPriest = b.priestName?.toLowerCase().includes(q)
        const matchItems = b.items && b.items.some((item) => item.name?.toLowerCase().includes(q))
        return matchReceipt || matchDevotee || matchStar || matchMobile || matchPriest || matchItems
      }

      return true
    })
  }, [bookings, counterFilter, statusFilter, searchText, counterSession])

  // Compute stats based on current date
  const stats = useMemo(() => {
    let total = bookings.length
    let paid = 0
    let unpaid = 0
    let collection = 0

    bookings.forEach((b) => {
      if (b.paymentStatus === 'Unpaid') {
        unpaid += 1
      } else {
        paid += 1
        collection += Number(b.total || 0)
      }
    })

    return { total, paid, unpaid, collection }
  }, [bookings])

  function handlePrintSchedule() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print schedule report.')
      return
    }

    const rowsHtml = filteredBookings
      .map(
        (b, i) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px;">${i + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; font-weight: bold;">${b.time || '—'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; font-family: monospace;">${b.receiptNo || '—'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px;"><strong>${b.devoteeName || '—'}</strong><br/><span style="color: #666; font-size: 10px;">${b.mobile || ''}</span></td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px;">${b.starName || '—'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px;">${(b.items || []).map((it) => `${it.name} (${it.qty || 1})`).join(', ') || '—'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px;">Ctr #${b.counterNo || '1'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; font-weight: bold; text-align: right;">₹${Number(b.total || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; text-align: center; color: ${b.paymentStatus === 'Unpaid' ? '#c00' : '#080'}; font-weight: bold;">${b.paymentStatus || 'Paid'}</td>
        </tr>
      `,
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Pooja Schedule - ${counterSession?.templeName || 'Temple'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h2, h3 { text-align: center; margin: 4px 0; }
            .header-box { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f0f0f0; padding: 8px; font-size: 11px; text-align: left; border-bottom: 2px solid #bbb; text-transform: uppercase; }
            .summary { margin-top: 16px; display: flex; justify-content: flex-end; gap: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header-box">
            <h2>${counterSession?.templeName || 'Temple'}</h2>
            <h3>DAILY POOJA & OFFERING SCHEDULE</h3>
            <div class="meta">
              <div><strong>Schedule Date:</strong> ${fmtDate(scheduleDate)}</div>
              <div><strong>Printed By:</strong> Counter #${counterSession?.counterNo} (${counterSession?.counterName})</div>
              <div><strong>Total Poojas:</strong> ${filteredBookings.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>Receipt</th>
                <th>Devotee Name</th>
                <th>Star</th>
                <th>Pooja Item(s)</th>
                <th>Counter</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No poojas scheduled for this date.</td></tr>'}
            </tbody>
          </table>
          <div class="summary">
            <div>Total Bookings: ${stats.total}</div>
            <div>Paid: ${stats.paid}</div>
            <div>Unpaid: ${stats.unpaid}</div>
            <div>Total Collection: ₹${stats.collection.toLocaleString('en-IN')}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Bar: Title + Date Picker + Actions ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#D4A017]/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A017]/15 text-[#F7D77C]">
              <CalendarDays size={18} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-[#F8F6F0]">
                Daily Pooja Schedule
              </h1>
              <p className="text-xs text-[#EFE6D3]/60">
                Live pooja bookings, timings, and devotee schedule for {counterSession?.templeName || 'Temple'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/6 px-3 py-2">
            <CalendarDays size={14} className="text-[#F7D77C]" />
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#F8F6F0] outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>

          {/* Quick Date Shortcuts */}
          <button
            type="button"
            onClick={() => setScheduleDate(new Date().toISOString().slice(0, 10))}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              scheduleDate === new Date().toISOString().slice(0, 10)
                ? 'border-[#D4A017] bg-[#D4A017]/20 text-[#F7D77C]'
                : 'border-white/10 bg-white/5 text-[#EFE6D3]/70 hover:bg-white/10'
            }`}
          >
            Today
          </button>

          {/* Export / Print */}
          <button
            type="button"
            onClick={handlePrintSchedule}
            disabled={filteredBookings.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#D4A017] px-3.5 py-2 text-xs font-bold text-[#07172D] transition hover:bg-[#F7D77C] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Printer size={14} />
            Print Schedule
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0B1F3A]/70 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#EFE6D3]/50">Total Bookings</p>
          <p className="mt-1.5 font-display text-2xl font-black text-[#F8F6F0]">{stats.total}</p>
          <p className="mt-1 text-[10px] text-[#EFE6D3]/40">For {fmtDate(scheduleDate)}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">Paid Bookings</p>
          <p className="mt-1.5 font-display text-2xl font-black text-emerald-400">{stats.paid}</p>
          <p className="mt-1 text-[10px] text-emerald-300/60">Confirmed & collected</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Unpaid / Reserved</p>
          <p className="mt-1.5 font-display text-2xl font-black text-amber-400">{stats.unpaid}</p>
          <p className="mt-1 text-[10px] text-amber-300/60">Pending payment</p>
        </div>

        <div className="rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/10 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#F7D77C]/80">Total Collections</p>
          <p className="mt-1.5 font-display text-2xl font-black text-[#F7D77C]">{fmtINR(stats.collection)}</p>
          <p className="mt-1 text-[10px] text-[#F7D77C]/60">All counters combined</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B1F3A]/60 p-3">
        {/* Search */}
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#071828] px-3 py-2 text-xs">
          <Search size={14} className="text-[#EFE6D3]/40" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search devotee, star, receipt #, or pooja item…"
            className="w-full bg-transparent text-xs text-[#F8F6F0] outline-none placeholder:text-[#EFE6D3]/35"
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')} className="text-[#EFE6D3]/50 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Counter Scope Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#EFE6D3]/50">Counter:</span>
          <select
            value={counterFilter}
            onChange={(e) => setCounterFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#071828] px-3 py-1.5 text-xs font-semibold text-[#F8F6F0] outline-none cursor-pointer"
          >
            <option value="all">All Counters</option>
            <option value="this">My Counter (#{counterSession?.counterNo})</option>
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
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-[#EFE6D3]/50">
          Showing <strong className="text-[#F7D77C]">{filteredBookings.length}</strong> poojas
        </span>
      </div>

      {/* ── Schedule Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#D4A017]/18 bg-[#0B1F3A]/70 shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-[#EFE6D3]/50">
            Loading daily pooja schedule…
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays size={38} className="mx-auto mb-3 text-[#D4A017]/30" />
            <p className="text-sm font-bold text-[#F8F6F0]">No Poojas Scheduled</p>
            <p className="mt-1 text-xs text-[#EFE6D3]/50">
              No matching bookings found for {fmtDate(scheduleDate)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#071828]/80 text-[11px] font-bold uppercase tracking-wider text-[#F7D77C]">
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Receipt No</th>
                  <th className="px-4 py-3.5">Devotee Name</th>
                  <th className="px-4 py-3.5">Nakshatra / Star</th>
                  <th className="px-4 py-3.5">Pooja Item(s)</th>
                  <th className="px-4 py-3.5">Counter</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((b) => {
                  const isUnpaid = b.paymentStatus === 'Unpaid'
                  return (
                    <tr key={b.id || b.receiptNo} className="hover:bg-white/4 transition">
                      {/* Scheduled Time */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-[#F7D77C]">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#D4A017]/70" />
                          {b.time || '06:00 AM'}
                        </span>
                      </td>

                      {/* Receipt No */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-white/80">
                        {b.receiptNo}
                      </td>

                      {/* Devotee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-[#F8F6F0]">{b.devoteeName || 'Devotee'}</div>
                        {b.mobile && <div className="text-[10px] text-[#EFE6D3]/45">{b.mobile}</div>}
                      </td>

                      {/* Star */}
                      <td className="px-4 py-3 whitespace-nowrap text-[#EFE6D3]/80 font-medium">
                        {b.starName || '—'}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <div className="max-w-[260px]">
                          {b.items && b.items.length > 0 ? (
                            b.items.map((it, idx) => (
                              <span
                                key={idx}
                                className="mr-1.5 inline-block rounded bg-white/6 px-1.5 py-0.5 text-[11px] font-medium text-white/90"
                              >
                                {it.name} {it.qty > 1 ? `× ${it.qty}` : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#EFE6D3]/40">General Pooja</span>
                          )}
                        </div>
                      </td>

                      {/* Counter */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[#EFE6D3]/70">
                        #{b.counterNo || '1'}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-[#F8F6F0]">
                        {fmtINR(b.total)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {isUnpaid ? (
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                            Unpaid
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            Paid ({b.paymentMethod || 'Cash'})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isUnpaid && (
                            <ReceiptPaymentAction
                              templeId={counterSession?.templeId}
                              receipt={b}
                              compact
                            />
                          )}
                          {onPrintReceipt && (
                            <button
                              type="button"
                              onClick={() => onPrintReceipt(b)}
                              className="rounded border border-white/10 bg-white/5 p-1 text-[#EFE6D3]/70 hover:bg-white/10 hover:text-white transition"
                              title="Print Receipt"
                            >
                              <Printer size={12} />
                            </button>
                          )}
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

import ReceiptPaymentAction from '../components/ReceiptPaymentAction.jsx'
import { useReceiptPaymentUpdates, patchReceiptList } from '../lib/useReceiptPaymentUpdates.js'
import { useEffect, useState } from 'react'
import { ArrowLeft, Download, LogIn, ReceiptText } from 'lucide-react'
import { hasAdminSession } from '../lib/adminSession.js'
import { getTempleSession } from '../lib/templeSession.js'
import { loadRegisteredTemples } from '../lib/templeStore.js'
import { loadCounters } from '../lib/counterStore.js'
import { loadAllReceipts } from '../lib/settingsStore.js'
import { toAppUrl } from '../lib/router.js'
import { downloadCounterLedgerPdf } from '../lib/counterLedgerPdf.js'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`
const controlClass = 'rounded-lg border border-white/15 bg-[#1E1F25] px-4 py-2 text-sm'

export default function CounterLedgerPage({ superAdminOnly = false }) {
  const [admin] = useState(hasAdminSession)
  const [session] = useState(getTempleSession)
  const authorized = admin || (!superAdminOnly && Boolean(session?.id))
  const [counters, setCounters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const params = new URLSearchParams(window.location.search)
  const templeId = params.get('templeId')
  const counterId = params.get('counterId')
  const selected = counters.find(counter => counter.templeId === templeId && counter.id === counterId)
  const listPath = superAdminOnly ? '/superadmin/counters' : '/temple/counter'

  useEffect(() => {
    if (!authorized) return
    let active = true
    async function load() {
      try {
        const temples = admin ? await loadRegisteredTemples() : [session]
        const groups = await Promise.all(temples.map(async (temple) => {
          const list = await loadCounters(temple.id)
          return list.map(counter => ({ ...counter, templeId: temple.id, templeName: temple.name }))
        }))
        if (active) setCounters(groups.flat())
      } catch {
        if (active) setError('Unable to load counters. Please refresh to try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [authorized, admin, session])

  if (!authorized) return <main className="p-8">Please <a href={toAppUrl(superAdminOnly ? '/superadmin' : '/temple-login')} className="underline">sign in as an administrator</a> to view counter ledgers.</main>

  const visibleCounters = counters.filter(counter => `${counter.name} ${counter.number} ${counter.loginId} ${counter.templeName}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <main className="min-h-screen bg-[#141519] text-[#F8F6F0]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-6 sm:px-10">
        <div>
          <a href={toAppUrl(selected ? listPath : admin ? '/superadmin' : '/temple/dashboard')} className="mb-3 inline-flex items-center gap-2 text-sm text-[#F7D77C]"><ArrowLeft size={16} />{selected ? 'All counters' : 'Dashboard'}</a>
          <h1 className="font-display text-3xl font-bold">{selected ? `${selected.name} — Full Ledger` : 'All Counters'}</h1>
          <p className="mt-2 text-sm text-white/50">{selected ? `${selected.templeName} · Counter ${selected.number} · ${selected.loginId}` : 'Choose a counter to view its complete receipt history.'}</p>
        </div>
        <a href={toAppUrl('/temple/counter/login')} className="inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-3 font-bold text-[#07172D]"><LogIn size={18} />Counter Login</a>
      </header>
      <div className="mx-auto max-w-7xl p-6 sm:p-10">
        {loading ? <p role="status">Loading counters…</p> : error ? <p role="alert">{error}</p> : counterId && !selected ? <p role="alert">This counter is not available for your administrator account. <a className="underline" href={toAppUrl(listPath)}>View counters</a></p> : selected ? <CounterLedger key={`${selected.templeId}/${selected.id}`} counter={selected} /> : <>
          <input aria-label="Search counters" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search counter, temple or login ID" className={`${controlClass} mb-6 w-full max-w-lg`} />
          <p className="mb-4 text-sm text-white/50">{visibleCounters.length} counters</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCounters.map(counter => <a key={`${counter.templeId}/${counter.id}`} href={toAppUrl(`${listPath}?templeId=${encodeURIComponent(counter.templeId)}&counterId=${encodeURIComponent(counter.id)}`)} className="rounded-xl border border-white/10 bg-[#1E1F25] p-6 transition hover:border-[#D4A017]">
              <ReceiptText className="mb-4 text-[#D4A017]" />
              <h2 className="text-lg font-bold">{counter.name || `Counter ${counter.number}`}</h2>
              <p className="mt-2 text-sm text-white/60">{counter.templeName} · Counter {counter.number}</p>
              <p className="mt-2 font-mono text-sm text-white/50">{counter.loginId}</p>
              <p className="mt-5 font-bold text-[#F7D77C]">View full ledger →</p>
            </a>)}
          </div>
          {!visibleCounters.length && <p>No counters found.</p>}
        </>}
      </div>
    </main>
  )
}

function CounterLedger({ counter }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [receipts, setReceipts] = useState([])
  useReceiptPaymentUpdates(({ templeId, receipt }) => { if (templeId === counter.templeId) setReceipts(list => patchReceiptList(list, receipt)) })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('All')
  const [method, setMethod] = useState('All')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => {
    let active = true
    loadAllReceipts(counter.templeId).then(list => {
      if (active) setReceipts(list.filter(receipt => receipt.counterId === counter.id))
    }).catch(() => { if (active) setError('Unable to load this counter ledger. Please refresh to try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [counter.templeId, counter.id])
  const dateOf = receipt => receipt.bookingDate || receipt.dbDate || receipt.dateStr || receipt.savedAt?.slice(0, 10) || ''
  const statusOf = receipt => receipt.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid'
  const methodOf = receipt => receipt.paymentMethod || 'Not recorded'
  const filtered = receipts.filter(receipt => (status === 'All' || statusOf(receipt) === status) && (method === 'All' || methodOf(receipt) === method) && (!from || dateOf(receipt) >= from) && (!to || dateOf(receipt) <= to))
  const paid = filtered.filter(receipt => statusOf(receipt) === 'Paid')
  const unpaid = filtered.filter(receipt => statusOf(receipt) === 'Unpaid')
  const total = list => list.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
  async function downloadPdf() {
    setDownloading(true)
    setDownloadError('')
    try {
      await downloadCounterLedgerPdf({ counter,
        filters: { status, method, from, to },
        totals: { count: filtered.length, amount: money(total(filtered)), paidCount: paid.length, paidAmount: money(total(paid)), unpaidCount: unpaid.length, unpaidAmount: money(total(unpaid)) },
        rows: filtered.map(receipt => [receipt.receiptNo || receipt.id, dateOf(receipt), `${receipt.devoteeName || 'Anonymous'}\n${receipt.mobile || ''}`, receipt.items?.map(item => `${item.name} (${item.qty || 1})`).join(', ') || '—', methodOf(receipt), `${statusOf(receipt)}${receipt.paidOn ? '\nPaid on ' + receipt.paidOn : ''}`, money(receipt.total)]),
      })
    } catch {
      setDownloadError('Unable to download the PDF. Please try again.')
    } finally { setDownloading(false) }
  }
  if (loading) return <p role="status">Loading full ledger…</p>
  if (error) return <p role="alert">{error}</p>
  return <>
    <div className="mb-5 flex justify-end">
      <button type="button" disabled={downloading} onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-lg bg-[#D4A017] px-5 py-3 font-bold text-[#07172D] disabled:opacity-50"><Download size={18} />{downloading ? 'Preparing PDF…' : 'Download PDF'}</button>
    </div>
    {downloadError && <p role="alert" className="mb-4 text-rose-400">{downloadError}</p>}
    <div className="mb-6 flex flex-wrap gap-4">
      <label className="grid gap-2 text-sm">Payment status<select aria-label="Payment status" value={status} onChange={event => setStatus(event.target.value)} className={controlClass}>{['All', 'Paid', 'Unpaid'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Payment method<select aria-label="Payment method" value={method} onChange={event => setMethod(event.target.value)} className={controlClass}>{['All', ...new Set(receipts.map(methodOf))].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-2 text-sm">From date<input type="date" value={from} onChange={event => setFrom(event.target.value)} className={controlClass} /></label>
      <label className="grid gap-2 text-sm">To date<input type="date" value={to} onChange={event => setTo(event.target.value)} className={controlClass} /></label>
      <button className={`${controlClass} self-end`} onClick={() => { setStatus('All'); setMethod('All'); setFrom(''); setTo('') }}>Reset filters</button>
    </div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[['Bookings', filtered], ['Paid', paid], ['Unpaid', unpaid]].map(([label, list]) => <article key={label} className="rounded-xl border border-white/10 bg-[#1E1F25] p-5"><h2 className="text-white/60">{label}</h2><p className="mt-2 text-3xl font-bold text-[#F7D77C]">{list.length}</p><p className="mt-2">{money(total(list))}</p></article>)}
    </div>
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1E1F25]">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead><tr>{['Receipt', 'Date', 'Devotee', 'Seva / Offering', 'Payment method', 'Status', 'Amount'].map(label => <th key={label} className="p-4 text-[#F7D77C]">{label}</th>)}</tr></thead>
        <tbody>{filtered.map((receipt, index) => <tr key={`${receipt.id}-${index}`} className="border-t border-white/10">
          <td className="p-4 font-mono">{receipt.receiptNo || receipt.id}</td><td className="p-4">{dateOf(receipt)}</td><td className="p-4">{receipt.devoteeName || 'Anonymous'}<p className="text-white/50">{receipt.mobile}</p></td><td className="p-4">{receipt.items?.map(item => `${item.name} (${item.qty || 1})`).join(', ') || '—'}</td><td className="p-4">{methodOf(receipt)}</td><td className={`p-4 ${statusOf(receipt) === 'Unpaid' ? 'text-rose-400' : 'text-emerald-400'}`}>{statusOf(receipt)}<ReceiptPaymentAction receipt={receipt} templeId={counter.templeId} /></td><td className="p-4 font-bold">{money(receipt.total)}</td>
        </tr>)}{!filtered.length && <tr><td colSpan={7} className="p-10 text-center text-white/50">No receipts match this counter and the selected filters.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-4 text-sm text-white/50">Showing {filtered.length} of {receipts.length} receipts · All dates are included unless filtered.</p>
  </>
}

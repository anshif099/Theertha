import { useState } from 'react'
import { createPortal } from 'react-dom'
import { canUpdateReceipt, localPaymentDate, markReceiptPaid, resolvePaymentReceipt } from '../lib/receiptPayments.js'
import { navigateTo } from '../lib/router.js'

export default function ReceiptPaymentAction({ receipt: originalReceipt, templeId }) {
  const [resolved, setResolved] = useState(null)
  const [open, setOpen] = useState(false)
  const receipt = (open && resolved) || originalReceipt
  const [method, setMethod] = useState('Cash')
  const [paidOn, setPaidOn] = useState(localPaymentDate)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const id = templeId || receipt?.templeId
  if (!receipt || !canUpdateReceipt(id)) return null
  async function save(print) {
    if (saving) return
    setSaving(true); setError('')
    try {
      const updated = receipt.paymentStatus === 'Unpaid'
        ? await markReceiptPaid(id, receipt, { paymentMethod: method, paidOn })
        : await resolvePaymentReceipt(id, receipt)
      setResolved(updated)
      if (print) {
        sessionStorage.setItem('theertha-last-receipt', JSON.stringify(updated))
        navigateTo('/temple/counter/receipt-preview')
      }
      setOpen(false)
    } catch (err) { setError(err.message || 'Payment could not be saved. Please try again.') }
    finally { setSaving(false) }
  }
  return <>
    {receipt.paidOn && <span className="block text-[10px]">Paid on {receipt.paidOn}</span>}
    <button type="button" onClick={async event => {
      event.stopPropagation(); setError(''); setOpen(true); setSaving(true)
      try { setResolved(await resolvePaymentReceipt(id, originalReceipt)) }
      catch (err) { setError(err.message) }
      finally { setSaving(false) }
    }} className="no-print ml-2 rounded border border-[#D4A017]/40 px-2 py-1 text-[11px] font-bold text-[#9C7414] hover:bg-[#D4A017]/10">
      {receipt.paymentStatus === 'Unpaid' ? 'Edit payment' : 'Paid bill'}
    </button>
    {open && createPortal(<div className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={event => event.stopPropagation()}>
      <section role="dialog" aria-modal="true" aria-label="Receipt payment" className="w-full max-w-md rounded-xl bg-white p-6 text-[#0B1F3A] shadow-2xl">
        <h2 className="text-xl font-bold">{receipt.paymentStatus === 'Unpaid' ? 'Record payment' : 'Generate paid bill'}</h2>
        <p className="mt-2 text-sm">Receipt {receipt.receiptNo} · ₹{Number(receipt.total || 0).toLocaleString('en-IN')}</p>
        {receipt.paymentStatus === 'Unpaid' ? <div className="my-4 grid gap-4">
          <label className="grid gap-1 text-sm">Payment method<select aria-label="Payment method" value={method} onChange={event => setMethod(event.target.value)} disabled={saving} className="rounded border p-2">{['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Payment received on<input aria-label="Payment received on" type="date" required max={localPaymentDate()} value={paidOn} onChange={event => setPaidOn(event.target.value)} disabled={saving} className="rounded border p-2" /></label>
          <p className="text-xs text-slate-500">The booking date stays unchanged. The payment is recorded on the date above.</p>
        </div> : <p className="my-4 text-sm">Paid {receipt.paidOn || ''} · {receipt.paymentMethod || 'Cash'}</p>}
        {error && <p role="alert" className="my-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded border px-3 py-2 text-sm">Cancel</button>
          {receipt.paymentStatus === 'Unpaid' && <button type="button" disabled={saving || !paidOn} onClick={() => save(false)} className="rounded border px-3 py-2 text-sm">Save as paid</button>}
          <button type="button" disabled={saving || !paidOn} onClick={() => save(true)} className="rounded bg-[#D4A017] px-3 py-2 text-sm font-bold disabled:opacity-50">{saving ? 'Saving…' : receipt.paymentStatus === 'Unpaid' ? 'Save & generate paid bill' : 'Generate paid bill'}</button>
        </div>
      </section>
    </div>, document.body)}
  </>
}

import { useEffect } from 'react'
import { PAYMENT_UPDATED } from './receiptPayments.js'

export function useReceiptPaymentUpdates(onUpdate) {
  useEffect(() => {
    const local = event => onUpdate(event.detail)
    const remote = event => {
      if (event.key !== PAYMENT_UPDATED || !event.newValue) return
      try { onUpdate(JSON.parse(event.newValue)) } catch { /* Ignore malformed browser data. */ }
    }
    window.addEventListener(PAYMENT_UPDATED, local)
    window.addEventListener('storage', remote)
    return () => { window.removeEventListener(PAYMENT_UPDATED, local); window.removeEventListener('storage', remote) }
  }, [onUpdate])
}

export function patchReceiptList(list, receipt) {
  return list.map(item => item.id === receipt.id ? { ...item, ...receipt } : item)
}
export function patchDevoteePayment(devotee, receipt) {
  if (!devotee) return devotee
  return { ...devotee, receipts: Object.fromEntries(Object.entries(devotee.receipts || {}).map(([id, item]) => [id,
    id === receipt.id || (item.receiptNo && item.receiptNo === receipt.receiptNo)
      ? { ...item, paymentStatus: receipt.paymentStatus, paymentMethod: receipt.paymentMethod, paidOn: receipt.paidOn, paidAt: receipt.paidAt }
      : item,
  ])) }
}

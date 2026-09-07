import { get, ref, update } from 'firebase/database'
import { realtimeDb } from './firebase.js'
import { loadAllReceipts } from './settingsStore.js'
import { hasAdminSession } from './adminSession.js'
import { getTempleSession } from './templeSession.js'

export const PAYMENT_UPDATED = 'theertha-receipt-payment-updated'
export function localPaymentDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function canUpdateReceipt(templeId) {
  try {
    const counter = JSON.parse(sessionStorage.getItem('theertha-counter-session') || 'null')
    return Boolean(templeId && (hasAdminSession() || getTempleSession()?.id === templeId || counter?.templeId === templeId))
  } catch { return false }
}
export async function resolvePaymentReceipt(templeId, receipt) {
  if (!canUpdateReceipt(templeId)) throw new Error('Sign in to this temple or counter to update payment.')
  if (!receipt?.id && !receipt?.receiptNo) throw new Error('This receipt has no reference number. Please open the original booking.')
  const list = await loadAllReceipts(templeId)
  const found = list.find(item => receipt.id ? item.id === receipt.id : item.receiptNo === receipt.receiptNo)
  if (!found) throw new Error('The original receipt could not be found. Please refresh and try again.')
  return { ...found, templeId }
}
export async function markReceiptPaid(templeId, receipt, { paymentMethod, paidOn }) {
  if (!paymentMethod || !/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || paidOn > localPaymentDate() || new Date(`${paidOn}T12:00:00Z`).toISOString().slice(0, 10) !== paidOn) {
    throw new Error('Choose a valid payment method and a payment date no later than today.')
  }
  const found = await resolvePaymentReceipt(templeId, receipt)
  const path = `registeredTemples/${templeId}/receipts/${found.dbDate || found.bookingDate}/${found.id}`
  const snapshot = await get(ref(realtimeDb, path))
  const current = snapshot.exists() ? { ...snapshot.val(), templeId, id: found.id, dbDate: found.dbDate || found.bookingDate } : found
  // Retrying a completed update must not change its original payment date.
  if (current.paymentStatus !== 'Unpaid') {
    cacheReceipt(templeId, current)
    return current
  }
  const payment = { paymentStatus: 'Paid', paymentMethod, paidOn, paidAt: new Date().toISOString() }
  const saved = { ...current, ...payment, templeId }
  const changes = {}
  const mirrorPaths = [path, `publicReceipts/${found.id}`]
  if (current.receiptNo) mirrorPaths.push(`publicReceipts/${String(current.receiptNo).replace(/[.#$[\]]/g, '_')}`)
  for (const mirror of mirrorPaths) changes[mirror] = saved

  // Update every person's copy of this bill without changing their individual totals.
  const devoteesPath = `registeredTemples/${templeId}/devotees`
  const devoteesSnapshot = await get(ref(realtimeDb, devoteesPath))
  const devotees = devoteesSnapshot.val() || {}
  for (const [mobile, devotee] of Object.entries(devotees)) {
    for (const [id, history] of Object.entries(devotee.receipts || {})) {
      if (id === found.id || (history.receiptNo && history.receiptNo === current.receiptNo)) {
        for (const [key, value] of Object.entries(payment)) changes[`${devoteesPath}/${mobile}/receipts/${id}/${key}`] = value
      }
    }
  }
  // A single server update keeps the original bill, verification copies and history consistent.
  // Errors are surfaced to the operator; no local-only "Paid" success is shown.
  await update(ref(realtimeDb), changes)
  try {
    const localKey = `theertha-devotees-${templeId}`
    const local = JSON.parse(localStorage.getItem(localKey) || '{}')
    for (const devotee of Object.values(local)) {
      for (const [id, history] of Object.entries(devotee.receipts || {})) {
        if (id === found.id || (history.receiptNo && history.receiptNo === current.receiptNo)) Object.assign(history, payment)
      }
    }
    localStorage.setItem(localKey, JSON.stringify(local))
  } catch { /* The server update remains authoritative if browser storage is full. */ }
  cacheReceipt(templeId, saved)
  return saved
}
function cacheReceipt(templeId, receipt) {
  try {
    const key = `theertha-receipts-${templeId}`
    const cached = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([receipt, ...cached.filter(item => item.id !== receipt.id)]))
    localStorage.setItem(PAYMENT_UPDATED, JSON.stringify({ templeId, receipt, time: Date.now() }))
    const preview = JSON.parse(sessionStorage.getItem('theertha-last-receipt') || 'null')
    if (preview?.id === receipt.id && preview?.templeId === templeId) sessionStorage.setItem('theertha-last-receipt', JSON.stringify(receipt))
  } catch { /* UI listeners still receive the successfully saved receipt. */ }
  window.dispatchEvent(new CustomEvent(PAYMENT_UPDATED, { detail: { templeId, receipt } }))
}

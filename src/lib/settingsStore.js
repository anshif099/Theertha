import { get, push, ref, remove, runTransaction, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const TEMPLE_DB_PATH = 'registeredTemples'

/* ══════════════════════════════════════════════
   Stars (Nakshatra)
══════════════════════════════════════════════ */

export async function loadStars(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, s]) => s && typeof s === 'object')
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function addStar(templeId, name) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars`))
  const record = { name: name.trim(), createdAt: new Date().toISOString() }
  await set(newRef, record)
  return { id: newRef.key, ...record }
}

export async function deleteStar(templeId, starId) {
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars/${starId}`))
}

/* ══════════════════════════════════════════════
   Quick Add Items
══════════════════════════════════════════════ */

export async function loadQuickItems(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, item]) => item && typeof item === 'object')
    .map(([id, item]) => ({ id, ...item }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function addQuickItem(templeId, { name, amount }) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems`))
  const record = {
    name: name.trim(),
    amount: Number(amount),
    createdAt: new Date().toISOString(),
  }
  await set(newRef, record)
  return { id: newRef.key, ...record }
}

export async function deleteQuickItem(templeId, itemId) {
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems/${itemId}`))
}

/* ══════════════════════════════════════════════
   Receipt Auto-number (atomic increment per counter)
══════════════════════════════════════════════ */

export async function getNextReceiptNo(templeId, counterId) {
  const seqRef = ref(
    realtimeDb,
    `${TEMPLE_DB_PATH}/${templeId}/counters/${counterId}/receiptSeq`,
  )

  let newSeq = 1
  await runTransaction(seqRef, (current) => {
    newSeq = (current || 0) + 1
    return newSeq
  })

  const year = new Date().getFullYear()
  return `RC-${year}-${String(newSeq).padStart(6, '0')}`
}

/* ══════════════════════════════════════════════
   Receipts  (stored by date for easy daily queries)
══════════════════════════════════════════════ */

function todayStr() {
  return new Date().toISOString().slice(0, 10) // "2026-05-30"
}

/**
 * Save a completed receipt under registeredTemples/{id}/receipts/{date}/{receiptId}
 */
export async function saveReceipt(templeId, receipt) {
  const date = todayStr()
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/receipts/${date}`))
  const record = { ...receipt, id: newRef.key, savedAt: new Date().toISOString(), dbDate: date }
  await set(newRef, record)
  return record
}

/**
 * Load all receipts for a given date (defaults to today).
 */
export async function loadTodayReceipts(templeId, dateStr) {
  const d = dateStr || todayStr()
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/receipts/${d}`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, r]) => r && typeof r === 'object')
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0))
}

/**
 * Load a single receipt from registeredTemples/{templeId}/receipts/{date}/{receiptId}
 */
export async function loadSingleReceipt(templeId, dateStr, receiptId) {
  const snapshot = await get(ref(realtimeDb, `registeredTemples/${templeId}/receipts/${dateStr}/${receiptId}`))
  if (!snapshot.exists()) return null
  return snapshot.val()
}


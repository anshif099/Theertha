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
  const date = receipt.bookingDate || todayStr()
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

/* ══════════════════════════════════════════════
   Expenses (stored under registeredTemples/{templeId}/expenses)
   ══════════════════════════════════════════════ */

export async function getNextVoucherNo(templeId) {
  const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenseSeq`)
  let newSeq = 1
  await runTransaction(seqRef, (current) => {
    newSeq = (current || 0) + 1
    return newSeq
  })
  const year = new Date().getFullYear()
  return `EXP-${year}-${String(newSeq).padStart(5, '0')}`
}

export async function saveExpense(templeId, expense) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenses`))
  const record = { ...expense, id: newRef.key, createdAt: new Date().toISOString() }
  await set(newRef, record)
  return record
}

export async function loadExpenses(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenses`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, exp]) => exp && typeof exp === 'object')
    .map(([id, exp]) => ({ id, ...exp }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

export async function loadAllReceipts(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/receipts`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  const list = []
  Object.entries(val).forEach(([dateStr, dateObj]) => {
    if (dateObj && typeof dateObj === 'object') {
      Object.entries(dateObj).forEach(([id, r]) => {
        if (r && typeof r === 'object') {
          list.push({ id, dateStr, ...r })
        }
      })
    }
  })
  return list
}


/* ══════════════════════════════════════════════
   Account Transactions (stored under registeredTemples/{templeId}/accounts)
   ══════════════════════════════════════════════ */

export async function saveAccountTransaction(templeId, transaction) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/accounts`))
  const record = { ...transaction, id: newRef.key, createdAt: new Date().toISOString() }
  await set(newRef, record)
  return record
}

export async function loadAccountTransactions(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/accounts`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, txn]) => txn && typeof txn === 'object')
    .map(([id, txn]) => ({ id, ...txn }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

/* ══════════════════════════════════════════════
   Pooja Status (stored under registeredTemples/{templeId}/poojaStatus/{dateStr})
   ══════════════════════════════════════════════ */

export async function updatePoojaStatus(templeId, dateStr, poojaKey, status) {
  const d = dateStr || new Date().toISOString().slice(0, 10)
  await set(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/poojaStatus/${d}/${poojaKey}`), status)
}

export async function loadPoojaStatuses(templeId, dateStr) {
  const d = dateStr || new Date().toISOString().slice(0, 10)
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/poojaStatus/${d}`))
  if (!snapshot.exists()) return {}
  return snapshot.val()
}

export async function saveSlotsConfig(templeId, slots) {
  await set(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/slotsConfig`), slots)
}

export async function loadSlotsConfig(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/slotsConfig`))
  if (!snapshot.exists()) return null
  return snapshot.val()
}

/* ══════════════════════════════════════════════
   Priests
══════════════════════════════════════════════ */

export async function loadPriests(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, p]) => p && typeof p === 'object')
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function addPriest(templeId, { name, salary, phone, address, role }) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests`))
  const record = {
    name: name.trim(),
    salary: Number(salary) || 0,
    phone: phone.trim(),
    address: address.trim(),
    role: role || 'Priest',
    createdAt: new Date().toISOString(),
  }
  await set(newRef, record)
  return { id: newRef.key, ...record }
}

export async function deletePriest(templeId, priestId) {
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests/${priestId}`))
}

/* ══════════════════════════════════════════════
   Devotees
══════════════════════════════════════════════ */

export async function saveDevotee(templeId, { devoteeName, mobile, starId, starName, receiptId, receiptNo, total, paymentStatus }) {
  if (!mobile) return null
  const path = `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobile.trim()}`
  const snap = await get(ref(realtimeDb, path))
  let devotee = {
    devoteeName: devoteeName.trim(),
    mobile: mobile.trim(),
    starId: starId || '',
    starName: starName || '',
    lastActive: new Date().toISOString(),
    receipts: {}
  }
  if (snap.exists()) {
    const existing = snap.val()
    devotee = {
      ...existing,
      devoteeName: devoteeName.trim(),
      starId: starId || existing.starId || '',
      starName: starName || existing.starName || '',
      lastActive: new Date().toISOString(),
    }
    if (!devotee.receipts) devotee.receipts = {}
  }
  if (receiptId) {
    devotee.receipts[receiptId] = {
      receiptNo,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      total: Number(total),
      paymentStatus // 'Paid' or 'Unpaid'
    }
  }
  await set(ref(realtimeDb, path), devotee)
  return devotee
}

export async function getDevoteeByMobile(templeId, mobile) {
  if (!mobile) return null
  const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobile.trim()}`))
  if (!snap.exists()) return null
  return snap.val()
}

export async function loadDevotees(templeId) {
  const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees`))
  if (!snap.exists()) return []
  const val = snap.val()
  return Object.entries(val)
    .filter(([, d]) => d && typeof d === 'object')
    .map(([mobile, d]) => ({ mobile, ...d }))
    .sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0))
}

export async function deleteDevotee(templeId, mobile) {
  if (!mobile) return
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobile.trim()}`))
}

/* ══════════════════════════════════════════════
   Donations / Sambavana
══════════════════════════════════════════════ */

export async function getNextDonationNo(templeId) {
  const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donationSeq`)
  let newSeq = 1
  await runTransaction(seqRef, (current) => {
    newSeq = (current || 0) + 1
    return newSeq
  })
  const year = new Date().getFullYear()
  return `DON-${year}-${String(newSeq).padStart(5, '0')}`
}

export async function saveDonation(templeId, donation) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations`))
  const record = { ...donation, id: newRef.key, createdAt: new Date().toISOString() }
  await set(newRef, record)
  return record
}

export async function loadDonations(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, d]) => d && typeof d === 'object')
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
}

export async function updateDonation(templeId, donationId, updatedFields) {
  const donRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations/${donationId}`)
  const snap = await get(donRef)
  if (!snap.exists()) return null
  const existing = snap.val()
  const updated = { ...existing, ...updatedFields, updatedAt: new Date().toISOString() }
  await set(donRef, updated)
  return updated
}

export async function deleteDonation(templeId, donationId) {
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations/${donationId}`))
}



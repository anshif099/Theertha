import { get, push, ref, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'
import { saveAccountTransaction } from './settingsStore.js'

const DB = 'registeredTemples'

/**
 * Fetches all fixed deposits for a specific temple from the Firebase database.
 * @param {string} templeId - The ID of the registered temple.
 * @returns {Promise<Array>} List of fixed deposits sorted by joinedAt descending.
 */
export async function loadFixedDeposits(templeId) {
  const snap = await get(ref(realtimeDb, `${DB}/${templeId}/fixedDeposits`))
  if (!snap.exists()) return []
  const val = snap.val()
  return Object.entries(val)
    .filter(([, fd]) => fd && typeof fd === 'object')
    .map(([id, fd]) => ({ id, ...fd }))
    .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))
}

/**
 * Registers a new devotee fixed deposit. Saves record and automatically logs credit in accounts.
 * @param {string} templeId - The ID of the registered temple.
 * @param {Object} data - Devotee deposit details.
 * @returns {Promise<Object>} The registered record.
 */
export async function registerFixedDeposit(templeId, { devoteeName, amount, purpose }) {
  const newRef = push(ref(realtimeDb, `${DB}/${templeId}/fixedDeposits`))
  const joinedAt = new Date().toISOString()
  const record = {
    devoteeName: devoteeName.trim(),
    amount: Number(amount),
    purpose: purpose.trim(),
    joinedAt,
    status: 'Active',
  }
  await set(newRef, record)

  // Auto post credit transaction to the Accounts ledger!
  const year = new Date().getFullYear()
  const randomNo = Math.floor(100 + Math.random() * 900)
  const voucherNo = `FD-${year}-${randomNo}`

  await saveAccountTransaction(templeId, {
    voucherNo,
    date: joinedAt.slice(0, 10),
    narration: `Fixed Deposit — Devotee: ${devoteeName.trim()} (Purpose: ${purpose.trim()})`,
    head: 'Fixed Deposits',
    type: 'Credit',
    amount: Number(amount),
    status: 'Posted',
  })

  return { id: newRef.key, ...record }
}

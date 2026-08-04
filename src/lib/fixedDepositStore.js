import { get, push, ref, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'
import { saveAccountTransaction } from './settingsStore.js'

const DB = 'registeredTemples'

function getLocalData(key, fallback = []) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export async function loadFixedDeposits(templeId) {
  const localKey = `theertha-fds-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${DB}/${templeId}/fixedDeposits`))
    if (!snap.exists()) return getLocalData(localKey, [])
    const val = snap.val()
    const list = Object.entries(val)
      .filter(([, fd]) => fd && typeof fd === 'object')
      .map(([id, fd]) => ({ id, ...fd }))
      .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load fixed deposits from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function registerFixedDeposit(templeId, { devoteeName, amount, purpose }) {
  const localKey = `theertha-fds-${templeId}`
  const joinedAt = new Date().toISOString()
  const record = {
    devoteeName: devoteeName.trim(),
    amount: Number(amount),
    purpose: purpose.trim(),
    joinedAt,
    status: 'Active',
  }
  let newId = `fd-${Date.now()}`
  try {
    const newRef = push(ref(realtimeDb, `${DB}/${templeId}/fixedDeposits`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to register fixed deposit on DB:', error)
  }

  const registered = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [registered, ...local.filter((f) => f.id !== newId)])

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

  return registered
}

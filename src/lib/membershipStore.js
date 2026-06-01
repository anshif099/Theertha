import { get, push, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'
import { saveAccountTransaction } from './settingsStore.js'

const DB = 'registeredTemples'

export async function loadMembershipConfig(templeId) {
  const snap = await get(ref(realtimeDb, `${DB}/${templeId}/membershipConfig`))
  if (!snap.exists()) {
    return { monthlyAmount: 120, yearlyAmount: 1200 } // Beautiful defaults
  }
  const val = snap.val()
  return {
    monthlyAmount: Number(val.monthlyAmount || 120),
    yearlyAmount: Number(val.yearlyAmount || 1200),
  }
}

export async function saveMembershipConfig(templeId, { monthlyAmount, yearlyAmount }) {
  await set(ref(realtimeDb, `${DB}/${templeId}/membershipConfig`), {
    monthlyAmount: Number(monthlyAmount),
    yearlyAmount: Number(yearlyAmount),
  })
}

export async function loadMemberships(templeId) {
  const snap = await get(ref(realtimeDb, `${DB}/${templeId}/memberships`))
  if (!snap.exists()) return []
  const val = snap.val()
  return Object.entries(val)
    .filter(([, m]) => m && typeof m === 'object')
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))
}

export async function registerMembership(templeId, { devoteeName, address, mobile, plan, amount }) {
  const newRef = push(ref(realtimeDb, `${DB}/${templeId}/memberships`))
  const joinedAt = new Date().toISOString()
  const record = {
    devoteeName: devoteeName.trim(),
    address: address.trim(),
    mobile: mobile.trim(),
    plan, // 'Monthly' or 'Yearly'
    amount: Number(amount),
    joinedAt,
    status: 'Active',
  }
  await set(newRef, record)

  // Auto post to accounts ledger as an elegant journal transaction credit entry!
  const year = new Date().getFullYear()
  const randomNo = Math.floor(100 + Math.random() * 900)
  const voucherNo = `MB-${year}-${randomNo}`
  
  await saveAccountTransaction(templeId, {
    voucherNo,
    date: joinedAt.slice(0, 10),
    narration: `Membership fee (${plan}) — Member: ${devoteeName.trim()} (${mobile.trim()})`,
    head: 'Membership fees',
    type: 'Credit',
    amount: Number(amount),
    status: 'Posted',
  })

  return { id: newRef.key, ...record }
}

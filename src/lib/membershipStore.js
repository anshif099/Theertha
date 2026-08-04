import { get, push, ref, remove, set } from 'firebase/database'
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

export async function loadMembershipConfig(templeId) {
  const localKey = `theertha-membership-cfg-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${DB}/${templeId}/membershipConfig`))
    if (!snap.exists()) {
      return getLocalData(localKey, { monthlyAmount: 120, yearlyAmount: 1200 })
    }
    const val = snap.val()
    const config = {
      monthlyAmount: Number(val.monthlyAmount || 120),
      yearlyAmount: Number(val.yearlyAmount || 1200),
    }
    setLocalData(localKey, config)
    return config
  } catch (error) {
    console.warn('Unable to load membership config from DB:', error)
    return getLocalData(localKey, { monthlyAmount: 120, yearlyAmount: 1200 })
  }
}

export async function saveMembershipConfig(templeId, { monthlyAmount, yearlyAmount }) {
  const localKey = `theertha-membership-cfg-${templeId}`
  const config = {
    monthlyAmount: Number(monthlyAmount),
    yearlyAmount: Number(yearlyAmount),
  }
  try {
    await set(ref(realtimeDb, `${DB}/${templeId}/membershipConfig`), config)
  } catch (error) {
    console.warn('Unable to save membership config to DB:', error)
  }
  setLocalData(localKey, config)
}

export async function loadMemberships(templeId) {
  const localKey = `theertha-memberships-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${DB}/${templeId}/memberships`))
    if (!snap.exists()) return getLocalData(localKey, [])
    const val = snap.val()
    const list = Object.entries(val)
      .filter(([, m]) => m && typeof m === 'object')
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load memberships from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function registerMembership(templeId, { devoteeName, address, mobile, plan, amount }) {
  const localKey = `theertha-memberships-${templeId}`
  const joinedAt = new Date().toISOString()
  const record = {
    devoteeName: devoteeName.trim(),
    address: address.trim(),
    mobile: mobile.trim(),
    plan,
    amount: Number(amount),
    joinedAt,
    status: 'Active',
  }
  let newId = `mb-${Date.now()}`
  try {
    const newRef = push(ref(realtimeDb, `${DB}/${templeId}/memberships`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to register membership on DB:', error)
  }

  const registered = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [registered, ...local.filter((m) => m.id !== newId)])

  // Auto post transaction
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

  return registered
}

export async function loadSingleMembership(templeId, memberId) {
  const localKey = `theertha-memberships-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${DB}/${templeId}/memberships/${memberId}`))
    if (snap.exists()) return { id: memberId, ...snap.val() }
  } catch (error) {
    console.warn('Unable to load single membership from DB:', error)
  }
  const local = getLocalData(localKey, [])
  return local.find((m) => m.id === memberId) || null
}

export async function updateMembership(templeId, memberId, { devoteeName, address, mobile, plan, amount }) {
  const localKey = `theertha-memberships-${templeId}`
  const joinedAt = new Date().toISOString()
  const record = {
    devoteeName: devoteeName.trim(),
    address: address.trim(),
    mobile: mobile.trim(),
    plan,
    amount: Number(amount),
    joinedAt,
    status: 'Active',
  }

  try {
    await set(ref(realtimeDb, `${DB}/${templeId}/memberships/${memberId}`), record)
  } catch (error) {
    console.warn('Unable to update membership on DB:', error)
  }

  const updated = { id: memberId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.map((m) => (m.id === memberId ? updated : m)),
  )
  return updated
}

export async function deleteMembership(templeId, memberId) {
  const localKey = `theertha-memberships-${templeId}`
  try {
    await remove(ref(realtimeDb, `${DB}/${templeId}/memberships/${memberId}`))
  } catch (error) {
    console.warn('Unable to delete membership from DB:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((m) => m.id !== memberId),
  )
}

import { get, push, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

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

/* ── Festival CRUD ── */
export async function loadFestivals(templeId) {
  const localKey = `theertha-festivals-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${DB}/${templeId}/festivals`))
    if (!snap.exists()) return getLocalData(localKey, [])
    const val = snap.val()
    const list = Object.entries(val)
      .filter(([, f]) => f && typeof f === 'object')
      .map(([id, f]) => ({ id, ...f }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load festivals from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function addFestival(templeId, festival) {
  const localKey = `theertha-festivals-${templeId}`
  let newId = `fest-${Date.now()}`
  const record = { ...festival, createdAt: new Date().toISOString() }
  try {
    const newRef = push(ref(realtimeDb, `${DB}/${templeId}/festivals`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to add festival to DB:', error)
  }
  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((f) => f.id !== newId)])
  return saved
}

export async function deleteFestival(templeId, festivalId) {
  const localKey = `theertha-festivals-${templeId}`
  try {
    await remove(ref(realtimeDb, `${DB}/${templeId}/festivals/${festivalId}`))
  } catch (error) {
    console.warn('Unable to delete festival from DB:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((f) => f.id !== festivalId),
  )
}

/* ── Monthly P&L helper ── */
export async function loadMonthPL(templeId, year, month) {
  const pad = String(month).padStart(2, '0')
  const prefix = `${year}-${pad}`

  let income = 0
  let accountIncome = 0
  let accountExpense = 0
  let expenses = 0
  const expenseBreakdown = {}

  try {
    const receiptSnap = await get(ref(realtimeDb, `${DB}/${templeId}/receipts`))
    if (receiptSnap.exists()) {
      const allDates = receiptSnap.val()
      Object.entries(allDates).forEach(([dateStr, dateObj]) => {
        if (!dateStr.startsWith(prefix)) return
        if (!dateObj || typeof dateObj !== 'object') return
        Object.values(dateObj).forEach((r) => {
          if (r && typeof r === 'object') income += Number(r.total || 0)
        })
      })
    }

    const acctSnap = await get(ref(realtimeDb, `${DB}/${templeId}/accounts`))
    if (acctSnap.exists()) {
      const accts = acctSnap.val()
      Object.values(accts).forEach((txn) => {
        if (!txn || typeof txn !== 'object') return
        const txnDate = txn.date || txn.createdAt || ''
        if (!txnDate.startsWith(prefix)) return
        const amt = Number(txn.amount || 0)
        if (txn.type === 'Credit') accountIncome += amt
        else if (txn.type === 'Debit') accountExpense += amt
      })
    }

    const expSnap = await get(ref(realtimeDb, `${DB}/${templeDb}/${templeId}/expenses`))
    if (expSnap.exists()) {
      const exps = expSnap.val()
      Object.values(exps).forEach((exp) => {
        if (!exp || typeof exp !== 'object') return
        const d = exp.date || (exp.createdAt || '').slice(0, 10)
        if (!d.startsWith(prefix)) return
        const amt = Number(exp.amount || 0)
        expenses += amt
        const cat = exp.category || 'Other'
        expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + amt
      })
    }
  } catch (error) {
    console.warn('Unable to compute monthly P&L from DB, checking local storage:', error)
    const localReceipts = getLocalData(`theertha-receipts-${templeId}`, [])
    localReceipts.forEach((r) => {
      const d = r.dbDate || r.bookingDate || ''
      if (d.startsWith(prefix)) income += Number(r.total || 0)
    })

    const localAccounts = getLocalData(`theertha-accounts-${templeId}`, [])
    localAccounts.forEach((txn) => {
      const d = txn.date || txn.createdAt || ''
      if (!d.startsWith(prefix)) return
      const amt = Number(txn.amount || 0)
      if (txn.type === 'Credit') accountIncome += amt
      else if (txn.type === 'Debit') accountExpense += amt
    })

    const localExpenses = getLocalData(`theertha-expenses-${templeId}`, [])
    localExpenses.forEach((exp) => {
      const d = exp.date || (exp.createdAt || '').slice(0, 10)
      if (!d.startsWith(prefix)) return
      const amt = Number(exp.amount || 0)
      expenses += amt
      const cat = exp.category || 'Other'
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + amt
    })
  }

  const totalIncome = income + accountIncome
  const totalExpense = expenses + accountExpense
  const net = totalIncome - totalExpense

  return {
    income: totalIncome,
    receiptIncome: income,
    accountIncome,
    expense: totalExpense,
    expenseBreakdown,
    net,
  }
}

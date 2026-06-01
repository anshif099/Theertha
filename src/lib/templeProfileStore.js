import { get, push, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const DB = 'registeredTemples'

/* ── Festival CRUD ── */
export async function loadFestivals(templeId) {
  const snap = await get(ref(realtimeDb, `${DB}/${templeId}/festivals`))
  if (!snap.exists()) return []
  const val = snap.val()
  return Object.entries(val)
    .filter(([, f]) => f && typeof f === 'object')
    .map(([id, f]) => ({ id, ...f }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export async function addFestival(templeId, festival) {
  const newRef = push(ref(realtimeDb, `${DB}/${templeId}/festivals`))
  const record = { ...festival, id: newRef.key, createdAt: new Date().toISOString() }
  await set(newRef, record)
  return record
}

export async function deleteFestival(templeId, festivalId) {
  await remove(ref(realtimeDb, `${DB}/${templeId}/festivals/${festivalId}`))
}

/* ── Monthly P&L helper ── */
export async function loadMonthPL(templeId, year, month) {
  // month is 1-indexed
  const pad = String(month).padStart(2, '0')
  const prefix = `${year}-${pad}`

  // Income: all receipts for the month
  let income = 0
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

  // Also load account transactions of type Credit for the month
  const acctSnap = await get(ref(realtimeDb, `${DB}/${templeId}/accounts`))
  let accountIncome = 0
  let accountExpense = 0
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

  // Expenses: all expense vouchers for the month
  let expenses = 0
  const expSnap = await get(ref(realtimeDb, `${DB}/${templeId}/expenses`))
  const expenseBreakdown = {}
  if (expSnap.exists()) {
    const exps = expSnap.val()
    Object.values(exps).forEach((exp) => {
      if (!exp || typeof exp === 'object' !== true) return
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

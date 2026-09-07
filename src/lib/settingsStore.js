import { get, push, ref, remove, runTransaction, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const TEMPLE_DB_PATH = 'registeredTemples'

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

export function encodeReceiptPayload(receipt) {
  if (!receipt) return ''
  try {
    const compact = {
      rNo: receipt.receiptNo || '',
      tName: receipt.templeName || 'Temple',
      tDist: receipt.templeDistrict || '',
      tTel: receipt.templeContact || '',
      dName: receipt.devoteeName || 'Devotee',
      mob: receipt.mobile || '',
      star: receipt.starName || '',
      addP: receipt.additionalPersons || [],
      persons: receipt.persons || [],
      rem: receipt.remarks || '',
      items: (receipt.items || []).map((i) => ({ name: i.name, amount: i.amount, qty: i.qty })),
      tot: receipt.total || 0,
      pm: receipt.paymentMethod || 'Cash',
      ps: receipt.paymentStatus || 'Paid',
      paidOn: receipt.paidOn || '',
      paidAt: receipt.paidAt || '',
      dt: receipt.date || receipt.bookingDate || '',
      tm: receipt.time || '',
      pName: receipt.priestName || ''
    }
    const jsonStr = JSON.stringify(compact)
    return btoa(encodeURIComponent(jsonStr))
  } catch (err) {
    console.warn('Failed to encode receipt payload:', err)
    return ''
  }
}

export function decodeReceiptPayload(base64Str) {
  if (!base64Str) return null
  try {
    const jsonStr = decodeURIComponent(atob(base64Str))
    const compact = JSON.parse(jsonStr)
    return {
      receiptNo: compact.rNo,
      templeName: compact.tName,
      templeDistrict: compact.tDist,
      templeContact: compact.tTel,
      devoteeName: compact.dName,
      mobile: compact.mob,
      starName: compact.star,
      additionalPersons: compact.addP || [],
      persons: compact.persons || [],
      remarks: compact.rem,
      items: compact.items || [],
      total: compact.tot,
      paymentMethod: compact.pm,
      paymentStatus: compact.ps,
      paidOn: compact.paidOn || '',
      paidAt: compact.paidAt || '',
      date: compact.dt,
      time: compact.tm,
      priestName: compact.pName,
      verifiedViaPayload: true
    }
  } catch (err) {
    console.warn('Failed to decode receipt payload:', err)
    return null
  }
}

/* ══════════════════════════════════════════════
   Stars (Nakshatra)
══════════════════════════════════════════════ */

import { ALL_27_NAKSHATRAS } from './nakshatraHelper.js'

export async function loadStars(templeId) {
  const localKey = `theertha-stars-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars`))
    let customList = []
    if (snapshot.exists()) {
      const val = snapshot.val()
      customList = Object.entries(val)
        .filter(([, s]) => s && typeof s === 'object')
        .map(([id, s]) => ({ id, ...s }))
    } else {
      customList = getLocalData(localKey, [])
    }
    
    // Merge ALL_27_NAKSHATRAS with any custom temple-added stars
    const mergedMap = new Map()
    ALL_27_NAKSHATRAS.forEach((star) => mergedMap.set(star.name.toLowerCase(), star))
    customList.forEach((star) => {
      if (star && star.name) {
        mergedMap.set(star.name.toLowerCase(), { id: star.id || `star-${Date.now()}`, name: star.name })
      }
    })
    
    const list = Array.from(mergedMap.values())
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load stars from Realtime Database:', error)
    return ALL_27_NAKSHATRAS
  }
}

export async function addStar(templeId, name) {
  const localKey = `theertha-stars-${templeId}`
  const record = { name: name.trim(), createdAt: new Date().toISOString() }
  let newId = `star-${Date.now()}`
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to add star to Realtime Database, saving locally:', error)
  }
  const added = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  const updated = [...local.filter((s) => s.id !== newId), added].sort((a, b) => a.name.localeCompare(b.name))
  setLocalData(localKey, updated)
  return added
}

export async function deleteStar(templeId, starId) {
  const localKey = `theertha-stars-${templeId}`
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/stars/${starId}`))
  } catch (error) {
    console.warn('Unable to delete star from Realtime Database:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((s) => s.id !== starId),
  )
}

/* ══════════════════════════════════════════════
   Quick Add Items
══════════════════════════════════════════════ */

export async function loadQuickItems(templeId) {
  let safeTempleId = templeId
  if (!safeTempleId) {
    try {
      const raw = sessionStorage.getItem('theertha-temple-session')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.id) safeTempleId = parsed.id
      }
    } catch {
      // ignore
    }
  }

  const localKey = safeTempleId ? `theertha-quick-items-${safeTempleId}` : null
  let list = []

  if (safeTempleId) {
    try {
      const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${safeTempleId}/quickItems`))
      if (snapshot.exists()) {
        const val = snapshot.val()
        list = Object.entries(val)
          .filter(([, item]) => item && typeof item === 'object')
          .map(([id, item]) => ({ id, ...item }))
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      }
    } catch (error) {
      console.warn('Unable to load quick items from Realtime Database:', error)
    }
  }

  if (list && list.length > 0) {
    if (localKey) setLocalData(localKey, list)
    return list
  }

  if (localKey) {
    const local = getLocalData(localKey, [])
    if (local && local.length > 0) return local
  }

  // Cross-temple fallback in localStorage: if user created items in this browser
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('theertha-quick-items-')) {
      const found = getLocalData(k, [])
      if (found && found.length > 0) {
        if (localKey) setLocalData(localKey, found)
        return found
      }
    }
  }

  return []
}

export async function addQuickItem(templeId, { name, amount, category = 'General', showInCounter = true }) {
  const cleanName = String(name || '').trim()
  const localKey = `theertha-quick-items-${templeId}`
  const record = {
    name: cleanName,
    amount: Number(amount),
    category: category || 'General',
    showInCounter: showInCounter !== false,
    createdAt: new Date().toISOString(),
  }
  let newId = `qi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to add quick item to Realtime Database, saving locally:', error)
  }
  const added = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  const updated = [...local.filter((i) => i.id !== newId), added].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  )
  setLocalData(localKey, updated)
  return added
}

export async function updateQuickItem(templeId, itemId, { name, amount, category, showInCounter }) {
  const localKey = `theertha-quick-items-${templeId}`
  const local = getLocalData(localKey, [])
  const existing = local.find((i) => i.id === itemId) || {}

  const updatedRecord = {
    ...existing,
    id: itemId,
    name: name !== undefined ? name.trim() : existing.name,
    amount: amount !== undefined ? Number(amount) : existing.amount,
    category: category !== undefined ? category : (existing.category || 'Custom'),
    showInCounter: showInCounter !== undefined ? Boolean(showInCounter) : (existing.showInCounter !== false),
    updatedAt: new Date().toISOString(),
  }

  try {
    await set(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems/${itemId}`), updatedRecord)
  } catch (error) {
    console.warn('Unable to update quick item in Realtime Database:', error)
  }

  const updatedList = local.map((i) => (i.id === itemId ? updatedRecord : i)).sort((a, b) => a.name.localeCompare(b.name))
  setLocalData(localKey, updatedList)
  return updatedRecord
}

export async function toggleQuickItemCounter(templeId, itemId, showInCounter) {
  return updateQuickItem(templeId, itemId, { showInCounter })
}

export async function addMultipleQuickItems(templeId, itemsList) {
  const localKey = `theertha-quick-items-${templeId}`
  const local = getLocalData(localKey, [])
  const addedItems = []

  for (const item of itemsList) {
    // avoid duplicates by name
    const existing = local.find((i) => i.name.toLowerCase() === item.name.trim().toLowerCase())
    if (existing) {
      // if already exists, just ensure showInCounter is true if user requested
      if (item.showInCounter && !existing.showInCounter) {
        await toggleQuickItemCounter(templeId, existing.id, true)
        existing.showInCounter = true
      }
      continue
    }

    const record = {
      name: item.name.trim(),
      amount: Number(item.amount),
      category: item.category || 'Custom',
      showInCounter: item.showInCounter !== false,
      createdAt: new Date().toISOString(),
    }
    let newId = `qi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    try {
      const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems`))
      newId = newRef.key || newId
      await set(newRef, { ...record, id: newId })
    } catch (error) {
      console.warn('Unable to bulk add quick item to DB:', error)
    }
    const added = { id: newId, ...record }
    addedItems.push(added)
  }

  const merged = [...local, ...addedItems].sort((a, b) => a.name.localeCompare(b.name))
  setLocalData(localKey, merged)
  return merged
}

export async function deleteQuickItem(templeId, itemId) {
  const localKey = `theertha-quick-items-${templeId}`
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/quickItems/${itemId}`))
  } catch (error) {
    console.warn('Unable to delete quick item from Realtime Database:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((i) => i.id !== itemId),
  )
}

/* ══════════════════════════════════════════════
   Receipt Auto-number (atomic increment per counter)
══════════════════════════════════════════════ */

export async function getNextReceiptNo(templeId, counterId) {
  try {
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
  } catch (error) {
    console.warn('Unable to get next receipt seq from DB, using fallback:', error)
    const localKey = `theertha-receipt-seq-${templeId}-${counterId || 'default'}`
    const last = Number(localStorage.getItem(localKey) || 0) + 1
    localStorage.setItem(localKey, String(last))
    const year = new Date().getFullYear()
    return `RC-${year}-${String(last).padStart(6, '0')}`
  }
}

/* ══════════════════════════════════════════════
   Receipts  (stored by date for easy daily queries)
══════════════════════════════════════════════ */

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function saveReceipt(templeId, receipt) {
  const safeTempleId = templeId || receipt.templeId || 'default-temple'
  const date = receipt.bookingDate || todayStr()
  const localKey = `theertha-receipts-${safeTempleId}`
  let newId = `rc-${Date.now()}`
  const now = new Date()
  const payment = receipt.paymentStatus !== 'Unpaid' ? {
    paidAt: receipt.paidAt || now.toISOString(),
    paidOn: receipt.paidOn || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  } : {}
  const record = { ...receipt, ...payment, templeId: safeTempleId, savedAt: now.toISOString(), dbDate: date }

  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${safeTempleId}/receipts/${date}`))
    newId = newRef.key || newId
    const finalRecord = { ...record, id: newId }

    // Save to temple receipts node
    await set(newRef, finalRecord)

    // ALSO save to flat public receipts path for instant mobile verification
    if (finalRecord.receiptNo) {
      const cleanReceiptNo = String(finalRecord.receiptNo).replace(/[.#$[\]]/g, '_')
      await set(ref(realtimeDb, `publicReceipts/${cleanReceiptNo}`), finalRecord)
    }
    await set(ref(realtimeDb, `publicReceipts/${newId}`), finalRecord)
  } catch (error) {
    console.warn('Unable to save receipt to Realtime Database, saving locally:', error)
  }

  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((r) => r.id !== newId)])
  return saved
}

export async function loadTodayReceipts(templeId, dateStr) {
  const d = dateStr || todayStr()
  const localKey = `theertha-receipts-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/receipts/${d}`))
    if (!snapshot.exists()) {
      const local = getLocalData(localKey, [])
      return local.filter((r) => r.dbDate === d || r.bookingDate === d)
    }
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, r]) => r && typeof r === 'object')
      .map(([id, r]) => ({ id, ...r }))
      .sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0))
    return list
  } catch (error) {
    console.warn('Unable to load receipts from Realtime Database:', error)
    const local = getLocalData(localKey, [])
    return local.filter((r) => r.dbDate === d || r.bookingDate === d)
  }
}

export async function loadSingleReceipt(templeId, dateStr, receiptId) {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const qReceiptNo = params.get('receiptNo') || ''
  const qReceiptId = params.get('receiptId') || ''
  const qTempleId = templeId || params.get('templeId') || ''
  const qDate = dateStr || params.get('date') || ''

  const searchKeys = [receiptId, qReceiptId, qReceiptNo, dateStr].filter(Boolean)

  // 0. Direct lookup in publicReceipts flat node (Instant O(1) mobile lookup across devices!)
  for (const key of searchKeys) {
    const cleanKey = String(key).replace(/[.#$[\]]/g, '_')
    try {
      const snap = await get(ref(realtimeDb, `publicReceipts/${cleanKey}`))
      if (snap.exists()) return snap.val()
    } catch (err) {
      console.warn('Public receipt direct lookup error:', err)
    }
  }

  // 1. Direct exact path lookup in Realtime DB
  if (qTempleId && qDate && qReceiptId) {
    let formattedDate = qDate
    if (qDate.includes(' ')) {
      const d = new Date(qDate)
      if (!isNaN(d.getTime())) formattedDate = d.toISOString().slice(0, 10)
    }
    try {
      const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${qTempleId}/receipts/${formattedDate}/${qReceiptId}`))
      if (snap.exists()) return snap.val()
    } catch (err) {
      console.warn('Direct path lookup failed:', err)
    }
  }

  // 2. Comprehensive search across ALL receipt dates for this temple in Realtime DB
  if (qTempleId) {
    try {
      const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${qTempleId}/receipts`))
      if (snap.exists()) {
        const datesObj = snap.val()
        for (const [dKey, receiptsMap] of Object.entries(datesObj)) {
          if (receiptsMap && typeof receiptsMap === 'object') {
            for (const [id, r] of Object.entries(receiptsMap)) {
              if (r && typeof r === 'object') {
                for (const key of searchKeys) {
                  if (
                    id === key ||
                    r.id === key ||
                    r.receiptNo === key ||
                    (r.receiptNo && r.receiptNo.toLowerCase() === key.toLowerCase())
                  ) {
                    return { id, ...r, dbDate: r.dbDate || r.bookingDate || dKey }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Temple receipts search failed:', err)
    }
  }

  // 3. Universal search across ALL registered temples in Realtime DB
  try {
    const allTemplesSnap = await get(ref(realtimeDb, TEMPLE_DB_PATH))
    if (allTemplesSnap.exists()) {
      const templesMap = allTemplesSnap.val()
      for (const [tId, tObj] of Object.entries(templesMap)) {
        if (tObj && tObj.receipts && typeof tObj.receipts === 'object') {
          for (const [dKey, receiptsMap] of Object.entries(tObj.receipts)) {
            if (receiptsMap && typeof receiptsMap === 'object') {
              for (const [id, r] of Object.entries(receiptsMap)) {
                if (r && typeof r === 'object') {
                  for (const key of searchKeys) {
                    if (
                      id === key ||
                      r.id === key ||
                      r.receiptNo === key ||
                      (r.receiptNo && r.receiptNo.toLowerCase() === key.toLowerCase())
                    ) {
                      return { id, ...r, templeId: tId, dbDate: r.dbDate || r.bookingDate || dKey }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('All temples search failed:', err)
  }

  // 4. LocalStorage lookup fallback
  if (typeof window !== 'undefined') {
    const localKeys = Object.keys(localStorage).filter((k) => k.startsWith('theertha-receipts-'))
    for (const k of localKeys) {
      const local = getLocalData(k, [])
      for (const r of local) {
        for (const key of searchKeys) {
          if (r.id === key || r.receiptNo === key || (r.receiptNo && r.receiptNo.toLowerCase() === key.toLowerCase())) {
            return r
          }
        }
      }
    }
  }

  return null
}

export async function loadAllReceipts(templeId) {
  const localKey = `theertha-receipts-${templeId}`
  const allList = []
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/receipts`))
    if (snapshot.exists()) {
      const datesObj = snapshot.val()
      Object.entries(datesObj).forEach(([dateKey, receiptsMap]) => {
        if (receiptsMap && typeof receiptsMap === 'object') {
          Object.entries(receiptsMap).forEach(([id, r]) => {
            if (r && typeof r === 'object') {
              allList.push({ id, ...r, dbDate: r.dbDate || r.bookingDate || dateKey })
            }
          })
        }
      })
    }
  } catch (error) {
    console.warn('Unable to load all receipts from DB:', error)
  }

  const local = getLocalData(localKey, [])
  const map = new Map()
  allList.forEach((r) => map.set(r.id || r.receiptNo, r))
  local.forEach((r) => {
    const key = r.id || r.receiptNo
    if (key && !map.has(key)) map.set(key, r)
  })

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.bookingDate || b.savedAt || 0) - new Date(a.bookingDate || a.savedAt || 0),
  )

  setLocalData(localKey, merged)
  return merged
}

/* ══════════════════════════════════════════════
   Expenses
══════════════════════════════════════════════ */

export async function getNextVoucherNo(templeId) {
  try {
    const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenseSeq`)
    let newSeq = 1
    await runTransaction(seqRef, (current) => {
      newSeq = (current || 0) + 1
      return newSeq
    })
    const year = new Date().getFullYear()
    return `EXP-${year}-${String(newSeq).padStart(5, '0')}`
  } catch (error) {
    const localKey = `theertha-exp-seq-${templeId}`
    const last = Number(localStorage.getItem(localKey) || 0) + 1
    localStorage.setItem(localKey, String(last))
    const year = new Date().getFullYear()
    return `EXP-${year}-${String(last).padStart(5, '0')}`
  }
}

export async function saveExpense(templeId, expense) {
  const localKey = `theertha-expenses-${templeId}`
  let newId = `exp-${Date.now()}`
  const record = { ...expense, createdAt: new Date().toISOString() }
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenses`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to save expense to DB, saving locally:', error)
  }
  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((e) => e.id !== newId)])
  return saved
}

export async function loadExpenses(templeId) {
  const localKey = `theertha-expenses-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/expenses`))
    if (!snapshot.exists()) return getLocalData(localKey, [])
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, exp]) => exp && typeof exp === 'object')
      .map(([id, exp]) => ({ id, ...exp }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load expenses from DB:', error)
    return getLocalData(localKey, [])
  }
}



/* ══════════════════════════════════════════════
   Account Transactions
══════════════════════════════════════════════ */

export async function saveAccountTransaction(templeId, transaction) {
  const localKey = `theertha-accounts-${templeId}`
  let newId = `txn-${Date.now()}`
  const record = { ...transaction, createdAt: new Date().toISOString() }
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/accounts`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to save transaction to DB:', error)
  }
  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((t) => t.id !== newId)])
  return saved
}

export async function loadAccountTransactions(templeId) {
  const localKey = `theertha-accounts-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/accounts`))
    if (!snapshot.exists()) return getLocalData(localKey, [])
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, txn]) => txn && typeof txn === 'object')
      .map(([id, txn]) => ({ id, ...txn }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load account transactions from DB:', error)
    return getLocalData(localKey, [])
  }
}

/* ══════════════════════════════════════════════
   Pooja Status & Slots
══════════════════════════════════════════════ */

export async function updatePoojaStatus(templeId, dateStr, poojaKey, status) {
  const d = dateStr || todayStr()
  const localKey = `theertha-pooja-status-${templeId}-${d}`
  try {
    await set(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/poojaStatus/${d}/${poojaKey}`), status)
  } catch (error) {
    console.warn('Unable to update pooja status on DB:', error)
  }
  const local = getLocalData(localKey, {})
  local[poojaKey] = status
  setLocalData(localKey, local)
}

export async function loadPoojaStatuses(templeId, dateStr) {
  const d = dateStr || todayStr()
  const localKey = `theertha-pooja-status-${templeId}-${d}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/poojaStatus/${d}`))
    if (!snapshot.exists()) return getLocalData(localKey, {})
    const val = snapshot.val()
    setLocalData(localKey, val)
    return val
  } catch (error) {
    console.warn('Unable to load pooja statuses from DB:', error)
    return getLocalData(localKey, {})
  }
}

export async function saveSlotsConfig(templeId, slots) {
  const localKey = `theertha-slots-${templeId}`
  try {
    await set(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/slotsConfig`), slots)
  } catch (error) {
    console.warn('Unable to save slots config to DB:', error)
  }
  setLocalData(localKey, slots)
}

export async function loadSlotsConfig(templeId) {
  const localKey = `theertha-slots-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/slotsConfig`))
    if (!snapshot.exists()) return getLocalData(localKey, null)
    const val = snapshot.val()
    setLocalData(localKey, val)
    return val
  } catch (error) {
    console.warn('Unable to load slots config from DB:', error)
    return getLocalData(localKey, null)
  }
}

/* ══════════════════════════════════════════════
   Priests
══════════════════════════════════════════════ */

export async function loadPriests(templeId) {
  const localKey = `theertha-priests-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests`))
    if (!snapshot.exists()) return getLocalData(localKey, [])
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, p]) => p && typeof p === 'object')
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => a.name.localeCompare(b.name))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load priests from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function addPriest(templeId, { name, salary, phone, address, role }) {
  const localKey = `theertha-priests-${templeId}`
  const record = {
    name: name.trim(),
    salary: Number(salary) || 0,
    phone: phone.trim(),
    address: address.trim(),
    role: role || 'Priest',
    createdAt: new Date().toISOString(),
  }
  let newId = `priest-${Date.now()}`
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to add priest to DB:', error)
  }
  const added = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  const updated = [...local.filter((p) => p.id !== newId), added].sort((a, b) => a.name.localeCompare(b.name))
  setLocalData(localKey, updated)
  return added
}

export async function deletePriest(templeId, priestId) {
  const localKey = `theertha-priests-${templeId}`
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/priests/${priestId}`))
  } catch (error) {
    console.warn('Unable to delete priest from DB:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((p) => p.id !== priestId),
  )
}

/* ══════════════════════════════════════════════
   Devotees
══════════════════════════════════════════════ */

export async function saveDevotee(templeId, { devoteeName, mobile, starId, starName, receiptId, receiptNo, total, paymentStatus }) {
  if (!mobile) return null
  const localKey = `theertha-devotees-${templeId}`
  const mobileKey = mobile.trim()
  const localMap = getLocalData(localKey, {})
  
  let devotee = {
    devoteeName: devoteeName.trim(),
    mobile: mobileKey,
    starId: starId || '',
    starName: starName || '',
    lastActive: new Date().toISOString(),
    receipts: {}
  }

  try {
    const path = `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobileKey}`
    const snap = await get(ref(realtimeDb, path))
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
        paymentStatus
      }
    }
    await set(ref(realtimeDb, path), devotee)
  } catch (error) {
    console.warn('Unable to save devotee to DB:', error)
    if (localMap[mobileKey]) {
      const existing = localMap[mobileKey]
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
        paymentStatus
      }
    }
  }

  localMap[mobileKey] = devotee
  setLocalData(localKey, localMap)
  return devotee
}

export async function getDevoteeByMobile(templeId, mobile) {
  if (!mobile) return null
  const localKey = `theertha-devotees-${templeId}`
  const mobileKey = mobile.trim()
  try {
    const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobileKey}`))
    if (snap.exists()) return snap.val()
  } catch (error) {
    console.warn('Unable to get devotee from DB:', error)
  }
  const localMap = getLocalData(localKey, {})
  return localMap[mobileKey] || null
}

export async function loadDevotees(templeId) {
  const localKey = `theertha-devotees-${templeId}`
  try {
    const snap = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees`))
    if (!snap.exists()) {
      const localMap = getLocalData(localKey, {})
      return Object.entries(localMap).map(([mobile, d]) => ({ mobile, ...d }))
    }
    const val = snap.val()
    const list = Object.entries(val)
      .filter(([, d]) => d && typeof d === 'object')
      .map(([mobile, d]) => ({ mobile, ...d }))
      .sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0))
    const map = {}
    list.forEach((d) => { map[d.mobile] = d })
    setLocalData(localKey, map)
    return list
  } catch (error) {
    console.warn('Unable to load devotees from DB:', error)
    const localMap = getLocalData(localKey, {})
    return Object.entries(localMap).map(([mobile, d]) => ({ mobile, ...d }))
  }
}

export async function deleteDevotee(templeId, mobile) {
  if (!mobile) return
  const localKey = `theertha-devotees-${templeId}`
  const mobileKey = mobile.trim()
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/devotees/${mobileKey}`))
  } catch (error) {
    console.warn('Unable to delete devotee from DB:', error)
  }
  const localMap = getLocalData(localKey, {})
  delete localMap[mobileKey]
  setLocalData(localKey, localMap)
}

/* ══════════════════════════════════════════════
   Donations / Sambavana
══════════════════════════════════════════════ */

export async function getNextDonationNo(templeId) {
  try {
    const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donationSeq`)
    let newSeq = 1
    await runTransaction(seqRef, (current) => {
      newSeq = (current || 0) + 1
      return newSeq
    })
    const year = new Date().getFullYear()
    return `DON-${year}-${String(newSeq).padStart(5, '0')}`
  } catch (error) {
    const localKey = `theertha-don-seq-${templeId}`
    const last = Number(localStorage.getItem(localKey) || 0) + 1
    localStorage.setItem(localKey, String(last))
    const year = new Date().getFullYear()
    return `DON-${year}-${String(last).padStart(5, '0')}`
  }
}

export async function saveDonation(templeId, donation) {
  const localKey = `theertha-donations-${templeId}`
  let newId = `don-${Date.now()}`
  const record = { ...donation, createdAt: new Date().toISOString() }
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to save donation to DB:', error)
  }
  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((d) => d.id !== newId)])
  return saved
}

export async function loadDonations(templeId) {
  const localKey = `theertha-donations-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations`))
    if (!snapshot.exists()) return getLocalData(localKey, [])
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, d]) => d && typeof d === 'object')
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load donations from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function updateDonation(templeId, donationId, updatedFields) {
  const localKey = `theertha-donations-${templeId}`
  let updated = null
  try {
    const donRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations/${donationId}`)
    const snap = await get(donRef)
    if (snap.exists()) {
      const existing = snap.val()
      updated = { ...existing, ...updatedFields, updatedAt: new Date().toISOString() }
      await set(donRef, updated)
    }
  } catch (error) {
    console.warn('Unable to update donation on DB:', error)
  }
  const local = getLocalData(localKey, [])
  const existingLocal = local.find((d) => d.id === donationId)
  if (existingLocal) {
    updated = { ...existingLocal, ...updatedFields, updatedAt: new Date().toISOString() }
    setLocalData(
      localKey,
      local.map((d) => (d.id === donationId ? updated : d)),
    )
  }
  return updated
}

export async function deleteDonation(templeId, donationId) {
  const localKey = `theertha-donations-${templeId}`
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/donations/${donationId}`))
  } catch (error) {
    console.warn('Unable to delete donation from DB:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((d) => d.id !== donationId),
  )
}

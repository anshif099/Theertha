import { get, push, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const TEMPLE_DB_PATH = 'registeredTemples'
const LOCAL_KEY_PREFIX = 'theertha-counters-'

function getLocalCounters(templeId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}${templeId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCounters(templeId, counters) {
  try {
    localStorage.setItem(`${LOCAL_KEY_PREFIX}${templeId}`, JSON.stringify(counters))
  } catch {
    // ignore
  }
}

function countersRef(templeId) {
  return ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/counters`)
}

function counterRef(templeId, counterId) {
  return ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/counters/${counterId}`)
}

/**
 * Load all counters for a temple from Firebase (with localStorage fallback).
 * Returns an array of { id, number, name, loginId, createdAt }
 */
export async function loadCounters(templeId) {
  try {
    const snapshot = await get(countersRef(templeId))

    if (!snapshot.exists()) {
      return getLocalCounters(templeId)
    }

    const value = snapshot.val()
    const list = Object.entries(value)
      .filter(([, counter]) => counter && typeof counter === 'object')
      .map(([id, counter]) => ({ id, ...counter }))
      .sort((a, b) => Number(a.number) - Number(b.number))

    saveLocalCounters(templeId, list)
    return list
  } catch (error) {
    console.warn('Unable to load counters from Realtime Database, using local storage fallback:', error)
    return getLocalCounters(templeId)
  }
}

/**
 * Add a new counter under the temple (with localStorage fallback).
 * counter = { number, name, loginId }
 */
export async function addCounter(templeId, counter) {
  const record = {
    number: counter.number,
    name: counter.name.trim(),
    loginId: counter.loginId.trim(),
    createdAt: new Date().toISOString(),
  }

  let newId = `ctr-${Date.now()}`

  try {
    const newRef = push(countersRef(templeId))
    newId = newRef.key || newId
    await set(newRef, record)
  } catch (error) {
    console.warn('Unable to save counter to Realtime Database, saving locally:', error)
  }

  const added = { id: newId, ...record }
  const local = getLocalCounters(templeId)
  const updated = [...local.filter((c) => c.id !== newId && String(c.number) !== String(record.number)), added].sort(
    (a, b) => Number(a.number) - Number(b.number),
  )

  saveLocalCounters(templeId, updated)
  return added
}

/**
 * Delete a counter by id (with localStorage fallback).
 */
export async function deleteCounter(templeId, counterId) {
  try {
    await remove(counterRef(templeId, counterId))
  } catch (error) {
    console.warn('Unable to delete counter from Realtime Database, deleting locally:', error)
  }

  const local = getLocalCounters(templeId)
  const updated = local.filter((c) => c.id !== counterId)
  saveLocalCounters(templeId, updated)
}

/**
 * Find a counter across ALL temples by its loginId.
 * Returns { counter, templeId } or null if not found.
 */
export async function findCounterByLoginId(loginId) {
  const normalizedId = loginId.trim().toUpperCase()
  if (!normalizedId) return null

  try {
    const snapshot = await get(ref(realtimeDb, 'registeredTemples'))
    if (snapshot.exists()) {
      const temples = snapshot.val()

      for (const [templeId, templeData] of Object.entries(temples)) {
        const counters = templeData?.counters
        if (!counters || typeof counters !== 'object') continue

        for (const [counterId, counter] of Object.entries(counters)) {
          if (counter?.loginId?.toUpperCase() === normalizedId) {
            return {
              counter: { id: counterId, ...counter },
              templeId,
              templeName: templeData.name || '',
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Unable to query counters from Realtime Database:', error)
  }

  // Local storage fallback search
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(LOCAL_KEY_PREFIX)) {
      const templeId = key.replace(LOCAL_KEY_PREFIX, '')
      try {
        const counters = JSON.parse(localStorage.getItem(key) || '[]')
        const found = counters.find((c) => c?.loginId?.toUpperCase() === normalizedId)
        if (found) {
          return {
            counter: found,
            templeId,
            templeName: 'Temple',
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return null
}


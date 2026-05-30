import { get, push, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const TEMPLE_DB_PATH = 'registeredTemples'

function countersRef(templeId) {
  return ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/counters`)
}

function counterRef(templeId, counterId) {
  return ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/counters/${counterId}`)
}

/**
 * Load all counters for a temple from Firebase.
 * Returns an array of { id, number, name, loginId, createdAt }
 */
export async function loadCounters(templeId) {
  const snapshot = await get(countersRef(templeId))

  if (!snapshot.exists()) {
    return []
  }

  const value = snapshot.val()

  return Object.entries(value)
    .filter(([, counter]) => counter && typeof counter === 'object')
    .map(([id, counter]) => ({ id, ...counter }))
    .sort((a, b) => Number(a.number) - Number(b.number))
}

/**
 * Add a new counter under the temple.
 * counter = { number, name, loginId }
 */
export async function addCounter(templeId, counter) {
  const newRef = push(countersRef(templeId))
  const record = {
    number: counter.number,
    name: counter.name.trim(),
    loginId: counter.loginId.trim(),
    createdAt: new Date().toISOString(),
  }
  await set(newRef, record)
  return { id: newRef.key, ...record }
}

/**
 * Delete a counter by id.
 */
export async function deleteCounter(templeId, counterId) {
  await remove(counterRef(templeId, counterId))
}

/**
 * Find a counter across ALL temples by its loginId.
 * Returns { counter, templeId } or null if not found.
 */
export async function findCounterByLoginId(loginId) {
  const normalizedId = loginId.trim().toUpperCase()
  if (!normalizedId) return null

  const snapshot = await get(ref(realtimeDb, 'registeredTemples'))
  if (!snapshot.exists()) return null

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

  return null
}


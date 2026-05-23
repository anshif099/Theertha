import { get, ref, remove, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const STORAGE_KEY = 'theertha-superadmin-temples'
const TEMPLE_DB_PATH = 'registeredTemples'
const DEFAULT_DISTRICT = 'Thiruvananthapuram'

const DISTRICT_CODES = {
  Thiruvananthapuram: 'TVM',
  Kollam: 'KLM',
  Pathanamthitta: 'PTA',
  Alappuzha: 'ALP',
  Kottayam: 'KTM',
  Idukki: 'IDK',
  Ernakulam: 'EKM',
  Thrissur: 'TSR',
  Palakkad: 'PKD',
  Malappuram: 'MPM',
  Kozhikode: 'KKD',
  Wayanad: 'WYD',
  Kannur: 'KNR',
  Kasaragod: 'KSD',
}

export const defaultTemples = [
  {
    id: 'temple-sree-padmanabha',
    loginId: 'THR-TVM-PAD7',
    name: 'Sree Padmanabha Temple',
    deity: 'Lord Vishnu',
    district: 'Thiruvananthapuram',
    status: 'Active',
    plan: 'Enterprise',
    contact: '+91 471 000 0000',
    description:
      'Enterprise temple operations with devotee services, offerings, accounts, and festival planning.',
    updatedAt: '2026-05-22',
  },
  {
    id: 'temple-guruvayur',
    loginId: 'THR-TSR-GUR9',
    name: 'Guruvayur Temple',
    deity: 'Lord Krishna',
    district: 'Thrissur',
    status: 'Active',
    plan: 'Professional',
    contact: '+91 487 000 0000',
    description:
      'High-volume counter, booking, devotee, and donation management for daily temple administration.',
    updatedAt: '2026-05-22',
  },
  {
    id: 'temple-chottanikkara',
    loginId: 'THR-EKM-CHO4',
    name: 'Chottanikkara Temple',
    deity: 'Bhagavathy',
    district: 'Ernakulam',
    status: 'Onboarding',
    plan: 'Basic',
    contact: '+91 484 000 0000',
    description:
      'Onboarding temple profile for bookings, membership, daily collections, and receipt workflows.',
    updatedAt: '2026-05-22',
  },
]

export function loadTemples() {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return defaultTemples
  }

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return defaultTemples
    }

    const normalizedTemples = parsed.map(normalizeTempleLogin)
    if (JSON.stringify(normalizedTemples) !== stored) {
      saveTemples(normalizedTemples)
    }

    return normalizedTemples
  } catch {
    return defaultTemples
  }
}

export function saveTemples(temples) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(temples))
}

export async function loadRegisteredTemples() {
  try {
    const snapshot = await get(ref(realtimeDb, TEMPLE_DB_PATH))

    if (!snapshot.exists()) {
      return loadTemples()
    }

    const normalizedTemples = parseDatabaseTemples(snapshot.val()).map(
      normalizeTempleLogin,
    )

    saveTemples(normalizedTemples)
    return normalizedTemples
  } catch (error) {
    console.warn('Unable to load temples from Realtime Database:', error)
    return loadTemples()
  }
}

export function getTemple(templeId) {
  return loadTemples().find((temple) => temple.id === templeId)
}

export async function getRegisteredTemple(templeId) {
  const cachedTemple = getTemple(templeId)

  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}`))

    if (!snapshot.exists()) {
      return cachedTemple
    }

    return normalizeTempleLogin({ id: templeId, ...snapshot.val() })
  } catch (error) {
    console.warn('Unable to load temple from Realtime Database:', error)
    return cachedTemple
  }
}

export async function saveTemple(temple) {
  const temples = await loadRegisteredTemples()
  const now = new Date().toISOString().slice(0, 10)
  const normalizedTemple = {
    ...temple,
    id: temple.id || createTempleId(),
    district: temple.district || DEFAULT_DISTRICT,
    loginId: temple.loginId || createTempleLoginId(temple.district),
    updatedAt: now,
  }

  const nextTemples = temple.id
    ? temples.map((item) => (item.id === temple.id ? normalizedTemple : item))
    : [normalizedTemple, ...temples]

  await set(
    ref(realtimeDb, `${TEMPLE_DB_PATH}/${normalizedTemple.id}`),
    cleanDatabaseRecord(normalizedTemple),
  )
  saveTemples(nextTemples)

  return normalizedTemple
}

export async function deleteTemple(templeId) {
  const nextTemples = loadTemples().filter((temple) => temple.id !== templeId)
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}`))
  saveTemples(nextTemples)
  return nextTemples
}

export async function findTempleByLoginId(loginId) {
  const normalizedLoginId = loginId.trim().toUpperCase()

  if (!normalizedLoginId) {
    return null
  }

  const temples = await loadRegisteredTemples()
  return (
    temples.find(
      (temple) => temple.loginId?.toUpperCase() === normalizedLoginId,
    ) || null
  )
}

function createTempleId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `temple-${Date.now()}`
}

export function createTempleLoginId(district = 'Thiruvananthapuram') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = new Uint32Array(4)
  const districtCode = DISTRICT_CODES[district] || 'KER'

  if (crypto.getRandomValues) {
    crypto.getRandomValues(values)
  } else {
    values.forEach((_, index) => {
      values[index] = Math.floor(Math.random() * alphabet.length)
    })
  }

  const suffix = Array.from(values, (value) => alphabet[value % alphabet.length])
    .join('')

  return `THR-${districtCode}-${suffix}`
}

function normalizeTempleLogin(temple) {
  const district = temple.district || DEFAULT_DISTRICT

  return {
    ...temple,
    district,
    loginId: temple.loginId || createTempleLoginId(district),
  }
}

function parseDatabaseTemples(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return Object.entries(value)
    .filter(([, temple]) => temple && typeof temple === 'object')
    .map(([id, temple]) => ({
      id,
      ...temple,
    }))
}

function cleanDatabaseRecord(temple) {
  return Object.fromEntries(
    Object.entries(temple).filter(([, value]) => value !== undefined),
  )
}

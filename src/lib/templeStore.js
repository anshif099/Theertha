const STORAGE_KEY = 'theertha-superadmin-temples'

export const defaultTemples = [
  {
    id: 'temple-sree-padmanabha',
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
    return Array.isArray(parsed) ? parsed : defaultTemples
  } catch {
    return defaultTemples
  }
}

export function saveTemples(temples) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(temples))
}

export function getTemple(templeId) {
  return loadTemples().find((temple) => temple.id === templeId)
}

export function saveTemple(temple) {
  const temples = loadTemples()
  const now = new Date().toISOString().slice(0, 10)
  const normalizedTemple = {
    ...temple,
    id: temple.id || createTempleId(),
    updatedAt: now,
  }

  const nextTemples = temple.id
    ? temples.map((item) => (item.id === temple.id ? normalizedTemple : item))
    : [normalizedTemple, ...temples]

  saveTemples(nextTemples)
  return normalizedTemple
}

export function deleteTemple(templeId) {
  const nextTemples = loadTemples().filter((temple) => temple.id !== templeId)
  saveTemples(nextTemples)
  return nextTemples
}

function createTempleId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `temple-${Date.now()}`
}

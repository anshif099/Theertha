const STORAGE_KEY = 'theertha-superadmin-temples'

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

export function getTemple(templeId) {
  return loadTemples().find((temple) => temple.id === templeId)
}

export function saveTemple(temple) {
  const temples = loadTemples()
  const now = new Date().toISOString().slice(0, 10)
  const normalizedTemple = {
    ...temple,
    id: temple.id || createTempleId(),
    loginId: temple.loginId || createTempleLoginId(temple.district),
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
  return {
    ...temple,
    loginId: temple.loginId || createTempleLoginId(temple.district),
  }
}

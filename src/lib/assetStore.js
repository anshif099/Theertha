import { get, push, ref, remove, runTransaction, set } from 'firebase/database'
import { realtimeDb } from './firebase.js'

const TEMPLE_DB_PATH = 'registeredTemples'

/* ══════════════════════════════════════════════
   Asset ID generator  (AST-YYYY-NNN)
══════════════════════════════════════════════ */
export async function getNextAssetId(templeId, category = 'AST') {
  // Derive prefix from category
  const prefixMap = {
    'Jewellery & valuables': 'JWL',
    'Land & buildings': 'LND',
    Vehicles: 'VHC',
    'Equipment & furniture': 'EQP',
    'Pooja utensils': 'POJ',
    'Agricultural land': 'AGR',
  }
  const prefix = prefixMap[category] || 'AST'
  const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assetSeq/${prefix}`)
  let newSeq = 1
  await runTransaction(seqRef, (cur) => {
    newSeq = (cur || 0) + 1
    return newSeq
  })
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(newSeq).padStart(3, '0')}`
}

/* ══════════════════════════════════════════════
   CRUD
══════════════════════════════════════════════ */
export async function loadAssets(templeId) {
  const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets`))
  if (!snapshot.exists()) return []
  const val = snapshot.val()
  return Object.entries(val)
    .filter(([, a]) => a && typeof a === 'object')
    .map(([id, a]) => ({ id, ...a }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

export async function addAsset(templeId, asset) {
  const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets`))
  const record = { ...asset, id: newRef.key, createdAt: new Date().toISOString() }
  await set(newRef, record)
  return record
}

export async function deleteAsset(templeId, assetId) {
  await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets/${assetId}`))
}

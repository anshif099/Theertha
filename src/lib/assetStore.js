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

export async function getNextAssetId(templeId, category = 'AST') {
  const prefixMap = {
    'Jewellery & valuables': 'JWL',
    'Land & buildings': 'LND',
    Vehicles: 'VHC',
    'Equipment & furniture': 'EQP',
    'Pooja utensils': 'POJ',
    'Agricultural land': 'AGR',
  }
  const prefix = prefixMap[category] || 'AST'
  try {
    const seqRef = ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assetSeq/${prefix}`)
    let newSeq = 1
    await runTransaction(seqRef, (cur) => {
      newSeq = (cur || 0) + 1
      return newSeq
    })
    const year = new Date().getFullYear()
    return `${prefix}-${year}-${String(newSeq).padStart(3, '0')}`
  } catch (error) {
    const localKey = `theertha-asset-seq-${templeId}-${prefix}`
    const last = Number(localStorage.getItem(localKey) || 0) + 1
    localStorage.setItem(localKey, String(last))
    const year = new Date().getFullYear()
    return `${prefix}-${year}-${String(last).padStart(3, '0')}`
  }
}

export async function loadAssets(templeId) {
  const localKey = `theertha-assets-${templeId}`
  try {
    const snapshot = await get(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets`))
    if (!snapshot.exists()) return getLocalData(localKey, [])
    const val = snapshot.val()
    const list = Object.entries(val)
      .filter(([, a]) => a && typeof a === 'object')
      .map(([id, a]) => ({ id, ...a }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    setLocalData(localKey, list)
    return list
  } catch (error) {
    console.warn('Unable to load assets from DB:', error)
    return getLocalData(localKey, [])
  }
}

export async function addAsset(templeId, asset) {
  const localKey = `theertha-assets-${templeId}`
  let newId = `ast-${Date.now()}`
  const record = { ...asset, createdAt: new Date().toISOString() }
  try {
    const newRef = push(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets`))
    newId = newRef.key || newId
    await set(newRef, { ...record, id: newId })
  } catch (error) {
    console.warn('Unable to add asset to DB:', error)
  }
  const saved = { id: newId, ...record }
  const local = getLocalData(localKey, [])
  setLocalData(localKey, [saved, ...local.filter((a) => a.id !== newId)])
  return saved
}

export async function deleteAsset(templeId, assetId) {
  const localKey = `theertha-assets-${templeId}`
  try {
    await remove(ref(realtimeDb, `${TEMPLE_DB_PATH}/${templeId}/assets/${assetId}`))
  } catch (error) {
    console.warn('Unable to delete asset from DB:', error)
  }
  const local = getLocalData(localKey, [])
  setLocalData(
    localKey,
    local.filter((a) => a.id !== assetId),
  )
}

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCzR5ip0bl9N3pur3kLNuTiUmp_C-_4fwc',
  authDomain: 'iaai-4adeb.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://iaai-4adeb-default-rtdb.firebaseio.com',
  projectId: 'iaai-4adeb',
  storageBucket: 'iaai-4adeb.firebasestorage.app',
  messagingSenderId: '1064038959808',
  appId: '1:1064038959808:web:4a596deca5b515ab15bb25',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const realtimeDb = getDatabase(firebaseApp)

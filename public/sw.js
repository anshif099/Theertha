const CACHE_NAME = 'theertha-pwa-v10'
const APP_SHELL = [
  '/theertha/',
  '/theertha/index.html',
  '/theertha/favicon.ico',
  '/theertha/manifest.webmanifest',
  '/theertha/logo.png',
  '/theertha/pwa-192.png',
  '/theertha/pwa-512.png',
  '/theertha/maskable-icon-512.png',
  '/theertha/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/theertha/index.html', copy))
          return response
        })
        .catch(() => caches.match('/theertha/index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkResponse
    }),
  )
})

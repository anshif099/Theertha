import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/theertha/',
  plugins: [react(), tailwindcss(), {
    name: 'retire-development-service-worker',
    apply: 'serve',
    transformIndexHtml() {
      return [{
        tag: 'script',
        injectTo: 'head-prepend',
        children: `
if ('serviceWorker' in navigator) {
  (async () => {
    const base = ${JSON.stringify(process.env.VITE_BASE_PATH || '/theertha/')};
    const scope = new URL(base, location.origin).href;
    const controller = navigator.serviceWorker.controller;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter((registration) =>
      registration.scope === scope ||
      (registration.scope.startsWith(location.origin + '/') && scope.startsWith(registration.scope)) ||
      (controller && registration.active?.scriptURL === controller.scriptURL) ||
      registration.active?.scriptURL === new URL(base + 'sw.js', location.origin).href
    );
    if (!appRegistrations.length && !controller) return;
    await Promise.all(appRegistrations.map((registration) => registration.unregister()));
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('theertha-pwa-')).map((name) => caches.delete(name)));
    location.reload();
  })().catch((error) => console.warn('Development service worker cleanup failed:', error));
}
`,
      }]
    },
    configureServer(server) {
      // This also reaches browsers whose cached main.jsx predates DEV cleanup.
      server.middlewares.use((req, res, next) => {
        const base = process.env.VITE_BASE_PATH || '/theertha/'
        // Always send fresh development modules, even with an old HTTP validator.
        delete req.headers['if-none-match']
        delete req.headers['if-modified-since']
        res.setHeader('Cache-Control', 'no-store')
        const pathname = req.url?.split('?')[0]
        if (pathname !== `${base}sw.js` && pathname !== '/sw.js') return next()
        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Cache-Control', 'no-store')
        res.end(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('theertha-pwa-')).map((name) => caches.delete(name)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate(client.url)));
  })());
});
`)
      })
    },
  }],
})

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A fetch handler is required for PWA installation.
  // We perform a simple pass-through to ensure Next.js routing, API calls, and SSR work perfectly.
});

const CACHE_NAME = 'aspire-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A very basic fetch handler that just lets the network handle it,
  // but satisfies the PWA installability requirement.
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline content not available');
    })
  );
});

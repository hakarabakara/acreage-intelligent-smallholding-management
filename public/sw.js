const CACHE_NAME = 'acreage-static-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // API requests: Network Only
  // We do not cache API responses in the SW to avoid serving stale data for critical operations.
  // The frontend app handles data freshness via React state/effects.
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  // Navigation requests (HTML): Network First, fallback to Cache
  // This ensures users get the latest app shell if online, but can still load the app if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }
  // Static assets (JS, CSS, Images, Fonts): Cache First, fallback to Network
  // These files are hashed by Vite, so they are safe to cache aggressively.
  // If not in cache, fetch from network.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
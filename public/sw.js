// Basic Service Worker for PWA Installability
const CACHE_NAME = 'acreage-v1';
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch handler
  // This is required for the browser to detect the app as "offline capable" (installable)
  // In a production app, we would implement caching strategies here
  event.respondWith(fetch(event.request));
});
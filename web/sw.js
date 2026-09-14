/**
 * ISU ID Generator — Service Worker (PWA Offline & Instant Load Cache)
 * Cache version: isu-id-v3.8.1
 */

const CACHE_NAME = 'isu-id-v3.8.1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css?v=3.8.1',
  './app.js',
  './animations.js',
  './manifest.webmanifest',
  './images/isu_logo_256.png',
  './images/isu_logo_512.png',
  './images/template_front.id.png',
  './images/template_back.id.png',
  './images/2026_id/new_template_front.id.png',
  './images/2026_id/new_template_back.id.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Precache partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Stale-While-Revalidate for same-origin or CDN static assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

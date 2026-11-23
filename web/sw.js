/**
 * ISU ID Generator — Service Worker (PWA Offline & Instant Load Cache)
 * Cache version: isu-id-v3.9.2
 */

const CACHE_NAME = 'isu-id-v3.9.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css?v=3.9.2',
  './app.js',
  './animations.js',
  './manifest.webmanifest',
  './assets/images/logos/isu_logo_256.png',
  './assets/images/logos/isu_logo_512.png',
  './assets/images/templates/legacy/template_front.id.png',
  './assets/images/templates/legacy/template_back.id.png',
  './assets/images/templates/2026/front_reference.png',
  './assets/images/templates/2026/back_reference.png',
  './assets/images/templates/2026/new_template_front.id.png?v=cr80c',
  './assets/images/templates/2026/new_template_back.id.png?v=cr80b',
  './assets/images/templates/2026/cr80_seal.png',
  './assets/images/templates/2026/cr80_university_wordmark.png',
  './assets/images/placeholders/cr80_photo_placeholder.png',
  './assets/images/templates/2026/cr80_qr.png',
  './assets/images/templates/2026/cr80_registrar_signature.png',
  './assets/fonts/poppins-latin-400.woff2',
  './assets/fonts/poppins-latin-600.woff2',
  './assets/fonts/poppins-latin-700.woff2'
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

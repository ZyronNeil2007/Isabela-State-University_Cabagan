/**
 * ISU ID Generator — Service Worker (PWA Offline & Instant Load Cache)
 * Cache version: isu-id-v3.9.2
 */

const CACHE_NAME = 'isu-id-v3.9.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles/main.css?v=3.9.2',
  './styles/base/tokens.css?v=3.9.2',
  './styles/base/fonts.css?v=3.9.2',
  './styles/base/reset.css?v=3.9.2',
  './styles/layout/body.css?v=3.9.2',
  './styles/layout/orbs.css?v=3.9.2',
  './styles/components/navbar.css?v=3.9.2',
  './styles/features/hero.css?v=3.9.2',
  './styles/components/buttons.css?v=3.9.2',
  './styles/layout/container.css?v=3.9.2',
  './styles/components/glass-panel.css?v=3.9.2',
  './styles/components/form.css?v=3.9.2',
  './styles/features/photo-upload.css?v=3.9.2',
  './styles/features/signature.css?v=3.9.2',
  './styles/features/ai-signature.css?v=3.9.2',
  './styles/features/stepper.css?v=3.9.2',
  './styles/components/form-header.css?v=3.9.2',
  './styles/components/download-buttons.css?v=3.9.2',
  './styles/layout/preview-section.css?v=3.9.2',
  './styles/features/card-preview.css?v=3.9.2',
  './styles/components/chips.css?v=3.9.2',
  './styles/components/liquid-glass.css?v=3.9.2',
  './styles/components/footer.css?v=3.9.2',
  './styles/base/animations.css?v=3.9.2',
  './styles/responsive/breakpoints.css?v=3.9.2',
  './styles/features/session-restore.css?v=3.9.2',
  './styles/features/ocr.css?v=3.9.2',
  './styles/base/accessibility.css?v=3.9.2',
  './styles/features/id-version.css?v=3.9.2',
  './styles/components/enhancements.css?v=3.9.2',
  './styles/features/hero-split.css?v=3.9.2',
  './styles/features/features-section.css?v=3.9.2',
  './styles/features/how-it-works.css?v=3.9.2',
  './styles/responsive/sections.css?v=3.9.2',
  './styles/components/mobile-nav.css?v=3.9.2',
  './styles/features/bento.css?v=3.9.2',
  './styles/responsive/hero-mobile.css?v=3.9.2',
  './styles/components/section-divider.css?v=3.9.2',
  './styles/components/site-footer.css?v=3.9.2',
  './styles/base/reduced-motion.css?v=3.9.2',
  './styles/responsive/performance.css?v=3.9.2',
  './styles/features/cr80-card.css?v=3.9.2',
  './styles/responsive/adaptive.css?v=3.9.2',
  './src/animations/animations.js',
  './src/app.js',
  './src/core/config/card-config.js',
  './src/core/initialization/boot.js',
  './src/core/initialization/expose-globals.js',
  './src/core/initialization/navbar.js',
  './src/core/state/canvas-refs.js',
  './src/core/state/state.js',
  './src/features/batch-manager/batch-manager.js',
  './src/features/campus-theme/campus-theme.js',
  './src/features/card-preview/card-inspect.js',
  './src/features/card-preview/cr80-preview.js',
  './src/features/card-preview/security-fx.js',
  './src/features/card-preview/tilt.js',
  './src/features/csv-import/csv-import.js',
  './src/features/id-generator/form-bindings.js',
  './src/features/id-generator/render-engine.js',
  './src/features/id-generator/stepper.js',
  './src/features/id-generator/templates.js',
  './src/features/ocr/ocr.js',
  './src/features/photo-editor/cropper.js',
  './src/features/qr-verification/qr-code.js',
  './src/features/signature/ai-signature.js',
  './src/features/signature/signature-pad.js',
  './src/features/student-management/student-tabs.js',
  './src/services/export/image-export.js',
  './src/services/export/pdf-export.js',
  './src/services/image-processing/image-loader.js',
  './src/services/image-processing/signature-processing.js',
  './src/services/storage/session.js',
  './src/utils/throttle.js',
  './src/utils/toast.js',
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

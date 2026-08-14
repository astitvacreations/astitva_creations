const CACHE_NAME = 'astitva-pwa-v1';

// Assets to cache immediately on SW install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon-180x180.png',
  '/maskable-icon-512x512.png'
];

// Install Event - Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old cache storage
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first strategy with offline fallback for pages, bypass API & sensitive paths
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept or cache non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. NEVER cache API requests, authentication, backend endpoints or sensitive paths
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/admin/') ||
    url.pathname.includes('/auth') ||
    url.origin !== self.origin
  ) {
    return; // Let browser handle network request natively
  }

  // 3. For HTML navigation requests (pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If online and page loaded, return response
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await cache.match('/offline.html');
          return offlinePage || Response.error();
        })
    );
    return;
  }

  // 4. For static assets (images, scripts, fonts, CSS) -> Stale While Revalidate / Cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* ignore network failure for background update */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    })
  );
});

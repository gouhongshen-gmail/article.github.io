const CACHE_VERSION = 'v3';
const SHELL_CACHE = `longlore-shell-${CACHE_VERSION}`;
const PAGE_CACHE = `longlore-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `longlore-static-${CACHE_VERSION}`;
const FONT_CACHE = `longlore-fonts-${CACHE_VERSION}`;
const ROOT_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

function withRoot(path) {
  return `${ROOT_PATH}/${String(path).replace(/^\/+/, '')}`;
}

const PRECACHE_URLS = [
  '',
  'stories/',
  'review/',
  'dashboard/',
  'vocabulary/',
  'pricing/',
  'about/',
  'offline.html',
  'manifest.json',
  'images/icon-192.png',
  'images/icon-512.png'
].map(withRoot);

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, PAGE_CACHE, STATIC_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Google Fonts — cache first, long-lived
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Precached shell pages — network first
  if (sameOrigin && PRECACHE_URLS.includes(url.pathname) &&
      (request.destination === 'document' || request.destination === '')) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // Story pages — stale while revalidate (fast cached reads)
  if (sameOrigin && url.pathname.startsWith(withRoot('stories/')) && request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // Static assets (CSS/JS/images/fonts) — cache first
  if (sameOrigin && ['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // All other navigation — network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(async () => {
        const cachedPage = await caches.match(request);
        return cachedPage || caches.match(withRoot('offline.html'));
      })
    );
  }
});

const CACHE_VERSION = 'v2';
const SHELL_CACHE = `longlore-shell-${CACHE_VERSION}`;
const PAGE_CACHE = `longlore-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `longlore-static-${CACHE_VERSION}`;
const ROOT_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

function withRoot(path) {
  return `${ROOT_PATH}/${String(path).replace(/^\/+/, '')}`;
}

const PRECACHE_URLS = [
  '',
  'stories/',
  'pricing/',
  'about/',
  'offline.html',
  'manifest.json',
  'robots.txt',
  'images/icon-192.png',
  'images/icon-512.png'
].map(withRoot);

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
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
    if (cached) {
      return cached;
    }
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
  const validCaches = [SHELL_CACHE, PAGE_CACHE, STATIC_CACHE];

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

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (
    sameOrigin &&
    PRECACHE_URLS.includes(url.pathname) &&
    (request.destination === 'document' || request.destination === '')
  ) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (
    sameOrigin &&
    ['style', 'script', 'image', 'font'].includes(request.destination)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(async () => {
        const cachedPage = await caches.match(request);
        return cachedPage || caches.match(withRoot('offline.html'));
      })
    );
  }
});

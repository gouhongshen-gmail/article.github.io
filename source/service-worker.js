const CACHE_VERSION = 'v1';
const SHELL_CACHE = `chronosina-shell-${CACHE_VERSION}`;
const CONTENT_CACHE = `chronosina-content-${CACHE_VERSION}`;
const STATIC_CACHE = `chronosina-static-${CACHE_VERSION}`;
const CONTENT_LIMIT = 50;
const STATIC_LIMIT = 100;
const CONTENT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const ROOT_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

function withRoot(path) {
  return `${ROOT_PATH}/${String(path).replace(/^\/+/, '')}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ARTICLE_PATH_PATTERN = new RegExp(`^${escapeRegex(ROOT_PATH)}/\\d{4}/\\d{2}/\\d{2}/.+/?$`);
const SHELL_URLS = [
  'css/chinese-learning.css',
  'css/custom.css',
  'css/srs.css',
  'css/onboarding.css',
  'js/chinese-learning.js',
  'js/analytics-events.js',
  'js/srs-engine.js',
  'js/onboarding.js',
  'offline.html',
  'manifest.json'
].map(withRoot);

async function cloneResponseWithHeaders(response, headersMap) {
  const headers = new Headers(response.headers);
  Object.entries(headersMap || {}).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const body = await response.clone().blob();
  return new Response(body, {
    headers,
    status    : response.status,
    statusText: response.statusText
  });
}

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(cacheName);
  const cachedResponse = await cloneResponseWithHeaders(response, {
    'x-sw-fetched-at': String(Date.now())
  });
  await cache.put(request, cachedResponse);
  return response;
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxItems) {
    return;
  }

  const staleKeys = keys.slice(0, keys.length - maxItems);
  await Promise.all(staleKeys.map((request) => cache.delete(request)));
}

async function purgeExpired(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  await Promise.all(keys.map(async (request) => {
    const response = await cache.match(request);
    if (!response) {
      return;
    }

    const fetchedAt = Number(response.headers.get('x-sw-fetched-at') || 0);
    if (fetchedAt && Date.now() - fetchedAt > maxAge) {
      await cache.delete(request);
    }
  }));
}

async function cacheFirst(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await cacheResponse(cacheName, request, response);
  if (maxItems) {
    await trimCache(cacheName, maxItems);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      await cacheResponse(cacheName, request, response);
      await purgeExpired(cacheName, CONTENT_MAX_AGE);
      await trimCache(cacheName, CONTENT_LIMIT);
      return response;
    })
    .catch((error) => {
      if (cached) {
        return cached;
      }
      throw error;
    });

  if (cached) {
    purgeExpired(cacheName, CONTENT_MAX_AGE).catch(() => {});
    return cached;
  }

  return networkPromise;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, CONTENT_CACHE, STATIC_CACHE];

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

  if (sameOrigin && SHELL_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE, SHELL_URLS.length));
    return;
  }

  if (sameOrigin && ARTICLE_PATH_PATTERN.test(url.pathname) && request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, CONTENT_CACHE));
    return;
  }

  if ((sameOrigin && ['image', 'font'].includes(request.destination)) || url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, STATIC_LIMIT));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(withRoot('offline.html')))
    );
  }
});

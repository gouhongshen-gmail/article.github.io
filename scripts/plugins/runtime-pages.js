/* global hexo */

'use strict';

function ensureTrailingSlash(value) {
  const normalized = String(value || '/').trim() || '/';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function withRoot(path) {
  const root = ensureTrailingSlash(hexo.config.root || '/');
  return `${root}${String(path || '').replace(/^\/+/, '')}`;
}

function buildManifest() {
  return JSON.stringify({
    background_color: '#0f172a',
    description     : hexo.config.description || '',
    display         : 'standalone',
    icons           : [
      {
        sizes: '192x192',
        src  : withRoot('images/icon-192.png'),
        type : 'image/png'
      },
      {
        sizes: '512x512',
        src  : withRoot('images/icon-512.png'),
        type : 'image/png'
      }
    ],
    name           : hexo.config.title || 'ChronoSina',
    scope          : ensureTrailingSlash(hexo.config.root || '/'),
    short_name     : 'ChronoSina',
    start_url      : ensureTrailingSlash(hexo.config.root || '/'),
    theme_color    : '#1e293b'
  }, null, 2);
}

function buildOfflinePage() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ChronoSina is offline</title>
    <style>
      :root {
        color-scheme: light dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background: #0f172a;
        color: #e2e8f0;
        font: 16px/1.7 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        max-width: 34rem;
        padding: 2rem;
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.92);
        box-shadow: 0 24px 50px rgba(2, 6, 23, 0.28);
      }

      h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(1.8rem, 4vw, 2.4rem);
      }

      p {
        margin: 0 0 1rem;
      }

      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.8rem 1rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb, #0f766e);
        color: #f8fafc;
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>You are offline</h1>
      <p>ChronoSina saved part of the site for offline reading, but this page is not available right now.</p>
      <p>Reconnect to keep exploring Chinese history, vocabulary popovers, and your review queue.</p>
      <a href="${ensureTrailingSlash(hexo.config.root || '/')}">Go back home</a>
    </main>
  </body>
</html>
`;
}

hexo.extend.generator.register('runtime-pages', function() {
  return [
    {
      data: buildManifest(),
      path: 'manifest.json'
    },
    {
      data: buildOfflinePage(),
      path: 'offline.html'
    }
  ];
});

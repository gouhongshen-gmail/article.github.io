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

function getSiteHomeUrl() {
  const siteUrl = String(hexo.config.url || '').trim();
  if (!siteUrl) {
    return '';
  }

  return new URL(ensureTrailingSlash(hexo.config.root || '/'), `${siteUrl}/`).toString();
}

const websiteSchema = {
  '@context'   : 'https://schema.org',
  '@type'      : 'WebSite',
  description  : hexo.config.description || '',
  inLanguage   : Array.isArray(hexo.config.language) ? hexo.config.language : [hexo.config.language || 'en'],
  name         : hexo.config.title || 'ChronoSina',
  url          : getSiteHomeUrl()
};

hexo.extend.injector.register('head_end', `
  <link rel="manifest" href="${withRoot('manifest.json')}">
  <script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>
  <script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('${withRoot('service-worker.js')}');
    });
  }
  </script>
`);

/* global hexo */

'use strict';

function ensureTrailingSlash(value) {
  const normalized = String(value || '/').trim() || '/';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function normalizeRoot(value) {
  const withSlash = ensureTrailingSlash(value || '/');
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`;
}

function normalizeSiteUrl(value) {
  const parsed = new URL(String(value || '').trim());
  const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
  return `${parsed.origin}${pathname}`;
}

const frontendUrl = process.env.CHRONOSINA_FRONTEND_URL
  ? String(process.env.CHRONOSINA_FRONTEND_URL).trim()
  : '';
const explicitRoot = process.env.CHRONOSINA_SITE_ROOT
  ? String(process.env.CHRONOSINA_SITE_ROOT).trim()
  : '';

if (frontendUrl) {
  const parsed = new URL(frontendUrl);
  hexo.config.url = normalizeSiteUrl(frontendUrl);
  hexo.config.root = normalizeRoot(explicitRoot || parsed.pathname || '/');
} else if (explicitRoot) {
  hexo.config.root = normalizeRoot(explicitRoot);
}

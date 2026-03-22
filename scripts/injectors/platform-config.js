/* global hexo */

'use strict';

const config = hexo.config.platform || {};
const workers = config.workers || {};

function readEnv(name, fallback = '') {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

const payload = {
  freeArticleLimit: toNumber(readEnv('CHRONOSINA_FREE_ARTICLE_LIMIT', config.free_article_limit || 3), 3),
  frontendUrl     : readEnv('CHRONOSINA_FRONTEND_URL', hexo.config.url || ''),
  mediaBaseUrl    : readEnv('CHRONOSINA_MEDIA_BASE_URL', workers.media || ''),
  paymentBaseUrl  : readEnv('CHRONOSINA_PAYMENT_BASE_URL', workers.payment || ''),
  syncBaseUrl     : readEnv('CHRONOSINA_SYNC_BASE_URL', workers.sync || ''),
  authBaseUrl     : readEnv('CHRONOSINA_AUTH_BASE_URL', workers.auth || '')
};

hexo.extend.injector.register('head_end', `
  <script>
    window.CHRONOSINA_PLATFORM = ${JSON.stringify(payload)};
  </script>
`);

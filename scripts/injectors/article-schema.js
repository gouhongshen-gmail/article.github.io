/* global hexo */

'use strict';

const { stripHTML } = require('hexo-util');

function absoluteUrl(path) {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${String(hexo.config.url || '').replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

function normalizeKeywords(keywords) {
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }

  return keywords ? String(keywords) : '';
}

function normalizeDescription(page) {
  const description = page.description || page.excerpt || page.excerpt_text || '';
  return stripHTML(String(description)).trim();
}

function buildSchema(page) {
  const schema = {
    '@context'        : 'https://schema.org',
    '@type'           : 'Article',
    headline          : page.title || '',
    description       : normalizeDescription(page),
    datePublished     : page.date ? page.date.toISOString() : '',
    dateModified      : (page.updated || page.date) ? (page.updated || page.date).toISOString() : '',
    author            : {
      '@type': 'Person',
      name   : page.author || hexo.config.author || 'ChronoSina'
    },
    publisher         : {
      '@type': 'Organization',
      name   : hexo.config.title || 'ChronoSina',
      logo   : {
        '@type': 'ImageObject',
        url    : absoluteUrl('/images/icon-512.png')
      }
    },
    mainEntityOfPage  : page.permalink || '',
    inLanguage        : page.lang || (Array.isArray(hexo.config.language) ? hexo.config.language[0] : hexo.config.language || 'en'),
    keywords          : normalizeKeywords(page.keywords),
    about             : {
      '@type' : 'Thing',
      name    : 'Chinese History',
      sameAs  : 'https://en.wikipedia.org/wiki/History_of_China'
    }
  };

  if (page.cover || page.index_img) {
    schema.image = {
      '@type': 'ImageObject',
      url    : absoluteUrl(page.cover || page.index_img)
    };
  }

  return schema;
}

hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!data || !data.page || !data.page.__post) {
    return html;
  }

  const schemaScript = `<script type="application/ld+json">${JSON.stringify(buildSchema(data.page))}</script>`;
  return String(html).replace('</head>', `${schemaScript}</head>`);
});

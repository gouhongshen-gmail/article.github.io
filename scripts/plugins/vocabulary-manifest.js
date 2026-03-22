/* global hexo */

'use strict';

const {
  extractLessonBlocks,
  hasVocabularyMetadata,
  parseLessonParagraphs
} = require('../lib/cnlesson-data');

const MANIFEST_VERSION = 1;

function withSiteRoot(pathname) {
  const root = String(hexo.config.root || '/').replace(/\/$/, '');
  return `${root}/${String(pathname || '').replace(/^\//, '')}`;
}

function guessDifficulty(wordCount) {
  if (wordCount <= 12) {
    return 'beginner';
  }

  if (wordCount <= 28) {
    return 'intermediate';
  }

  return 'advanced';
}

function getPostTags(post) {
  if (!post.tags) {
    return [];
  }

  if (typeof post.tags.map === 'function') {
    return post.tags.map((tag) => tag.name);
  }

  return [];
}

hexo.extend.filter.register('after_generate', function() {
  const allWords = new Map();
  const articles = [];
  const posts = hexo.locals.get('posts').toArray();

  posts.forEach((post) => {
    const blocks = extractLessonBlocks(post.raw);
    const articleWords = [];
    const rootedPath = withSiteRoot(post.path);

    blocks.forEach((block) => {
      const paragraphs = parseLessonParagraphs(block);

      paragraphs.forEach((sentences) => {
        sentences.forEach((sentence) => {
          sentence.segments
            .filter(hasVocabularyMetadata)
            .forEach((segment) => {
              if (!allWords.has(segment.wordId)) {
                allWords.set(segment.wordId, {
                  id       : segment.wordId,
                  text     : segment.text,
                  pinyin   : segment.pinyin,
                  gloss    : segment.gloss,
                  note     : segment.note || null,
                  articles : [],
                  frequency: 0
                });
              }

              const word = allWords.get(segment.wordId);
              word.articles.push(rootedPath);
              word.frequency += 1;
              articleWords.push(segment.wordId);
            });
        });
      });
    });

    if (!articleWords.length) {
      return;
    }

    articles.push({
      path      : rootedPath,
      title     : post.title,
      date      : post.date.format('YYYY-MM-DD'),
      wordCount : articleWords.length,
      tags      : getPostTags(post),
      difficulty: guessDifficulty(articleWords.length)
    });
  });

  const words = Array.from(allWords.values())
    .map((word) => Object.assign({}, word, {
      articles: Array.from(new Set(word.articles))
    }))
    .sort((left, right) => left.text.localeCompare(right.text, 'zh-CN'));

  const vocabulary = {
    version    : MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    totalWords : words.length,
    words
  };

  const articleMeta = {
    version: MANIFEST_VERSION,
    articles
  };

  hexo.route.set('api/vocabulary.json', JSON.stringify(vocabulary, null, 2));
  hexo.route.set('api/articles-meta.json', JSON.stringify(articleMeta, null, 2));
});

/* global hexo */

'use strict';

const yaml = require('js-yaml');

function parseLessonContent(content) {
  if (!content || !content.trim()) {
    throw new Error('[cnlesson] The tag body cannot be empty.');
  }

  let parsed;
  try {
    parsed = yaml.load(content);
  } catch (error) {
    throw new Error(`[cnlesson] Invalid YAML: ${error.message}`);
  }

  const paragraphs = Array.isArray(parsed)
    ? [parsed]
    : parsed && Array.isArray(parsed.sentences)
      ? [parsed.sentences]
      : parsed && Array.isArray(parsed.paragraphs)
        ? parsed.paragraphs.map((paragraph, index) => {
          if (Array.isArray(paragraph)) {
            return paragraph;
          }

          if (paragraph && Array.isArray(paragraph.sentences)) {
            return paragraph.sentences;
          }

          throw new Error(`[cnlesson] Paragraph ${index + 1} must be an array or an object with a "sentences" array.`);
        })
        : null;

  if (!paragraphs || paragraphs.length === 0) {
    throw new Error('[cnlesson] Provide a YAML array, an object with "sentences", or an object with "paragraphs".');
  }

  return paragraphs;
}

function normalizeWordKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function fallbackWordId(text) {
  const codepoints = Array.from(String(text || ''))
    .map((character) => character.codePointAt(0).toString(16))
    .join('-');

  return codepoints ? `word-${codepoints}` : 'word';
}

function generateWordId(segment) {
  const normalizedPinyin = normalizeWordKey(segment && segment.pinyin ? segment.pinyin : '');
  if (normalizedPinyin) {
    return normalizedPinyin;
  }

  return fallbackWordId(segment && segment.text ? segment.text : '');
}

function hasVocabularyMetadata(segment) {
  return Boolean(segment && typeof segment === 'object' && !Array.isArray(segment)
    && segment.text
    && (segment.gloss || segment.pinyin || segment.audio || segment.note));
}

function normalizeSegment(segment, sentenceIndex, segmentIndex) {
  if (typeof segment === 'string') {
    return String(segment);
  }

  if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
    throw new Error(`[cnlesson] Segment ${segmentIndex + 1} in sentence ${sentenceIndex + 1} must be a string or object.`);
  }

  if (!segment.text) {
    throw new Error(`[cnlesson] Segment ${segmentIndex + 1} in sentence ${sentenceIndex + 1} must include "text".`);
  }

  const normalized = {
    text  : String(segment.text),
    gloss : segment.gloss ? String(segment.gloss) : '',
    pinyin: segment.pinyin ? String(segment.pinyin) : '',
    audio : segment.audio ? String(segment.audio) : '',
    note  : segment.note ? String(segment.note) : ''
  };

  normalized.wordId = hasVocabularyMetadata(normalized) ? generateWordId(normalized) : '';
  return normalized;
}

function normalizeSentence(sentence, index) {
  if (!sentence || typeof sentence !== 'object' || Array.isArray(sentence)) {
    throw new Error(`[cnlesson] Sentence ${index + 1} must be an object.`);
  }

  if (!sentence.en || !sentence.zh) {
    throw new Error(`[cnlesson] Sentence ${index + 1} must include both "en" and "zh".`);
  }

  return {
    en      : String(sentence.en),
    zh      : String(sentence.zh),
    audio   : sentence.audio ? String(sentence.audio) : '',
    segments: Array.isArray(sentence.segments)
      ? sentence.segments.map((segment, segmentIndex) => normalizeSegment(segment, index, segmentIndex))
      : []
  };
}

function parseLessonParagraphs(content) {
  return parseLessonContent(content).map((paragraph, paragraphIndex) => {
    if (!Array.isArray(paragraph) || paragraph.length === 0) {
      throw new Error(`[cnlesson] Paragraph ${paragraphIndex + 1} must contain at least one sentence.`);
    }

    return paragraph.map(normalizeSentence);
  });
}

function extractLessonBlocks(markdown) {
  const blocks = [];
  const pattern = /\{%\s*(cnlesson|lesson)(?:\s+[^%]*)?\s*%\}([\s\S]*?)\{%\s*end\1\s*%\}/g;
  let match = pattern.exec(String(markdown || ''));

  while (match) {
    blocks.push(match[2]);
    match = pattern.exec(String(markdown || ''));
  }

  return blocks;
}

module.exports = {
  extractLessonBlocks,
  generateWordId,
  hasVocabularyMetadata,
  parseLessonContent,
  parseLessonParagraphs
};

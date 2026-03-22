/* global hexo */

'use strict';

const { escapeHTML } = require('hexo-util');
const {
  hasVocabularyMetadata,
  parseLessonParagraphs
} = require('../lib/cnlesson-data');

let lessonBlockCounter = 0;

const speakerIcon = `
<svg class="cn-lesson__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z"></path>
</svg>`;

function escapeAttr(value) {
  return escapeHTML(String(value));
}

function renderMarkdown(markdown) {
  return hexo.render.renderSync({
    text  : String(markdown).trim(),
    engine: 'markdown'
  }).trim();
}

function unwrapSingleParagraph(html) {
  const trimmed = String(html).trim();
  const match = trimmed.match(/^<p>([\s\S]*)<\/p>$/);
  return match ? match[1].trim() : trimmed;
}

function renderSegment(segment, sentenceIndex, segmentIndex) {
  if (typeof segment === 'string') {
    return `<span class="cn-lesson__plain-text">${escapeHTML(segment)}</span>`;
  }

  if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
    throw new Error(`[cnlesson] Segment ${segmentIndex + 1} in sentence ${sentenceIndex + 1} must be a string or object.`);
  }

  if (!segment.text) {
    throw new Error(`[cnlesson] Segment ${segmentIndex + 1} in sentence ${sentenceIndex + 1} must include "text".`);
  }

  const text = String(segment.text);
  const gloss = segment.gloss ? String(segment.gloss) : '';
  const pinyin = segment.pinyin ? String(segment.pinyin) : '';
  const audio = segment.audio ? String(segment.audio) : '';
  const note = segment.note ? String(segment.note) : '';

  if (!hasVocabularyMetadata(segment)) {
    return `<span class="cn-lesson__plain-text">${escapeHTML(text)}</span>`;
  }

  const audioAttr = audio ? ` data-audio="${escapeAttr(audio)}"` : '';
  const noteAttr = note ? ` data-note="${escapeAttr(note)}"` : '';
  const wordIdAttr = segment.wordId ? ` data-word-id="${escapeAttr(segment.wordId)}"` : '';

  return `
    <button
      type="button"
      class="cn-lesson__token"
      data-cn-token=""
      data-text="${escapeAttr(text)}"
      data-gloss="${escapeAttr(gloss)}"
      data-pinyin="${escapeAttr(pinyin)}"${audioAttr}${noteAttr}${wordIdAttr}
      aria-label="Show learning note for ${escapeAttr(text)}"
    >${escapeHTML(text)}</button>`;
}

function renderSegments(sentence, sentenceIndex) {
  if (!sentence.segments.length) {
    return `<span class="cn-lesson__plain-text">${escapeHTML(sentence.zh)}</span>`;
  }

  return sentence.segments.map((segment, segmentIndex) => renderSegment(segment, sentenceIndex, segmentIndex)).join('');
}

function renderSentence(sentence, blockId, paragraphIndex, sentenceIndex) {
  const translationId = `cn-lesson-translation-${blockId}-${paragraphIndex + 1}-${sentenceIndex + 1}`;
  const englishHtml = unwrapSingleParagraph(renderMarkdown(sentence.en));
  const sentenceAudioAttr = sentence.audio ? ` data-audio="${escapeAttr(sentence.audio)}"` : '';

  return `
    <span class="cn-lesson__sentence" data-cn-lesson-sentence="">
      <button
        type="button"
        class="cn-lesson__toggle"
        aria-expanded="false"
        aria-controls="${translationId}"
        aria-label="Toggle Chinese translation for sentence ${sentenceIndex + 1}"
      >CN</button>

      <span class="cn-lesson__english" lang="en">
          ${englishHtml}
      </span>

      <span class="cn-lesson__translation" id="${translationId}" hidden>
          <button
            type="button"
            class="cn-lesson__audio"
            data-cn-audio=""
            data-text="${escapeAttr(sentence.zh)}"${sentenceAudioAttr}
            aria-label="Play Chinese audio for sentence ${sentenceIndex + 1}"
          >
            ${speakerIcon}
            <span class="cn-lesson__visually-hidden">Play Chinese audio</span>
          </button>

          <span class="cn-lesson__translation-text" lang="zh-CN">
            ${renderSegments(sentence, sentenceIndex)}
          </span>
      </span>
    </span>`;
}

function renderParagraph(sentences, blockId, paragraphIndex) {
  const sentenceHtml = sentences
    .map((sentence, sentenceIndex) => renderSentence(sentence, blockId, paragraphIndex, sentenceIndex))
    .join('\n');

  return `<p class="cn-lesson__paragraph">${sentenceHtml}</p>`;
}

function renderLesson(content) {
  const blockId = lessonBlockCounter++;
  const paragraphs = parseLessonParagraphs(content);
  const lessonHtml = paragraphs
    .map((paragraph, paragraphIndex) => renderParagraph(paragraph, blockId, paragraphIndex))
    .join('\n');

  return `<section class="cn-lesson" data-cn-lesson="">${lessonHtml}</section>`;
}

hexo.extend.tag.register('cnlesson', (args, content) => renderLesson(content), { ends: true });
hexo.extend.tag.register('lesson', (args, content) => renderLesson(content), { ends: true });

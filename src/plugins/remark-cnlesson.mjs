import yaml from 'yaml';
import { visit } from 'unist-util-visit';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validateSentence(item, index) {
  if (typeof item.en !== 'string' || !item.en.trim()) {
    throw new Error(
      `cnlesson: sentence ${index} missing or invalid "en" field: ${JSON.stringify(item)}`
    );
  }
  if (typeof item.zh !== 'string' || !item.zh.trim()) {
    throw new Error(
      `cnlesson: sentence ${index} missing or invalid "zh" field: ${JSON.stringify(item)}`
    );
  }
  if (!Array.isArray(item.segments)) {
    throw new Error(
      `cnlesson: sentence ${index} missing or invalid "segments" array: ${JSON.stringify(item)}`
    );
  }
  for (const [si, seg] of item.segments.entries()) {
    if (typeof seg.text !== 'string' || !seg.text) {
      throw new Error(
        `cnlesson: sentence ${index}, segment ${si} missing "text": ${JSON.stringify(seg)}`
      );
    }
  }
}

function renderSegment(seg) {
  const text = escapeHtml(seg.text);
  if (seg.gloss || seg.pinyin) {
    const attrs = [];
    if (seg.pinyin) attrs.push(`data-pinyin="${escapeHtml(seg.pinyin)}"`);
    if (seg.gloss) attrs.push(`data-gloss="${escapeHtml(seg.gloss)}"`);
    attrs.push('tabindex="0"');
    return `<span class="vocab-token" ${attrs.join(' ')}>${text}</span>`;
  }
  return `<span>${text}</span>`;
}

function renderPair(item) {
  const segments = item.segments.map(renderSegment).join('');
  const en = escapeHtml(item.en.trim());
  return [
    '<div class="cnlesson-pair">',
    `  <p class="cnlesson-zh" lang="zh-CN">${segments}</p>`,
    `  <p class="cnlesson-en" lang="en">${en}</p>`,
    '</div>',
  ].join('\n');
}

export default function remarkCnlesson() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'cnlesson') return;

      const sentences = yaml.parse(node.value);

      if (!Array.isArray(sentences)) {
        throw new Error(
          'cnlesson: content must be a YAML array of sentence objects'
        );
      }

      sentences.forEach((item, i) => validateSentence(item, i));

      const inner = sentences.map(renderPair).join('\n');
      const html = `<div class="cnlesson">\n${inner}\n</div>`;

      parent.children[index] = { type: 'html', value: html };
    });
  };
}

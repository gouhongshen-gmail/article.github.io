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

function renderPair(item, blockIdx, sentIdx) {
  const id = item.id || `s${blockIdx}-${sentIdx}`;
  const segments = item.segments.map(renderSegment).join('');
  const en = escapeHtml(item.en.trim());
  return [
    `<div class="cnlesson-pair" data-sentence-id="${id}">`,
    `  <p class="cnlesson-zh" lang="zh-CN">${segments}</p>`,
    `  <p class="cnlesson-en" lang="en">${en}</p>`,
    '</div>',
  ].join('\n');
}

// Track block index across tree for unique IDs
let blockCounter = 0;

export default function remarkCnlesson() {
  return (tree) => {
    blockCounter = 0;

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'cnlesson') return;

      const sentences = yaml.parse(node.value);

      if (!Array.isArray(sentences)) {
        throw new Error(
          'cnlesson: content must be a YAML array of sentence objects'
        );
      }

      sentences.forEach((item, i) => validateSentence(item, i));

      const bi = blockCounter++;
      const inner = sentences.map((s, si) => renderPair(s, bi, si)).join('\n');
      const html = `<div class="cnlesson" data-block="${bi}">\n${inner}\n</div>`;

      parent.children[index] = { type: 'html', value: html };
    });
  };
}

import { describe, it, expect } from 'vitest';
import remarkCnlesson from '../remark-cnlesson.mjs';

/**
 * Helper to create a minimal AST tree for testing
 */
function makeTree(lang, value) {
  return {
    type: 'root',
    children: [{ type: 'code', lang, value }],
  };
}

describe('remark-cnlesson plugin', () => {
  describe('Valid YAML with segments', () => {
    it('should produce HTML with cnlesson and pair classes', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      expect(tree.children[0].type).toBe('html');
      expect(tree.children[0].value).toContain('class="cnlesson"');
      expect(tree.children[0].value).toContain('class="cnlesson-pair"');
    });

    it('should produce cnlesson-zh and cnlesson-en elements', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('class="cnlesson-zh"');
      expect(html).toContain('class="cnlesson-en"');
      expect(html).toContain('你');
      expect(html).toContain('好');
      expect(html).toContain('Hello');
    });

    it('should wrap segments in span tags', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('<span>你</span>');
      expect(html).toContain('<span>好</span>');
    });
  });

  describe('Vocab tokens with pinyin and gloss', () => {
    it('should have vocab-token class for segment with pinyin', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
      pinyin: nǐ`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('class="vocab-token"');
      expect(html).toContain('data-pinyin="nǐ"');
    });

    it('should have vocab-token class for segment with gloss', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
      gloss: you`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('class="vocab-token"');
      expect(html).toContain('data-gloss="you"');
    });

    it('should have both pinyin and gloss attributes when present', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
      pinyin: nǐ
      gloss: you`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('class="vocab-token"');
      expect(html).toContain('data-pinyin="nǐ"');
      expect(html).toContain('data-gloss="you"');
      expect(html).toContain('tabindex="0"');
    });

    it('should escape HTML in pinyin and gloss', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
      pinyin: nǐ<script>alert('xss')</script>
      gloss: you&dangerous`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;dangerous');
      expect(html).not.toContain('<script>');
    });
  });

  describe('Segment without pinyin or gloss', () => {
    it('should NOT have vocab-token class', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 。`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('<span>。</span>');
      expect(html).not.toContain('class="vocab-token"');
    });

    it('should mix vocab-token and regular spans', () => {
      const yaml = `- en: Hello world
  zh: 你好世界
  segments:
    - text: 你
      pinyin: nǐ
    - text: 好
    - text: 世
      gloss: world
    - text: 界`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('class="vocab-token"');
      expect(html).toContain('<span>好</span>');
      expect(html).toContain('<span>界</span>');
    });
  });

  describe('Error handling', () => {
    it('should throw error for missing "en" field', () => {
      const yaml = `- zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson.*sentence 0.*missing or invalid "en"/
      );
    });

    it('should throw error for empty "en" field', () => {
      const yaml = `- en: ""
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson.*sentence 0.*missing or invalid "en"/
      );
    });

    it('should throw error for missing "zh" field', () => {
      const yaml = `- en: Hello
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson.*sentence 0.*missing or invalid "zh"/
      );
    });

    it('should throw error for missing "segments" field', () => {
      const yaml = `- en: Hello
  zh: 你好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson.*sentence 0.*missing or invalid "segments"/
      );
    });

    it('should throw error for segment missing "text" field', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - pinyin: nǐ`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson.*sentence 0.*segment 0.*missing "text"/
      );
    });

    it('should throw error for non-array YAML content', () => {
      const yaml = `en: Hello
zh: 你好
segments:
  - text: 你`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(
        /cnlesson: content must be a YAML array/
      );
    });

    it('should identify which sentence has the error', () => {
      const yaml = `- en: First
  zh: 第一
  segments:
    - text: 第
    - text: 一
- en: ""
  zh: 第二
  segments:
    - text: 第`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();

      expect(() => plugin(tree)).toThrow(/sentence 1/);
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML in Chinese text', () => {
      const yaml = `- en: Test
  zh: 你好<script>alert('xss')</script>
  segments:
    - text: 你好<script>alert('xss')</script>`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('should escape HTML in English text', () => {
      const yaml = `- en: Hello <img src=x>
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('&lt;img');
      expect(html).not.toContain('<img src');
    });

    it('should escape ampersands', () => {
      const yaml = `- en: A & B
  zh: A & B
  segments:
    - text: A & B`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('&amp;');
      expect(html).not.toContain('A & B');
    });

    it('should escape quotes in attributes', () => {
      const yaml = `- en: Test
  zh: 你好
  segments:
    - text: 你
      pinyin: nǐ"malicious`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('&quot;');
      expect(html).not.toContain('nǐ"malicious');
    });
  });

  describe('Non-cnlesson code blocks', () => {
    it('should not transform code blocks with different lang', () => {
      const tree = makeTree('javascript', 'const x = 5;');
      const plugin = remarkCnlesson();
      plugin(tree);

      expect(tree.children[0].type).toBe('code');
      expect(tree.children[0].value).toBe('const x = 5;');
    });

    it('should preserve multiple code blocks, transforming only cnlesson', () => {
      const tree = {
        type: 'root',
        children: [
          { type: 'code', lang: 'javascript', value: 'const x = 5;' },
          {
            type: 'code',
            lang: 'cnlesson',
            value: `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`,
          },
          { type: 'code', lang: 'python', value: 'print("hello")' },
        ],
      };

      const plugin = remarkCnlesson();
      plugin(tree);

      expect(tree.children[0].type).toBe('code');
      expect(tree.children[1].type).toBe('html');
      expect(tree.children[2].type).toBe('code');
    });
  });

  describe('Multiple sentences', () => {
    it('should handle multiple sentences in one block', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好
- en: Goodbye
  zh: 再见
  segments:
    - text: 再
    - text: 见`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('你');
      expect(html).toContain('好');
      expect(html).toContain('Hello');
      expect(html).toContain('再');
      expect(html).toContain('见');
      expect(html).toContain('Goodbye');
    });

    it('should create separate cnlesson-pair divs for each sentence', () => {
      const yaml = `- en: First
  zh: 第一个
  segments:
    - text: 第一个
- en: Second
  zh: 第二个
  segments:
    - text: 第二个`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      const pairCount = (html.match(/class="cnlesson-pair"/g) || []).length;
      expect(pairCount).toBe(2);
    });
  });

  describe('Language attributes', () => {
    it('should set lang="zh-CN" on Chinese text', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('lang="zh-CN"');
    });

    it('should set lang="en" on English text', () => {
      const yaml = `- en: Hello
  zh: 你好
  segments:
    - text: 你
    - text: 好`;

      const tree = makeTree('cnlesson', yaml);
      const plugin = remarkCnlesson();
      plugin(tree);

      const html = tree.children[0].value;
      expect(html).toContain('lang="en"');
    });
  });
});

<script>
  import StoryReader from './StoryReader.svelte';

  /** @type {import('./StoryReader.svelte').Sentence[]} */
  const demoData = [
    {
      id: 'demo-1',
      en: 'The Silk Road was an ancient trade route between China and the West.',
      zh: '丝绸之路是中国和西方之间的古代贸易路线。',
      segments: [
        { text: '丝绸之路', pinyin: 'sīchóu zhī lù', gloss: 'Silk Road' },
        { text: '是' },
        { text: '中国', pinyin: 'zhōngguó', gloss: 'China' },
        { text: '和' },
        { text: '西方', pinyin: 'xīfāng', gloss: 'West' },
        { text: '之间的' },
        { text: '古代', pinyin: 'gǔdài', gloss: 'ancient' },
        { text: '贸易', pinyin: 'màoyì', gloss: 'trade' },
        { text: '路线。' },
      ],
    },
    {
      id: 'demo-2',
      en: 'For many years, China and Rome did not know each other.',
      zh: '很多年里，中国和罗马不认识彼此。',
      segments: [
        { text: '很多年里，' },
        { text: '中国', pinyin: 'zhōngguó', gloss: 'China' },
        { text: '和' },
        { text: '罗马', pinyin: 'luómǎ', gloss: 'Rome' },
        { text: '不' },
        { text: '认识', pinyin: 'rènshi', gloss: 'to know' },
        { text: '彼此。' },
      ],
    },
    {
      id: 'demo-3',
      en: 'Then merchants began to travel along the routes and exchange goods.',
      zh: '后来商人开始沿着路线旅行和交换商品。',
      segments: [
        { text: '后来', pinyin: 'hòulái', gloss: 'later' },
        { text: '商人', pinyin: 'shāngrén', gloss: 'merchant' },
        { text: '开始', pinyin: 'kāishǐ', gloss: 'to begin' },
        { text: '沿着', pinyin: 'yánzhe', gloss: 'along' },
        { text: '路线', pinyin: 'lùxiàn', gloss: 'route' },
        { text: '旅行', pinyin: 'lǚxíng', gloss: 'to travel' },
        { text: '和' },
        { text: '交换', pinyin: 'jiāohuàn', gloss: 'to exchange' },
        { text: '商品。' },
      ],
    },
  ];

  // Auto-demo: expand first sentence after a short delay
  let autoPlayed = $state(false);

  $effect(() => {
    if (!autoPlayed) {
      const timer = setTimeout(() => { autoPlayed = true; }, 1500);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="demo-container">
  <div class="demo-container__label">
    <span class="demo-container__badge">Interactive</span>
    From "The Silk Road" — click any sentence
  </div>
  <div class="demo-container__reader">
    <StoryReader data={demoData} showPinyin={true} />
  </div>
</div>

<style>
  .demo-container {
    border: 2px solid var(--color-gold, #cda434);
    border-radius: 16px;
    background: linear-gradient(
      180deg,
      var(--color-parchment, #f5f0e6) 0%,
      var(--color-surface, #eae5db) 100%
    );
    box-shadow: 0 12px 32px rgba(28, 25, 23, 0.08);
    overflow: hidden;
  }

  .demo-container__label {
    padding: 12px 20px;
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
    border-bottom: 1px solid rgba(205, 164, 52, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .demo-container__badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-gold, #cda434);
    color: white;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .demo-container__reader {
    padding: 8px 4px;
  }

  /* Override StoryReader container styles inside demo */
  .demo-container__reader :global(.sr-reader) {
    margin: 0;
    border: none;
    background: transparent;
    border-radius: 0;
  }
</style>

<script>
  /** @typedef {{ id: string, en: string, zh: string, segments: Array<{text: string, pinyin?: string, gloss?: string}> }} Sentence */

  let {
    /** @type {'en-first' | 'zh-first'} */
    direction = 'en-first',
    showPinyin = true,
    children,
  } = $props();

  /** @type {Sentence[]} */
  let sentences = $state([]);
  /** @type {number | null} */
  let expandedIdx = $state(null);
  /** @type {HTMLElement | null} */
  let contentEl = $state(null);

  // Parse cnlesson-pair elements from the slotted DOM
  function parseFromDom(container) {
    if (!container) return [];
    const pairs = container.querySelectorAll('.cnlesson-pair');
    /** @type {Sentence[]} */
    const result = [];
    pairs.forEach((pair, i) => {
      const zhEl = pair.querySelector('.cnlesson-zh');
      const enEl = pair.querySelector('.cnlesson-en');
      if (!zhEl || !enEl) return;

      const id = pair.getAttribute('data-sentence-id') || `s-${i}`;
      const segments = [];
      zhEl.querySelectorAll('span').forEach(span => {
        segments.push({
          text: span.textContent || '',
          pinyin: span.dataset.pinyin || undefined,
          gloss: span.dataset.gloss || undefined,
        });
      });

      result.push({
        id,
        en: enEl.textContent?.trim() || '',
        zh: zhEl.textContent?.trim() || '',
        segments,
      });
    });
    return result;
  }

  $effect(() => {
    if (contentEl) {
      sentences = parseFromDom(contentEl);
    }
  });

  function toggleSentence(idx) {
    expandedIdx = expandedIdx === idx ? null : idx;
  }
</script>

<!-- Hidden: original slot content (parsed for data) -->
<div bind:this={contentEl} class="sr-source" class:sr-source--hidden={sentences.length > 0} aria-hidden={sentences.length > 0 ? 'true' : undefined}>
  {@render children?.()}
</div>

<!-- Rendered: new paragraph reading view -->
{#if sentences.length > 0}
  <div
    class="sr-reader"
    class:sr-zh-first={direction === 'zh-first'}
    data-pinyin={showPinyin ? 'visible' : 'hidden'}
  >
    {#if direction === 'en-first'}
      <!-- English-first: flowing English paragraph, click to expand Chinese -->
      <div class="sr-paragraph">
        {#each sentences as sentence, idx}
          <button
            class="sr-sentence"
            class:sr-sentence--active={expandedIdx === idx}
            onclick={() => toggleSentence(idx)}
            aria-expanded={expandedIdx === idx}
          >
            {sentence.en}
          </button>
          {#if expandedIdx === idx}
            <div class="sr-expansion" data-sentence-id={sentence.id}>
              <p class="sr-zh" lang="zh-CN">
                {#each sentence.segments as seg}
                  {#if seg.pinyin || seg.gloss}
                    <span
                      class="vocab-token"
                      data-pinyin={seg.pinyin || undefined}
                      data-gloss={seg.gloss || undefined}
                      tabindex="0"
                    >{seg.text}</span>
                  {:else}
                    <span>{seg.text}</span>
                  {/if}
                {/each}
              </p>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Chinese-first: flowing Chinese, click to expand English -->
      {#each sentences as sentence, idx}
        <div class="sr-zh-block" data-sentence-id={sentence.id}>
          <button
            class="sr-zh sr-zh--clickable"
            lang="zh-CN"
            onclick={() => toggleSentence(idx)}
            aria-expanded={expandedIdx === idx}
          >
            {#each sentence.segments as seg}
              {#if seg.pinyin || seg.gloss}
                <span
                  class="vocab-token"
                  data-pinyin={seg.pinyin || undefined}
                  data-gloss={seg.gloss || undefined}
                  tabindex="0"
                >{seg.text}</span>
              {:else}
                <span>{seg.text}</span>
              {/if}
            {/each}
          </button>
          {#if expandedIdx === idx}
            <p class="sr-en-expansion">{sentence.en}</p>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/if}

<style>
  /* Hide original slotted content once StoryReader has parsed it */
  .sr-source--hidden {
    display: none !important;
  }

  /* Reader container */
  .sr-reader {
    margin-block: var(--space-xl);
    padding: var(--space-lg);
    background-color: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-subtle);
  }

  /* English paragraph: sentences flow naturally */
  .sr-paragraph {
    font-family: var(--font-body-en);
    font-size: var(--reading-font-size, var(--text-body));
    line-height: 1.75;
    color: var(--color-text-primary);
  }

  /* Individual sentence (clickable) */
  .sr-sentence {
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 150ms ease;
    padding: 1px 0;
    /* Reset button styles */
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    display: inline;
  }

  .sr-sentence:hover {
    background-color: rgba(35, 122, 99, 0.06);
  }

  .sr-sentence--active {
    background-color: rgba(35, 122, 99, 0.1);
  }

  .sr-sentence:focus-visible {
    outline: 2px solid var(--color-jade, #237a63);
    outline-offset: 1px;
  }

  /* Chinese expansion below the sentence */
  .sr-expansion {
    display: block;
    padding: 8px 0 12px 0;
    border-left: 3px solid var(--color-jade, #237a63);
    padding-left: 12px;
    margin: 4px 0 8px;
    animation: sr-expand 250ms ease-out;
  }

  @keyframes sr-expand {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Chinese text styling */
  .sr-zh {
    font-family: var(--font-display-cn, 'Noto Serif SC', serif);
    font-size: 1.15em;
    line-height: 1.8;
    color: var(--color-text-primary);
    margin: 0;
    letter-spacing: 0.02em;
  }

  /* Vocab tokens in new reader */
  .sr-reader :global(.vocab-token) {
    position: relative;
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 150ms ease;
  }

  .sr-reader :global(.vocab-token:hover),
  .sr-reader :global(.vocab-token:focus) {
    background-color: rgba(35, 122, 99, 0.12);
  }

  /* Pinyin display */
  .sr-reader :global(.vocab-token[data-pinyin])::before {
    content: attr(data-pinyin);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-family: var(--font-body-en, system-ui);
    color: var(--color-text-secondary);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease;
  }

  .sr-reader[data-pinyin="visible"] :global(.vocab-token[data-pinyin])::before {
    opacity: 1;
  }

  .sr-reader :global(.vocab-token[data-pinyin]:hover)::before,
  .sr-reader :global(.vocab-token[data-pinyin]:focus)::before {
    opacity: 1;
  }

  /* Extra line-height when pinyin visible */
  .sr-reader[data-pinyin="visible"] .sr-zh {
    line-height: 2.4;
  }

  /* ---- Chinese-first mode ---- */
  .sr-zh--clickable {
    cursor: pointer;
    border-radius: 4px;
    padding: 4px 0;
    transition: background-color 150ms ease;
    /* Reset button styles */
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    display: block;
    width: 100%;
  }

  .sr-zh--clickable:hover {
    background-color: rgba(35, 122, 99, 0.06);
  }

  .sr-zh-block {
    margin-bottom: var(--space-md);
  }

  .sr-zh-block:last-child {
    margin-bottom: 0;
  }

  .sr-en-expansion {
    font-family: var(--font-body-en, system-ui);
    font-size: var(--text-small);
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 4px 0 0;
    padding-left: 12px;
    border-left: 3px solid var(--color-gold, #cda434);
    animation: sr-expand 250ms ease-out;
  }

  /* Difficulty-based sizing */
  :global([data-difficulty="beginner"]) .sr-zh {
    font-size: 1.4em;
    letter-spacing: 0.04em;
    line-height: 2;
  }

  :global([data-difficulty="intermediate"]) .sr-zh {
    font-size: 1.25em;
    letter-spacing: 0.02em;
    line-height: 1.9;
  }

  :global([data-difficulty="advanced"]) .sr-zh {
    font-size: 1.15em;
    letter-spacing: 0.01em;
    line-height: 1.8;
  }
</style>

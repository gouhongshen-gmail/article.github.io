<script>
  import PinyinKeyboard from './PinyinKeyboard.svelte';

  const TONE_MAP = {
    ā: 'a', á: 'a', ǎ: 'a', à: 'a',
    ē: 'e', é: 'e', ě: 'e', è: 'e',
    ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
    ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
    ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
    ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
  };

  function stripChinese(text = '') {
    return text.replace(/[^\u4e00-\u9fff]/g, '');
  }

  function normalizePinyin(pinyin = '') {
    return pinyin
      .trim()
      .toLowerCase()
      .replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (m) => TONE_MAP[m] || m)
      .replace(/\s+/g, '');
  }

  let {
    sentence = /** @type {{ zh: string, en: string, segments: Array<{text: string, pinyin?: string}> } | null} */ (null),
    guided = true,
    onComplete = /** @type {() => void} */ (() => {}),
    onClose = /** @type {() => void} */ (() => {}),
  } = $props();

  let guidedMode = $state(guided);
  let typedInputs = $state(/** @type {string[]} */ ([]));
  let mistakes = $state(0);
  let currentSentenceKey = $state('');
  let completionKey = $state('');

  let units = $derived(
    (sentence?.segments ?? [])
      .map((seg, index) => {
        const text = stripChinese(seg.text || '');
        if (!text) return null;
        return {
          id: `unit-${index}`,
          text,
          pinyin: normalizePinyin(seg.pinyin || ''),
          requiresInput: Boolean(seg.pinyin && normalizePinyin(seg.pinyin || '')),
        };
      })
      .filter(Boolean)
  );

  let inputUnits = $derived(units.filter((unit) => unit.requiresInput));
  let targetText = $derived(units.map((unit) => unit.text).join(''));

  let revealedText = $derived.by(() => {
    let result = '';
    let inputIdx = 0;
    for (const unit of units) {
      if (unit.requiresInput) {
        if (inputIdx < typedInputs.length) {
          result += typedInputs[inputIdx];
          inputIdx += 1;
        } else {
          break;
        }
      } else {
        result += unit.text;
      }
    }
    return result;
  });

  let currentUnit = $derived(inputUnits[typedInputs.length] ?? null);
  let isComplete = $derived(inputUnits.length === 0 || typedInputs.length >= inputUnits.length);
  let accuracy = $derived(
    typedInputs.length + mistakes > 0
      ? Math.round((typedInputs.length / (typedInputs.length + mistakes)) * 100)
      : 100
  );

  $effect(() => {
    const nextKey = sentence?.zh || '';
    if (nextKey && nextKey !== currentSentenceKey) {
      currentSentenceKey = nextKey;
      typedInputs = [];
      mistakes = 0;
      completionKey = '';
    }
  });

  $effect(() => {
    if (isComplete && currentSentenceKey && completionKey !== currentSentenceKey) {
      completionKey = currentSentenceKey;
      const timer = setTimeout(() => onComplete(), 500);
      return () => clearTimeout(timer);
    }
  });

  function handleSelect(candidate) {
    if (!currentUnit) return;
    const normalizedCandidate = stripChinese(candidate);
    if (normalizedCandidate === currentUnit.text) {
      typedInputs = [...typedInputs, currentUnit.text];
    } else {
      mistakes += 1;
      const el = document.querySelector('.tp-current');
      if (el) {
        el.classList.add('tp-shake');
        setTimeout(() => el.classList.remove('tp-shake'), 400);
      }
    }
  }

  function handleBackspace() {
    if (typedInputs.length > 0) {
      typedInputs = typedInputs.slice(0, -1);
      completionKey = '';
    }
  }

  function restart() {
    typedInputs = [];
    mistakes = 0;
    completionKey = '';
  }
</script>

{#if sentence}
  <div class="tp" role="region" aria-label="Typing practice">
    <div class="tp-header">
      <h3 class="tp-title">打字练习</h3>
      <div class="tp-controls">
        <label class="tp-toggle">
          <input type="checkbox" bind:checked={guidedMode} />
          <span>{guidedMode ? '引导' : '盲打'}</span>
        </label>
        <button class="tp-close" onclick={onClose} aria-label="Close">✕</button>
      </div>
    </div>

    <p class="tp-reference">{sentence.en}</p>
    <p class="tp-help">只练带拼音的词块；未注音字词会自动填入。</p>

    <div class="tp-chars">
      {#each targetText.split('') as char, i}
        <span
          class="tp-char"
          class:tp-typed={i < revealedText.length}
          class:tp-current={currentUnit && i >= revealedText.length && i < revealedText.length + currentUnit.text.length}
          class:tp-upcoming={!currentUnit || i >= revealedText.length + (currentUnit?.text.length ?? 0)}
        >
          {#if i < revealedText.length}
            {char}
          {:else if currentUnit && i < revealedText.length + currentUnit.text.length}
            <span class="tp-char-hint">{guidedMode ? char : '·'}</span>
          {:else}
            {guidedMode ? char : '·'}
          {/if}
        </span>
      {/each}
    </div>

    <div class="tp-stats">
      <span>进度: {revealedText.length}/{targetText.length}</span>
      <span>准确率: {accuracy}%</span>
      {#if isComplete}
        <span class="tp-complete">✓ 完成!</span>
      {/if}
    </div>

    {#if isComplete}
      <div class="tp-actions">
        <button class="tp-btn tp-btn--secondary" onclick={restart}>再来一次</button>
        <button class="tp-btn tp-btn--primary" onclick={onClose}>继续阅读</button>
      </div>
    {:else}
      <PinyinKeyboard
        visible={true}
        guided={guidedMode}
        expectedPinyin={currentUnit?.pinyin || ''}
        onSelect={handleSelect}
        onBackspace={handleBackspace}
      />
    {/if}
  </div>
{/if}

<style>
  .tp {
    background: var(--color-elevated, #fff);
    border: 2px solid var(--color-gold, #cda434);
    border-radius: 16px;
    padding: 20px;
    max-width: 520px;
    margin: var(--space-lg) auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .tp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .tp-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary, #1c1917);
    margin: 0;
  }

  .tp-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tp-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
    cursor: pointer;
  }

  .tp-toggle input {
    accent-color: var(--color-jade, #237a63);
  }

  .tp-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    color: var(--color-text-secondary, #57534e);
    transition: background-color 100ms ease;
  }

  .tp-close:hover {
    background: var(--color-surface, #eae5db);
  }

  .tp-reference {
    font-size: 14px;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 8px;
    line-height: 1.5;
    font-style: italic;
  }

  .tp-help {
    font-size: 12px;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 16px;
    opacity: 0.8;
  }

  .tp-chars {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-bottom: 16px;
    min-height: 56px;
  }

  .tp-char {
    width: 44px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 24px;
    font-family: var(--font-display-cn, serif);
    font-weight: 500;
    transition: all 150ms ease;
  }

  .tp-typed {
    background: rgba(35, 122, 99, 0.1);
    color: var(--color-jade, #237a63);
    border: 1px solid rgba(35, 122, 99, 0.2);
  }

  .tp-current {
    background: rgba(205, 164, 52, 0.1);
    border: 2px solid var(--color-gold, #cda434);
    box-shadow: 0 0 8px rgba(205, 164, 52, 0.2);
  }

  .tp-char-hint {
    opacity: 0.3;
  }

  .tp-upcoming {
    background: var(--color-surface, #eae5db);
    color: var(--color-text-secondary, #57534e);
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    opacity: 0.6;
  }

  .tp-stats {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .tp-complete {
    color: var(--color-jade, #237a63);
    font-weight: 700;
  }

  .tp-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
  }

  .tp-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 100ms ease;
  }

  .tp-btn--primary {
    background: var(--color-jade, #237a63);
    color: white;
    border: none;
  }

  .tp-btn--secondary {
    background: none;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    color: var(--color-text-primary, #1c1917);
  }

  .tp-btn:hover {
    opacity: 0.85;
  }

  :global(.tp-shake) {
    animation: tp-shake 400ms ease;
  }

  @keyframes tp-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }

  @media (max-width: 480px) {
    .tp { padding: 12px; }
    .tp-char {
      width: 36px;
      height: 40px;
      font-size: 20px;
    }
  }
</style>

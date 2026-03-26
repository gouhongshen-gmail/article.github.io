<script>
  /**
   * PinyinKeyboard — Virtual QWERTY keyboard with tone selection and candidate bar.
   * Used in typing practice mode to input pinyin for Chinese characters.
   */

  let {
    /** Called when user selects a character from candidates */
    onSelect = /** @type {(char: string) => void} */ (() => {}),
    /** Called when user presses backspace */
    onBackspace = /** @type {() => void} */ (() => {}),
    /** Whether to highlight the next correct key */
    guided = true,
    /** The next expected pinyin syllable (for guided mode) */
    expectedPinyin = '',
    /** Whether keyboard is visible */
    visible = true,
  } = $props();

  let input = $state('');
  let candidates = $state(/** @type {string[]} */ ([]));
  let toneMode = $state(false);
  let dictLoaded = $state(false);
  let dict = $state(/** @type {Record<string, string[]>} */ ({}));

  // Keyboard layout
  const ROW1 = 'qwertyuiop'.split('');
  const ROW2 = 'asdfghjkl'.split('');
  const ROW3 = 'zxcvbnm'.split('');
  const TONES = ['ā', 'á', 'ǎ', 'à', '—'];

  // Load dictionary lazily
  $effect(() => {
    if (visible && !dictLoaded) {
      fetch('/data/pinyin-dict.json')
        .then(r => r.json())
        .then(data => { dict = data; dictLoaded = true; })
        .catch(() => { dictLoaded = true; });
    }
  });

  // Update candidates when input changes
  $effect(() => {
    if (input.length > 0 && dictLoaded) {
      const lower = input.toLowerCase();
      // Exact match first, then prefix matches
      const exact = dict[lower] || [];
      if (exact.length > 0) {
        candidates = exact.slice(0, 8);
      } else {
        // Find syllables starting with input
        const matches = Object.entries(dict)
          .filter(([k]) => k.startsWith(lower))
          .flatMap(([, v]) => v)
          .slice(0, 8);
        candidates = matches;
      }
    } else {
      candidates = [];
    }
  });

  // Check if key is the next expected key in guided mode
  function isExpectedKey(key) {
    if (!guided || !expectedPinyin) return false;
    const expected = expectedPinyin.toLowerCase();
    const nextChar = expected[input.length];
    return nextChar === key;
  }

  function pressKey(key) {
    input += key;
  }

  function backspace() {
    if (input.length > 0) {
      input = input.slice(0, -1);
    } else {
      onBackspace();
    }
  }

  function selectCandidate(char) {
    onSelect(char);
    input = '';
    candidates = [];
  }

  function clear() {
    input = '';
    candidates = [];
  }

  // Handle physical keyboard input
  function handleKeydown(e) {
    if (!visible) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Escape') {
      clear();
    } else if (e.key >= '1' && e.key <= '8' && candidates.length > 0) {
      e.preventDefault();
      const idx = parseInt(e.key) - 1;
      if (candidates[idx]) selectCandidate(candidates[idx]);
    } else if (e.key === ' ' && candidates.length > 0) {
      e.preventDefault();
      selectCandidate(candidates[0]);
    } else if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      pressKey(e.key.toLowerCase());
    }
  }

  $effect(() => {
    if (visible) {
      window.addEventListener('keydown', handleKeydown);
      return () => window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

{#if visible}
  <div class="pk" role="application" aria-label="Pinyin keyboard">
    <!-- Candidate bar -->
    <div class="pk-candidates" role="listbox" aria-label="Character candidates">
      {#if input}
        <span class="pk-input-display">{input}</span>
      {/if}
      {#each candidates as char, i}
        <button
          class="pk-candidate"
          role="option"
          onclick={() => selectCandidate(char)}
        >
          <span class="pk-candidate-num">{i + 1}</span>{char}
        </button>
      {/each}
      {#if input && candidates.length === 0 && dictLoaded}
        <span class="pk-no-match">无匹配</span>
      {/if}
    </div>

    <!-- Row 1: QWERTY -->
    <div class="pk-row">
      {#each ROW1 as key}
        <button
          class="pk-key"
          class:pk-key--glow={isExpectedKey(key)}
          onclick={() => pressKey(key)}
        >{key}</button>
      {/each}
    </div>

    <!-- Row 2: ASDF -->
    <div class="pk-row">
      <div class="pk-spacer-half"></div>
      {#each ROW2 as key}
        <button
          class="pk-key"
          class:pk-key--glow={isExpectedKey(key)}
          onclick={() => pressKey(key)}
        >{key}</button>
      {/each}
      <div class="pk-spacer-half"></div>
    </div>

    <!-- Row 3: ZXCV + backspace -->
    <div class="pk-row">
      <div class="pk-spacer"></div>
      {#each ROW3 as key}
        <button
          class="pk-key"
          class:pk-key--glow={isExpectedKey(key)}
          onclick={() => pressKey(key)}
        >{key}</button>
      {/each}
      <button class="pk-key pk-key--wide" onclick={backspace} aria-label="Backspace">⌫</button>
    </div>

    <!-- Row 4: space + clear -->
    <div class="pk-row pk-row--bottom">
      <button class="pk-key pk-key--space" onclick={() => {
        if (candidates.length > 0) selectCandidate(candidates[0]);
      }}>空格选字</button>
      <button class="pk-key pk-key--action" onclick={clear}>清除</button>
    </div>
  </div>
{/if}

<style>
  .pk {
    background: var(--color-elevated, #fff);
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 12px;
    padding: 8px;
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .pk-candidates {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    min-height: 40px;
    border-bottom: 1px solid var(--color-border-subtle, #d6d3d1);
    margin-bottom: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .pk-input-display {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-jade, #237a63);
    padding-right: 8px;
    border-right: 1px solid var(--color-border-subtle, #d6d3d1);
    margin-right: 4px;
    white-space: nowrap;
  }

  .pk-candidate {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 10px;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 6px;
    background: var(--color-surface, #eae5db);
    font-size: 18px;
    font-family: var(--font-display-cn, serif);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 100ms ease;
  }

  .pk-candidate:hover {
    background: rgba(35, 122, 99, 0.1);
  }

  .pk-candidate-num {
    font-size: 11px;
    color: var(--color-text-secondary, #57534e);
    font-family: var(--font-body-en, system-ui);
    margin-right: 2px;
  }

  .pk-no-match {
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
  }

  .pk-row {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .pk-row--bottom {
    margin-bottom: 0;
    gap: 8px;
  }

  .pk-spacer-half {
    width: 20px;
    flex-shrink: 0;
  }

  .pk-spacer {
    width: 36px;
    flex-shrink: 0;
  }

  .pk-key {
    width: 40px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 6px;
    background: var(--color-parchment, #f5f0e6);
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-primary, #1c1917);
    cursor: pointer;
    transition: background-color 80ms ease, box-shadow 80ms ease, transform 60ms ease;
    text-transform: lowercase;
    user-select: none;
    -webkit-user-select: none;
  }

  .pk-key:hover {
    background: var(--color-surface, #eae5db);
  }

  .pk-key:active {
    transform: scale(0.95);
    background: rgba(35, 122, 99, 0.08);
  }

  /* Guided mode: next correct key glows gold */
  .pk-key--glow {
    box-shadow: 0 0 8px 2px rgba(205, 164, 52, 0.4);
    border-color: var(--color-gold, #cda434);
    background: rgba(205, 164, 52, 0.08);
  }

  .pk-key--wide {
    width: 56px;
    font-size: 18px;
  }

  .pk-key--space {
    flex: 1;
    max-width: 200px;
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
  }

  .pk-key--action {
    width: 64px;
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
  }

  /* Responsive: smaller keys on narrow screens */
  @media (max-width: 480px) {
    .pk-key {
      width: 32px;
      height: 40px;
      font-size: 14px;
    }
    .pk-spacer-half { width: 12px; }
    .pk-spacer { width: 24px; }
    .pk-key--wide { width: 44px; }
  }
</style>

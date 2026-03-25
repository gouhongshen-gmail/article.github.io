<script>
  import { untrack } from 'svelte';

  const FONT_SIZE_KEY = 'longlore_font_size';
  const READING_MODE_KEY = 'longlore_reading_mode';
  const READING_DIR_KEY = 'longlore_reading_direction';
  const FONT_MIN = 14;
  const FONT_MAX = 24;
  const FONT_STEP = 2;
  const FONT_DEFAULT = 16;

  const MODES = {
    guided: { pinyin: true, translations: true },
    assisted: { pinyin: false, translations: true },
    immersive: { pinyin: false, translations: false }
  };

  let showTranslations = $state(true);
  let showPinyin = $state(true);
  let fontSize = $state(FONT_DEFAULT);
  let readingMode = $state('guided');
  let sepiaMode = $state(false);
  let readingDirection = $state('en-first');

  let modeLabel = $derived(
    ({ guided: '引导', assisted: '辅助', immersive: '沉浸' })[readingMode] ?? '模式'
  );

  let isZhFirst = $derived(readingDirection === 'zh-first');

  function loadPrefs() {
    try {
      const savedSize = localStorage.getItem(FONT_SIZE_KEY);
      if (savedSize) {
        fontSize = Math.max(FONT_MIN, Math.min(FONT_MAX, Number(savedSize)));
      }

      const savedMode = localStorage.getItem(READING_MODE_KEY);
      if (savedMode && MODES[savedMode]) {
        readingMode = savedMode;
        const mode = MODES[readingMode];
        showPinyin = mode.pinyin;
        showTranslations = mode.translations;
      }

      const savedDir = localStorage.getItem(READING_DIR_KEY);
      if (savedDir === 'en-first' || savedDir === 'zh-first') {
        readingDirection = savedDir;
      }
    } catch { /* ignore */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
      localStorage.setItem(READING_MODE_KEY, readingMode);
      localStorage.setItem(READING_DIR_KEY, readingDirection);
    } catch { /* ignore */ }
  }

  function applySettings() {
    const content = document.querySelector('.story-content');
    if (content) {
      content.style.setProperty('--reading-font-size', `${fontSize}px`);
      content.setAttribute('data-translations', showTranslations ? 'visible' : 'hidden');
      content.setAttribute('data-pinyin', showPinyin ? 'visible' : 'hidden');
      content.setAttribute('data-reading-direction', readingDirection);
    }

    if (sepiaMode) {
      document.documentElement.setAttribute('data-reading-mode', 'sepia');
    } else {
      document.documentElement.removeAttribute('data-reading-mode');
    }
  }

  function toggleTranslations() {
    showTranslations = !showTranslations;
    readingMode = null;
    savePrefs();
  }

  function togglePinyin() {
    showPinyin = !showPinyin;
    readingMode = null;
    savePrefs();
  }

  function toggleSepia() {
    sepiaMode = !sepiaMode;
  }

  function cycleReadingMode() {
    const modes = ['guided', 'assisted', 'immersive'];
    const currentIndex = modes.indexOf(readingMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    readingMode = modes[nextIndex];

    const mode = MODES[readingMode];
    showPinyin = mode.pinyin;
    showTranslations = mode.translations;

    savePrefs();
  }

  function decreaseFont() {
    if (fontSize <= FONT_MIN) return;
    fontSize -= FONT_STEP;
    savePrefs();
  }

  function increaseFont() {
    if (fontSize >= FONT_MAX) return;
    fontSize += FONT_STEP;
    savePrefs();
  }

  function toggleDirection() {
    readingDirection = readingDirection === 'en-first' ? 'zh-first' : 'en-first';
    savePrefs();
    window.dispatchEvent(new CustomEvent('reading-direction-change', {
      detail: { direction: readingDirection }
    }));
  }

  // Load preferences once on mount (untracked to avoid re-triggering)
  $effect(() => {
    untrack(() => loadPrefs());
  });

  // Apply settings reactively whenever state changes
  $effect(() => {
    applySettings();
  });
</script>

<div class="reading-toolbar" role="toolbar" aria-label="Reading controls">
  <!-- Reading Mode Selector -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn mode-btn"
      class:active={readingMode}
      onclick={cycleReadingMode}
      title="Click to cycle through reading modes: Guided → Assisted → Immersive"
      aria-label="Reading mode: {modeLabel}"
    >
      {modeLabel}
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Translation & Pinyin Toggles -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn toggle-btn"
      class:active={showTranslations}
      onclick={toggleTranslations}
      aria-pressed={showTranslations}
      aria-label="Toggle English translations"
      title="Show/hide English translations"
    >
      译文
    </button>

    <button
      class="toolbar-btn toggle-btn"
      class:active={showPinyin}
      onclick={togglePinyin}
      aria-pressed={showPinyin}
      aria-label="Toggle pinyin"
      title="Show/hide pinyin annotations"
    >
      拼音
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Reading Direction Toggle -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn toggle-btn"
      class:active={isZhFirst}
      onclick={toggleDirection}
      aria-pressed={isZhFirst}
      aria-label={isZhFirst ? 'Switch to English-first reading' : 'Switch to Chinese-first reading'}
      title="Toggle reading direction between English-first and Chinese-first"
    >
      EN↔中
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Font Size Controls -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn font-btn"
      onclick={decreaseFont}
      disabled={fontSize <= FONT_MIN}
      aria-label="Decrease font size"
      title="Decrease font size"
    >
      A−
    </button>
    <button
      class="toolbar-btn font-btn"
      onclick={increaseFont}
      disabled={fontSize >= FONT_MAX}
      aria-label="Increase font size"
      title="Increase font size"
    >
      A+
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Sepia Toggle -->
  <div class="toolbar-group">
    <button
      class="toolbar-btn toggle-btn"
      class:active={sepiaMode}
      onclick={toggleSepia}
      aria-pressed={sepiaMode}
      aria-label="Toggle sepia reading mode"
      title="Toggle sepia reading mode"
    >
      棕褐
    </button>
  </div>
</div>

<style>
  .reading-toolbar {
    position: fixed;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--color-elevated);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    padding: 6px 8px;
    border-radius: var(--radius-lg);

    /* Desktop: floating bottom-right */
    bottom: 24px;
    right: 24px;
  }

  @media (max-width: 1023px) {
    .reading-toolbar {
      /* Mobile: sticky bottom above tab bar */
      bottom: 72px;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 4px;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 36px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
    padding: 0 8px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast, 150ms) ease;
    white-space: nowrap;
  }

  .toolbar-btn:hover:not(:disabled) {
    color: var(--color-text-primary);
  }

  .toolbar-btn.active {
    background: var(--color-jade);
    color: white;
    border-color: var(--color-jade);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mode-btn {
    min-width: 50px;
    font-weight: 600;
  }

  .toggle-btn {
    font-weight: 600;
  }

  .font-btn {
    font-weight: 600;
    font-size: 14px;
  }
</style>

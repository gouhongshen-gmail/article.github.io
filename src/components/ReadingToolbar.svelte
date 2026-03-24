<script>
  const PREFS_KEY = 'longlore:reading-prefs';
  const FONT_KEY = 'longlore:font-size';
  const FONT_MIN = 14;
  const FONT_MAX = 24;
  const FONT_STEP = 2;
  const FONT_DEFAULT = 16;

  let showTranslation = $state(true);
  let fontSize = $state(FONT_DEFAULT);

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.showTranslation === 'boolean') showTranslation = prefs.showTranslation;
      }
      const savedSize = localStorage.getItem(FONT_KEY);
      if (savedSize) fontSize = Math.max(FONT_MIN, Math.min(FONT_MAX, Number(savedSize)));
    } catch { /* ignore */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ showTranslation }));
      localStorage.setItem(FONT_KEY, String(fontSize));
    } catch { /* ignore */ }
  }

  function applyTranslation() {
    document.documentElement.classList.toggle('hide-translations', !showTranslation);
  }

  function applyFontSize() {
    const content = document.querySelector('.story-content');
    if (content) content.style.fontSize = `${fontSize}px`;
  }

  function toggleTranslation() {
    showTranslation = !showTranslation;
    applyTranslation();
    savePrefs();
  }

  function decreaseFont() {
    if (fontSize <= FONT_MIN) return;
    fontSize -= FONT_STEP;
    applyFontSize();
    savePrefs();
  }

  function increaseFont() {
    if (fontSize >= FONT_MAX) return;
    fontSize += FONT_STEP;
    applyFontSize();
    savePrefs();
  }

  $effect(() => {
    loadPrefs();
    applyTranslation();
    applyFontSize();
  });
</script>

<div class="reading-toolbar" role="toolbar" aria-label="Reading controls">
  <div class="toolbar-group">
    <button
      class="toolbar-btn translation-toggle"
      class:active={showTranslation}
      onclick={toggleTranslation}
      aria-pressed={showTranslation}
      aria-label="Toggle English translation"
    >
      <span class="toggle-label">翻译</span>
      <span class="toggle-switch">
        <span class="toggle-knob"></span>
      </span>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-group font-controls">
    <button
      class="toolbar-btn font-btn"
      onclick={decreaseFont}
      disabled={fontSize <= FONT_MIN}
      aria-label="Decrease font size"
    >A−</button>
    <button
      class="toolbar-btn font-btn"
      onclick={increaseFont}
      disabled={fontSize >= FONT_MAX}
      aria-label="Increase font size"
    >A+</button>
  </div>
</div>

<style>
  /* Global: hide translations */
  :global(.hide-translations .cnlesson-en) {
    opacity: 0;
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
    transition: opacity var(--duration-normal, 300ms) ease,
                height var(--duration-normal, 300ms) ease;
  }

  :global(.cnlesson-en) {
    transition: opacity var(--duration-normal, 300ms) ease,
                height var(--duration-normal, 300ms) ease;
  }

  .reading-toolbar {
    position: fixed;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-elevated, #fff);
    border: 1px solid var(--color-border-subtle, #d6d1c7);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(28,25,23,0.08));
    padding: 6px 12px;
    border-radius: var(--radius-lg, 16px);

    /* Desktop: floating bottom-right */
    bottom: 24px;
    right: 24px;
  }

  @media (max-width: 1023px) {
    .reading-toolbar {
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: 0;
      height: 48px;
      justify-content: center;
      padding-bottom: max(6px, env(safe-area-inset-bottom));
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
    background: var(--color-border-subtle, #d6d1c7);
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: var(--color-text-primary, #1c1917);
    font-size: 14px;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: background var(--duration-fast, 150ms) ease;
    white-space: nowrap;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--color-surface, #eae5db);
  }

  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Toggle switch */
  .toggle-label {
    font-family: var(--font-body-cn, sans-serif);
  }

  .toggle-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--color-border-subtle, #d6d1c7);
    border-radius: 10px;
    transition: background var(--duration-fast, 150ms) ease;
  }

  .active .toggle-switch {
    background: var(--color-jade, #2d8a72);
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform var(--duration-fast, 150ms) ease;
  }

  .active .toggle-knob {
    transform: translateX(16px);
  }

  /* Font buttons */
  .font-btn {
    min-width: 36px;
    justify-content: center;
    font-weight: 600;
  }
</style>

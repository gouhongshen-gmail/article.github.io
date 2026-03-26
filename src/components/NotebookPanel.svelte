<script>
  /**
   * NotebookPanel — Side panel for viewing saved vocabulary and notes.
   * Shows words grouped by story, with SRS review status and filtering.
   */
  import { getNotebook, getNotebookStats, deleteWord, getReviewDue, markReviewed } from '@lib/notebook-store';

  let visible = $state(false);
  let tab = $state('all'); // 'all' | 'review' | 'stats'
  let notebookEntries = $state(/** @type {Array<any>} */ ([]));
  let stats = $state({ totalWords: 0, dueForReview: 0, masteredCount: 0, storiesWithWords: 0 });
  let reviewWords = $state(/** @type {any[]} */ ([]));
  let loading = $state(false);

  // Review state
  let reviewIdx = $state(0);
  let showAnswer = $state(false);

  async function loadData() {
    loading = true;
    try {
      const [nb, st, rw] = await Promise.all([
        getNotebook(),
        getNotebookStats(),
        getReviewDue(),
      ]);
      notebookEntries = nb;
      stats = st;
      reviewWords = rw;
    } catch (e) {
      console.error('Notebook load error:', e);
    }
    loading = false;
  }

  function toggle() {
    visible = !visible;
    if (visible) loadData();
  }

  async function handleDelete(hanzi, storyId) {
    await deleteWord(hanzi, storyId);
    await loadData();
  }

  async function handleReview(correct) {
    if (reviewIdx >= reviewWords.length) return;
    const word = reviewWords[reviewIdx];
    await markReviewed(word.hanzi, word.storyId, correct);
    showAnswer = false;
    if (reviewIdx < reviewWords.length - 1) {
      reviewIdx++;
    } else {
      await loadData();
      reviewIdx = 0;
    }
  }

  // Listen for toggle event from toolbar or shortcut
  $effect(() => {
    function onToggle() { toggle(); }
    window.addEventListener('notebook-toggle', onToggle);
    function onKeydown(e) {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('notebook-toggle', onToggle);
      window.removeEventListener('keydown', onKeydown);
    };
  });

  let allWords = $derived(notebookEntries.flatMap((entry) => entry.words));
</script>

<!-- Toggle button (fixed) -->
<button class="nb-toggle" onclick={toggle} aria-label="Open notebook" title="词汇本 (⌘N)">
  📒
  {#if stats.dueForReview > 0}
    <span class="nb-badge">{stats.dueForReview}</span>
  {/if}
</button>

<!-- Panel -->
{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="nb-backdrop" onclick={toggle} onkeydown={(e) => e.key === 'Escape' && toggle()}></div>
  <aside class="nb-panel" role="dialog" aria-label="Vocabulary notebook">
    <div class="nb-header">
      <h2 class="nb-title">📒 词汇本</h2>
      <button class="nb-close" onclick={toggle} aria-label="Close">✕</button>
    </div>

    <!-- Tabs -->
    <div class="nb-tabs" role="tablist">
      <button class="nb-tab" class:nb-tab--active={tab === 'all'} onclick={() => { tab = 'all'; }} role="tab">
        全部 ({stats.totalWords})
      </button>
      <button class="nb-tab" class:nb-tab--active={tab === 'review'} onclick={() => { tab = 'review'; reviewIdx = 0; showAnswer = false; }} role="tab">
        复习 ({stats.dueForReview})
      </button>
      <button class="nb-tab" class:nb-tab--active={tab === 'stats'} onclick={() => { tab = 'stats'; }} role="tab">
        统计
      </button>
    </div>

    <div class="nb-content">
      {#if loading}
        <p class="nb-empty">加载中...</p>
      {:else if tab === 'all'}
        {#if allWords.length === 0}
          <p class="nb-empty">还没有保存词汇。阅读故事时点击词汇旁的☆收藏。</p>
        {:else}
          {#each notebookEntries as entry}
            <div class="nb-story-group">
              <h3 class="nb-story-title">{entry.storyTitle || entry.storyId}</h3>
              {#each entry.words as word}
                <div class="nb-word">
                  <div class="nb-word-main">
                    <span class="nb-hanzi">{word.hanzi}</span>
                    <span class="nb-pinyin">{word.pinyin}</span>
                    <span class="nb-gloss">{word.gloss}</span>
                  </div>
                  {#if word.note}
                    <p class="nb-note">{word.note}</p>
                  {/if}
                  <button class="nb-delete" onclick={() => handleDelete(word.hanzi, word.storyId)} aria-label="Delete word" title="删除">✕</button>
                </div>
              {/each}
            </div>
          {/each}
        {/if}

      {:else if tab === 'review'}
        {#if reviewWords.length === 0}
          <div class="nb-empty-review">
            <p class="nb-empty">🎉 没有需要复习的词汇！</p>
            <p class="nb-empty-sub">继续阅读故事，保存新词汇吧。</p>
          </div>
        {:else}
          <div class="nb-review-card">
            <p class="nb-review-progress">{reviewIdx + 1} / {reviewWords.length}</p>
            <p class="nb-review-hanzi">{reviewWords[reviewIdx]?.hanzi}</p>
            {#if showAnswer}
              <p class="nb-review-pinyin">{reviewWords[reviewIdx]?.pinyin}</p>
              <p class="nb-review-gloss">{reviewWords[reviewIdx]?.gloss}</p>
              {#if reviewWords[reviewIdx]?.sentenceZh}
                <p class="nb-review-sentence">{reviewWords[reviewIdx]?.sentenceZh}</p>
              {/if}
              <div class="nb-review-actions">
                <button class="nb-review-btn nb-review-btn--wrong" onclick={() => handleReview(false)}>😕 再看看</button>
                <button class="nb-review-btn nb-review-btn--right" onclick={() => handleReview(true)}>✓ 记住了</button>
              </div>
            {:else}
              <button class="nb-review-reveal" onclick={() => { showAnswer = true; }}>翻看答案</button>
            {/if}
          </div>
        {/if}

      {:else if tab === 'stats'}
        <div class="nb-stats">
          <div class="nb-stat">
            <span class="nb-stat-value">{stats.totalWords}</span>
            <span class="nb-stat-label">已保存词汇</span>
          </div>
          <div class="nb-stat">
            <span class="nb-stat-value">{stats.dueForReview}</span>
            <span class="nb-stat-label">待复习</span>
          </div>
          <div class="nb-stat">
            <span class="nb-stat-value">{stats.masteredCount}</span>
            <span class="nb-stat-label">已掌握</span>
          </div>
          <div class="nb-stat">
            <span class="nb-stat-value">{stats.storiesWithWords}</span>
            <span class="nb-stat-label">已学故事</span>
          </div>
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .nb-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--color-gold, #cda434);
    background: var(--color-parchment, #f5f0e6);
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease, box-shadow 150ms ease;
  }

  .nb-toggle:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
  }

  .nb-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-cinnabar, #b5412a);
    color: white;
    font-size: 11px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .nb-backdrop {
    position: fixed;
    inset: 0;
    z-index: 299;
    background: rgba(28, 25, 23, 0.3);
    animation: nb-fade-in 200ms ease;
  }

  @keyframes nb-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .nb-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 300;
    width: min(380px, 90vw);
    background: var(--color-parchment, #f5f0e6);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    animation: nb-slide-in 250ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  @keyframes nb-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .nb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border-subtle, #d6d3d1);
  }

  .nb-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary, #1c1917);
  }

  .nb-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary, #57534e);
    font-size: 14px;
  }

  .nb-close:hover { background: var(--color-surface, #eae5db); }

  .nb-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border-subtle, #d6d3d1);
  }

  .nb-tab {
    flex: 1;
    padding: 10px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary, #57534e);
    cursor: pointer;
    transition: color 100ms, border-color 100ms;
  }

  .nb-tab--active {
    color: var(--color-jade, #237a63);
    border-bottom-color: var(--color-jade, #237a63);
  }

  .nb-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .nb-empty {
    text-align: center;
    color: var(--color-text-secondary, #57534e);
    font-size: 14px;
    margin-top: 40px;
  }

  .nb-empty-sub {
    text-align: center;
    color: var(--color-text-secondary, #57534e);
    font-size: 13px;
    opacity: 0.7;
  }

  .nb-story-group {
    margin-bottom: 20px;
  }

  .nb-story-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .nb-word {
    position: relative;
    padding: 10px 12px;
    background: var(--color-surface, #eae5db);
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .nb-word-main {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .nb-hanzi {
    font-size: 20px;
    font-weight: 700;
    font-family: var(--font-display-cn, serif);
    color: var(--color-text-primary, #1c1917);
  }

  .nb-pinyin {
    font-size: 13px;
    color: var(--color-jade, #237a63);
  }

  .nb-gloss {
    font-size: 13px;
    color: var(--color-text-secondary, #57534e);
  }

  .nb-note {
    font-size: 12px;
    color: var(--color-text-secondary, #57534e);
    margin: 4px 0 0;
    font-style: italic;
  }

  .nb-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 12px;
    color: var(--color-text-secondary, #57534e);
    cursor: pointer;
    opacity: 0;
    transition: opacity 100ms;
  }

  .nb-word:hover .nb-delete { opacity: 1; }

  /* Review card */
  .nb-review-card {
    text-align: center;
    padding: 24px 16px;
  }

  .nb-review-progress {
    font-size: 12px;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 16px;
  }

  .nb-review-hanzi {
    font-size: 48px;
    font-weight: 700;
    font-family: var(--font-display-cn, serif);
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 16px;
  }

  .nb-review-pinyin {
    font-size: 18px;
    color: var(--color-jade, #237a63);
    margin: 0 0 4px;
  }

  .nb-review-gloss {
    font-size: 16px;
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 12px;
  }

  .nb-review-sentence {
    font-size: 14px;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 20px;
    font-family: var(--font-display-cn, serif);
  }

  .nb-review-reveal {
    padding: 12px 32px;
    border-radius: 8px;
    border: 2px solid var(--color-gold, #cda434);
    background: none;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary, #1c1917);
    cursor: pointer;
    transition: background-color 100ms;
  }

  .nb-review-reveal:hover { background: rgba(205, 164, 52, 0.08); }

  .nb-review-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .nb-review-btn {
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 100ms;
  }

  .nb-review-btn:hover { opacity: 0.85; }

  .nb-review-btn--wrong {
    background: var(--color-surface, #eae5db);
    color: var(--color-text-primary, #1c1917);
  }

  .nb-review-btn--right {
    background: var(--color-jade, #237a63);
    color: white;
  }

  /* Stats */
  .nb-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px 0;
  }

  .nb-stat {
    text-align: center;
    padding: 16px;
    background: var(--color-surface, #eae5db);
    border-radius: 12px;
  }

  .nb-stat-value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: var(--color-jade, #237a63);
    margin-bottom: 4px;
  }

  .nb-stat-label {
    font-size: 12px;
    color: var(--color-text-secondary, #57534e);
  }

  .nb-empty-review {
    padding-top: 20px;
  }
</style>

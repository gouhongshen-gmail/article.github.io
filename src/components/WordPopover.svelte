<script>
  import { saveWord, isWordSaved } from '@lib/vocab-store';

  /** @type {{ hanzi: string; pinyin: string; gloss: string } | null} */
  let word = $state(null);
  /** @type {HTMLElement | null} */
  let activeEl = $state(null);
  let isMobile = $state(false);
  let visible = $state(false);
  let popoverStyle = $state('');
  let saving = $state(false);
  let saved = $state(false);

  function updateMediaQuery() {
    isMobile = window.innerWidth < 1024;
  }

  function positionPopover(target) {
    const rect = target.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverEstimatedHeight = 180;
    const gap = 8;

    let top, left;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow >= popoverEstimatedHeight + gap) {
      top = rect.bottom + gap + window.scrollY;
    } else {
      top = rect.top - popoverEstimatedHeight - gap + window.scrollY;
    }

    left = rect.left + rect.width / 2 - popoverWidth / 2 + window.scrollX;
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));
    top = Math.max(8, top);

    popoverStyle = `top:${top}px;left:${left}px;width:${popoverWidth}px;`;
  }

  function handleClick(e) {
    const token = e.target.closest('.vocab-token');
    if (token) {
      e.preventDefault();
      if (activeEl) activeEl.classList.remove('vocab-token--active');
      activeEl = token;
      activeEl.classList.add('vocab-token--active');

      word = {
        hanzi: token.textContent?.trim() ?? '',
        pinyin: token.dataset.pinyin ?? '',
        gloss: token.dataset.gloss ?? '',
      };

      // Check if already saved
      saved = false;
      isWordSaved(word.hanzi, window.location.pathname.split('/').filter(Boolean).pop() || 'unknown')
        .then(isSaved => { saved = isSaved; })
        .catch(() => {});

      if (!isMobile) positionPopover(token);
      visible = true;
    } else if (!e.target.closest('.word-popover') && !e.target.closest('.word-sheet')) {
      dismiss();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') dismiss();
  }

  function dismiss() {
    visible = false;
    if (activeEl) {
      activeEl.classList.remove('vocab-token--active');
      activeEl = null;
    }
    word = null;
  }

  async function handleSave() {
    if (!word || saving || saved) return;
    saving = true;
    try {
      await saveWord({
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        gloss: word.gloss,
        storyId: window.location.pathname.split('/').filter(Boolean).pop() || 'unknown',
        storyTitle: document.title.split('|')[0]?.trim() || '',
        sentenceZh: activeEl?.closest('.cnlesson-pair')?.querySelector('.cnlesson-zh')?.textContent || '',
        sentenceEn: activeEl?.closest('.cnlesson-pair')?.querySelector('.cnlesson-en')?.textContent || '',
      });
      saved = true;
      // Mark the token as saved in the DOM
      if (activeEl) activeEl.setAttribute('data-saved', 'true');
      // Reset after brief feedback
      setTimeout(() => { saved = false; }, 2000);
    } catch (e) {
      console.error('Failed to save word:', e);
    } finally {
      saving = false;
    }
  }

  $effect(() => {
    updateMediaQuery();
    const onResize = () => updateMediaQuery();
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeydown);
      if (activeEl) activeEl.classList.remove('vocab-token--active');
    };
  });
</script>

{#if visible && word}
  {#if isMobile}
    <!-- Mobile: backdrop + bottom sheet -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sheet-backdrop" onclick={dismiss} onkeydown={handleKeydown}></div>
    <div class="word-sheet" role="dialog" aria-label="Word definition">
      <div class="drag-handle"></div>
      <div class="word-content">
        <p class="word-hanzi">{word.hanzi}</p>
        <p class="word-pinyin">{word.pinyin}</p>
        <p class="word-gloss">{word.gloss}</p>
        <button class="save-btn" disabled={saving || saved} onclick={handleSave}>
          {#if saving}
            保存中...
          {:else if saved}
            ✓ 已添加
          {:else}
            添加到词库
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <!-- Desktop: positioned popover -->
    <div class="word-popover" role="dialog" aria-label="Word definition" style={popoverStyle}>
      <p class="word-hanzi">{word.hanzi}</p>
      <p class="word-pinyin">{word.pinyin}</p>
      <p class="word-gloss">{word.gloss}</p>
      <button class="save-btn" disabled={saving || saved} onclick={handleSave}>
        {#if saving}
          保存中...
        {:else if saved}
          ✓ 已添加
        {:else}
          添加到词库
        {/if}
      </button>
    </div>
  {/if}
{/if}

<style>
  /* Active word highlight (global) */
  :global(.vocab-token--active) {
    background: rgba(45, 138, 114, 0.15);
    border-radius: 2px;
  }

  /* Desktop popover */
  .word-popover {
    position: absolute;
    z-index: 200;
    background: var(--color-parchment, #f5f0e6);
    box-shadow: 0 4px 16px rgba(28, 25, 23, 0.1);
    border-radius: 12px;
    padding: 16px;
    animation: popover-in 200ms ease both;
  }

  @keyframes popover-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile backdrop */
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 199;
    background: rgba(28, 25, 23, 0.35);
    animation: fade-in 200ms ease both;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Mobile bottom sheet */
  .word-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    max-height: 320px;
    background: var(--color-parchment, #f5f0e6);
    border-radius: 16px 16px 0 0;
    animation: sheet-up 300ms cubic-bezier(0.32, 0.72, 0, 1) both;
  }

  @keyframes sheet-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .drag-handle {
    width: 40px;
    height: 4px;
    background: var(--color-surface, #eae5db);
    border-radius: 2px;
    margin: 10px auto 0;
  }

  .word-content {
    padding: 24px;
  }

  /* Shared content styles */
  .word-hanzi {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--font-display-cn, serif);
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 4px;
  }

  .word-pinyin {
    font-size: 16px;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 8px;
  }

  .word-gloss {
    font-size: 14px;
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 16px;
    line-height: 1.4;
  }

  .save-btn {
    display: block;
    width: 100%;
    height: 40px;
    background: var(--color-jade, #2d8a72);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--duration-fast, 150ms) ease;
  }

  .save-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

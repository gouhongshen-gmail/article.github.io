<script>
  import { saveWord, isWordSaved, getWordCount } from '@lib/vocab-store';
  import {
    getWordsByStory as getNotebookWordsByStory,
    updateWordNote,
  } from '@lib/notebook-store';
  import { canAddWord } from '@lib/limits';
  import LimitModal from './LimitModal.svelte';

  /** @type {{ hanzi: string; pinyin: string; gloss: string } | null} */
  let word = $state(null);
  /** @type {HTMLElement | null} */
  let activeEl = $state(null);
  let isMobile = $state(false);
  let visible = $state(false);
  let popoverStyle = $state('');
  let saving = $state(false);
  let saved = $state(false);
  let limitModalVisible = $state(false);

  // Audio
  let speaking = $state(false);

  // Notes
  let noteText = $state('');
  let showNoteInput = $state(false);

  function getStoryId() {
    return window.location.pathname.split('/').filter(Boolean).pop() || 'unknown';
  }

  function getNoteKey(hanzi, storyId) {
    return `${hanzi}_${storyId}`;
  }

  /** Load saved note from localStorage */
  function loadNote(hanzi, storyId) {
    try {
      const notes = JSON.parse(localStorage.getItem('longlore_word_notes') || '{}');
      return notes[getNoteKey(hanzi, storyId)] || '';
    } catch { return ''; }
  }

  /** Save note to localStorage */
  function saveNote(hanzi, storyId, text) {
    try {
      const notes = JSON.parse(localStorage.getItem('longlore_word_notes') || '{}');
      const key = getNoteKey(hanzi, storyId);
      if (text.trim()) {
        notes[key] = text.trim();
      } else {
        delete notes[key];
      }
      localStorage.setItem('longlore_word_notes', JSON.stringify(notes));
    } catch { /* ignore */ }
  }

  function updateMediaQuery() {
    isMobile = window.innerWidth < 1024;
  }

  function positionPopover(target) {
    const rect = target.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverEstimatedHeight = 220;
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

  /** Find sentence context from both old cnlesson DOM and new StoryReader DOM */
  function getSentenceContext(el) {
    // StoryReader: look for sr-expansion or sr-zh-block parent
    const srExpansion = el?.closest('.sr-expansion');
    if (srExpansion) {
      const paragraph = srExpansion.closest('.sr-paragraph');
      const sentenceId = srExpansion.dataset.sentenceId;
      const zhText = srExpansion.querySelector('.sr-zh')?.textContent || '';
      // Find EN sentence from the sibling button
      const allBtns = paragraph?.querySelectorAll('.sr-sentence') || [];
      const allExpansions = paragraph?.querySelectorAll('.sr-expansion') || [];
      let enText = '';
      allExpansions.forEach((exp, i) => {
        if (exp === srExpansion && allBtns[i]) enText = allBtns[i].textContent || '';
      });
      return { zh: zhText, en: enText };
    }

    // StoryReader zh-first: look for sr-zh-block
    const zhBlock = el?.closest('.sr-zh-block');
    if (zhBlock) {
      const zhText = zhBlock.querySelector('.sr-zh')?.textContent || '';
      const enText = zhBlock.querySelector('.sr-en-expansion')?.textContent || '';
      return { zh: zhText, en: enText };
    }

    // Old cnlesson format
    const pair = el?.closest('.cnlesson-pair');
    if (pair) {
      return {
        zh: pair.querySelector('.cnlesson-zh')?.textContent || '',
        en: pair.querySelector('.cnlesson-en')?.textContent || '',
      };
    }

    return { zh: '', en: '' };
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

      // Load note and check saved status
      const storyId = getStoryId();
      noteText = loadNote(word.hanzi, storyId);
      showNoteInput = !!noteText;
      speaking = false;
      saved = false;
      Promise.all([
        isWordSaved(word.hanzi, storyId),
        getNotebookWordsByStory(storyId).catch(() => []),
      ])
        .then(([isSaved, storyWords]) => {
          saved = isSaved;
          const savedWord = storyWords.find((entry) => entry.hanzi === word?.hanzi);
          if (savedWord?.note && !noteText) {
            noteText = savedWord.note;
            showNoteInput = true;
          }
        })
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
    // Save note on dismiss
    if (word) {
      const storyId = getStoryId();
      if (noteText !== loadNote(word.hanzi, storyId)) {
        saveNote(word.hanzi, storyId, noteText);
      }
      if (saved) {
        void updateWordNote(word.hanzi, storyId, noteText).catch(() => {});
      }
    }
    visible = false;
    showNoteInput = false;
    if (activeEl) {
      activeEl.classList.remove('vocab-token--active');
      activeEl = null;
    }
    word = null;
  }

  /** Play word audio using browser speechSynthesis (placeholder for R2 TTS) */
  function playAudio() {
    if (!word || speaking) return;
    if (!('speechSynthesis' in window)) return;

    speaking = true;
    const utterance = new SpeechSynthesisUtterance(word.hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.onend = () => { speaking = false; };
    utterance.onerror = () => { speaking = false; };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function handleSave() {
    if (!word || saving || saved) return;
    saving = true;
    try {
      const currentCount = await getWordCount();
      if (!canAddWord(currentCount)) {
        limitModalVisible = true;
        return;
      }

      const ctx = getSentenceContext(activeEl);
      await saveWord({
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        gloss: word.gloss,
        storyId: getStoryId(),
        storyTitle: document.title.split('|')[0]?.trim() || '',
        sentenceZh: ctx.zh,
        sentenceEn: ctx.en,
      });
      if (noteText.trim()) {
        await updateWordNote(word.hanzi, getStoryId(), noteText);
      }
      saved = true;
      if (activeEl) activeEl.setAttribute('data-saved', 'true');
      setTimeout(() => { saved = false; }, 2000);
    } catch (e) {
      console.error('Failed to save word:', e);
    } finally {
      saving = false;
    }
  }

  function handleNoteBlur() {
    if (!word) return;
    const storyId = getStoryId();
    saveNote(word.hanzi, storyId, noteText);
    if (saved) {
      void updateWordNote(word.hanzi, storyId, noteText).catch(() => {});
    }
    if (!noteText.trim()) showNoteInput = false;
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
  <LimitModal
    visible={limitModalVisible}
    title="你的免费词库已满"
    message="Free accounts can save up to 50 words. Upgrade to Pro for unlimited vocabulary!"
    ctaText="Upgrade to Pro"
    ctaHref="/pricing"
    onClose={() => { limitModalVisible = false; }}
  />
  {#if isMobile}
    <!-- Mobile: backdrop + bottom sheet -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sheet-backdrop" onclick={dismiss} onkeydown={handleKeydown}></div>
    <div class="word-sheet" role="dialog" aria-label="Word definition">
      <div class="drag-handle"></div>
      <div class="word-content">
        <div class="word-header">
          <div class="word-header-left">
            <p class="word-hanzi">{word.hanzi}</p>
            <p class="word-pinyin">{word.pinyin}</p>
          </div>
          <div class="word-actions">
            <button class="audio-btn" onclick={playAudio} disabled={speaking} aria-label="Play pronunciation" title="播放发音">
              {speaking ? '⏸' : '🔊'}
            </button>
            <button
              class="bookmark-btn"
              class:bookmark-btn--active={saved}
              onclick={handleSave}
              disabled={saving}
              aria-label={saved ? 'Word saved' : 'Save word'}
              title={saved ? '已收藏' : '收藏'}
            >
              {saved ? '★' : '☆'}
            </button>
          </div>
        </div>
        <p class="word-gloss">{word.gloss}</p>
        {#if noteText || showNoteInput}
          <textarea
            class="note-input"
            bind:value={noteText}
            onblur={handleNoteBlur}
            placeholder="写笔记..."
            rows="2"
          ></textarea>
        {:else}
          <button class="note-toggle" onclick={() => { showNoteInput = true; }}>
            ✏️ 添加笔记
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Desktop: positioned popover -->
    <div class="word-popover" role="dialog" aria-label="Word definition" style={popoverStyle}>
      <div class="word-header">
        <div class="word-header-left">
          <p class="word-hanzi">{word.hanzi}</p>
          <p class="word-pinyin">{word.pinyin}</p>
        </div>
        <div class="word-actions">
          <button class="audio-btn" onclick={playAudio} disabled={speaking} aria-label="Play pronunciation" title="播放发音">
            {speaking ? '⏸' : '🔊'}
          </button>
          <button
            class="bookmark-btn"
            class:bookmark-btn--active={saved}
            onclick={handleSave}
            disabled={saving}
            aria-label={saved ? 'Word saved' : 'Save word'}
            title={saved ? '已收藏' : '收藏'}
          >
            {saved ? '★' : '☆'}
          </button>
        </div>
      </div>
      <p class="word-gloss">{word.gloss}</p>
      {#if noteText || showNoteInput}
        <textarea
          class="note-input"
          bind:value={noteText}
          onblur={handleNoteBlur}
          placeholder="写笔记..."
          rows="2"
        ></textarea>
      {:else}
        <button class="note-toggle" onclick={() => { showNoteInput = true; }}>
          ✏️ 添加笔记
        </button>
      {/if}
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
    border-top: 3px solid var(--color-gold, #cda434);
    padding: 16px;
    animation: popover-in 200ms ease both;
  }

  @keyframes popover-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
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
    max-height: 40vh;
    background: var(--color-parchment, #f5f0e6);
    border-radius: 16px 16px 0 0;
    border-top: 3px solid var(--color-gold, #cda434);
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
    padding: 20px 24px 24px;
  }

  /* Header: hanzi/pinyin + action buttons */
  .word-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .word-header-left {
    flex: 1;
    min-width: 0;
  }

  .word-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  /* Shared content styles */
  .word-hanzi {
    font-size: 32px;
    font-weight: 700;
    font-family: var(--font-display-cn, serif);
    color: var(--color-text-primary, #1c1917);
    margin: 0;
    line-height: 1.2;
  }

  .word-pinyin {
    font-size: 16px;
    color: var(--color-text-secondary, #57534e);
    margin: 4px 0 0;
  }

  .word-gloss {
    font-size: 14px;
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 12px;
    line-height: 1.5;
  }

  /* Audio button */
  .audio-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 2px solid var(--color-jade, #237a63);
    border-radius: 50%;
    color: var(--color-jade, #237a63);
    font-size: 18px;
    cursor: pointer;
    transition: background-color 150ms ease, transform 100ms ease;
    flex-shrink: 0;
  }

  .audio-btn:hover:not(:disabled) {
    background: rgba(35, 122, 99, 0.08);
  }

  .audio-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .audio-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Bookmark button */
  .bookmark-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: var(--color-text-secondary, #57534e);
    transition: color 150ms ease, transform 100ms ease;
    flex-shrink: 0;
  }

  .bookmark-btn:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .bookmark-btn--active {
    color: var(--color-cinnabar, #b5412a);
  }

  .bookmark-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Note toggle link */
  .note-toggle {
    background: none;
    border: none;
    color: var(--color-text-secondary, #57534e);
    font-size: 13px;
    cursor: pointer;
    padding: 4px 0;
    opacity: 0.7;
    transition: opacity 150ms ease;
  }

  .note-toggle:hover {
    opacity: 1;
  }

  /* Note textarea */
  .note-input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-family: inherit;
    color: var(--color-text-primary, #1c1917);
    resize: vertical;
    line-height: 1.4;
    box-sizing: border-box;
  }

  .note-input:focus {
    outline: 2px solid var(--color-jade, #237a63);
    outline-offset: -1px;
    border-color: transparent;
  }
</style>

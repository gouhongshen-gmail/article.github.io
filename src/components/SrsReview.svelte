<script lang="ts">
  import { onMount } from 'svelte';
  import { gradeCard, previewIntervals, formatInterval, type VocabCard as SrsCard } from '@lib/srs-engine';
  import { getDueCards, updateCard, addReviewLog, type VocabCard } from '@lib/vocab-store';
  import { canReview, incrementTodayReviewCount, getTodayReviewCount, getDailyReviewLimit } from '@lib/limits';
  import LimitModal from '@components/LimitModal.svelte';

  // Demo cards as fallback
  const demoCards: SrsCard[] = [
    { id: '1', hanzi: '大运河', pinyin: 'Dà Yùn Hé', english: 'the Grand Canal', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '2', hanzi: '朝廷', pinyin: 'cháo tíng', english: 'imperial court', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '3', hanzi: '连接', pinyin: 'lián jiē', english: 'to connect; to link', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '4', hanzi: '粮食', pinyin: 'liáng shi', english: 'grain; food', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '5', hanzi: '税赋', pinyin: 'shuì fù', english: 'tax revenue', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '6', hanzi: '天命', pinyin: 'tiān mìng', english: 'Mandate of Heaven', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '7', hanzi: '统治者', pinyin: 'tǒng zhì zhě', english: 'ruler; sovereign', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
    { id: '8', hanzi: '扩建', pinyin: 'kuò jiàn', english: 'to expand; to extend', easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0).toISOString(), stage: 'new', createdAt: '', updatedAt: '' },
  ];

  // Convert vocab store card to SRS card format
  function convertCard(card: VocabCard): SrsCard {
    return {
      ...card,
      english: card.gloss,
      createdAt: new Date(card.createdAt).toISOString(),
      updatedAt: new Date(card.updatedAt).toISOString(),
      nextReview: new Date(card.nextReview).toISOString(),
    };
  }

  let cards = $state<SrsCard[]>([...demoCards]);
  let currentIndex = $state(0);
  let flipped = $state(false);
  let sliding = $state<'none' | 'out' | 'in'>('none');
  let correctCount = $state(0);
  let totalReviewed = $state(0);
  let loading = $state(true);
  let isDemoMode = $state(false);
  let limitModalVisible = $state(false);
  let originalCards = $state<VocabCard[]>([]); // Store original cards for persistence

  let currentCard = $derived(cards[currentIndex]);
  let isComplete = $derived(currentIndex >= cards.length);
  let progress = $derived(isComplete ? 100 : (currentIndex / cards.length) * 100);
  let intervalPreviews = $derived(currentCard ? previewIntervals(currentCard) : {});
  let accuracy = $derived(totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0);

  onMount(async () => {
    try {
      // Try to load due cards from IndexedDB
      const dbCards = await getDueCards(20);
      
      if (dbCards.length > 0) {
        // Use real cards from database
        originalCards = dbCards;
        cards = dbCards.map(convertCard);
        isDemoMode = false;
      } else {
        // Fall back to demo mode
        isDemoMode = true;
        cards = demoCards.map(c => ({ ...c }));
      }
    } catch (err) {
      // On error, use demo mode
      console.error('Failed to load due cards:', err);
      isDemoMode = true;
      cards = demoCards.map(c => ({ ...c }));
    } finally {
      loading = false;
    }
  });

  function flipCard() {
    if (!flipped && !isComplete) flipped = true;
  }

  async function score(quality: number) {
    if (!currentCard) return;

    const cardBefore = currentCard;
    const updated = gradeCard(currentCard, quality);
    cards[currentIndex] = updated;

    // Update IndexedDB if not in demo mode
    if (!isDemoMode && originalCards[currentIndex]) {
      const originalCard = originalCards[currentIndex];
      const updatedDbCard: VocabCard = {
        ...originalCard,
        easeFactor: updated.easeFactor,
        interval: updated.interval,
        repetitions: updated.repetitions,
        nextReview: new Date(updated.nextReview).getTime(),
        stage: updated.stage,
        updatedAt: Date.now(),
      };

      try {
        // Persist to IndexedDB
        await updateCard(updatedDbCard);
        
        // Log the review
        await addReviewLog({
          cardId: originalCard.id,
          quality,
          intervalBefore: cardBefore.interval,
          intervalAfter: updated.interval,
          easeBefore: cardBefore.easeFactor,
          easeAfter: updated.easeFactor,
          reviewedAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to persist review:', err);
      }
    }

    if (quality >= 3) correctCount++;
    totalReviewed++;
    
    // Increment today's review count
    incrementTodayReviewCount();

    // Check if review limit reached
    if (!canReview()) {
      limitModalVisible = true;
      return;
    }

    // Slide out
    sliding = 'out';
    setTimeout(() => {
      currentIndex++;
      flipped = false;
      sliding = 'in';
      setTimeout(() => { sliding = 'none'; }, 250);
    }, 200);
  }

  async function restart() {
    loading = true;
    currentIndex = 0;
    flipped = false;
    sliding = 'none';
    correctCount = 0;
    totalReviewed = 0;

    try {
      const dbCards = await getDueCards(20);
      if (dbCards.length > 0) {
        originalCards = dbCards;
        cards = dbCards.map(convertCard);
        isDemoMode = false;
      } else {
        isDemoMode = true;
        cards = demoCards.map(c => ({ ...c }));
      }
    } catch (err) {
      console.error('Failed to reload cards:', err);
      isDemoMode = true;
      cards = demoCards.map(c => ({ ...c }));
    } finally {
      loading = false;
    }
  }

  const buttons = [
    { quality: 1, label: '重来', sublabel: 'Again', color: '#c4392a', bg: '#fef2f2' },
    { quality: 2, label: '困难', sublabel: 'Hard', color: '#b8860b', bg: '#fefce8' },
    { quality: 3, label: '记得', sublabel: 'Good', color: '#2d8a72', bg: '#f0fdf4' },
    { quality: 5, label: '简单', sublabel: 'Easy', color: '#6b7280', bg: '#f9fafb' },
  ];
</script>

<div class="srs-container">
  <LimitModal
    visible={limitModalVisible}
    title="今日复习已达上限"
    message={`You've completed ${getDailyReviewLimit()} reviews today. Upgrade to Pro for unlimited daily reviews!`}
    ctaText="Upgrade to Pro"
    ctaHref="/pricing"
    onClose={() => { limitModalVisible = false; }}
  />
  {#if loading}
    <!-- Loading State -->
    <div class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">Loading review cards...</p>
    </div>
  {:else if isComplete}
    <div class="complete-card">
      <div class="complete-bar" style="background: var(--color-jade);"></div>
      <div class="complete-icon">🎉</div>
      <h2>复习完成！</h2>
      <p class="complete-sub">Session Complete</p>
      {#if isDemoMode}
        <div class="demo-banner">Demo mode — save words from stories to start real reviews</div>
      {/if}
      <div class="complete-stats">
        <div class="stat">
          <span class="stat-num">{totalReviewed}</span>
          <span class="stat-label">reviewed</span>
        </div>
        <div class="stat">
          <span class="stat-num">{accuracy}%</span>
          <span class="stat-label">accuracy</span>
        </div>
      </div>
      <div class="complete-actions">
        <button class="btn-primary" onclick={restart}>再来一轮</button>
        <a href="/dashboard" class="btn-link">Back to Dashboard →</a>
      </div>
    </div>
  {:else if currentCard}
    <!-- Demo mode banner -->
    {#if isDemoMode}
      <div class="demo-banner">Demo mode — save words from stories to start real reviews</div>
    {/if}

    <!-- Progress -->
    <div class="progress-row">
      <div class="progress-track">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <span class="progress-text">{currentIndex + 1} / {cards.length}</span>
    </div>

    <!-- Card -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="card-wrapper"
      class:slide-out={sliding === 'out'}
      class:slide-in={sliding === 'in'}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="card" class:flipped onclick={flipCard}>
        <div class="card-face card-front">
          <span class="card-prompt">你认识这个词吗？</span>
          <span class="card-hanzi">{currentCard.hanzi}</span>
          <span class="card-hint">tap to reveal</span>
        </div>
        <div class="card-face card-back">
          <div class="card-back-content">
            <span class="card-pinyin">{currentCard.pinyin}</span>
            <span class="card-english">{currentCard.english}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Score buttons -->
    {#if flipped}
      <div class="score-buttons">
        {#each buttons as btn}
          <button
            class="score-btn"
            style="color: {btn.color}; background: {btn.bg};"
            onclick={() => score(btn.quality)}
          >
            <span class="score-label">{btn.label}</span>
            <span class="score-sub">{btn.sublabel}</span>
            <span class="score-interval">{intervalPreviews[btn.quality]}</span>
          </button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <p class="empty-title">没有需要复习的词</p>
      <p class="empty-sub">No words to review</p>
      <a href="/stories" class="btn-primary">Start reading stories →</a>
    </div>
  {/if}
</div>

<style>
  .srs-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg, 1.5rem);
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md, 1rem);
    padding: var(--space-2xl, 3rem) var(--space-lg, 1.5rem);
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border-subtle, #d6d1c7);
    border-top-color: var(--color-jade, #2d8a72);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .loading-text {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #57534e);
  }

  /* Demo Banner */
  .demo-banner {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #fef3c7;
    border-left: 3px solid #f59e0b;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #92400e;
    text-align: center;
  }

  /* Progress */
  .progress-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
  }
  .progress-track {
    flex: 1;
    height: 3px;
    background: var(--color-border-subtle, #d6d1c7);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-jade, #2d8a72);
    transition: width 0.3s ease;
  }
  .progress-text {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #57534e);
    white-space: nowrap;
  }

  /* Card */
  .card-wrapper {
    width: 100%;
    perspective: 1000px;
  }
  .card-wrapper.slide-out {
    animation: slideOut 200ms ease-in forwards;
  }
  .card-wrapper.slide-in {
    animation: slideIn 250ms ease-out forwards;
  }
  @keyframes slideOut {
    to { transform: translateX(-120%); opacity: 0; }
  }
  @keyframes slideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .card {
    width: 100%;
    min-height: 420px;
    position: relative;
    cursor: pointer;
    transform-style: preserve-3d;
    transition: transform 280ms ease-out;
  }
  .card.flipped {
    transform: rotateY(180deg);
  }

  .card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md, 1rem);
    padding: var(--space-lg, 1.5rem);
    background: var(--color-bg, #f5f0e6);
    border: 1px solid var(--color-ink, #1c1917);
    border-radius: var(--radius-md, 8px);
  }

  .card-back {
    transform: rotateY(180deg);
  }

  .card-back-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 1rem);
    align-items: center;
    justify-content: center;
  }

  .card-prompt {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #57534e);
  }
  .card-hanzi {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-text-primary, #1c1917);
  }
  .card-hint {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #57534e);
    opacity: 0.5;
  }
  .card-pinyin {
    font-size: 1rem;
    color: var(--color-text-secondary, #57534e);
  }
  .card-english {
    font-size: 1.375rem;
    color: var(--color-text-primary, #1c1917);
    text-align: center;
  }

  /* Score Buttons */
  .score-buttons {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
  .score-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.75rem 0.25rem;
    min-height: 48px;
    border: 1px solid transparent;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    font-family: inherit;
    transition: transform 120ms ease;
    white-space: pre-wrap;
  }
  .score-btn:active {
    transform: scale(0.96);
  }
  .score-label {
    font-size: 0.9rem;
    font-weight: 600;
  }
  .score-sub {
    font-size: 0.7rem;
    opacity: 0.7;
  }
  .score-interval {
    font-size: 0.65rem;
    opacity: 0.5;
    margin-top: 2px;
    line-height: 1.2;
  }

  /* Complete Card */
  .complete-card {
    width: 100%;
    background: var(--color-bg, #f5f0e6);
    border: 1px solid var(--color-border-subtle, #d6d1c7);
    border-radius: var(--radius-lg, 16px);
    padding: var(--space-xl, 2rem);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .complete-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    animation: barPulse 2s ease infinite;
  }
  @keyframes barPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; background: var(--color-gold-leaf, #cda434); }
  }
  .complete-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .complete-card h2 {
    font-size: 1.5rem;
    margin: 0 0 0.25rem;
    color: var(--color-text-primary, #1c1917);
  }
  .complete-sub {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 1.5rem;
  }
  .complete-stats {
    display: flex;
    justify-content: center;
    gap: 2.5rem;
    margin-bottom: 1.5rem;
  }
  .stat { display: flex; flex-direction: column; align-items: center; }
  .stat-num {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-jade, #2d8a72);
  }
  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #57534e);
  }

  .complete-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  /* Shared buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background: var(--color-jade, #2d8a72);
    color: #fff;
    border: none;
    border-radius: var(--radius-md, 8px);
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .btn-primary:hover { opacity: 0.9; }
  .btn-link {
    font-size: 0.9rem;
    color: var(--color-jade, #2d8a72);
    text-decoration: none;
  }
  .btn-link:hover { text-decoration: underline; }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--space-2xl, 3rem) var(--space-lg, 1.5rem);
  }
  .empty-title {
    font-size: 1.25rem;
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 0.25rem;
  }
  .empty-sub {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #57534e);
    margin: 0 0 1.5rem;
  }
</style>

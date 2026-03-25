<script>
  import { getAllWords } from '@lib/vocab-store';

  // Demo vocabulary data (fallback)
  const demoWords = [
    {
      id: 1,
      hanzi: '故事',
      pinyin: 'gùshì',
      meaning: 'story, tale',
      level: 'mastered',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
      saved: true,
    },
    {
      id: 2,
      hanzi: '古老',
      pinyin: 'gǔlǎo',
      meaning: 'ancient, old',
      level: 'mature',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
      saved: true,
    },
    {
      id: 3,
      hanzi: '花园',
      pinyin: 'huāyuán',
      meaning: 'garden',
      level: 'learning',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() - 86400000).toLocaleDateString(),
      saved: true,
    },
    {
      id: 4,
      hanzi: '秘密',
      pinyin: 'mìmì',
      meaning: 'secret, mystery',
      level: 'learning',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() + 43200000).toLocaleDateString(),
      saved: true,
    },
    {
      id: 5,
      hanzi: '发现',
      pinyin: 'fāxiàn',
      meaning: 'discover, find',
      level: 'new',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 7).toLocaleDateString(),
      saved: true,
    },
    {
      id: 6,
      hanzi: '冒险',
      pinyin: 'màoxiǎn',
      meaning: 'adventure, risk',
      level: 'new',
      story: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 7).toLocaleDateString(),
      saved: true,
    },
    {
      id: 7,
      hanzi: '忽然',
      pinyin: 'hūrán',
      meaning: 'suddenly, all at once',
      level: 'mature',
      story: 'Whispers in the Night',
      nextReview: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
      saved: true,
    },
    {
      id: 8,
      hanzi: '光线',
      pinyin: 'guāngxiàn',
      meaning: 'light ray, beam',
      level: 'learning',
      story: 'Whispers in the Night',
      nextReview: new Date(Date.now() + 86400000 * 1).toLocaleDateString(),
      saved: true,
    },
    {
      id: 9,
      hanzi: '呼吸',
      pinyin: 'hūxī',
      meaning: 'breath, breathe',
      level: 'mastered',
      story: 'Whispers in the Night',
      nextReview: new Date(Date.now() - 86400000 * 10).toLocaleDateString(),
      saved: true,
    },
    {
      id: 10,
      hanzi: '温暖',
      pinyin: 'nuǎnhuo',
      meaning: 'warm, warmth',
      level: 'new',
      story: 'Whispers in the Night',
      nextReview: new Date(Date.now() + 86400000 * 7).toLocaleDateString(),
      saved: true,
    },
    {
      id: 11,
      hanzi: '记忆',
      pinyin: 'jìyì',
      meaning: 'memory, remembrance',
      level: 'mastered',
      story: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 20).toLocaleDateString(),
      saved: true,
    },
    {
      id: 12,
      hanzi: '失去',
      pinyin: 'shīqù',
      meaning: 'lose, loss',
      level: 'learning',
      story: 'Echoes of the Past',
      nextReview: new Date(Date.now() + 86400000 * 3).toLocaleDateString(),
      saved: true,
    },
    {
      id: 13,
      hanzi: '承诺',
      pinyin: 'chéngnuò',
      meaning: 'promise, commitment',
      level: 'new',
      story: 'Echoes of the Past',
      nextReview: new Date(Date.now() + 86400000 * 7).toLocaleDateString(),
      saved: true,
    },
    {
      id: 14,
      hanzi: '勇气',
      pinyin: 'yǒngqì',
      meaning: 'courage, bravery',
      level: 'mature',
      story: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 7).toLocaleDateString(),
      saved: true,
    },
    {
      id: 15,
      hanzi: '希望',
      pinyin: 'xīwàng',
      meaning: 'hope, wish',
      level: 'mastered',
      story: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 15).toLocaleDateString(),
      saved: true,
    },
  ];

  let words = $state(demoWords);
  let isLoading = $state(true);
  let isDemoMode = $state(true);
  let selectedStage = $state('all');
  let searchQuery = $state('');
  let expandedId = $state(null);

  // Load words from IndexedDB on mount
  $effect(() => {
    getAllWords().then(dbWords => {
      if (dbWords.length > 0) {
        words = dbWords.map(w => ({
          id: w.id,
          hanzi: w.hanzi,
          pinyin: w.pinyin,
          meaning: w.gloss,
          level: w.stage || 'new',
          story: w.storyTitle || 'Unknown',
          nextReview: w.nextReview ? new Date(w.nextReview).toLocaleDateString() : 'Not scheduled',
          saved: true,
        }));
        isDemoMode = false;
      }
      isLoading = false;
    }).catch(err => {
      console.error('Failed to load words from IndexedDB:', err);
      isLoading = false;
    });
  });

  const stages = ['all', 'new', 'learning', 'mature', 'mastered'];

  const stageColors = {
    new: 'var(--color-gray, #999)',
    learning: 'var(--color-gold-leaf, #D4AF37)',
    mature: 'var(--color-jade, #5A8C6F)',
    mastered: 'var(--color-vermillion, #C41E3A)',
  };

  const stageLabels = {
    new: 'New',
    learning: 'Learning',
    mature: 'Mature',
    mastered: 'Mastered',
  };

  // Filter words based on stage and search query
  let filteredWords = $derived.by(() => {
    let result = words;

    // Filter by stage
    if (selectedStage !== 'all') {
      result = result.filter((w) => w.level === selectedStage);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.hanzi.includes(query) ||
          w.pinyin.toLowerCase().includes(query) ||
          w.meaning.toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Calculate stats
  let stats = $derived.by(() => {
    const total = words.length;
    const mastered = words.filter((w) => w.level === 'mastered').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueTodayCount = words.filter((w) => {
      const reviewDate = new Date(w.nextReview);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate <= today;
    }).length;

    return {
      total,
      dueToday: dueTodayCount,
      mastered,
    };
  });

  // Format date for display
  function formatNextReview(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(dateStr);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Due now';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  }

  function toggleExpanded(id) {
    expandedId = expandedId === id ? null : id;
  }

</script>

<div class="vocabulary-list">
  <!-- Stats Summary -->
  <div class="stats-summary">
    <div class="stat">
      <span class="label">Total:</span>
      <span class="value">{stats.total}</span>
    </div>
    <span class="separator">·</span>
    <div class="stat">
      <span class="label">Due today:</span>
      <span class="value">{stats.dueToday}</span>
    </div>
    <span class="separator">·</span>
    <div class="stat">
      <span class="label">Mastered:</span>
      <span class="value">{stats.mastered}</span>
    </div>
  </div>

  <!-- Filter and Search -->
  <div class="controls">
    <!-- Stage Filter -->
    <div class="filter-bar">
      {#each stages as stage (stage)}
        <button
          class="filter-pill"
          class:active={selectedStage === stage}
          onclick={() => (selectedStage = stage)}
        >
          {stage === 'all' ? 'All' : stageLabels[stage]}
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="search-container">
      <input
        type="text"
        placeholder="Search hanzi, pinyin, or meaning..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>
  </div>

  <!-- Word List -->
  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your vocabulary...</p>
    </div>
  {:else if filteredWords.length === 0}
    <div class="empty-state">
      <p>{isDemoMode ? 'These are sample words — save words from stories to build your vocabulary' : 'No words saved yet. Tap vocabulary words while reading stories to add them here.'}</p>
    </div>
  {:else}
    {#if isDemoMode}
      <div class="demo-mode-banner">
        <span class="demo-badge">Demo data</span>
        <p>These are sample words — save words from stories to build your vocabulary</p>
      </div>
    {/if}
    <div class="word-list">
      {#each filteredWords as word (word.id)}
        <div
          class="word-item"
          class:expanded={expandedId === word.id}
          onclick={() => toggleExpanded(word.id)}
        >
          <!-- Collapsed View -->
          <div class="word-card">
            <div class="word-left">
              <div class="hanzi">{word.hanzi}</div>
              <div class="pinyin">{word.pinyin}</div>
            </div>

            <div class="word-right">
              <div class="gloss">{word.meaning}</div>
              <div class="stage-indicator" style="background-color: {stageColors[word.level]}" />
            </div>

            <div class="word-bottom">
              <div class="story-source">{word.story}</div>
              <div class="next-review">{formatNextReview(word.nextReview)}</div>
            </div>
          </div>

          <!-- Expanded View -->
          {#if expandedId === word.id}
            <div class="expanded-details">
              <div class="detail-section">
                <h4>Review History</h4>
                <div class="review-placeholder">
                  <p>Review history will be tracked here once IndexedDB is configured.</p>
                </div>
              </div>

              <div class="detail-section">
                <h4>Stage</h4>
                <div class="stage-badge" style="background-color: {stageColors[word.level]}">
                  {stageLabels[word.level]}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --color-jade: #5a8c6f;
    --color-vermillion: #c41e3a;
    --color-gold-leaf: #d4af37;
    --color-text-primary: #2a2a2a;
    --color-text-secondary: #666666;
    --color-bg: #fafaf8;
    --color-surface: #ffffff;
    --color-border: #e5e5e3;
    --color-gray: #999999;
    --font-display-cn: 'Noto Serif SC', serif;
  }

  .vocabulary-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Stats Summary */
  .stats-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .stat {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .stat .label {
    font-weight: 500;
  }

  .stat .value {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .separator {
    opacity: 0.5;
  }

  /* Controls */
  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-pill {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 150ms ease;
  }

  .filter-pill:hover {
    border-color: var(--color-text-primary);
    background-color: var(--color-bg);
  }

  .filter-pill.active {
    background-color: var(--color-text-primary);
    color: var(--color-surface);
    border-color: var(--color-text-primary);
  }

  .search-container {
    display: flex;
  }

  .search-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 14px;
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    transition: border-color 150ms ease;
  }

  .search-input::placeholder {
    color: var(--color-text-secondary);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-text-primary);
  }

  /* Empty State */
  .empty-state {
    padding: 40px 24px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .empty-state p {
    font-size: 14px;
    line-height: 1.6;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    gap: 16px;
    color: var(--color-text-secondary);
  }

  .loading-state p {
    font-size: 14px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-jade, #5A8C6F);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Demo Mode Banner */
  .demo-mode-banner {
    background: rgba(212, 175, 55, 0.08);
    border-left: 3px solid var(--color-gold-leaf, #D4AF37);
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .demo-badge {
    display: inline-block;
    background: var(--color-gold-leaf, #D4AF37);
    color: #2a2a2a;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .demo-mode-banner p {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  /* Word List */
  .word-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .word-item {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background-color: var(--color-surface);
    overflow: hidden;
    transition: all 150ms ease;
    cursor: pointer;
  }

  .word-item:hover {
    border-color: var(--color-text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .word-item.expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* Word Card (Collapsed) */
  .word-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
    padding: 16px;
    align-items: start;
  }

  .word-left {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hanzi {
    font-family: var(--font-display-cn);
    font-size: 22px;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .pinyin {
    font-size: 14px;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  .word-right {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .gloss {
    font-size: 14px;
    color: var(--color-text-primary);
    line-height: 1.4;
    flex: 1;
  }

  .stage-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .word-bottom {
    grid-column: 1 / -1;
    grid-row: 2;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .story-source {
    font-weight: 500;
  }

  .next-review {
    font-weight: 500;
  }

  /* Expanded Details */
  .expanded-details {
    border-top: 1px solid var(--color-border);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: rgba(0, 0, 0, 0.02);
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .detail-section h4 {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .context-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary);
    margin: 0;
    padding: 10px;
    background-color: var(--color-surface);
    border-radius: 6px;
    border-left: 3px solid var(--color-border);
  }

  .review-placeholder {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-style: italic;
    padding: 10px;
    background-color: var(--color-surface);
    border-radius: 6px;
    text-align: center;
  }

  .review-placeholder p {
    margin: 0;
  }

  .stage-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    width: fit-content;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .word-card {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
      gap: 10px;
      padding: 14px;
    }

    .word-left {
      grid-column: 1;
      grid-row: 1;
    }

    .word-right {
      grid-column: 1;
      grid-row: 2;
    }

    .word-bottom {
      grid-column: 1;
      grid-row: 3;
      flex-direction: column;
      gap: 4px;
    }

    .hanzi {
      font-size: 20px;
    }

    .expanded-details {
      padding: 14px;
    }
  }
</style>

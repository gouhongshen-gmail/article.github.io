<script>
  import { onMount } from 'svelte';

  // Demo vocabulary data
  const demoWords = [
    {
      id: 1,
      hanzi: '故事',
      pinyin: 'gùshì',
      gloss: 'story, tale',
      stage: 'mastered',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() - 86400000 * 3),
      context: '这个故事很有趣。(This story is very interesting.)',
    },
    {
      id: 2,
      hanzi: '古老',
      pinyin: 'gǔlǎo',
      gloss: 'ancient, old',
      stage: 'mature',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 2),
      context: '这是一座古老的城堡。(This is an ancient castle.)',
    },
    {
      id: 3,
      hanzi: '花园',
      pinyin: 'huāyuán',
      gloss: 'garden',
      stage: 'learning',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() - 86400000),
      context: '她在花园里散步。(She walks in the garden.)',
    },
    {
      id: 4,
      hanzi: '秘密',
      pinyin: 'mìmì',
      gloss: 'secret, mystery',
      stage: 'learning',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() + 43200000),
      context: '这个秘密很重要。(This secret is important.)',
    },
    {
      id: 5,
      hanzi: '发现',
      pinyin: 'fāxiàn',
      gloss: 'discover, find',
      stage: 'new',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 7),
      context: '她发现了一扇隐藏的门。(She discovered a hidden door.)',
    },
    {
      id: 6,
      hanzi: '冒险',
      pinyin: 'màoxiǎn',
      gloss: 'adventure, risk',
      stage: 'new',
      storyTitle: 'The Lost Garden',
      nextReview: new Date(Date.now() + 86400000 * 7),
      context: '开始了一场新的冒险。(Beginning a new adventure.)',
    },
    {
      id: 7,
      hanzi: '忽然',
      pinyin: 'hūrán',
      gloss: 'suddenly, all at once',
      stage: 'mature',
      storyTitle: 'Whispers in the Night',
      nextReview: new Date(Date.now() - 86400000 * 5),
      context: '忽然，她听到了一个声音。(Suddenly, she heard a sound.)',
    },
    {
      id: 8,
      hanzi: '光线',
      pinyin: 'guāngxiàn',
      gloss: 'light ray, beam',
      stage: 'learning',
      storyTitle: 'Whispers in the Night',
      nextReview: new Date(Date.now() + 86400000 * 1),
      context: '月光线照进房间。(Moonlight beamed into the room.)',
    },
    {
      id: 9,
      hanzi: '呼吸',
      pinyin: 'hūxī',
      gloss: 'breath, breathe',
      stage: 'mastered',
      storyTitle: 'Whispers in the Night',
      nextReview: new Date(Date.now() - 86400000 * 10),
      context: '深深呼吸。(Breathe deeply.)',
    },
    {
      id: 10,
      hanzi: '温暖',
      pinyin: 'nuǎnhuo',
      gloss: 'warm, warmth',
      stage: 'new',
      storyTitle: 'Whispers in the Night',
      nextReview: new Date(Date.now() + 86400000 * 7),
      context: '感到温暖的怀抱。(Feel the warm embrace.)',
    },
    {
      id: 11,
      hanzi: '记忆',
      pinyin: 'jìyì',
      gloss: 'memory, remembrance',
      stage: 'mastered',
      storyTitle: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 20),
      context: '童年的记忆依然清晰。(Childhood memories remain clear.)',
    },
    {
      id: 12,
      hanzi: '失去',
      pinyin: 'shīqù',
      gloss: 'lose, loss',
      stage: 'learning',
      storyTitle: 'Echoes of the Past',
      nextReview: new Date(Date.now() + 86400000 * 3),
      context: '我失去了我最珍贵的东西。(I lost what I cherished most.)',
    },
    {
      id: 13,
      hanzi: '承诺',
      pinyin: 'chéngnuò',
      gloss: 'promise, commitment',
      stage: 'new',
      storyTitle: 'Echoes of the Past',
      nextReview: new Date(Date.now() + 86400000 * 7),
      context: '她守住了她的承诺。(She kept her promise.)',
    },
    {
      id: 14,
      hanzi: '勇气',
      pinyin: 'yǒngqì',
      gloss: 'courage, bravery',
      stage: 'mature',
      storyTitle: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 7),
      context: '需要很多勇气才能前进。(It takes much courage to move forward.)',
    },
    {
      id: 15,
      hanzi: '希望',
      pinyin: 'xīwàng',
      gloss: 'hope, wish',
      stage: 'mastered',
      storyTitle: 'Echoes of the Past',
      nextReview: new Date(Date.now() - 86400000 * 15),
      context: '心中充满希望。(Heart full of hope.)',
    },
  ];

  let words = $state(demoWords);
  let selectedStage = $state('all');
  let searchQuery = $state('');
  let expandedId = $state(null);

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
      result = result.filter((w) => w.stage === selectedStage);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.hanzi.includes(query) ||
          w.pinyin.toLowerCase().includes(query) ||
          w.gloss.toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Calculate stats
  let stats = $derived.by(() => {
    const total = words.length;
    const mastered = words.filter((w) => w.stage === 'mastered').length;
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
  function formatNextReview(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
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

  onMount(() => {
    // Component mounted
  });
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
  {#if filteredWords.length === 0}
    <div class="empty-state">
      <p>No words saved yet. Tap vocabulary words while reading stories to add them here.</p>
    </div>
  {:else}
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
              <div class="gloss">{word.gloss}</div>
              <div class="stage-indicator" style="background-color: {stageColors[word.stage]}" />
            </div>

            <div class="word-bottom">
              <div class="story-source">{word.storyTitle}</div>
              <div class="next-review">{formatNextReview(word.nextReview)}</div>
            </div>
          </div>

          <!-- Expanded View -->
          {#if expandedId === word.id}
            <div class="expanded-details">
              <div class="detail-section">
                <h4>Context</h4>
                <p class="context-text">{word.context}</p>
              </div>

              <div class="detail-section">
                <h4>Review History</h4>
                <div class="review-placeholder">
                  <p>Review history will be tracked here once IndexedDB is configured.</p>
                </div>
              </div>

              <div class="detail-section">
                <h4>Stage</h4>
                <div class="stage-badge" style="background-color: {stageColors[word.stage]}">
                  {stageLabels[word.stage]}
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

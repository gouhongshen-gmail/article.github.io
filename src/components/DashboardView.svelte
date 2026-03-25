<script>
  import { getStats, getDueCards, getAllWords } from '@lib/vocab-store';

  // Demo mode toggle — set to true for empty state, false for returning user
  let isNewUser = $state(false);

  // Demo data — will be replaced with IndexedDB reads
  const demoStats = {
    streak: 7,
    wordsLearned: 42,
    wordsMastered: 12,
    wordsInPipeline: 30,
    reviewsDueToday: 8,
    reviewsCompletedToday: 15,
    accuracy: 85,
    weeklyDelta: 12,
  };

  const demoHeatmap = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 86400000);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const count = Math.floor(Math.random() * 20);
    
    return {
      date: date.toISOString().slice(0, 10),
      count,
      display: `${dayName}, ${month} ${day}: ${count} reviews`,
    };
  });

  // Last 7 days accuracy trend (for sparkline)
  const accuracyTrend = [78, 81, 79, 84, 82, 85, 85];

  const demoContinueStories = [
    {
      title: 'The Grand Canal',
      slug: 'grand-canal',
      progress: 60,
      difficulty: 'beginner',
    },
    {
      title: 'Mandate of Heaven',
      slug: 'mandate-heaven',
      progress: 30,
      difficulty: 'intermediate',
    },
  ];

  let stats = $state(demoStats);
  let isDemoMode = $state(true);
  let heatmap = $state(demoHeatmap);
  let continueStories = $state(demoContinueStories);
  let hoverTooltip = $state(null);

  // Load real stats from IndexedDB
  $effect(() => {
    Promise.all([getStats(), getDueCards(), getAllWords()]).then(([statsResult, dueCards, allWords]) => {
      if (allWords.length > 0) {
        stats = {
          ...stats,
          wordsLearned: allWords.length,
          wordsMastered: allWords.filter(w => w.stage === 'mastered').length,
          wordsInPipeline: allWords.filter(w => w.stage !== 'mastered').length,
          reviewsDueToday: dueCards.length,
        };
        isDemoMode = false;
      }
    }).catch(err => {
      console.error('Failed to load stats from IndexedDB:', err);
    });
  });

  const hour = new Date().getHours();

  let greeting = $derived(
    hour >= 5 && hour < 12
      ? '早上好'
      : hour >= 12 && hour < 18
        ? '下午好'
        : hour >= 18 && hour < 23
          ? '晚上好'
          : '夜深了',
  );

  let hasReviews = $derived(stats.reviewsDueToday > 0);
  let isOverdue = $derived(stats.reviewsDueToday > 20);
  let reviewMinutes = $derived(Math.ceil(stats.reviewsDueToday * 0.4));

  const totalSegments = 10;

  function heatmapColor(count) {
    if (count === 0) return 'var(--heatmap-0)';
    if (count <= 5) return 'var(--heatmap-low)';
    if (count <= 15) return 'var(--heatmap-mid)';
    return 'var(--heatmap-high)';
  }

  function difficultyLabel(d) {
    switch (d) {
      case 'beginner':
        return '初级';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return d;
    }
  }

  // Generate SVG sparkline path data
  function generateSparklinePath(data) {
    const width = 60;
    const height = 20;
    const padding = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - (((value - min) / range) * (height - padding * 2) + padding);
      return `${x},${y}`;
    });
    
    return points.join(' ');
  }

  function getWeeklyDeltaColor() {
    return stats.weeklyDelta >= 0 ? 'var(--color-jade)' : 'var(--color-brand)';
  }

  function getWeeklyDeltaSign() {
    return stats.weeklyDelta >= 0 ? '+' : '';
  }

  function getFilledSegments(progress) {
    return Math.round((progress / 100) * totalSegments);
  }
</script>

<div class="dashboard">
  {#if isNewUser}
    <!-- ⓪ Empty State for New Users -->
    <div class="empty-state">
      <div class="empty-state-content">
        <span class="empty-state-icon">🐉</span>
        <h2 class="empty-state-heading">Welcome to LongLore!</h2>
        <p class="empty-state-message">Start reading stories to build your vocabulary.</p>
        <a href="/stories" class="btn-primary btn-large">Explore Stories →</a>
      </div>
    </div>
  {:else}
    <!-- ① Greeting Header -->
    <header class="greeting">
      <div class="greeting-left">
        <span class="greeting-text">{greeting}</span>
        {#if isDemoMode}
          <span class="demo-badge-inline">Demo data</span>
        {/if}
      </div>
      <div class="streak-display">
        <span class="streak-icon">🔥</span>
        <span class="streak-number">{stats.streak}</span>
        <span class="streak-unit">天</span>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- Main Column -->
      <div class="main-column">
        <!-- ② Review CTA Card -->
        <section class="card review-card" class:review-card--overdue={isOverdue}>
          {#if hasReviews}
            <div class="review-header">
              <p class="review-message">
                <strong>{stats.reviewsDueToday} words</strong> to review · ~{reviewMinutes} min
              </p>
              {#if isOverdue}
                <span class="overdue-badge">Overdue!</span>
              {/if}
            </div>
            <a href="/review" class="btn-primary">Start Review →</a>
          {:else}
            <p class="review-message caught-up">All caught up! 🎉 Next review in 3小时</p>
          {/if}
        </section>

        <!-- ③ Continue Reading Section -->
        <section class="card continue-section">
          <h3 class="section-heading">Continue Reading</h3>
          <div class="continue-stories">
            {#each continueStories as story}
              <div class="story-card">
                <div class="story-header">
                  <h4 class="story-title">{story.title}</h4>
                  <span class="difficulty-badge {story.difficulty}">
                    {difficultyLabel(story.difficulty)}
                  </span>
                </div>
                <div class="progress-bar" role="progressbar" aria-valuenow={story.progress} aria-valuemin={0} aria-valuemax={100}>
                  {#each Array(totalSegments) as _, i}
                    <div class="progress-segment" class:filled={i < getFilledSegments(story.progress)}></div>
                  {/each}
                </div>
                <div class="story-footer">
                  <span class="progress-label">{story.progress}%</span>
                  <a href="/stories/{story.slug}" class="continue-link">Continue →</a>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- ④ 30-Day Heatmap -->
        <section class="card heatmap-card">
          <h3 class="section-heading">30-Day Activity</h3>
          <div class="heatmap-wrapper">
            <div class="heatmap-grid">
              {#each heatmap as day (day.date)}
                <div
                  class="heatmap-cell"
                  style:background-color={heatmapColor(day.count)}
                  title={day.display}
                  on:mouseenter={() => hoverTooltip = day.display}
                  on:mouseleave={() => hoverTooltip = null}
                ></div>
              {/each}
            </div>
            {#if hoverTooltip}
              <div class="heatmap-tooltip">{hoverTooltip}</div>
            {/if}
          </div>
        </section>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- ⑤ Stats Grid (2×2 on mobile, stacked on desktop) -->
        <div class="stats-grid-mobile">
          <!-- Accuracy with Sparkline -->
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-emoji">✓</span>
              <svg class="sparkline" viewBox="0 0 60 20" preserveAspectRatio="none">
                <polyline points={generateSparklinePath(accuracyTrend)} />
              </svg>
            </div>
            <span class="stat-value">{stats.accuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>

          <!-- Mastered with Weekly Delta -->
          <div class="stat-card">
            <span class="stat-emoji">🏆</span>
            <span class="stat-value">{stats.wordsMastered}</span>
            <span class="stat-label">Mastered</span>
            <span class="stat-trend" style:color={getWeeklyDeltaColor()}>
              {getWeeklyDeltaSign()}{stats.weeklyDelta} this week
            </span>
          </div>

          <!-- Learned -->
          <div class="stat-card">
            <span class="stat-emoji">📚</span>
            <span class="stat-value">{stats.wordsLearned}</span>
            <span class="stat-label">Learned</span>
          </div>

          <!-- Today -->
          <div class="stat-card">
            <span class="stat-emoji">🎯</span>
            <span class="stat-value">{stats.reviewsCompletedToday}</span>
            <span class="stat-label">Today</span>
          </div>
        </div>
      </aside>
    </div>
  {/if}
</div>

<style>
  /* Heatmap color scale */
  .dashboard {
    --heatmap-0: #e8dcc8;
    --heatmap-low: #a8d5a2;
    --heatmap-mid: #2e8b57;
    --heatmap-high: #1a5c38;
  }

  :global([data-theme='dark']) .dashboard {
    --heatmap-0: #2a2722;
    --heatmap-low: #1e4a32;
    --heatmap-mid: #2d8a72;
    --heatmap-high: #1a6b4e;
  }

  /* ── Layout ─────────────────────────────────────────────────── */
  .dashboard {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--space-md);
  }

  .dashboard-grid {
    display: grid;
    gap: var(--space-md);
  }

  @media (min-width: 768px) {
    .dashboard {
      padding: var(--space-lg) var(--space-md);
    }

    .dashboard-grid {
      grid-template-columns: 2fr 1fr;
      gap: var(--space-lg);
    }
  }

  .main-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  /* ── Cards ──────────────────────────────────────────────────── */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
  }

  /* ── ⓪ Empty State ─────────────────────────────────────────── */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .empty-state-content {
    text-align: center;
    max-width: 400px;
  }

  .empty-state-icon {
    font-size: 64px;
    display: block;
    margin-bottom: var(--space-md);
  }

  .empty-state-heading {
    font-family: var(--font-display-en);
    font-size: var(--text-h2);
    font-weight: 700;
    margin: 0 0 var(--space-sm);
    color: var(--color-text-primary);
  }

  .empty-state-message {
    font-size: var(--text-body);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-lg);
    line-height: var(--lh-body);
  }

  .btn-large {
    padding: var(--space-md) var(--space-xl) !important;
    font-size: var(--text-h3) !important;
  }

  /* ── ① Greeting Header ─────────────────────────────────────── */
  .greeting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg) 0 var(--space-md);
  }

  .greeting-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .greeting-text {
    font-family: var(--font-display-cn);
    font-size: var(--text-h1);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: var(--lh-h1-cjk);
  }

  .demo-badge-inline {
    display: inline-block;
    background: rgba(212, 175, 55, 0.15);
    color: #8b7326;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .streak-display {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
  }

  .streak-icon {
    font-size: 28px;
    line-height: 1;
  }

  .streak-number {
    font-size: 36px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
    font-family: var(--font-body-en);
  }

  .streak-unit {
    font-size: 18px;
    color: var(--color-text-secondary);
    font-family: var(--font-body-cn);
  }

  /* ── ② Review CTA Card ─────────────────────────────────────── */
  .review-card {
    border-left: 4px solid var(--color-jade);
  }

  .review-card--overdue {
    border-left-color: #c4392a;
  }

  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  .review-message {
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--lh-h3);
    font-family: var(--font-body-en);
  }

  .review-message.caught-up {
    margin-bottom: 0;
  }

  .overdue-badge {
    display: inline-block;
    background: #c4392a;
    color: #fff;
    font-size: var(--text-caption);
    font-weight: 600;
    padding: 4px 10px;
    border-radius: var(--radius-md);
    white-space: nowrap;
    font-family: var(--font-body-en);
  }

  .btn-primary {
    display: inline-block;
    background: var(--color-jade);
    color: #fff;
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 600;
    font-family: var(--font-body-en);
    font-size: var(--text-body);
    transition:
      background var(--duration-fast) var(--ease-default),
      transform var(--duration-fast) var(--ease-default);
    border: none;
    cursor: pointer;
  }

  .btn-primary:hover {
    background: #1e6b4e;
    transform: translateY(-1px);
  }

  .btn-primary:focus-visible {
    outline: 2px solid var(--color-jade);
    outline-offset: 2px;
  }

  /* ── ③ Continue Reading Section ────────────────────────────── */
  .section-heading {
    font-family: var(--font-display-en);
    font-size: var(--text-h3);
    font-weight: 600;
    margin: 0 0 var(--space-md);
    color: var(--color-text-primary);
    line-height: var(--lh-h3);
  }

  .continue-stories {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .story-card {
    background: var(--color-elevated);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .story-title {
    font-family: var(--font-display-en);
    font-size: var(--text-body);
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
    line-height: var(--lh-body);
  }

  .difficulty-badge {
    font-size: var(--text-caption);
    font-weight: 500;
    padding: 2px 10px;
    border-radius: var(--radius-full);
    white-space: nowrap;
    font-family: var(--font-body-cn);
    flex-shrink: 0;
  }

  .difficulty-badge.beginner {
    background: rgba(45, 138, 114, 0.12);
    color: var(--color-jade);
  }

  .difficulty-badge.intermediate {
    background: rgba(205, 164, 52, 0.12);
    color: #cda434;
  }

  .difficulty-badge.advanced {
    background: rgba(196, 57, 42, 0.12);
    color: #c4392a;
  }

  .progress-bar {
    display: flex;
    gap: 3px;
    margin-bottom: var(--space-sm);
  }

  .progress-segment {
    flex: 1;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    transition: background var(--duration-normal) var(--ease-default);
  }

  .progress-segment.filled {
    background: var(--color-jade);
  }

  .story-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .progress-label {
    font-size: var(--text-small);
    color: var(--color-text-secondary);
    font-family: var(--font-body-en);
  }

  .continue-link {
    color: var(--color-jade);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--text-small);
    font-family: var(--font-body-en);
    transition: opacity var(--duration-fast) var(--ease-default);
  }

  .continue-link:hover {
    opacity: 0.8;
  }

  .continue-link:focus-visible {
    outline: 2px solid var(--color-jade);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* ── ④ 30-Day Heatmap ──────────────────────────────────────── */
  .heatmap-card {
    display: flex;
    flex-direction: column;
  }

  .card-heading {
    font-size: var(--text-small);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-md);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-body-en);
  }

  .heatmap-wrapper {
    position: relative;
  }

  .heatmap-grid {
    display: grid;
    grid-template-rows: repeat(7, 16px);
    grid-auto-flow: column;
    grid-auto-columns: 16px;
    gap: 3px;
  }

  @media (min-width: 768px) {
    .heatmap-grid {
      grid-template-rows: repeat(7, 20px);
      grid-auto-columns: 20px;
    }
  }

  .heatmap-cell {
    border-radius: 3px;
    transition: transform var(--duration-fast) var(--ease-default);
    cursor: pointer;
  }

  .heatmap-cell:hover {
    transform: scale(1.2);
  }

  .heatmap-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-text-primary);
    color: var(--color-surface);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    font-weight: 500;
    white-space: nowrap;
    margin-bottom: 8px;
    z-index: 10;
    pointer-events: none;
  }

  /* ── ⑤ Sidebar Stats Grid ────────────────────────────────────── */
  .stats-grid-mobile {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  @media (min-width: 768px) {
    .stats-grid-mobile {
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-xs);
  }

  .stat-card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
  }

  .stat-emoji {
    font-size: 24px;
    line-height: 1;
  }

  .sparkline {
    width: 60px;
    height: 20px;
    stroke: var(--color-jade);
    stroke-width: 1.5;
    fill: none;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.1;
    font-family: var(--font-body-en);
  }

  .stat-unit {
    font-size: 18px;
    font-weight: 400;
    color: var(--color-text-secondary);
    font-family: var(--font-body-cn);
  }

  .stat-label {
    font-size: var(--text-small);
    color: var(--color-text-secondary);
    font-family: var(--font-body-en);
  }

  .stat-trend {
    font-size: var(--text-caption);
    font-weight: 500;
    font-family: var(--font-body-en);
  }
</style>

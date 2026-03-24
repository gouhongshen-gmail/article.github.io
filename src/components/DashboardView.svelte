<script>
  // Demo data — will be replaced with IndexedDB reads
  const demoStats = {
    streak: 7,
    wordsLearned: 42,
    wordsMastered: 12,
    wordsInPipeline: 30,
    reviewsDueToday: 8,
    reviewsCompletedToday: 15,
    accuracy: 85,
  };

  const demoHeatmap = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 20),
  }));

  const demoContinueStory = {
    title: 'How the Grand Canal Helped Hold Imperial China Together',
    slug: 'grand-canal',
    progress: 35,
    difficulty: 'beginner',
  };

  let stats = $state(demoStats);
  let heatmap = $state(demoHeatmap);
  let continueStory = $state(demoContinueStory);

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
  let reviewMinutes = $derived(Math.ceil(stats.reviewsDueToday * 0.4));

  const totalSegments = 10;
  let filledSegments = $derived(
    Math.round((continueStory.progress / 100) * totalSegments),
  );

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
</script>

<div class="dashboard">
  <!-- ① Greeting Header -->
  <header class="greeting">
    <span class="greeting-text">{greeting}</span>
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
      <section class="card review-card">
        {#if hasReviews}
          <p class="review-message">
            <strong>{stats.reviewsDueToday} words</strong> to review · ~{reviewMinutes} min
          </p>
          <a href="/review" class="btn-primary">Start Review →</a>
        {:else}
          <p class="review-message caught-up">All caught up! 🎉 Next review in 3小时</p>
        {/if}
      </section>

      <!-- ③ Continue Reading Card -->
      <section class="card continue-card">
        <div class="continue-header">
          <h3 class="continue-title">{continueStory.title}</h3>
          <span class="difficulty-badge {continueStory.difficulty}">
            {difficultyLabel(continueStory.difficulty)}
          </span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow={continueStory.progress} aria-valuemin={0} aria-valuemax={100}>
          {#each Array(totalSegments) as _, i}
            <div class="progress-segment" class:filled={i < filledSegments}></div>
          {/each}
        </div>
        <div class="continue-footer">
          <span class="progress-label">{continueStory.progress}%</span>
          <a href="/stories/{continueStory.slug}" class="continue-link">Continue →</a>
        </div>
      </section>

      <!-- ④ Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-emoji">🔥</span>
          <span class="stat-value">{stats.streak}<span class="stat-unit"> 天</span></span>
          <span class="stat-label">Streak</span>
        </div>
        <div class="stat-card">
          <span class="stat-emoji">🏆</span>
          <span class="stat-value">{stats.wordsMastered}</span>
          <span class="stat-label">Mastered</span>
        </div>
        <div class="stat-card">
          <span class="stat-emoji">📚</span>
          <span class="stat-value">{stats.wordsInPipeline}</span>
          <span class="stat-label">In Pipeline</span>
          <span class="stat-trend">+5 this week</span>
        </div>
        <div class="stat-card">
          <span class="stat-emoji stat-emoji--check">✓</span>
          <span class="stat-value">{stats.reviewsCompletedToday}</span>
          <span class="stat-label">Today</span>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- ⑤ 30-Day Heatmap -->
      <section class="card heatmap-card">
        <h3 class="card-heading">30-Day Activity</h3>
        <div class="heatmap-grid">
          {#each heatmap as day}
            <div
              class="heatmap-cell"
              style:background-color={heatmapColor(day.count)}
              title="{day.date}: {day.count} reviews"
            ></div>
          {/each}
        </div>
      </section>
    </aside>
  </div>
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

  @media (min-width: 1024px) {
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
    background: var(--color-elevated);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: var(--space-md);
  }

  @media (min-width: 1024px) {
    .card {
      padding: var(--space-lg);
    }
  }

  /* ── ① Greeting Header ─────────────────────────────────────── */
  .greeting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg) 0 var(--space-md);
  }

  .greeting-text {
    font-family: var(--font-display-cn);
    font-size: var(--text-h1);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: var(--lh-h1-cjk);
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
    border-left: 4px solid var(--color-accent);
  }

  .review-message {
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-md);
    line-height: var(--lh-h3);
    font-family: var(--font-body-en);
  }

  .review-message.caught-up {
    margin-bottom: 0;
  }

  .btn-primary {
    display: inline-block;
    background: var(--color-accent);
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
  }

  .btn-primary:hover {
    background: #257a64;
    transform: translateY(-1px);
  }

  .btn-primary:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* ── ③ Continue Reading Card ────────────────────────────────── */
  .continue-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .continue-title {
    font-family: var(--font-display-en);
    font-size: var(--text-h3);
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
    line-height: var(--lh-h3);
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
    color: var(--color-gold-leaf);
  }

  .difficulty-badge.advanced {
    background: rgba(196, 57, 42, 0.12);
    color: var(--color-brand);
  }

  .progress-bar {
    display: flex;
    gap: 3px;
    margin-bottom: var(--space-sm);
  }

  .progress-segment {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--color-surface);
    transition: background var(--duration-normal) var(--ease-default);
  }

  .progress-segment.filled {
    background: var(--color-accent);
  }

  .continue-footer {
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
    color: var(--color-accent);
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
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* ── ④ Stats Grid ───────────────────────────────────────────── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    background: var(--color-elevated);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-xs);
  }

  .stat-emoji {
    font-size: 24px;
    line-height: 1;
  }

  .stat-emoji--check {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-accent);
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
    color: var(--color-accent);
    font-weight: 500;
    font-family: var(--font-body-en);
  }

  /* ── ⑤ 30-Day Heatmap ──────────────────────────────────────── */
  .card-heading {
    font-size: var(--text-small);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-md);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-body-en);
  }

  .heatmap-grid {
    display: grid;
    grid-template-rows: repeat(7, 16px);
    grid-auto-flow: column;
    grid-auto-columns: 16px;
    gap: 3px;
  }

  @media (min-width: 1024px) {
    .heatmap-grid {
      grid-template-rows: repeat(7, 20px);
      grid-auto-columns: 20px;
    }
  }

  .heatmap-cell {
    border-radius: 3px;
    transition: transform var(--duration-fast) var(--ease-default);
  }

  .heatmap-cell:hover {
    transform: scale(1.2);
  }
</style>

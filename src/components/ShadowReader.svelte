<script>
  const PAUSE_SECONDS = 3;

  function stripChinese(text = '') {
    return text.replace(/[^\u4e00-\u9fff]/g, '');
  }

  let {
    sentence = /** @type {{ zh: string, en: string, segments: Array<{text: string}> } | null} */ (null),
    onClose = /** @type {() => void} */ (() => {}),
  } = $props();

  let phase = $state('listen');
  let activeSegIdx = $state(-1);
  let countdown = $state(PAUSE_SECONDS);
  let attempt = $state(1);
  let timers = [];

  let shadowSegments = $derived(
    (sentence?.segments ?? [])
      .map((seg, idx) => ({ id: idx, text: stripChinese(seg.text || '') }))
      .filter((seg) => seg.text)
  );

  function stopAudio() {
    try {
      window.__audioProvider?.stop?.();
    } catch {
      // no-op
    }
  }

  function clearTimers() {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  }

  function estimateDurationMs() {
    const chars = Math.max(1, shadowSegments.reduce((sum, seg) => sum + seg.text.length, 0));
    const rate = Number(window.__audioProvider?.playbackRate || localStorage.getItem('longlore_audio_speed') || 0.8);
    return Math.max(2200, Math.round((chars * 420) / (rate || 0.8)));
  }

  function scheduleHighlights(totalMs) {
    if (shadowSegments.length === 0) return;
    const totalChars = shadowSegments.reduce((sum, seg) => sum + seg.text.length, 0) || 1;
    let elapsed = 0;
    shadowSegments.forEach((seg, idx) => {
      const delay = elapsed;
      timers.push(setTimeout(() => {
        activeSegIdx = idx;
      }, delay));
      elapsed += Math.round((seg.text.length / totalChars) * totalMs);
    });
  }

  function startPausePhase() {
    phase = 'pause';
    activeSegIdx = -1;
    countdown = PAUSE_SECONDS;

    for (let i = 1; i <= PAUSE_SECONDS; i += 1) {
      timers.push(setTimeout(() => {
        countdown = Math.max(PAUSE_SECONDS - i, 0);
      }, i * 1000));
    }

    timers.push(setTimeout(() => {
      phase = 'shadow';
    }, PAUSE_SECONDS * 1000));
  }

  function startListen() {
    clearTimers();
    stopAudio();
    phase = 'listen';
    activeSegIdx = -1;
    countdown = PAUSE_SECONDS;

    const totalMs = estimateDurationMs();
    scheduleHighlights(totalMs);
    window.dispatchEvent(new CustomEvent('audio-play-request', { detail: { text: sentence?.zh || '' } }));
    timers.push(setTimeout(startPausePhase, totalMs + 120));
  }

  function finishShadow() {
    clearTimers();
    stopAudio();
    activeSegIdx = -1;
    phase = 'review';
  }

  function retryShadow() {
    attempt += 1;
    startListen();
  }

  function closeShadow() {
    clearTimers();
    stopAudio();
    onClose();
  }

  $effect(() => {
    if (sentence) {
      startListen();
    }
    return () => {
      clearTimers();
      stopAudio();
    };
  });
</script>

{#if sentence}
  <section class="shadow" aria-label="Shadow reading practice">
    <div class="shadow__header">
      <div>
        <p class="shadow__kicker">Shadow Reading · 跟读</p>
        <h4 class="shadow__title">先听，再跟读，再自评</h4>
      </div>
      <button class="shadow__close" onclick={closeShadow} aria-label="Close shadow reading">✕</button>
    </div>

    <div class="shadow__steps" aria-hidden="true">
      <span class:shadow__step--active={phase === 'listen'}>1 听</span>
      <span class:shadow__step--active={phase === 'pause'}>2 停顿</span>
      <span class:shadow__step--active={phase === 'shadow'}>3 跟读</span>
      <span class:shadow__step--active={phase === 'review'}>4 自评</span>
    </div>

    <div class="shadow__sentence" lang="zh-CN">
      {#each shadowSegments as seg, idx}
        <span class="shadow__segment" class:shadow__segment--active={phase === 'listen' && idx === activeSegIdx}>
          {seg.text}
        </span>
      {/each}
    </div>

    <p class="shadow__reference">{sentence.en}</p>

    {#if phase === 'listen'}
      <p class="shadow__status">正在播放示范发音。注意节奏与停连。</p>
      <div class="shadow__actions">
        <button class="shadow__btn shadow__btn--secondary" onclick={startListen}>重听一遍</button>
      </div>
    {:else if phase === 'pause'}
      <p class="shadow__status">准备跟读，{countdown} 秒后开始。</p>
      <div class="shadow__count">{countdown}</div>
      <div class="shadow__actions">
        <button class="shadow__btn shadow__btn--secondary" onclick={() => { clearTimers(); phase = 'shadow'; countdown = 0; }}>跳过停顿</button>
      </div>
    {:else if phase === 'shadow'}
      <p class="shadow__status">现在轮到你。尝试完整跟读这一句，然后点“我读完了”。</p>
      <div class="shadow__actions">
        <button class="shadow__btn shadow__btn--primary" onclick={finishShadow}>我读完了</button>
        <button class="shadow__btn shadow__btn--secondary" onclick={startListen}>再听一遍</button>
      </div>
    {:else}
      <p class="shadow__status">第 {attempt} 轮完成。感觉如何？</p>
      <div class="shadow__actions">
        <button class="shadow__btn shadow__btn--primary" onclick={closeShadow}>顺利，继续阅读</button>
        <button class="shadow__btn shadow__btn--secondary" onclick={retryShadow}>还要再练</button>
      </div>
    {/if}
  </section>
{/if}

<style>
  .shadow {
    margin-top: var(--space-md);
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--color-gold, #cda434) 45%, transparent);
    border-radius: 14px;
    background: color-mix(in srgb, var(--color-parchment, #f5f0e6) 86%, white);
    box-shadow: 0 8px 24px rgba(28, 25, 23, 0.08);
  }

  .shadow__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .shadow__kicker {
    margin: 0 0 4px;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-secondary, #57534e);
  }

  .shadow__title {
    margin: 0;
    font-size: 16px;
    color: var(--color-text-primary, #1c1917);
  }

  .shadow__close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    background: transparent;
    color: var(--color-text-secondary, #57534e);
    cursor: pointer;
  }

  .shadow__steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 14px;
  }

  .shadow__steps span {
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(28, 25, 23, 0.05);
    color: var(--color-text-secondary, #57534e);
    font-size: 12px;
    text-align: center;
  }

  .shadow__step--active {
    background: rgba(35, 122, 99, 0.12);
    color: var(--color-jade, #237a63);
    font-weight: 700;
  }

  .shadow__sentence {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
    font-family: var(--font-display-cn, serif);
    font-size: 1.15rem;
    line-height: 1.9;
  }

  .shadow__segment {
    padding: 2px 6px;
    border-radius: 6px;
    transition: background-color 140ms ease, color 140ms ease, transform 140ms ease;
  }

  .shadow__segment--active {
    background: rgba(205, 164, 52, 0.18);
    color: var(--color-text-primary, #1c1917);
    transform: translateY(-1px);
  }

  .shadow__reference {
    margin: 0 0 12px;
    color: var(--color-text-secondary, #57534e);
    font-size: 13px;
    line-height: 1.5;
  }

  .shadow__status {
    margin: 0;
    color: var(--color-text-primary, #1c1917);
    font-size: 14px;
    line-height: 1.5;
  }

  .shadow__count {
    margin: 12px 0 0;
    font-size: 32px;
    font-weight: 700;
    color: var(--color-jade, #237a63);
    text-align: center;
  }

  .shadow__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .shadow__btn {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .shadow__btn--primary {
    background: var(--color-jade, #237a63);
    border-color: var(--color-jade, #237a63);
    color: white;
  }

  .shadow__btn--secondary {
    background: transparent;
    color: var(--color-text-primary, #1c1917);
  }
</style>

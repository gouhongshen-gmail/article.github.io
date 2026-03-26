<script>
  /**
   * AudioProvider — singleton audio playback for Chinese sentences and words.
   * Phase 3: Uses browser speechSynthesis as fallback.
   * Future: will fetch pre-generated TTS from R2.
   */

  let speaking = $state(false);
  let currentText = $state('');
  let playbackRate = $state(0.8);

  const RATES = [0.5, 0.75, 1.0, 1.25];

  // Load persisted rate on mount
  $effect(() => {
    try {
      const saved = localStorage.getItem('longlore_audio_speed');
      if (saved) playbackRate = parseFloat(saved);
    } catch { /* SSR or unavailable */ }
  });

  /** Play Chinese text using speechSynthesis */
  function speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    speaking = true;
    currentText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = playbackRate;
    utterance.onend = () => { speaking = false; currentText = ''; };
    utterance.onerror = () => { speaking = false; currentText = ''; };
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    speaking = false;
    currentText = '';
  }

  function cycleRate() {
    const idx = RATES.indexOf(playbackRate);
    playbackRate = RATES[(idx + 1) % RATES.length];
    localStorage.setItem('longlore_audio_speed', String(playbackRate));
  }

  // Expose via window for cross-component access
  $effect(() => {
    /** @type {any} */ (window).__audioProvider = { speak, stop, speaking, currentText, playbackRate, cycleRate };
    return () => { delete /** @type {any} */ (window).__audioProvider; };
  });

  // Listen for play requests from other components
  $effect(() => {
    function onPlayRequest(e) {
      const { text } = e.detail || {};
      if (text) speak(text);
    }
    window.addEventListener('audio-play-request', onPlayRequest);
    return () => window.removeEventListener('audio-play-request', onPlayRequest);
  });
</script>

<!-- Speed indicator (visible when audio active) -->
{#if speaking}
  <div class="audio-indicator" role="status" aria-live="polite">
    <button class="audio-speed-btn" onclick={cycleRate} title="Change speed">
      {playbackRate}x
    </button>
    <button class="audio-stop-btn" onclick={stop} aria-label="Stop audio" title="停止">
      ■
    </button>
  </div>
{/if}

<style>
  .audio-indicator {
    position: fixed;
    bottom: 80px;
    right: 16px;
    z-index: 150;
    display: flex;
    gap: 4px;
    animation: fade-in 200ms ease;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .audio-speed-btn, .audio-stop-btn {
    height: 36px;
    padding: 0 12px;
    border-radius: 18px;
    border: 1px solid var(--color-border-subtle, #d6d3d1);
    background: var(--color-parchment, #f5f0e6);
    color: var(--color-text-primary, #1c1917);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: background-color 150ms ease;
  }

  .audio-speed-btn:hover, .audio-stop-btn:hover {
    background: var(--color-surface, #eae5db);
  }

  .audio-stop-btn {
    padding: 0 10px;
    color: var(--color-cinnabar, #b5412a);
  }
</style>

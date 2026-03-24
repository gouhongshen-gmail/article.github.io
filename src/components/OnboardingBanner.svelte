<script lang="ts">
  import { onMount } from 'svelte';

  // State
  let isVisible = $state(false);
  let bannerType = $state<'first-visit' | 'save-progress' | 'welcome-back' | null>(null);
  let wordCount = $state(0);
  let isDismissed = $state(false);
  let isHomepage = $state(false);

  // Props for dismissal tracking
  const FIRST_VISIT_KEY = 'longlore_first_visit';
  const VISIT_COUNT_KEY = 'longlore_visit_count';
  const WORD_COUNT_KEY = 'longlore_word_count';
  const BANNER_DISMISSED_KEY = 'longlore_banner_dismissed';
  const TOKEN_KEY = 'll_token';
  const SAVE_PROGRESS_DISMISS_COUNT_KEY = 'longlore_save_progress_dismiss_count';
  const DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  const SAVE_PROGRESS_SHOW_AFTER_VIEWS = 3;

  // Animation control
  let animatingOut = $state(false);

  /**
   * Check if banner should be dismissed based on timestamp
   */
  function isBannerDismissedRecently(): boolean {
    const dismissedTime = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!dismissedTime) return false;
    const timeSinceDissmissal = Date.now() - parseInt(dismissedTime);
    return timeSinceDissmissal < DISMISSAL_DURATION;
  }

  /**
   * Initialize banner state on mount
   */
  function initializeBanner(): void {
    // Check if we're on homepage
    isHomepage = window.location.pathname === '/' || window.location.pathname === '';

    // Check if recently dismissed
    if (isBannerDismissedRecently()) {
      isDismissed = true;
      return;
    }

    // Check for first visit
    const firstVisitTime = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisitTime) {
      // First visit!
      localStorage.setItem(FIRST_VISIT_KEY, Date.now().toString());
      bannerType = 'first-visit';
      isVisible = true;
      return;
    }

    // Increment visit count
    const currentVisitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    const newVisitCount = currentVisitCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, newVisitCount.toString());

    // Check for token (logged in)
    const token = getCookie(TOKEN_KEY);
    const isLoggedIn = !!token;

    // Get word count
    const savedWordCount = parseInt(localStorage.getItem(WORD_COUNT_KEY) || '0');
    wordCount = savedWordCount;

    // Determine banner type based on state
    if (!isLoggedIn && savedWordCount > 0) {
      // Has words but not logged in
      const dismissCount = parseInt(localStorage.getItem(SAVE_PROGRESS_DISMISS_COUNT_KEY) || '0');
      // Show if dismissed count < 3 (re-shows after 3 page views)
      if (dismissCount < 3) {
        bannerType = 'save-progress';
        isVisible = true;
      }
    } else if (isLoggedIn && isHomepage && newVisitCount > 3) {
      // Returning user with token, only on homepage
      bannerType = 'welcome-back';
      isVisible = true;
    }
  }

  /**
   * Get cookie value by name
   */
  function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Close banner with animation
   */
  function closeBanner(): void {
    animatingOut = true;
    setTimeout(() => {
      isVisible = false;
      animatingOut = false;
    }, 300);
  }

  /**
   * Handle banner dismissal
   */
  function dismissBanner(): void {
    if (bannerType === 'first-visit') {
      // Auto-dismiss after 8 seconds or on click
      localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    } else if (bannerType === 'save-progress') {
      // Increment dismiss count for save-progress banner
      const dismissCount = parseInt(localStorage.getItem(SAVE_PROGRESS_DISMISS_COUNT_KEY) || '0');
      localStorage.setItem(SAVE_PROGRESS_DISMISS_COUNT_KEY, (dismissCount + 1).toString());
      localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    }
    closeBanner();
  }

  /**
   * Handle CTA button click
   */
  function handleCTA(): void {
    if (bannerType === 'save-progress') {
      // Navigate to login
      window.location.href = '/login';
    } else if (bannerType === 'welcome-back') {
      // Navigate to review
      window.location.href = '/review';
    }
  }

  /**
   * Mount effect
   */
  $effect(() => {
    if (typeof window !== 'undefined') {
      initializeBanner();

      // Auto-dismiss first-visit banner after 8 seconds
      if (bannerType === 'first-visit' && isVisible) {
        const timeout = setTimeout(() => {
          dismissBanner();
        }, 8000);

        return () => clearTimeout(timeout);
      }
    }
  });

  /**
   * Render banner content based on type
   */
  function getBannerContent() {
    switch (bannerType) {
      case 'first-visit':
        return {
          message: '👋 Welcome! Tap the glowing word above to start learning Chinese',
          showCTA: false,
          ctaText: '',
        };
      case 'save-progress':
        return {
          message: `You've saved ${wordCount} word${wordCount !== 1 ? 's' : ''}! Sign up to keep them safe across devices.`,
          showCTA: true,
          ctaText: 'Save my progress',
        };
      case 'welcome-back':
        return {
          message: `Welcome back! 🐉 You have ${wordCount} word${wordCount !== 1 ? 's' : ''} to review today.`,
          showCTA: true,
          ctaText: 'Start Review →',
        };
      default:
        return {
          message: '',
          showCTA: false,
          ctaText: '',
        };
    }
  }
</script>

{#if isVisible && bannerType}
  {@const content = getBannerContent()}
  <div class="banner-wrapper" class:animating-out={animatingOut}>
    <div class="banner" role="alert" aria-live="polite">
      <div class="banner-content">
        <p class="banner-message">{content.message}</p>
        {#if content.showCTA}
          <button class="banner-cta" on:click={handleCTA}>{content.ctaText}</button>
        {/if}
      </div>
      {#if bannerType !== 'first-visit'}
        <button class="banner-close" on:click={dismissBanner} aria-label="Close banner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .banner-wrapper {
    position: fixed;
    bottom: 64px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    z-index: 45;
    pointer-events: auto;
    animation: slideUp 300ms ease-out forwards;
  }

  .banner-wrapper.animating-out {
    animation: slideDown 300ms ease-out forwards;
  }

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
    }
  }

  .banner {
    position: relative;
    background-color: var(--color-elevated);
    box-shadow: var(--shadow-lg);
    border-radius: var(--radius-md);
    padding: 16px 20px;
    width: 100%;
    max-width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .banner-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }

  .banner-message {
    font-size: var(--text-body);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--lh-body);
  }

  .banner-cta {
    align-self: flex-start;
    background-color: var(--color-jade);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 0 16px;
    height: 36px;
    font-size: var(--text-body);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 200ms ease;
  }

  .banner-cta:hover {
    opacity: 0.9;
  }

  .banner-cta:active {
    opacity: 0.8;
  }

  .banner-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 200ms ease;
  }

  .banner-close:hover {
    color: var(--color-text-primary);
  }

  .banner-close svg {
    width: 100%;
    height: 100%;
  }

  /* Mobile: full width, above tab bar */
  @media (max-width: 767px) {
    .banner-wrapper {
      bottom: 64px;
      left: 0;
      right: 0;
      transform: translateY(0);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      padding: 0 8px;
    }

    .banner-wrapper.animating-out {
      animation: slideDown 300ms ease-out forwards;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slideDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }

    .banner {
      width: calc(100% - 16px);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    .banner-content {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .banner-message {
      font-size: var(--text-small);
      flex: 1;
    }

    .banner-cta {
      font-size: var(--text-small);
      padding: 0 12px;
      height: 32px;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  /* Desktop: max-width 480px, centered, bottom 24px */
  @media (min-width: 768px) {
    .banner-wrapper {
      bottom: 24px;
      max-width: 480px;
      border-radius: var(--radius-lg);
    }

    .banner {
      flex-direction: row;
      align-items: flex-start;
      gap: 16px;
    }

    .banner-content {
      gap: 12px;
      width: 100%;
    }

    .banner-message {
      margin: 0;
    }

    .banner-cta {
      align-self: flex-end;
    }

    .banner-close {
      top: 12px;
      right: 12px;
    }
  }
</style>

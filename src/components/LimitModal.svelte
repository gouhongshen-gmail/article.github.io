<script>
  const {
    visible = false,
    title = '',
    message = '',
    ctaText = 'Upgrade to Pro',
    ctaHref = '/pricing',
    onClose = () => {},
  } = $props();

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && visible) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleEscapeKey} />

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleBackdropClick}>
    <div class="modal" role="dialog" aria-label={title}>
      <h2 class="modal-title">{title}</h2>
      <p class="modal-message">{message}</p>
      <a href={ctaHref} class="cta-button">{ctaText}</a>
      <button class="maybe-later-link" onclick={onClose}>Maybe later</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 200ms ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal {
    background: var(--color-elevated, #fefdf9);
    border-radius: var(--radius-lg, 16px);
    padding: 32px;
    max-width: 380px;
    box-shadow: var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
    animation: scaleIn 200ms ease;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-title {
    font-size: 1.25rem;
    font-family: var(--font-display-en, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    color: var(--color-text-primary, #1c1917);
    margin: 0 0 12px;
    font-weight: 600;
  }

  .modal-message {
    font-family: var(--text-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    color: var(--color-text-secondary, #57534e);
    line-height: 1.6;
    margin: 0 0 24px;
    font-size: 1rem;
  }

  .cta-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 44px;
    background: var(--color-jade, #2d8a72);
    color: white;
    border: none;
    border-radius: var(--radius-md, 8px);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    font-size: 1rem;
    transition: opacity 150ms ease;
    margin-bottom: 12px;
  }

  .cta-button:hover {
    opacity: 0.9;
  }

  .cta-button:active {
    opacity: 0.8;
  }

  .maybe-later-link {
    display: block;
    width: 100%;
    padding: 8px;
    background: none;
    border: none;
    font-size: var(--text-small, 0.875rem);
    color: var(--color-text-secondary, #57534e);
    cursor: pointer;
    text-align: center;
    transition: color 150ms ease;
    font-family: inherit;
  }

  .maybe-later-link:hover {
    color: var(--color-text-primary, #1c1917);
  }
</style>

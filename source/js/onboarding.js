/* global Fluid */

(function() {
  'use strict';

  var ONBOARDED_KEY = 'chronosina_onboarded';
  var LEVEL_KEY = 'chronosina_level';
  var STEP_WELCOME = 'welcome';
  var STEP_DEMO = 'demo';
  var STEP_LEVEL = 'level';

  var state = {
    card        : null,
    overlay     : null,
    selectedLevel: 'none',
    step        : null,
    targetToken : null,
    tooltip     : null
  };

  function trackEvent(action, label) {
    if (window.ChronoSinaAnalytics && typeof window.ChronoSinaAnalytics.trackEvent === 'function') {
      window.ChronoSinaAnalytics.trackEvent('onboarding', action, label || '');
    }
  }

  function isFirstVisit() {
    return !window.localStorage.getItem(ONBOARDED_KEY);
  }

  function isArticlePage() {
    return document.querySelector('[data-cn-lesson]') !== null;
  }

  function removeSpotlight() {
    if (state.targetToken) {
      state.targetToken.classList.remove('onboarding-spotlight');
    }
  }

  function hideTooltip() {
    if (state.tooltip) {
      state.tooltip.hidden = true;
      state.tooltip.innerHTML = '';
    }
  }

  function positionTooltip(panel) {
    if (!state.tooltip || !panel) {
      return;
    }

    var rect = panel.getBoundingClientRect();
    var spacing = 14;
    var top = rect.bottom + spacing;
    var left = Math.max(spacing, Math.min(rect.left, window.innerWidth - state.tooltip.offsetWidth - spacing));

    if (top + state.tooltip.offsetHeight > window.innerHeight - spacing) {
      top = Math.max(spacing, rect.top - state.tooltip.offsetHeight - spacing);
    }

    state.tooltip.style.top = top + 'px';
    state.tooltip.style.left = left + 'px';
  }

  function bindCardActions() {
    var startButton = state.card.querySelector('[data-onboarding-start]');
    if (startButton) {
      startButton.addEventListener('click', function() {
        renderDemoStep();
      });
    }

    var continueButton = state.card.querySelector('[data-onboarding-continue]');
    if (continueButton) {
      continueButton.addEventListener('click', function() {
        renderLevelStep();
      });
    }

    var finishButton = state.card.querySelector('[data-onboarding-finish]');
    if (finishButton) {
      finishButton.addEventListener('click', function() {
        finishOnboarding(state.selectedLevel, false);
      });
    }

    var skipButtons = state.card.querySelectorAll('[data-onboarding-skip]');
    skipButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        finishOnboarding(state.selectedLevel || 'none', true);
      });
    });

    state.card.querySelectorAll('input[name="chronosina-level"]').forEach(function(input) {
      input.addEventListener('change', function() {
        state.selectedLevel = input.value;
      });
    });
  }

  function renderWelcomeStep() {
    state.step = STEP_WELCOME;
    state.overlay.hidden = false;
    state.overlay.classList.remove('is-demo');
    hideTooltip();
    removeSpotlight();

    state.card.innerHTML = [
      '<div class="onboarding-step">',
      '  <p class="onboarding-step__eyebrow">Welcome</p>',
      '  <h2 class="onboarding-step__title">Welcome to ChronoSina</h2>',
      '  <p class="onboarding-step__body">You are reading Chinese history in English — and each highlighted Chinese phrase can teach you new vocabulary.</p>',
      '  <div class="onboarding-step__actions">',
      '    <button type="button" class="onboarding-button onboarding-button--ghost" data-onboarding-skip>Skip</button>',
      '    <button type="button" class="onboarding-button" data-onboarding-start>Show me how</button>',
      '  </div>',
      '</div>'
    ].join('');

    bindCardActions();
  }

  function renderDemoStep() {
    state.step = STEP_DEMO;
    state.overlay.hidden = false;
    state.overlay.classList.add('is-demo');
    state.targetToken = document.querySelector('[data-cn-token]');

    state.card.innerHTML = [
      '<div class="onboarding-step">',
      '  <p class="onboarding-step__eyebrow">Step 2 of 3</p>',
      '  <h2 class="onboarding-step__title">Try the highlighted word</h2>',
      '  <p class="onboarding-step__body">Tap the pulsing Chinese token in the article. We will show you pronunciation, meaning, and a one-click save button for your review queue.</p>',
      '  <div class="onboarding-step__actions">',
      '    <button type="button" class="onboarding-button onboarding-button--ghost" data-onboarding-skip>Skip</button>',
      '  </div>',
      '</div>'
    ].join('');

    bindCardActions();

    if (!state.targetToken) {
      renderLevelStep();
      return;
    }

    state.targetToken.classList.add('onboarding-spotlight');
    state.targetToken.scrollIntoView({
      behavior: 'smooth',
      block   : 'center'
    });
  }

  function renderLevelStep() {
    state.step = STEP_LEVEL;
    state.overlay.hidden = false;
    state.overlay.classList.remove('is-demo');
    hideTooltip();
    removeSpotlight();

    state.card.innerHTML = [
      '<div class="onboarding-step">',
      '  <p class="onboarding-step__eyebrow">Step 3 of 3</p>',
      '  <h2 class="onboarding-step__title">How much Chinese do you know?</h2>',
      '  <p class="onboarding-step__body">We will remember this preference locally so future learning features can adapt to your level.</p>',
      '  <div class="onboarding-levels">',
      '    <label class="onboarding-level"><input type="radio" name="chronosina-level" value="none" checked> <span>None yet — just curious</span></label>',
      '    <label class="onboarding-level"><input type="radio" name="chronosina-level" value="beginner"> <span>A few words</span></label>',
      '    <label class="onboarding-level"><input type="radio" name="chronosina-level" value="hsk12"> <span>HSK 1-2</span></label>',
      '    <label class="onboarding-level"><input type="radio" name="chronosina-level" value="hsk34"> <span>HSK 3-4</span></label>',
      '    <label class="onboarding-level"><input type="radio" name="chronosina-level" value="hsk5plus"> <span>HSK 5+ / fluent</span></label>',
      '  </div>',
      '  <div class="onboarding-step__actions">',
      '    <button type="button" class="onboarding-button onboarding-button--ghost" data-onboarding-skip>Skip</button>',
      '    <button type="button" class="onboarding-button" data-onboarding-finish>Continue</button>',
      '  </div>',
      '</div>'
    ].join('');

    bindCardActions();
  }

  function finishOnboarding(level, skipped) {
    var nextLevel = level || 'none';

    window.localStorage.setItem(ONBOARDED_KEY, 'true');
    window.localStorage.setItem(LEVEL_KEY, nextLevel);

    state.step = null;
    state.overlay.hidden = true;
    hideTooltip();
    removeSpotlight();

    trackEvent(skipped ? 'skip' : 'complete', nextLevel);
    window.dispatchEvent(new CustomEvent('chronosina:onboarding-complete', {
      detail: {
        level  : nextLevel,
        skipped: skipped
      }
    }));
  }

  function handlePopoverOpen(event) {
    if (state.step !== STEP_DEMO || !state.targetToken) {
      return;
    }

    if (!event.detail || event.detail.button !== state.targetToken) {
      return;
    }

    state.tooltip.innerHTML = [
      '<div class="onboarding-tooltip__title">Nice — this is the lesson popover.</div>',
      '<div class="onboarding-tooltip__body">Use the speaker to hear pronunciation, then hit <strong>Save</strong> to add the word to your review deck.</div>'
    ].join('');
    state.tooltip.hidden = false;
    positionTooltip(event.detail.panel);

    state.card.innerHTML = [
      '<div class="onboarding-step">',
      '  <p class="onboarding-step__eyebrow">Great</p>',
      '  <h2 class="onboarding-step__title">You found the learning tools</h2>',
      '  <p class="onboarding-step__body">From here you can listen, read the gloss, and save the word into spaced repetition.</p>',
      '  <div class="onboarding-step__actions">',
      '    <button type="button" class="onboarding-button onboarding-button--ghost" data-onboarding-skip>Skip</button>',
      '    <button type="button" class="onboarding-button" data-onboarding-continue>Continue</button>',
      '  </div>',
      '</div>'
    ].join('');

    bindCardActions();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && state.step) {
      finishOnboarding(state.selectedLevel || 'none', true);
    }
  }

  function createUI() {
    var overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="onboarding-card" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(overlay);

    var tooltip = document.createElement('div');
    tooltip.className = 'onboarding-tooltip';
    tooltip.hidden = true;
    document.body.appendChild(tooltip);

    state.overlay = overlay;
    state.card = overlay.querySelector('.onboarding-card');
    state.tooltip = tooltip;
  }

  function initOnboarding() {
    if (!isFirstVisit() || !isArticlePage()) {
      return;
    }

    createUI();
    renderWelcomeStep();

    window.addEventListener('chronosina:token-popover-open', handlePopoverOpen);
    window.addEventListener('resize', function() {
      if (!state.tooltip.hidden) {
        positionTooltip(document.querySelector('.cn-lesson__popover'));
      }
    });
    document.addEventListener('keydown', handleKeydown);
  }

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initOnboarding);
  } else {
    document.addEventListener('DOMContentLoaded', initOnboarding);
  }
})();

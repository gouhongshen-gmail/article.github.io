/* global Fluid */

(function() {
  'use strict';

  var GUEST_READ_KEY = 'chronosina_articles_read';
  var overlayMounted = false;

  function platform() {
    return window.ChronoSinaPlatform;
  }

  function auth() {
    return window.ChronoSinaAuth;
  }

  function sync() {
    return window.ChronoSinaSync;
  }

  function config() {
    return platform().getConfig();
  }

  function canUseService(name) {
    return Boolean(platform()
      && typeof platform().isServiceConfigured === 'function'
      && platform().isServiceConfigured(name));
  }

  function isArticlePage() {
    return document.querySelector('article.post-content') !== null
      && document.querySelector('.markdown-body') !== null;
  }

  function getArticlePath() {
    return window.location.pathname;
  }

  function getWordCount() {
    return document.querySelectorAll('[data-cn-token]').length;
  }

  function getGuestReads() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(GUEST_READ_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setGuestReads(reads) {
    window.localStorage.setItem(GUEST_READ_KEY, JSON.stringify(reads));
  }

  function lockArticle(message, signedIn) {
    var board = document.querySelector('#board article.post-content');
    var body = document.querySelector('.markdown-body');

    if (!board || !body) {
      return;
    }

    body.classList.add('chronosina-paywall__locked-content');

    if (!overlayMounted) {
      var overlay = document.createElement('section');
      overlay.className = 'chronosina-paywall';
      overlay.setAttribute('data-paywall', '');
      board.insertBefore(overlay, body);
      overlayMounted = true;
    }

    var paywall = board.querySelector('[data-paywall]');
    paywall.innerHTML = [
      '<div class="chronosina-paywall__card">',
      '  <p class="chronosina-paywall__eyebrow">ChronoSina access</p>',
      '  <h2 class="chronosina-paywall__title">' + (signedIn ? 'Upgrade to keep reading' : 'Sign in to keep reading') + '</h2>',
      '  <p class="chronosina-paywall__body">' + escapeHtml(message) + '</p>',
      '  <div class="chronosina-paywall__actions">',
      (!signedIn ? '    <button type="button" class="chronosina-paywall__button chronosina-paywall__button--secondary" data-paywall-signin>Sign in</button>' : ''),
      '    <button type="button" class="chronosina-paywall__button" data-paywall-upgrade="monthly">Go Pro monthly</button>',
      '    <button type="button" class="chronosina-paywall__button chronosina-paywall__button--secondary" data-paywall-upgrade="yearly">Go Pro yearly</button>',
      '  </div>',
      '</div>'
    ].join('');

    var signInButton = paywall.querySelector('[data-paywall-signin]');
    if (signInButton) {
      signInButton.addEventListener('click', function() {
        auth().openModal();
      });
    }

    paywall.querySelectorAll('[data-paywall-upgrade]').forEach(function(button) {
      button.addEventListener('click', function() {
        startCheckout(button.getAttribute('data-paywall-upgrade'));
      });
    });
  }

  function unlockArticle() {
    var body = document.querySelector('.markdown-body');
    if (body) {
      body.classList.remove('chronosina-paywall__locked-content');
    }

    var paywall = document.querySelector('[data-paywall]');
    if (paywall) {
      paywall.remove();
      overlayMounted = false;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function rememberGuestArticle(path) {
    var reads = getGuestReads();
    if (!reads.includes(path)) {
      reads.push(path);
      setGuestReads(reads);
    }
  }

  function handleGuestAccess() {
    var reads = getGuestReads();
    var path = getArticlePath();
    var limit = Number(config().freeArticleLimit || 3);

    if (reads.includes(path) || reads.length < limit) {
      rememberGuestArticle(path);
      return Promise.resolve(true);
    }

    lockArticle('You have reached the free article limit. Sign in to keep reading across devices, or upgrade to Pro for unlimited access.', false);
    return Promise.resolve(false);
  }

  function recordArticleView() {
    if (!sync()) {
      return;
    }

    sync().recordArticleProgress({
      articlePath: getArticlePath(),
      lastReadAt : new Date().toISOString(),
      wordsKnown : 0,
      wordsTotal : getWordCount()
    });
  }

  function handleSignedInAccess() {
    if (!canUseService('sync')) {
      unlockArticle();
      recordArticleView();
      return Promise.resolve(true);
    }

    return platform().request('sync', '/api/sync/access?articlePath=' + encodeURIComponent(getArticlePath()), {
      auth  : true,
      method: 'GET'
    }).then(function(data) {
      if (data.accessAllowed) {
        unlockArticle();
        recordArticleView();
        return true;
      }

      lockArticle('Your free account has used its included reading allowance. Upgrade to Pro for unlimited articles and cloud sync.', true);
      return false;
    }).catch(function(error) {
      console.error('[paywall] Failed to check access.', error);
      return true;
    });
  }

  function startCheckout(plan) {
    if (!platform().getToken()) {
      auth().openModal('Sign in first, then you can start checkout.', 'info');
      return;
    }

    if (!canUseService('payment')) {
      auth().openModal('Payments are not configured yet. Deploy the payment Worker and Stripe keys first.', 'info');
      return;
    }

    platform().request('payment', '/api/payment/checkout', {
      auth  : true,
      json  : {
        plan        : plan === 'yearly' ? 'yearly' : 'monthly',
        redirectPath: window.location.pathname
      },
      method: 'POST'
    }).then(function(data) {
      if (!data || !data.url) {
        throw new Error('Missing Stripe checkout URL.');
      }

      window.location.href = data.url;
    }).catch(function(error) {
      console.error('[paywall] Failed to start checkout.', error);
      auth().openModal(error.message, 'error');
    });
  }

  function handleCheckoutResult() {
    var url = new URL(window.location.href);
    var state = url.searchParams.get('checkout');
    if (!state) {
      return;
    }

    url.searchParams.delete('checkout');
    window.history.replaceState({}, document.title, url.toString());

    if (state === 'success' && platform().getToken()) {
      platform().refreshUser()
        .then(function() {
          unlockArticle();
        })
        .catch(function(error) {
          console.error('[paywall] Failed to refresh user after checkout.', error);
        });
    }
  }

  function evaluateAccess() {
    if (!isArticlePage() || window.location.pathname.indexOf('/auth/') !== -1) {
      return Promise.resolve(true);
    }

    if (platform().getToken()) {
      return handleSignedInAccess();
    }

    return handleGuestAccess();
  }

  function initPaywall() {
    if (!window.ChronoSinaPlatform) {
      return;
    }

    handleCheckoutResult();
    evaluateAccess();

    window.addEventListener(platform().AUTH_CHANGE_EVENT, function() {
      evaluateAccess();
    });
  }

  window.ChronoSinaPaywall = {
    evaluateAccess: evaluateAccess,
    startCheckout : startCheckout
  };

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initPaywall);
  } else {
    document.addEventListener('DOMContentLoaded', initPaywall);
  }
})();

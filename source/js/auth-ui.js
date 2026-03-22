/* global Fluid */

(function() {
  'use strict';

  var MODAL_ID = 'chronosina-auth-modal';
  var state = {
    mode      : 'start',
    mount     : null,
    navbarItem: null,
    pendingEmail: ''
  };

  function platform() {
    return window.ChronoSinaPlatform;
  }

  function getUser() {
    return platform().getCachedUser();
  }

  function getLevel() {
    return window.localStorage.getItem('chronosina_level') || 'none';
  }

  function createNavbarButton() {
    var navList = document.querySelector('.navbar-nav.ml-auto.text-center');
    if (!navList || state.navbarItem) {
      return;
    }

    state.navbarItem = document.createElement('li');
    state.navbarItem.className = 'nav-item chronosina-auth-nav';
    navList.appendChild(state.navbarItem);
    renderNavbarButton();
  }

  function renderNavbarButton() {
    if (!state.navbarItem) {
      return;
    }

    var user = getUser();
    var label = user ? (user.displayName || user.email || 'Account') : 'Sign in';
    var badge = user && user.tier === 'pro'
      ? '<span class="chronosina-auth-nav__badge">PRO</span>'
      : '';

    state.navbarItem.innerHTML = [
      '<a class="nav-link chronosina-auth-nav__link" href="javascript:;" aria-label="Account">',
      '  <i class="iconfont icon-user-fill"></i>',
      '  <span>' + escapeHtml(label) + '</span>',
      badge,
      '</a>'
    ].join('');

    state.navbarItem.querySelector('a').addEventListener('click', function() {
      openModal();
    });
  }

  function ensureModal() {
    if (state.mount) {
      return state.mount;
    }

    var modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'chronosina-auth';
    modal.hidden = true;
    document.body.appendChild(modal);
    state.mount = modal;

    modal.addEventListener('click', function(event) {
      if (event.target === modal || event.target.closest('[data-auth-close]')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    return modal;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSignedOutView(message, type) {
    var messageHtml = message
      ? '<p class="chronosina-auth__message ' + (type || 'info') + '">' + escapeHtml(message) + '</p>'
      : '';

    return [
      '<div class="chronosina-auth__dialog" role="dialog" aria-modal="true" aria-labelledby="chronosina-auth-title">',
      '  <button type="button" class="chronosina-auth__close" data-auth-close aria-label="Close">×</button>',
      '  <p class="chronosina-auth__eyebrow">ChronoSina Account</p>',
      '  <h2 id="chronosina-auth-title" class="chronosina-auth__title">Sign in to sync your learning</h2>',
      '  <p class="chronosina-auth__body">Save vocabulary across devices, keep your Chinese level in sync, and unlock Pro upgrades when you need them.</p>',
      messageHtml,
      '  <div class="chronosina-auth__actions">',
      '    <button type="button" class="chronosina-auth__provider" data-auth-provider="google">Continue with Google</button>',
      '    <button type="button" class="chronosina-auth__provider chronosina-auth__provider--secondary" data-auth-provider="x">Continue with X</button>',
      '  </div>',
      '  <div class="chronosina-auth__separator"><span>or use email</span></div>',
      '  <form class="chronosina-auth__form" data-auth-email-form>',
      '    <input type="email" name="email" class="chronosina-auth__input" placeholder="your@email.com" required>',
      '    <button type="submit" class="chronosina-auth__submit">Send magic code</button>',
      '  </form>',
      '</div>'
    ].join('');
  }

  function renderVerifyView(message, type) {
    var messageHtml = message
      ? '<p class="chronosina-auth__message ' + (type || 'info') + '">' + escapeHtml(message) + '</p>'
      : '';

    return [
      '<div class="chronosina-auth__dialog" role="dialog" aria-modal="true" aria-labelledby="chronosina-auth-title">',
      '  <button type="button" class="chronosina-auth__close" data-auth-close aria-label="Close">×</button>',
      '  <p class="chronosina-auth__eyebrow">Magic code</p>',
      '  <h2 id="chronosina-auth-title" class="chronosina-auth__title">Enter the code we emailed you</h2>',
      '  <p class="chronosina-auth__body">We sent a 6-digit code to <strong>' + escapeHtml(state.pendingEmail) + '</strong>.</p>',
      messageHtml,
      '  <form class="chronosina-auth__form" data-auth-code-form>',
      '    <input type="text" name="code" inputmode="numeric" maxlength="6" class="chronosina-auth__input chronosina-auth__input--code" placeholder="123456" required>',
      '    <button type="submit" class="chronosina-auth__submit">Verify and sign in</button>',
      '  </form>',
      '  <button type="button" class="chronosina-auth__link" data-auth-back>Use a different email</button>',
      '</div>'
    ].join('');
  }

  function renderSignedInView(message, type) {
    var user = getUser();
    var messageHtml = message
      ? '<p class="chronosina-auth__message ' + (type || 'info') + '">' + escapeHtml(message) + '</p>'
      : '';

    return [
      '<div class="chronosina-auth__dialog" role="dialog" aria-modal="true" aria-labelledby="chronosina-auth-title">',
      '  <button type="button" class="chronosina-auth__close" data-auth-close aria-label="Close">×</button>',
      '  <p class="chronosina-auth__eyebrow">Account</p>',
      '  <h2 id="chronosina-auth-title" class="chronosina-auth__title">' + escapeHtml(user.displayName || 'ChronoSina user') + '</h2>',
      '  <p class="chronosina-auth__body">' + escapeHtml(user.email) + '</p>',
      messageHtml,
      '  <dl class="chronosina-auth__meta">',
      '    <div><dt>Tier</dt><dd>' + escapeHtml((user.tier || 'free').toUpperCase()) + '</dd></div>',
      '    <div><dt>Chinese level</dt><dd>' + escapeHtml(user.chineseLevel || 'none') + '</dd></div>',
      '  </dl>',
      '  <div class="chronosina-auth__actions">',
      (user.tier === 'pro'
        ? '    <button type="button" class="chronosina-auth__provider chronosina-auth__provider--secondary" data-auth-refresh>Refresh profile</button>'
        : '    <button type="button" class="chronosina-auth__provider" data-auth-upgrade>Upgrade to Pro</button>'),
      '    <button type="button" class="chronosina-auth__provider chronosina-auth__provider--secondary" data-auth-logout>Log out</button>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function renderModal(message, type) {
    var modal = ensureModal();
    var user = getUser();

    if (user) {
      state.mode = 'account';
      modal.innerHTML = renderSignedInView(message, type);
    } else if (state.mode === 'verify') {
      modal.innerHTML = renderVerifyView(message, type);
    } else {
      state.mode = 'start';
      modal.innerHTML = renderSignedOutView(message, type);
    }

    bindModalActions(modal);
  }

  function bindModalActions(modal) {
    var emailForm = modal.querySelector('[data-auth-email-form]');
    if (emailForm) {
      emailForm.addEventListener('submit', function(event) {
        event.preventDefault();
        sendMagicCode(emailForm.email.value.trim());
      });
    }

    var codeForm = modal.querySelector('[data-auth-code-form]');
    if (codeForm) {
      codeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        verifyMagicCode(codeForm.code.value.trim());
      });
    }

    modal.querySelectorAll('[data-auth-provider]').forEach(function(button) {
      button.addEventListener('click', function() {
        startOAuth(button.getAttribute('data-auth-provider'));
      });
    });

    var backButton = modal.querySelector('[data-auth-back]');
    if (backButton) {
      backButton.addEventListener('click', function() {
        state.mode = 'start';
        renderModal();
      });
    }

    var logoutButton = modal.querySelector('[data-auth-logout]');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

    var refreshButton = modal.querySelector('[data-auth-refresh]');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
        platform().refreshUser()
          .then(function() {
            renderModal('Profile refreshed.', 'success');
          })
          .catch(function(error) {
            renderModal(error.message, 'error');
          });
      });
    }

    var upgradeButton = modal.querySelector('[data-auth-upgrade]');
    if (upgradeButton) {
      upgradeButton.addEventListener('click', function() {
        if (window.ChronoSinaPaywall && typeof window.ChronoSinaPaywall.startCheckout === 'function') {
          window.ChronoSinaPaywall.startCheckout('monthly');
        }
      });
    }
  }

  function openModal(message, type) {
    var modal = ensureModal();
    modal.hidden = false;
    renderModal(message, type);
  }

  function closeModal() {
    var modal = ensureModal();
    modal.hidden = true;
  }

  function startOAuth(providerName) {
    platform().request('auth', '/auth/' + providerName, {
      json  : {
        chineseLevel: getLevel(),
        redirectPath: window.location.pathname
      },
      method: 'POST'
    }).then(function(data) {
      if (!data || !data.url) {
        throw new Error('Missing OAuth redirect URL.');
      }

      window.location.href = data.url;
    }).catch(function(error) {
      openModal(error.message, 'error');
    });
  }

  function sendMagicCode(email) {
    state.pendingEmail = email;

    platform().request('auth', '/auth/magic-link/send', {
      json  : {
        chineseLevel: getLevel(),
        email       : email
      },
      method: 'POST'
    }).then(function() {
      state.mode = 'verify';
      renderModal('Code sent. Check your inbox.', 'success');
    }).catch(function(error) {
      state.mode = 'start';
      renderModal(error.message, 'error');
    });
  }

  function verifyMagicCode(code) {
    platform().request('auth', '/auth/magic-link/verify', {
      json  : {
        chineseLevel: getLevel(),
        code        : code,
        email       : state.pendingEmail
      },
      method: 'POST'
    }).then(function(data) {
      platform().setSession(data.token, data.user);
      closeModal();
    }).catch(function(error) {
      state.mode = 'verify';
      renderModal(error.message, 'error');
    });
  }

  function logout() {
    platform().request('auth', '/auth/logout', {
      auth  : true,
      method: 'POST'
    }).catch(function() {
      return null;
    }).then(function() {
      platform().clearSession();
      closeModal();
    });
  }

  function handleOnboardingComplete(event) {
    if (!platform().getToken() || !platform().isServiceConfigured('auth')) {
      return;
    }

    platform().request('auth', '/api/user/level', {
      auth  : true,
      json  : {
        chineseLevel: event.detail && event.detail.level ? event.detail.level : getLevel()
      },
      method: 'PUT'
    }).catch(function(error) {
      console.error('[auth] Failed to sync chinese level.', error);
    });
  }

  function handleAuthHashResult() {
    var result = platform().consumeAuthReturnHash();
    if (result && result.error) {
      openModal(result.error, 'error');
    }
  }

  function initAuthUI() {
    if (!window.ChronoSinaPlatform) {
      return;
    }

    createNavbarButton();
    ensureModal();
    handleAuthHashResult();

    if (platform().getToken()) {
      platform().refreshUser().catch(function(error) {
        console.error('[auth] Failed to refresh user.', error);
      });
    }

    window.addEventListener(platform().AUTH_CHANGE_EVENT, function() {
      renderNavbarButton();
      renderModal();
    });

    window.addEventListener(platform().AUTH_ERROR_EVENT, function(event) {
      var error = event.detail && event.detail.error ? event.detail.error : new Error('Authentication failed.');
      platform().clearSession();
      openModal(error.message, 'error');
    });

    window.addEventListener('chronosina:onboarding-complete', handleOnboardingComplete);
  }

  window.ChronoSinaAuth = {
    closeModal: closeModal,
    getCurrentUser: getUser,
    openModal : openModal
  };

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initAuthUI);
  } else {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  }
})();

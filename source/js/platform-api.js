/* global Fluid */

(function() {
  'use strict';

  var TOKEN_KEY = 'chronosina_jwt';
  var USER_KEY = 'chronosina_user';
  var AUTH_ERROR_EVENT = 'chronosina:auth-error';
  var AUTH_CHANGE_EVENT = 'chronosina:auth-changed';
  var PLACEHOLDER_HOST_PATTERN = /\.example\.workers\.dev$/i;
  var utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var utf8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

  function safeJsonParse(value, fallback) {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function bytesToBinary(bytes) {
    var chunkSize = 0x8000;
    var chunks = [];
    var index = 0;

    for (index = 0; index < bytes.length; index += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize)));
    }

    return chunks.join('');
  }

  function binaryToBytes(binary) {
    var bytes = new Uint8Array(binary.length);
    var index = 0;

    for (index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  function parseBinaryJson(binary) {
    if (utf8Decoder) {
      return JSON.parse(utf8Decoder.decode(binaryToBytes(binary)));
    }

    return JSON.parse(decodeURIComponent(escape(binary)));
  }

  function base64UrlDecode(value) {
    var normalized = String(value || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    var padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return window.atob(padded);
  }

  function encodeUnicode(value) {
    var json = JSON.stringify(value);
    var binary = utf8Encoder
      ? bytesToBinary(utf8Encoder.encode(json))
      : unescape(encodeURIComponent(json));

    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function decodeUnicode(value) {
    return parseBinaryJson(base64UrlDecode(value));
  }

  function getConfig() {
    var defaults = {
      authBaseUrl     : '',
      freeArticleLimit: 3,
      frontendUrl     : window.location.origin,
      mediaBaseUrl    : '',
      paymentBaseUrl  : '',
      syncBaseUrl     : ''
    };

    return Object.assign({}, defaults, window.CHRONOSINA_PLATFORM || {});
  }

  function dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, {
      detail: detail || {}
    }));
  }

  function getToken() {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  }

  function getCachedUser() {
    return safeJsonParse(window.localStorage.getItem(USER_KEY), null);
  }

  function setSession(token, user) {
    if (!token) {
      throw new Error('A JWT token is required to create a session.');
    }

    window.localStorage.setItem(TOKEN_KEY, token);

    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    dispatch(AUTH_CHANGE_EVENT, {
      token: token,
      user : user || getCachedUser()
    });
  }

  function clearSession() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    dispatch(AUTH_CHANGE_EVENT, {
      token: '',
      user : null
    });
  }

  function parseJwt(token) {
    if (!token) {
      return null;
    }

    try {
      var parts = String(token).split('.');
      if (parts.length !== 3) {
        return null;
      }

      return parseBinaryJson(base64UrlDecode(parts[1]));
    } catch (error) {
      return null;
    }
  }

  function resolveBaseUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    try {
      return new URL(raw, window.location.origin).toString();
    } catch (error) {
      return '';
    }
  }

  function getServiceBaseUrl(service) {
    return resolveBaseUrl(getConfig()[service + 'BaseUrl']);
  }

  function isServiceConfigured(service) {
    var base = getServiceBaseUrl(service);
    if (!base) {
      return false;
    }

    try {
      return !PLACEHOLDER_HOST_PATTERN.test(new URL(base).hostname);
    } catch (error) {
      return false;
    }
  }

  function createServiceError(service) {
    var error = new Error('The ' + service + ' service is not configured yet. Deploy the Worker and set its public URL first.');
    error.code = 'service_unconfigured';
    error.service = service;
    return error;
  }

  function buildUrl(service, path) {
    var base = getServiceBaseUrl(service);

    if (!isServiceConfigured(service)) {
      throw createServiceError(service);
    }

    return new URL(String(path || '/').replace(/^\//, ''), base.endsWith('/') ? base : base + '/');
  }

  function request(service, path, options) {
    try {
      var requestOptions = options || {};
      var url = buildUrl(service, path);
      var headers = new Headers(requestOptions.headers || {});

      if (requestOptions.json !== undefined) {
        headers.set('Content-Type', 'application/json');
      }

      if (requestOptions.auth) {
        var token = getToken();
        if (!token) {
          throw new Error('You need to sign in first.');
        }
        headers.set('Authorization', 'Bearer ' + token);
      }

      return fetch(url.toString(), Object.assign({}, requestOptions, {
        body   : requestOptions.json !== undefined ? JSON.stringify(requestOptions.json) : requestOptions.body,
        headers: headers
      })).then(function(response) {
        var contentType = response.headers.get('content-type') || '';
        var bodyPromise = contentType.indexOf('application/json') !== -1
          ? response.json()
          : response.text();

        return bodyPromise.then(function(body) {
          if (!response.ok) {
            var message = typeof body === 'string'
              ? body
              : (body && body.error) || 'Request failed.';
            var error = new Error(message);
            error.response = response;
            error.body = body;

            if (response.status === 401) {
              dispatch(AUTH_ERROR_EVENT, {
                error: error
              });
            }

            throw error;
          }

          return body;
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function consumeAuthReturnHash() {
    if (!window.location.hash) {
      return null;
    }

    var hash = window.location.hash.replace(/^#/, '');
    var params = new URLSearchParams(hash);
    var token = params.get('chronosina_token');
    var userEncoded = params.get('chronosina_user');
    var error = params.get('chronosina_error');

    if (!token && !error) {
      return null;
    }

    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

    if (error) {
      dispatch(AUTH_ERROR_EVENT, {
        error: new Error(error)
      });
      return {
        error: error
      };
    }

    var user = null;
    if (userEncoded) {
      try {
        user = decodeUnicode(userEncoded);
      } catch (decodeError) {
        user = null;
      }
    }

    if (token) {
      setSession(token, user);
    }

    return {
      token: token,
      user : user
    };
  }

  function refreshUser() {
    if (!getToken()) {
      return Promise.resolve(null);
    }

    if (!isServiceConfigured('auth')) {
      return Promise.resolve(getCachedUser());
    }

    return request('auth', '/auth/me', {
      auth  : true,
      method: 'GET'
    }).then(function(data) {
      if (data && data.user) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        dispatch(AUTH_CHANGE_EVENT, {
          token: getToken(),
          user : data.user
        });
        return data.user;
      }

      return null;
    }).catch(function(error) {
      if (error && error.code === 'service_unconfigured') {
        return getCachedUser();
      }

      clearSession();
      throw error;
    });
  }

  window.ChronoSinaPlatform = {
    AUTH_CHANGE_EVENT    : AUTH_CHANGE_EVENT,
    AUTH_ERROR_EVENT     : AUTH_ERROR_EVENT,
    buildUrl             : buildUrl,
    clearSession         : clearSession,
    consumeAuthReturnHash: consumeAuthReturnHash,
    encodeState          : encodeUnicode,
    getCachedUser        : getCachedUser,
    getConfig            : getConfig,
    getServiceBaseUrl    : getServiceBaseUrl,
    getToken             : getToken,
    isServiceConfigured  : isServiceConfigured,
    parseJwt             : parseJwt,
    refreshUser          : refreshUser,
    request              : request,
    setSession           : setSession
  };
})();

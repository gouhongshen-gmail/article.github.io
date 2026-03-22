/* global Fluid */

(function() {
  'use strict';

  var LAST_SYNC_KEY = 'chronosina_last_sync';
  var PROGRESS_KEY = 'chronosina_article_progress';
  var syncState = {
    inFlight : null,
    scheduled: null
  };

  function platform() {
    return window.ChronoSinaPlatform;
  }

  function hasSession() {
    return Boolean(platform() && platform().getToken());
  }

  function canUseSync() {
    return Boolean(platform()
      && typeof platform().isServiceConfigured === 'function'
      && platform().isServiceConfigured('sync'));
  }

  function readProgressMap() {
    try {
      var raw = window.localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return {};
      }

      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeProgressMap(map) {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  }

  function getProgressEntries() {
    var map = readProgressMap();
    return Object.keys(map).map(function(key) {
      return map[key];
    });
  }

  function mergeProgressEntries(entries) {
    var map = readProgressMap();

    (entries || []).forEach(function(entry) {
      if (!entry || !entry.articlePath) {
        return;
      }

      var existing = map[entry.articlePath];
      if (!existing || new Date(entry.lastReadAt).getTime() >= new Date(existing.lastReadAt).getTime()) {
        map[entry.articlePath] = entry;
      }
    });

    writeProgressMap(map);
  }

  function recordArticleProgress(entry) {
    if (!entry || !entry.articlePath) {
      return Promise.resolve();
    }

    mergeProgressEntries([entry]);

    if (!hasSession() || !canUseSync()) {
      return Promise.resolve();
    }

    return platform().request('sync', '/api/sync/article-view', {
      auth  : true,
      json  : entry,
      method: 'POST'
    }).catch(function(error) {
      console.error('[sync] Failed to record article progress.', error);
    });
  }

  function getLastSync() {
    return window.localStorage.getItem(LAST_SYNC_KEY) || '1970-01-01T00:00:00.000Z';
  }

  function setLastSync(value) {
    window.localStorage.setItem(LAST_SYNC_KEY, value);
  }

  function syncNow() {
    if (!hasSession()
      || !canUseSync()
      || !window.SRS
      || typeof window.SRS.getSyncSnapshot !== 'function') {
      return Promise.resolve(null);
    }

    if (syncState.inFlight) {
      return syncState.inFlight;
    }

    syncState.inFlight = window.SRS.getSyncSnapshot(getLastSync())
      .then(function(snapshot) {
        return platform().request('sync', '/api/sync/push', {
          auth  : true,
          json  : {
            progress  : getProgressEntries(),
            reviewLog : snapshot.reviewLog,
            since     : getLastSync(),
            vocabulary: snapshot.vocabulary
          },
          method: 'POST'
        });
      })
      .then(function(data) {
        var updates = data && data.serverUpdates ? data.serverUpdates : {
          progress  : [],
          reviewLog : [],
          serverTime: new Date().toISOString(),
          vocabulary: []
        };

        mergeProgressEntries(updates.progress || []);
        return window.SRS.applyServerSync(updates).then(function() {
          setLastSync(updates.serverTime || new Date().toISOString());
          return updates;
        });
      })
      .catch(function(error) {
        console.error('[sync] Sync failed.', error);
        return null;
      })
      .finally(function() {
        syncState.inFlight = null;
      });

    return syncState.inFlight;
  }

  function scheduleSync() {
    if (syncState.scheduled) {
      window.clearTimeout(syncState.scheduled);
    }

    syncState.scheduled = window.setTimeout(function() {
      syncState.scheduled = null;
      syncNow();
    }, 600);
  }

  function initSync() {
    if (!window.ChronoSinaPlatform || !window.SRS) {
      return;
    }

    if (hasSession() && navigator.onLine) {
      syncNow();
    }

    window.addEventListener('online', syncNow);
    window.addEventListener(platform().AUTH_CHANGE_EVENT, function() {
      if (hasSession()) {
        syncNow();
      }
    });
    window.addEventListener('chronosina:srs-updated', scheduleSync);
  }

  window.ChronoSinaSync = {
    getProgressEntries   : getProgressEntries,
    recordArticleProgress: recordArticleProgress,
    syncNow              : syncNow
  };

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initSync);
  } else {
    document.addEventListener('DOMContentLoaded', initSync);
  }
})();

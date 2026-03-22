/* global Fluid */

(function() {
  'use strict';

  var DB_NAME = 'chronosina-srs';
  var DB_VERSION = 2;
  var WORD_STORE = 'vocabulary';
  var REVIEW_STORE = 'reviewLog';
  var SETTINGS_STORE = 'settings';
  var REVIEW_LIMIT = 10;
  var DAILY_GOAL = 10;

  var dbPromise = null;
  var reviewCard = null;
  var reviewState = {
    index   : 0,
    queue   : [],
    revealed: false
  };

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, {
      detail: detail || {}
    }));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function trackEvent(category, action, label, extra) {
    if (window.ChronoSinaAnalytics && typeof window.ChronoSinaAnalytics.trackEvent === 'function') {
      window.ChronoSinaAnalytics.trackEvent(category, action, label, extra);
    }
  }

  function requestToPromise(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };
      request.onerror = function() {
        reject(request.error || new Error('IndexedDB request failed.'));
      };
    });
  }

  function formatDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function getTodayKey() {
    return formatDate(new Date());
  }

  function addDays(dateKey, days) {
    var date = new Date((dateKey || getTodayKey()) + 'T00:00:00');
    date.setDate(date.getDate() + Number(days || 0));
    return formatDate(date);
  }

  function fallbackWordId(text, pinyin) {
    var normalized = String(pinyin || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    if (normalized) {
      return normalized;
    }

    var codepoints = Array.from(String(text || ''))
      .map(function(character) {
        return character.codePointAt(0).toString(16);
      })
      .join('-');

    return codepoints ? 'word-' + codepoints : 'word';
  }

  function getArticleTitle() {
    var titleNode = document.querySelector('.post-content .post-title, .post-content h1, h1.post-title');
    if (titleNode && titleNode.textContent) {
      return titleNode.textContent.trim();
    }

    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      return ogTitle.content.trim();
    }

    return document.title || 'ChronoSina';
  }

  function clampQuality(quality) {
    var value = Number(quality);
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error('Review quality must be an integer between 0 and 5.');
    }

    return value;
  }

  function normalizeWord(word) {
    if (!word || !word.text) {
      throw new Error('A saved word must include text.');
    }

    var id = word.id ? String(word.id) : fallbackWordId(word.text, word.pinyin);
    var today = getTodayKey();
    var updatedAt = word.updatedAt ? String(word.updatedAt) : new Date().toISOString();

    return {
      audioUrl     : word.audioUrl ? String(word.audioUrl) : '',
      cloudId      : word.cloudId ? String(word.cloudId) : '',
      correctCount : Number.isFinite(Number(word.correctCount)) ? Number(word.correctCount) : 0,
      deletedAt    : word.deletedAt ? String(word.deletedAt) : null,
      easeFactor   : Number.isFinite(Number(word.easeFactor)) ? Number(word.easeFactor) : 2.5,
      gloss        : word.gloss ? String(word.gloss) : '',
      id           : id,
      interval     : Number.isFinite(Number(word.interval)) ? Number(word.interval) : 0,
      lastReview   : word.lastReview ? String(word.lastReview) : null,
      nextReview   : word.nextReview ? String(word.nextReview) : today,
      note         : word.note ? String(word.note) : '',
      pinyin       : word.pinyin ? String(word.pinyin) : '',
      qualityHistory: Array.isArray(word.qualityHistory) ? word.qualityHistory.slice() : [],
      repetitions  : Number.isFinite(Number(word.repetitions)) ? Number(word.repetitions) : 0,
      reviewCount  : Number.isFinite(Number(word.reviewCount)) ? Number(word.reviewCount) : 0,
      savedAt      : word.savedAt ? String(word.savedAt) : new Date().toISOString(),
      sourceArticle: word.sourceArticle ? String(word.sourceArticle) : window.location.pathname,
      sourceTitle  : word.sourceTitle ? String(word.sourceTitle) : getArticleTitle(),
      text         : String(word.text),
      updatedAt    : updatedAt
    };
  }

  function openDatabase() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB is not available in this browser.'));
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise(function(resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var wordStore = null;
        var reviewStore = null;

        if (!db.objectStoreNames.contains(WORD_STORE)) {
          wordStore = db.createObjectStore(WORD_STORE, { keyPath: 'id' });
          wordStore.createIndex('nextReview', 'nextReview', { unique: false });
          wordStore.createIndex('savedAt', 'savedAt', { unique: false });
        } else {
          wordStore = event.target.transaction.objectStore(WORD_STORE);
        }

        if (wordStore && !wordStore.indexNames.contains('updatedAt')) {
          wordStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (wordStore && !wordStore.indexNames.contains('deletedAt')) {
          wordStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(REVIEW_STORE)) {
          reviewStore = db.createObjectStore(REVIEW_STORE, {
            autoIncrement: true,
            keyPath      : 'id'
          });
          reviewStore.createIndex('timestamp', 'timestamp', { unique: false });
          reviewStore.createIndex('wordId', 'wordId', { unique: false });
        } else {
          reviewStore = event.target.transaction.objectStore(REVIEW_STORE);
        }

        if (reviewStore && !reviewStore.indexNames.contains('reviewedAt')) {
          reviewStore.createIndex('reviewedAt', 'reviewedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          var settingsStore = db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          settingsStore.put({
            key  : 'dailyGoal',
            value: DAILY_GOAL
          });
        }
      };

      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error || new Error('Failed to open the SRS database.'));
      };
    });

    return dbPromise;
  }

  function transaction(storeNames, mode, handler) {
    return openDatabase().then(function(db) {
      return new Promise(function(resolve, reject) {
        var names = Array.isArray(storeNames) ? storeNames : [storeNames];
        var tx = db.transaction(names, mode);
        var stores = {};
        var result;

        names.forEach(function(name) {
          stores[name] = tx.objectStore(name);
        });

        Promise.resolve()
          .then(function() {
            return handler(stores, tx);
          })
          .then(function(value) {
            result = value;
          })
          .catch(function(error) {
            try {
              tx.abort();
            } catch (abortError) {
              console.error('[srs] Failed to abort transaction.', abortError);
            }
            reject(error);
          });

        tx.oncomplete = function() {
          resolve(result);
        };
        tx.onerror = function() {
          reject(tx.error || new Error('IndexedDB transaction failed.'));
        };
        tx.onabort = function() {
          reject(tx.error || new Error('IndexedDB transaction aborted.'));
        };
      });
    });
  }

  function getAllFromStore(storeName) {
    return transaction(storeName, 'readonly', function(stores) {
      return requestToPromise(stores[storeName].getAll());
    });
  }

  function getAllWordsInternal(includeDeleted) {
    return getAllFromStore(WORD_STORE).then(function(words) {
      return words
        .filter(function(word) {
          return includeDeleted ? true : !word.deletedAt;
        })
        .sort(function(left, right) {
          return String(left.savedAt).localeCompare(String(right.savedAt));
        });
    });
  }

  function normalizeReviewEntry(entry) {
    var reviewedAt = entry.reviewedAt || entry.timestamp || new Date().toISOString();

    return {
      quality    : Number(entry.quality),
      responseTime: Number.isFinite(Number(entry.responseTime)) ? Number(entry.responseTime) : null,
      reviewedAt : String(reviewedAt),
      timestamp  : String(reviewedAt),
      wordId     : String(entry.wordId)
    };
  }

  function getReviewKey(entry) {
    return String(entry.wordId) + '::' + String(entry.reviewedAt || entry.timestamp || '');
  }

  function mergeWord(existing, incoming) {
    if (!existing) {
      return normalizeWord(incoming);
    }

    return normalizeWord({
      audioUrl     : incoming.audioUrl || existing.audioUrl,
      cloudId      : incoming.cloudId || existing.cloudId || '',
      correctCount : Number.isFinite(Number(incoming.correctCount)) ? Number(incoming.correctCount) : existing.correctCount,
      deletedAt    : incoming.deletedAt || existing.deletedAt || null,
      easeFactor   : Number.isFinite(Number(incoming.easeFactor)) ? Number(incoming.easeFactor) : existing.easeFactor,
      gloss        : incoming.gloss || existing.gloss,
      id           : existing.id,
      interval     : Number.isFinite(Number(incoming.interval)) ? Number(incoming.interval) : existing.interval,
      lastReview   : incoming.lastReview || existing.lastReview,
      nextReview   : incoming.nextReview || existing.nextReview,
      note         : incoming.note || existing.note,
      pinyin       : incoming.pinyin || existing.pinyin,
      qualityHistory: Array.isArray(incoming.qualityHistory) && incoming.qualityHistory.length
        ? incoming.qualityHistory.slice()
        : (Array.isArray(existing.qualityHistory) ? existing.qualityHistory.slice() : []),
      repetitions  : Number.isFinite(Number(incoming.repetitions)) ? Number(incoming.repetitions) : existing.repetitions,
      reviewCount  : Number.isFinite(Number(incoming.reviewCount)) ? Number(incoming.reviewCount) : existing.reviewCount,
      savedAt      : incoming.savedAt || existing.savedAt,
      sourceArticle: incoming.sourceArticle || existing.sourceArticle,
      sourceTitle  : incoming.sourceTitle || existing.sourceTitle,
      text         : incoming.text || existing.text,
      updatedAt    : incoming.updatedAt || existing.updatedAt || new Date().toISOString()
    });
  }

  function saveWord(word) {
    var payload = normalizeWord(word);
    payload.updatedAt = new Date().toISOString();
    payload.deletedAt = null;

    return transaction(WORD_STORE, 'readwrite', function(stores) {
      return requestToPromise(stores[WORD_STORE].get(payload.id))
        .then(function(existing) {
          var nextWord = mergeWord(existing, payload);
          return requestToPromise(stores[WORD_STORE].put(nextWord)).then(function() {
            return nextWord;
          });
        });
    }).then(function(savedWord) {
      emit('chronosina:srs-updated', {
        type: 'save',
        word: savedWord
      });
      trackEvent('vocab', 'save', savedWord.text, {
        wordId: savedWord.id
      });
      return savedWord;
    });
  }

  function removeWord(wordId) {
    return transaction(WORD_STORE, 'readwrite', function(stores) {
      return requestToPromise(stores[WORD_STORE].get(String(wordId)))
        .then(function(existing) {
          if (!existing) {
            return null;
          }

          existing.deletedAt = new Date().toISOString();
          existing.updatedAt = existing.deletedAt;
          return requestToPromise(stores[WORD_STORE].put(existing));
        });
    }).then(function() {
      emit('chronosina:srs-updated', {
        type  : 'remove',
        wordId: String(wordId)
      });
    });
  }

  function getWord(wordId) {
    return transaction(WORD_STORE, 'readonly', function(stores) {
      return requestToPromise(stores[WORD_STORE].get(String(wordId)));
    }).then(function(word) {
      return word && !word.deletedAt ? word : null;
    });
  }

  function hasWord(wordId) {
    return getWord(wordId).then(function(word) {
      return Boolean(word);
    });
  }

  function getAllWords() {
    return getAllWordsInternal(false);
  }

  function getWordCount() {
    return getAllWords().then(function(words) {
      return words.length;
    });
  }

  function getDueWords(limit) {
    var today = getTodayKey();
    var maxItems = typeof limit === 'number' ? limit : REVIEW_LIMIT;

    return getAllWords().then(function(words) {
      return words
        .filter(function(word) {
          return !word.nextReview || word.nextReview <= today;
        })
        .sort(function(left, right) {
          return String(left.nextReview || '').localeCompare(String(right.nextReview || ''))
            || String(left.savedAt).localeCompare(String(right.savedAt));
        })
        .slice(0, maxItems);
    });
  }

  function getDueCount() {
    return getDueWords(Number.MAX_SAFE_INTEGER).then(function(words) {
      return words.length;
    });
  }

  function reviewWord(wordId, quality, meta) {
    var responseMeta = meta || {};
    var rating = clampQuality(quality);

    return transaction([WORD_STORE, REVIEW_STORE], 'readwrite', function(stores) {
      return requestToPromise(stores[WORD_STORE].get(String(wordId)))
        .then(function(existing) {
          if (!existing) {
            throw new Error('Cannot review a word that is not saved.');
          }

          var nextWord = normalizeWord(existing);
          var today = getTodayKey();

          if (rating >= 3) {
            if (nextWord.repetitions === 0) {
              nextWord.interval = 1;
            } else if (nextWord.repetitions === 1) {
              nextWord.interval = 6;
            } else {
              nextWord.interval = Math.max(1, Math.round(nextWord.interval * nextWord.easeFactor));
            }

            nextWord.repetitions += 1;
            nextWord.correctCount += 1;
          } else {
            nextWord.repetitions = 0;
            nextWord.interval = 1;
          }

          nextWord.easeFactor = Math.max(
            1.3,
            nextWord.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
          );
          nextWord.lastReview = today;
          nextWord.nextReview = addDays(today, nextWord.interval);
          nextWord.deletedAt = null;
          nextWord.qualityHistory = Array.isArray(nextWord.qualityHistory) ? nextWord.qualityHistory.slice() : [];
          nextWord.qualityHistory.push(rating);
          nextWord.updatedAt = new Date().toISOString();
          nextWord.reviewCount += 1;

          return requestToPromise(stores[WORD_STORE].put(nextWord))
            .then(function() {
              var reviewedAt = new Date().toISOString();
              return requestToPromise(stores[REVIEW_STORE].add({
                quality     : rating,
                responseTime: Number.isFinite(Number(responseMeta.responseTime)) ? Number(responseMeta.responseTime) : null,
                reviewedAt  : reviewedAt,
                timestamp   : reviewedAt,
                wordId      : nextWord.id
              }));
            })
            .then(function() {
              return nextWord;
            });
        });
    }).then(function(updatedWord) {
      emit('chronosina:srs-updated', {
        type: 'review',
        word: updatedWord
      });
      trackEvent('srs', 'review', 'quality-' + rating, {
        wordId: updatedWord.id
      });
      return updatedWord;
    });
  }

  function getStats() {
    return getAllWords().then(function(words) {
      var today = getTodayKey();
      var learned = 0;
      var learning = 0;
      var fresh = 0;
      var due = 0;

      words.forEach(function(word) {
        if (!word.nextReview || word.nextReview <= today) {
          due += 1;
        }

        if (word.repetitions >= 3) {
          learned += 1;
        } else if (word.repetitions > 0) {
          learning += 1;
        } else {
          fresh += 1;
        }
      });

      return {
        due     : due,
        learned : learned,
        learning: learning,
        new     : fresh,
        total   : words.length
      };
    });
  }

  function getReviewHistory(days) {
    var range = Number.isFinite(Number(days)) ? Number(days) : 30;
    var cutoff = Date.now() - (range * 24 * 60 * 60 * 1000);

    return getAllFromStore(REVIEW_STORE).then(function(entries) {
      return entries
        .filter(function(entry) {
          return new Date(entry.reviewedAt || entry.timestamp).getTime() >= cutoff;
        })
        .sort(function(left, right) {
          return new Date(right.reviewedAt || right.timestamp).getTime() - new Date(left.reviewedAt || left.timestamp).getTime();
        });
    });
  }

  function getAllReviewLog() {
    return getAllFromStore(REVIEW_STORE).then(function(entries) {
      return entries.sort(function(left, right) {
        return new Date(left.reviewedAt || left.timestamp).getTime() - new Date(right.reviewedAt || right.timestamp).getTime();
      });
    });
  }

  function getSyncSnapshot(since) {
    var sinceTime = since ? new Date(since).getTime() : 0;

    return Promise.all([
      getAllWordsInternal(true),
      getAllReviewLog()
    ]).then(function(values) {
      return {
        reviewLog: values[1].filter(function(entry) {
          return !sinceTime || new Date(entry.reviewedAt || entry.timestamp).getTime() > sinceTime;
        }).map(normalizeReviewEntry),
        vocabulary: values[0].filter(function(word) {
          return !sinceTime || new Date(word.updatedAt || word.savedAt).getTime() > sinceTime;
        }).map(normalizeWord)
      };
    });
  }

  function applyServerSync(bundle) {
    var words = Array.isArray(bundle && bundle.vocabulary) ? bundle.vocabulary.map(normalizeWord) : [];
    var logs = Array.isArray(bundle && bundle.reviewLog) ? bundle.reviewLog.map(normalizeReviewEntry) : [];

    return transaction([WORD_STORE, REVIEW_STORE], 'readwrite', function(stores) {
      return Promise.all([
        requestToPromise(stores[WORD_STORE].getAll()),
        requestToPromise(stores[REVIEW_STORE].getAll())
      ]).then(function(values) {
        var existingWords = new Map(values[0].map(function(word) {
          return [word.id, word];
        }));
        var reviewKeys = new Set(values[1].map(getReviewKey));
        var operations = [];

        words.forEach(function(word) {
          var existing = existingWords.get(word.id);
          if (!existing || new Date(word.updatedAt || word.savedAt).getTime() >= new Date(existing.updatedAt || existing.savedAt).getTime()) {
            operations.push(requestToPromise(stores[WORD_STORE].put(mergeWord(existing || word, word))));
          }
        });

        logs.forEach(function(entry) {
          var key = getReviewKey(entry);
          if (reviewKeys.has(key)) {
            return;
          }

          reviewKeys.add(key);
          operations.push(requestToPromise(stores[REVIEW_STORE].add({
            quality     : entry.quality,
            responseTime: entry.responseTime,
            reviewedAt  : entry.reviewedAt,
            timestamp   : entry.reviewedAt,
            wordId      : entry.wordId
          })));
        });

        return Promise.all(operations);
      });
    }).then(function() {
      emit('chronosina:srs-updated', {
        type: 'sync-apply'
      });
    });
  }

  function exportToJSON() {
    return Promise.all([
      getAllFromStore(WORD_STORE),
      getAllFromStore(REVIEW_STORE),
      getAllFromStore(SETTINGS_STORE)
    ]).then(function(values) {
      return {
        exportedAt: new Date().toISOString(),
        reviewLog : values[1],
        settings  : values[2],
        version   : 1,
        vocabulary: values[0]
      };
    });
  }

  function importFromJSON(data) {
    if (!data || typeof data !== 'object') {
      return Promise.reject(new Error('Import data must be an object.'));
    }

      var words = Array.isArray(data.vocabulary) ? data.vocabulary.map(normalizeWord) : [];
      var logs = Array.isArray(data.reviewLog) ? data.reviewLog.map(normalizeReviewEntry) : [];
    var settings = Array.isArray(data.settings) ? data.settings : [];

    return transaction([WORD_STORE, REVIEW_STORE, SETTINGS_STORE], 'readwrite', function(stores) {
      return Promise.all([
        requestToPromise(stores[WORD_STORE].clear()),
        requestToPromise(stores[REVIEW_STORE].clear()),
        requestToPromise(stores[SETTINGS_STORE].clear())
      ]).then(function() {
        return Promise.all(words.map(function(word) {
          return requestToPromise(stores[WORD_STORE].put(word));
        }).concat(logs.map(function(log) {
          return requestToPromise(stores[REVIEW_STORE].put(log));
        })).concat((settings.length ? settings : [{
          key  : 'dailyGoal',
          value: DAILY_GOAL
        }]).map(function(setting) {
          return requestToPromise(stores[SETTINGS_STORE].put(setting));
        })));
      });
    }).then(function() {
      emit('chronosina:srs-updated', { type: 'import' });
    });
  }

  function getSaveButtonText(saved) {
    return saved ? 'Saved ✓' : '⭐ Save';
  }

  function buildWordPayload(button) {
    if (!button) {
      return null;
    }

    var text = button.getAttribute('data-text') || '';
    var pinyin = button.getAttribute('data-pinyin') || '';

    if (!text) {
      return null;
    }

    return normalizeWord({
      audioUrl     : button.getAttribute('data-audio') || '',
      gloss        : button.getAttribute('data-gloss') || '',
      id           : button.getAttribute('data-word-id') || fallbackWordId(text, pinyin),
      note         : button.getAttribute('data-note') || '',
      pinyin       : pinyin,
      sourceArticle: window.location.pathname,
      sourceTitle  : getArticleTitle(),
      text         : text
    });
  }

  function injectSaveButton(detail) {
    var panel = detail && detail.panel ? detail.panel : document.querySelector('.cn-lesson__popover');
    var button = detail && detail.button ? detail.button : document.querySelector('.cn-lesson__token.is-active');

    if (!panel || !button || panel.hidden) {
      return;
    }

    var popoverCard = panel.querySelector('.cn-lesson__popover-card');
    if (!popoverCard || popoverCard.querySelector('[data-srs-save-btn]')) {
      return;
    }

    var payload = buildWordPayload(button);
    if (!payload || !payload.id) {
      return;
    }

    var actions = document.createElement('div');
    actions.className = 'srs-popover__actions';

    var saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'srs-save-btn';
    saveButton.setAttribute('data-srs-save-btn', payload.id);
    saveButton.textContent = getSaveButtonText(false);
    actions.appendChild(saveButton);
    popoverCard.appendChild(actions);

    hasWord(payload.id)
      .then(function(saved) {
        saveButton.textContent = getSaveButtonText(saved);
        saveButton.disabled = saved;
        if (saved) {
          saveButton.classList.add('is-saved');
        }
      })
      .catch(function(error) {
        console.error('[srs] Failed to read word state.', error);
      });

    saveButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();

      if (saveButton.disabled) {
        return;
      }

      saveButton.disabled = true;

      saveWord(payload)
        .then(function() {
          saveButton.textContent = getSaveButtonText(true);
          saveButton.classList.add('is-saved');
          return refreshReviewCard();
        })
        .catch(function(error) {
          saveButton.disabled = false;
          console.error('[srs] Failed to save word.', error);
        });
    });
  }

  function isHomePage() {
    var root = window.CONFIG && window.CONFIG.root ? window.CONFIG.root : '/';
    var normalizedRoot = root.endsWith('/') ? root : root + '/';
    return window.location.pathname === normalizedRoot || window.location.pathname === normalizedRoot + 'index.html';
  }

  function ensureReviewCard() {
    if (reviewCard && reviewCard.isConnected) {
      return reviewCard;
    }

    var existing = document.querySelector('[data-srs-review]');
    if (existing) {
      reviewCard = existing;
      return reviewCard;
    }

    var article = document.querySelector('article.post-content.mx-auto');
    var container = document.createElement('section');
    container.className = 'srs-review';
    container.setAttribute('data-srs-review', '');

    if (article && article.parentNode) {
      var anchor = document.querySelector('#board .post-prevnext');
      article.parentNode.insertBefore(container, anchor || article.nextSibling);
      reviewCard = container;
      return reviewCard;
    }

    if (isHomePage()) {
      var firstIndexCard = document.querySelector('.index-card');
      if (firstIndexCard && firstIndexCard.parentNode) {
        firstIndexCard.parentNode.insertBefore(container, firstIndexCard);
        reviewCard = container;
        return reviewCard;
      }
    }

    return null;
  }

  function getProgressPercent() {
    if (!reviewState.queue.length) {
      return 0;
    }

    var completed = Math.min(reviewState.index, reviewState.queue.length);
    return Math.round((completed / reviewState.queue.length) * 100);
  }

  function renderStats(stats) {
    return [
      '<div class="srs-review__stats">',
      '  <div class="srs-review__stat"><span class="srs-review__stat-value">' + escapeHtml(stats.total) + '</span><span class="srs-review__stat-label">saved</span></div>',
      '  <div class="srs-review__stat"><span class="srs-review__stat-value">' + escapeHtml(stats.due) + '</span><span class="srs-review__stat-label">due</span></div>',
      '  <div class="srs-review__stat"><span class="srs-review__stat-value">' + escapeHtml(stats.learned) + '</span><span class="srs-review__stat-label">learned</span></div>',
      '  <div class="srs-review__stat"><span class="srs-review__stat-value">' + escapeHtml(stats.learning) + '</span><span class="srs-review__stat-label">learning</span></div>',
      '</div>'
    ].join('');
  }

  function renderEmptyState(stats) {
    return [
      '<div class="srs-review__panel">',
      '  <div class="srs-review__header">',
      '    <div>',
      '      <p class="srs-review__eyebrow">Daily Review</p>',
      '      <h2 class="srs-review__title">Start your vocabulary deck</h2>',
      '    </div>',
      '    <span class="srs-review__badge">0 due</span>',
      '  </div>',
      renderStats(stats),
      '  <p class="srs-review__message">Click any highlighted Chinese token in an article and choose <strong>Save</strong> to build your review queue.</p>',
      '</div>'
    ].join('');
  }

  function renderNoDueState(stats) {
    return [
      '<div class="srs-review__panel">',
      '  <div class="srs-review__header">',
      '    <div>',
      '      <p class="srs-review__eyebrow">Daily Review</p>',
      '      <h2 class="srs-review__title">You are clear for today</h2>',
      '    </div>',
      '    <span class="srs-review__badge">0 due</span>',
      '  </div>',
      renderStats(stats),
      '  <p class="srs-review__message">Nice work. Keep collecting words from the lessons and new reviews will appear here automatically.</p>',
      '</div>'
    ].join('');
  }

  function renderReviewState(stats) {
    var current = reviewState.queue[reviewState.index];

    if (!current) {
      return renderNoDueState(stats);
    }

    var source = current.sourceTitle
      ? '<p class="srs-review__source">From: ' + escapeHtml(current.sourceTitle) + '</p>'
      : '';
    var answer = reviewState.revealed
      ? [
        '<div class="srs-review__answer">',
        current.pinyin ? '  <p class="srs-review__pinyin">' + escapeHtml(current.pinyin) + '</p>' : '',
        current.gloss ? '  <p class="srs-review__gloss">' + escapeHtml(current.gloss) + '</p>' : '',
        source,
        '  <div class="srs-review__actions">',
        '    <button type="button" class="srs-review__audio cn-lesson__audio" data-cn-audio="" data-text="' + escapeHtml(current.text) + '"' + (current.audioUrl ? ' data-audio="' + escapeHtml(current.audioUrl) + '"' : '') + '>🔊 Play</button>',
        '  </div>',
        '  <div class="srs-review__grades">',
        '    <button type="button" class="srs-review__grade" data-srs-quality="1">Forgot</button>',
        '    <button type="button" class="srs-review__grade" data-srs-quality="3">Hard</button>',
        '    <button type="button" class="srs-review__grade" data-srs-quality="4">Good</button>',
        '    <button type="button" class="srs-review__grade" data-srs-quality="5">Easy</button>',
        '  </div>',
        '</div>'
      ].join('\n')
      : '<button type="button" class="srs-review__reveal" data-srs-reveal>Show answer</button>';

    return [
      '<div class="srs-review__panel">',
      '  <div class="srs-review__header">',
      '    <div>',
      '      <p class="srs-review__eyebrow">Daily Review</p>',
      '      <h2 class="srs-review__title">' + escapeHtml(stats.due) + ' word' + (stats.due === 1 ? '' : 's') + ' due today</h2>',
      '    </div>',
      '    <span class="srs-review__badge">' + escapeHtml(reviewState.index + 1) + '/' + escapeHtml(reviewState.queue.length) + '</span>',
      '  </div>',
      renderStats(stats),
      '  <div class="srs-review__flashcard">',
      '    <div class="srs-review__prompt">' + escapeHtml(current.text) + '</div>',
      '    <p class="srs-review__hint">' + (reviewState.revealed ? 'How well did you remember it?' : 'Recall the meaning before revealing the answer.') + '</p>',
      answer,
      '  </div>',
      '  <div class="srs-review__progress-bar"><span style="width:' + escapeHtml(getProgressPercent()) + '%"></span></div>',
      '  <p class="srs-review__progress-label">' + escapeHtml(reviewState.index) + ' reviewed · goal ' + escapeHtml(DAILY_GOAL) + '/day</p>',
      '</div>'
    ].join('');
  }

  function renderErrorState(error) {
    return [
      '<div class="srs-review__panel">',
      '  <div class="srs-review__header">',
      '    <div>',
      '      <p class="srs-review__eyebrow">Daily Review</p>',
      '      <h2 class="srs-review__title">SRS is unavailable</h2>',
      '    </div>',
      '    <span class="srs-review__badge is-muted">error</span>',
      '  </div>',
      '  <p class="srs-review__message">' + escapeHtml(String(error.message || error)) + '</p>',
      '</div>'
    ].join('');
  }

  function bindReviewActions(container) {
    var revealButton = container.querySelector('[data-srs-reveal]');
    if (revealButton) {
      revealButton.addEventListener('click', function() {
        reviewState.revealed = true;
        refreshReviewCard();
      });
    }

    container.querySelectorAll('[data-srs-quality]').forEach(function(button) {
      button.addEventListener('click', function() {
        var current = reviewState.queue[reviewState.index];
        if (!current) {
          return;
        }

        reviewWord(current.id, Number(button.getAttribute('data-srs-quality')), {
          responseTime: null
        })
          .then(function() {
            reviewState.index += 1;
            reviewState.revealed = false;
            return refreshReviewCard();
          })
          .catch(function(error) {
            console.error('[srs] Failed to submit review.', error);
          });
      });
    });
  }

  function refreshReviewCard() {
    var container = ensureReviewCard();
    if (!container) {
      return Promise.resolve();
    }

    return Promise.all([
      getStats(),
      getDueWords(REVIEW_LIMIT)
    ]).then(function(values) {
      var stats = values[0];
      reviewState.queue = values[1];

      if (reviewState.index >= reviewState.queue.length) {
        reviewState.index = 0;
      }

      if (!reviewState.queue.length) {
        reviewState.revealed = false;
      }

      if (!stats.total) {
        container.innerHTML = renderEmptyState(stats);
        return;
      }

      if (!stats.due) {
        container.innerHTML = renderNoDueState(stats);
        return;
      }

      container.innerHTML = renderReviewState(stats);
      bindReviewActions(container);
    }).catch(function(error) {
      console.error('[srs] Failed to refresh review card.', error);
      container.innerHTML = renderErrorState(error);
    });
  }

  function initSRS() {
    openDatabase()
      .then(function() {
        return refreshReviewCard();
      })
      .catch(function(error) {
        console.error('[srs] Failed to initialize.', error);
        var container = ensureReviewCard();
        if (container) {
          container.innerHTML = renderErrorState(error);
        }
      });

    window.addEventListener('chronosina:token-popover-open', function(event) {
      injectSaveButton(event.detail || {});
    });

    window.addEventListener('chronosina:srs-updated', function() {
      refreshReviewCard();
    });
  }

  var api = {
    applyServerSync: applyServerSync,
    exportToJSON   : exportToJSON,
    getAllReviewLog: getAllReviewLog,
    getAllWords    : getAllWords,
    getDueCount    : getDueCount,
    getDueWords    : getDueWords,
    getReviewHistory: getReviewHistory,
    getStats       : getStats,
    getSyncSnapshot: getSyncSnapshot,
    getWord        : getWord,
    getWordCount   : getWordCount,
    hasWord        : hasWord,
    importFromJSON : importFromJSON,
    refreshUI      : refreshReviewCard,
    removeWord     : removeWord,
    reviewWord     : reviewWord,
    saveWord       : saveWord
  };

  window.SRS = api;
  window.ChronoSinaSRS = api;

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initSRS);
  } else {
    document.addEventListener('DOMContentLoaded', initSRS);
  }
})();

/* global Fluid */

(function() {
  'use strict';

  var STORAGE_KEY = 'chronosina_events';
  var EVENT_LIMIT = 500;

  function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  function readEvents() {
    if (!canUseStorage()) {
      return [];
    }

    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[analytics] Failed to parse stored events.', error);
      return [];
    }
  }

  function writeEvents(events) {
    if (!canUseStorage()) {
      return [];
    }

    var nextEvents = events.slice(-EVENT_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
    return nextEvents;
  }

  function trackEvent(category, action, label, extra) {
    if (!category || !action) {
      throw new Error('trackEvent(category, action) requires both category and action.');
    }

    var events = readEvents();
    var entry = {
      category: String(category),
      action  : String(action),
      label   : label ? String(label) : '',
      extra   : extra || null,
      ts      : Date.now()
    };

    events.push(entry);
    writeEvents(events);

    window.dispatchEvent(new CustomEvent('chronosina:analytics-track', {
      detail: entry
    }));

    return entry;
  }

  function clearEvents() {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.ChronoSinaAnalytics = {
    clearEvents: clearEvents,
    getEvents  : readEvents,
    trackEvent : trackEvent
  };

  if (!window.trackChronoSinaEvent) {
    window.trackChronoSinaEvent = trackEvent;
  }
})();

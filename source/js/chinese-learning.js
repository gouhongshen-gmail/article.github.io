/* global Fluid */

(function() {
  'use strict';

  var ACTIVE_CLASS = 'is-active';
  var PLAYING_CLASS = 'is-playing';
  var LESSON_SELECTOR = '[data-cn-lesson]';
  var TOGGLE_SELECTOR = '.cn-lesson__toggle';
  var TRANSLATION_SELECTOR = '.cn-lesson__translation';
  var TOKEN_SELECTOR = '[data-cn-token]';
  var AUDIO_SELECTOR = '[data-cn-audio]';
  var POPOVER_SELECTOR = '.cn-lesson__popover';

  var activeAudio = null;
  var activeButton = null;
  var activeToken = null;
  var activeSentence = null;
  var popover = null;

  var speakerIcon = [
    '<svg class="cn-lesson__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z"></path>',
    '</svg>'
  ].join('');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hasLessons() {
    return document.querySelector(LESSON_SELECTOR) !== null;
  }

  function clearPlayingState() {
    if (activeButton) {
      activeButton.classList.remove(PLAYING_CLASS);
    }
    activeButton = null;
  }

  function stopPlayback() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    clearPlayingState();
  }

  function markPlaying(button) {
    clearPlayingState();
    activeButton = button;
    if (button) {
      button.classList.add(PLAYING_CLASS);
    }
  }

  function pickChineseVoice() {
    if (!('speechSynthesis' in window)) {
      return null;
    }

    var voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) {
      return null;
    }

    return voices.find(function(voice) {
      return /^zh(-|_)/i.test(voice.lang);
    }) || voices.find(function(voice) {
      return /Chinese/i.test(voice.name);
    }) || null;
  }

  function speakText(text, button) {
    if (!('speechSynthesis' in window)) {
      console.warn('[cn-lesson] Browser speech synthesis is not available.');
      return;
    }

    stopPlayback();

    var utterance = new SpeechSynthesisUtterance(text);
    var voice = pickChineseVoice();

    utterance.lang = voice ? voice.lang : 'zh-CN';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = clearPlayingState;
    utterance.onerror = function(event) {
      console.warn('[cn-lesson] Speech synthesis failed.', event.error || event);
      clearPlayingState();
    };

    markPlaying(button);
    window.speechSynthesis.speak(utterance);
  }

  function playAudio(url, text, button) {
    if (activeButton === button) {
      stopPlayback();
      return;
    }

    if (!url) {
      speakText(text, button);
      return;
    }

    stopPlayback();

    var didFallback = false;
    var audio = new Audio(url);

    function fallbackToSpeech(reason) {
      if (didFallback) {
        return;
      }

      didFallback = true;
      console.warn('[cn-lesson] Audio playback failed, falling back to speech synthesis.', reason || '');
      activeAudio = null;
      clearPlayingState();

      if (text) {
        speakText(text, button);
      }
    }

    activeAudio = audio;
    markPlaying(button);

    audio.addEventListener('ended', function() {
      activeAudio = null;
      clearPlayingState();
    }, { once: true });

    audio.addEventListener('error', function(event) {
      fallbackToSpeech(event.type);
    }, { once: true });

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function(error) {
        fallbackToSpeech(error && error.message ? error.message : error);
      });
    }
  }

  function ensurePopover() {
    if (popover) {
      return popover;
    }

    popover = document.createElement('div');
    popover.className = 'cn-lesson__popover';
    popover.setAttribute('role', 'dialog');
    popover.hidden = true;
    document.body.appendChild(popover);
    return popover;
  }

  function clearActiveToken() {
    if (activeToken) {
      activeToken.classList.remove(ACTIVE_CLASS);
    }
    activeToken = null;
  }

  function closePopover() {
    if (popover) {
      popover.hidden = true;
      popover.innerHTML = '';
    }
    clearActiveToken();
    window.dispatchEvent(new CustomEvent('chronosina:token-popover-close'));
  }

  function closeSentence(sentence) {
    if (!sentence) {
      return;
    }

    var toggleButton = sentence.querySelector(TOGGLE_SELECTOR);
    var translation = sentence.querySelector(TRANSLATION_SELECTOR);

    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', 'false');
    }

    if (translation) {
      translation.hidden = true;
      translation.style.left = '';
      translation.style.top = '';
      translation.removeAttribute('data-placement');
    }

    sentence.classList.remove(ACTIVE_CLASS, 'is-open');

    if (activeSentence === sentence) {
      activeSentence = null;
    }
  }

  function closeAllSentences(exceptSentence) {
    document.querySelectorAll('[data-cn-lesson-sentence].is-open').forEach(function(sentence) {
      if (sentence !== exceptSentence) {
        closeSentence(sentence);
      }
    });
  }

  function positionTranslation(sentence, translation) {
    if (!sentence || !translation) {
      return;
    }

    var spacing = 12;
    translation.style.left = '0px';
    translation.style.top = sentence.offsetHeight + 10 + 'px';
    translation.setAttribute('data-placement', 'bottom');

    var sentenceRect = sentence.getBoundingClientRect();
    var translationRect = translation.getBoundingClientRect();
    var left = 0;
    var top = sentence.offsetHeight + 10;

    if (sentenceRect.left + translationRect.width > window.innerWidth - spacing) {
      left = window.innerWidth - spacing - sentenceRect.left - translationRect.width;
    }

    if (sentenceRect.left + left < spacing) {
      left = spacing - sentenceRect.left;
    }

    if (sentenceRect.bottom + 10 + translationRect.height > window.innerHeight - spacing
      && sentenceRect.top - translationRect.height - 10 > spacing) {
      top = -translationRect.height - 10;
      translation.setAttribute('data-placement', 'top');
    }

    translation.style.left = left + 'px';
    translation.style.top = top + 'px';
  }

  function positionPopover(anchor, panel) {
    panel.hidden = false;
    panel.style.top = '0px';
    panel.style.left = '0px';

    var spacing = 12;
    var anchorRect = anchor.getBoundingClientRect();
    var panelRect = panel.getBoundingClientRect();
    var left = anchorRect.left + (anchorRect.width / 2) - (panelRect.width / 2);
    var top = anchorRect.top - panelRect.height - spacing;

    if (top < spacing) {
      top = anchorRect.bottom + spacing;
      panel.setAttribute('data-placement', 'bottom');
    } else {
      panel.setAttribute('data-placement', 'top');
    }

    left = Math.max(spacing, Math.min(left, window.innerWidth - panelRect.width - spacing));

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function openTokenPopover(button) {
    if (activeToken === button && popover && !popover.hidden) {
      closePopover();
      return;
    }

    closePopover();

    var panel = ensurePopover();
    var text = button.getAttribute('data-text') || '';
    var gloss = button.getAttribute('data-gloss') || 'Gloss not provided yet.';
    var pinyin = button.getAttribute('data-pinyin') || '';
    var note = button.getAttribute('data-note') || '';
    var audio = button.getAttribute('data-audio') || '';
    var audioButton = text
      ? [
        '<button type="button" class="cn-lesson__popover-audio" data-cn-popover-audio="" aria-label="Play pronunciation">',
        speakerIcon,
        '<span class="cn-lesson__visually-hidden">Play pronunciation</span>',
        '</button>'
      ].join('')
      : '';

    panel.innerHTML = [
      '<div class="cn-lesson__popover-card">',
      '  <div class="cn-lesson__popover-header">',
      '    <div class="cn-lesson__popover-word" lang="zh-CN">' + escapeHtml(text) + '</div>',
      '    ' + audioButton,
      '  </div>',
      pinyin ? '  <div class="cn-lesson__popover-pinyin">' + escapeHtml(pinyin) + '</div>' : '',
      '  <div class="cn-lesson__popover-gloss">' + escapeHtml(gloss) + '</div>',
      note ? '  <div class="cn-lesson__popover-note">' + escapeHtml(note) + '</div>' : '',
      '</div>'
    ].join('');

    var playButton = panel.querySelector('[data-cn-popover-audio]');
    if (playButton) {
      playButton.addEventListener('click', function(event) {
        event.stopPropagation();
        playAudio(audio, text, playButton);
      });
    }

    activeToken = button;
    button.classList.add(ACTIVE_CLASS);
    positionPopover(button, panel);

    window.dispatchEvent(new CustomEvent('chronosina:token-popover-open', {
      detail: {
        button: button,
        panel : panel
      }
    }));
  }

  function toggleTranslation(button) {
    var sentence = button.closest('[data-cn-lesson-sentence]');
    if (!sentence) {
      return;
    }

    var translation = sentence.querySelector(TRANSLATION_SELECTOR);
    var expanded = button.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeSentence(sentence);
      closePopover();
      return;
    }

    closeAllSentences(sentence);
    closePopover();

    button.setAttribute('aria-expanded', 'true');
    sentence.classList.add('is-open');
    translation.hidden = false;
    positionTranslation(sentence, translation);
    activeSentence = sentence;
  }

  function handleDocumentClick(event) {
    var toggleButton = event.target.closest(TOGGLE_SELECTOR);
    if (toggleButton) {
      event.preventDefault();
      toggleTranslation(toggleButton);
      return;
    }

    var tokenButton = event.target.closest(TOKEN_SELECTOR);
    if (tokenButton) {
      event.preventDefault();
      openTokenPopover(tokenButton);
      return;
    }

    var audioButton = event.target.closest(AUDIO_SELECTOR);
    if (audioButton) {
      event.preventDefault();
      playAudio(
        audioButton.getAttribute('data-audio') || '',
        audioButton.getAttribute('data-text') || '',
        audioButton
      );
      return;
    }

    if (event.target.closest(TRANSLATION_SELECTOR)) {
      return;
    }

    if (event.target.closest(POPOVER_SELECTOR)) {
      return;
    }

    closePopover();
    closeAllSentences();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closePopover();
      closeAllSentences();
      stopPlayback();
    }
  }

  function initLessons() {
    if (!hasLessons()) {
      return;
    }

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', function() {
      closePopover();
      closeAllSentences();
    });
    window.addEventListener('scroll', function() {
      closePopover();
      closeAllSentences();
    }, true);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function() {
        window.speechSynthesis.getVoices();
      };
    }
  }

  if (window.Fluid && Fluid.utils && typeof Fluid.utils.listenDOMLoaded === 'function') {
    Fluid.utils.listenDOMLoaded(initLessons);
  } else {
    document.addEventListener('DOMContentLoaded', initLessons);
  }
})();

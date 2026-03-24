<script>
  import { onMount } from 'svelte';

  let readingMode = 'guided';
  let fontSize = 16;
  let chineseFont = 'system';
  let dailyReviewLimit = 20;
  let newWordsPerSession = 10;
  let showIntervalPreview = true;
  let theme = 'system';
  let readingDisplayMode = 'default';
  let displayName = '';
  let userLevel = 'beginner';

  onMount(() => {
    // Load settings from localStorage
    readingMode = localStorage.getItem('longlore_reading_mode') || 'guided';
    fontSize = parseInt(localStorage.getItem('longlore_font_size') || '16');
    chineseFont = localStorage.getItem('longlore_chinese_font') || 'system';
    dailyReviewLimit = parseInt(localStorage.getItem('longlore_daily_review_limit') || '20');
    newWordsPerSession = parseInt(localStorage.getItem('longlore_new_words_per_session') || '10');
    showIntervalPreview = localStorage.getItem('longlore_show_interval_preview') !== 'false';
    theme = localStorage.getItem('longlore_theme') || 'system';
    readingDisplayMode = localStorage.getItem('longlore_reading_display_mode') || 'default';
    displayName = localStorage.getItem('longlore_display_name') || '';
    userLevel = localStorage.getItem('longlore_user_level') || 'beginner';

    // Apply theme on mount
    applyTheme();
  });

  function saveSetting(key, value) {
    localStorage.setItem(`longlore_${key}`, value);
  }

  function handleReadingModeChange(mode) {
    readingMode = mode;
    saveSetting('reading_mode', mode);
  }

  function handleFontSizeChange(size) {
    fontSize = size;
    saveSetting('font_size', size);
  }

  function handleChineseFontChange(font) {
    chineseFont = font;
    saveSetting('chinese_font', font);
  }

  function handleDailyReviewLimitChange(limit) {
    dailyReviewLimit = limit;
    saveSetting('daily_review_limit', limit);
  }

  function handleNewWordsPerSessionChange(words) {
    newWordsPerSession = words;
    saveSetting('new_words_per_session', words);
  }

  function handleShowIntervalPreviewChange(checked) {
    showIntervalPreview = checked;
    saveSetting('show_interval_preview', checked);
  }

  function handleThemeChange(t) {
    theme = t;
    saveSetting('theme', t);
    applyTheme();
  }

  function handleReadingDisplayModeChange(mode) {
    readingDisplayMode = mode;
    saveSetting('reading_display_mode', mode);
  }

  function handleDisplayNameChange(name) {
    displayName = name;
    saveSetting('display_name', name);
  }

  function handleUserLevelChange(level) {
    userLevel = level;
    saveSetting('user_level', level);
  }

  function applyTheme() {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  function handleDeleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      // Implementation for account deletion
      console.log('Account deletion requested');
    }
  }
</script>

<div class="settings-container">
  <!-- Reading Preferences -->
  <section class="settings-section">
    <h2>Reading Preferences</h2>
    <div class="settings-card">
      <!-- Reading Mode -->
      <div class="setting-row">
        <label for="reading-mode">Reading Mode</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              name="reading-mode"
              value="guided"
              checked={readingMode === 'guided'}
              onchange={() => handleReadingModeChange('guided')}
            />
            Guided
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="reading-mode"
              value="assisted"
              checked={readingMode === 'assisted'}
              onchange={() => handleReadingModeChange('assisted')}
            />
            Assisted
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="reading-mode"
              value="immersive"
              checked={readingMode === 'immersive'}
              onchange={() => handleReadingModeChange('immersive')}
            />
            Immersive
          </label>
        </div>
      </div>

      <!-- Font Size -->
      <div class="setting-row">
        <div class="label-group">
          <label for="font-size">Default Font Size</label>
          <span class="value">{fontSize}px</span>
        </div>
        <div class="control-group">
          <input
            type="range"
            id="font-size"
            min="14"
            max="24"
            value={fontSize}
            onchange={(e) => handleFontSizeChange(parseInt(e.target.value))}
          />
          <div class="preview" style="font-size: {fontSize}px">大运河 The Grand Canal</div>
        </div>
      </div>

      <!-- Chinese Font -->
      <div class="setting-row last">
        <label for="chinese-font">Chinese Font</label>
        <select
          id="chinese-font"
          value={chineseFont}
          onchange={(e) => handleChineseFontChange(e.target.value)}
        >
          <option value="system">System Default</option>
          <option value="lxgw-wenkai-pro">LXGW WenKai (Pro)</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Review Settings -->
  <section class="settings-section">
    <h2>Review Settings</h2>
    <div class="settings-card">
      <!-- Daily Review Limit -->
      <div class="setting-row">
        <label for="daily-limit">Daily Review Limit</label>
        <input
          type="number"
          id="daily-limit"
          min="1"
          max="100"
          value={dailyReviewLimit}
          onchange={(e) => handleDailyReviewLimitChange(parseInt(e.target.value))}
        />
      </div>

      <!-- New Words Per Session -->
      <div class="setting-row">
        <label for="new-words">New Words Per Session</label>
        <input
          type="number"
          id="new-words"
          min="1"
          max="50"
          value={newWordsPerSession}
          onchange={(e) => handleNewWordsPerSessionChange(parseInt(e.target.value))}
        />
      </div>

      <!-- Show Interval Preview -->
      <div class="setting-row last">
        <label for="interval-preview">Show Interval Preview</label>
        <input
          type="checkbox"
          id="interval-preview"
          checked={showIntervalPreview}
          onchange={(e) => handleShowIntervalPreviewChange(e.target.checked)}
        />
      </div>
    </div>
  </section>

  <!-- Display -->
  <section class="settings-section">
    <h2>Display</h2>
    <div class="settings-card">
      <!-- Theme -->
      <div class="setting-row">
        <label for="theme">Theme</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === 'system'}
              onchange={() => handleThemeChange('system')}
            />
            System
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onchange={() => handleThemeChange('light')}
            />
            Light
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onchange={() => handleThemeChange('dark')}
            />
            Dark
          </label>
        </div>
      </div>

      <!-- Reading Display Mode -->
      <div class="setting-row last">
        <label for="reading-display">Reading Mode</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              name="reading-display"
              value="default"
              checked={readingDisplayMode === 'default'}
              onchange={() => handleReadingDisplayModeChange('default')}
            />
            Default
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="reading-display"
              value="sepia"
              checked={readingDisplayMode === 'sepia'}
              onchange={() => handleReadingDisplayModeChange('sepia')}
            />
            Sepia
          </label>
        </div>
      </div>
    </div>
  </section>

  <!-- Account -->
  <section class="settings-section">
    <h2>Account</h2>
    <div class="settings-card">
      <!-- Display Name -->
      <div class="setting-row">
        <label for="display-name">Display Name</label>
        <input
          type="text"
          id="display-name"
          placeholder="Learner"
          value={displayName}
          onchange={(e) => handleDisplayNameChange(e.target.value)}
        />
      </div>

      <!-- User Level -->
      <div class="setting-row">
        <label for="user-level">Current Level</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              name="user-level"
              value="beginner"
              checked={userLevel === 'beginner'}
              onchange={() => handleUserLevelChange('beginner')}
            />
            Beginner 🌱
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="user-level"
              value="intermediate"
              checked={userLevel === 'intermediate'}
              onchange={() => handleUserLevelChange('intermediate')}
            />
            Intermediate 🌿
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="user-level"
              value="advanced"
              checked={userLevel === 'advanced'}
              onchange={() => handleUserLevelChange('advanced')}
            />
            Advanced 🌳
          </label>
        </div>
      </div>

      <!-- Sign Out -->
      <div class="setting-row">
        <button class="sign-out-btn" onclick={handleSignOut}>Sign Out</button>
      </div>

      <!-- Delete Account -->
      <div class="setting-row last">
        <button class="delete-account-btn" onclick={handleDeleteAccount}>Delete Account</button>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="settings-section">
    <h2>About</h2>
    <div class="settings-card">
      <div class="setting-row">
        <label>Version</label>
        <span class="value">1.0.0</span>
      </div>
      <div class="setting-row last">
        <div class="links-group">
          <a href="/about">About</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .settings-section h2 {
    font-size: 1.1rem;
    font-family: var(--font-display-en);
    margin-bottom: 16px;
    color: var(--text-heading);
  }

  .settings-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--text-body);
    gap: 16px;
  }

  .setting-row.last {
    border-bottom: none;
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .label-group .value {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-left: auto;
  }

  .control-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .control-group input[type='range'] {
    width: 150px;
    accent-color: var(--color-jade);
  }

  .preview {
    font-weight: 500;
    color: var(--text-body);
    margin-top: 4px;
  }

  label {
    color: var(--text-body);
    flex: 1;
  }

  input[type='text'],
  input[type='number'],
  select {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--color-background);
    color: var(--text-body);
    font-size: 0.95rem;
    min-width: 150px;
  }

  input[type='text']:focus,
  input[type='number']:focus,
  select:focus {
    outline: none;
    border-color: var(--color-jade);
    box-shadow: 0 0 0 2px rgba(107, 142, 126, 0.1);
  }

  input[type='checkbox'],
  input[type='radio'] {
    accent-color: var(--color-jade);
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .radio-option input {
    margin: 0;
  }

  .sign-out-btn {
    color: var(--color-error, #dc2626);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 4px;
    transition: opacity 0.2s;
  }

  .sign-out-btn:hover {
    opacity: 0.7;
  }

  .delete-account-btn {
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .delete-account-btn:hover {
    opacity: 0.8;
  }

  .links-group {
    display: flex;
    gap: 24px;
    justify-self: flex-end;
  }

  .links-group a {
    font-size: 0.9rem;
    color: var(--color-jade);
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .links-group a:hover {
    opacity: 0.7;
    text-decoration: underline;
  }

  .value {
    color: var(--text-muted);
    font-size: 0.95rem;
  }
</style>

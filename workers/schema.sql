PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,
  provider_id TEXT,
  chinese_level TEXT DEFAULT 'none',
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS magic_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  display_name TEXT,
  chinese_level TEXT DEFAULT 'none',
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  consumed_at TEXT,
  attempts INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_magic_codes_email ON magic_codes(email, expires_at);

CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  text TEXT NOT NULL,
  pinyin TEXT,
  gloss TEXT,
  note TEXT,
  audio_url TEXT,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TEXT,
  last_review TEXT,
  quality_history TEXT,
  source_article TEXT,
  source_title TEXT,
  saved_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE(user_id, word_id)
);
CREATE INDEX IF NOT EXISTS idx_vocab_user ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_review ON vocabulary(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_vocab_updated ON vocabulary(user_id, updated_at);

CREATE TABLE IF NOT EXISTS review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  quality INTEGER NOT NULL,
  review_time_ms INTEGER,
  reviewed_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_unique ON review_log(user_id, word_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_user ON review_log(user_id, reviewed_at);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_path TEXT NOT NULL,
  words_known INTEGER DEFAULT 0,
  words_total INTEGER DEFAULT 0,
  last_read_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_path)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id, last_read_at);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  stripe_customer_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_billing_events_customer ON billing_events(stripe_customer_id);

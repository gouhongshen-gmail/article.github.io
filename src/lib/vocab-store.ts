/**
 * LoongLore — IndexedDB Vocabulary Store
 * Stores saved words, review cards, and pending sync queue.
 * All data is local-first; syncs to server when online.
 */

const DB_NAME = 'longlore';
const DB_VERSION = 1;

export interface VocabCard {
  id: string; // `${hanzi}_${storyId}`
  hanzi: string;
  pinyin: string;
  gloss: string;
  note?: string;
  storyId: string;
  storyTitle: string;
  sentenceZh: string;
  sentenceEn: string;
  // SM-2 fields
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReview: number; // timestamp ms
  // Metadata
  stage: 'new' | 'learning' | 'mature' | 'mastered';
  createdAt: number;
  updatedAt: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  quality: number; // 1-5
  intervalBefore: number;
  intervalAfter: number;
  easeBefore: number;
  easeAfter: number;
  reviewedAt: number;
}

export interface PendingSync {
  id: string;
  type: 'vocab_add' | 'vocab_update' | 'review_log';
  payload: string; // JSON
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('vocab')) {
        const vocabStore = db.createObjectStore('vocab', { keyPath: 'id' });
        vocabStore.createIndex('stage', 'stage', { unique: false });
        vocabStore.createIndex('nextReview', 'nextReview', { unique: false });
        vocabStore.createIndex('storyId', 'storyId', { unique: false });
        vocabStore.createIndex('hanzi', 'hanzi', { unique: false });
      }

      if (!db.objectStoreNames.contains('reviewLog')) {
        const logStore = db.createObjectStore('reviewLog', { keyPath: 'id' });
        logStore.createIndex('cardId', 'cardId', { unique: false });
        logStore.createIndex('reviewedAt', 'reviewedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------- Vocabulary CRUD ----------

export async function saveWord(word: Omit<VocabCard, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'stage' | 'createdAt' | 'updatedAt'>): Promise<VocabCard> {
  const db = await openDB();
  const now = Date.now();
  const card: VocabCard = {
    ...word,
    id: `${word.hanzi}_${word.storyId}`,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now,
    stage: 'new',
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['vocab', 'pendingSync'], 'readwrite');
    const vocabStore = tx.objectStore('vocab');
    const syncStore = tx.objectStore('pendingSync');

    vocabStore.put(card);
    syncStore.put({
      id: `sync_${now}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'vocab_add',
      payload: JSON.stringify(card),
      createdAt: now,
    });

    tx.oncomplete = () => resolve(card);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWord(id: string): Promise<VocabCard | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const request = tx.objectStore('vocab').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllWords(): Promise<VocabCard[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const request = tx.objectStore('vocab').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getWordsByStory(storyId: string): Promise<VocabCard[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const index = tx.objectStore('vocab').index('storyId');
    const request = index.getAll(storyId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getDueCards(limit = 20): Promise<VocabCard[]> {
  const db = await openDB();
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const index = tx.objectStore('vocab').index('nextReview');
    const range = IDBKeyRange.upperBound(now);
    const request = index.getAll(range, limit);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateCard(card: VocabCard): Promise<void> {
  const db = await openDB();
  card.updatedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['vocab', 'pendingSync'], 'readwrite');
    tx.objectStore('vocab').put(card);
    tx.objectStore('pendingSync').put({
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'vocab_update',
      payload: JSON.stringify(card),
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWordCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const request = tx.objectStore('vocab').count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStats(): Promise<{
  total: number;
  dueToday: number;
  mastered: number;
  byStage: Record<string, number>;
}> {
  const words = await getAllWords();
  const now = Date.now();
  const byStage: Record<string, number> = { new: 0, learning: 0, mature: 0, mastered: 0 };
  let dueToday = 0;

  for (const w of words) {
    byStage[w.stage] = (byStage[w.stage] || 0) + 1;
    if (w.nextReview <= now) dueToday++;
  }

  return {
    total: words.length,
    dueToday,
    mastered: byStage.mastered || 0,
    byStage,
  };
}

// ---------- Review Log ----------

export async function addReviewLog(log: Omit<ReviewLog, 'id'>): Promise<void> {
  const db = await openDB();
  const entry: ReviewLog = {
    ...log,
    id: `review_${log.reviewedAt}_${Math.random().toString(36).slice(2, 8)}`,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['reviewLog', 'pendingSync'], 'readwrite');
    tx.objectStore('reviewLog').put(entry);
    tx.objectStore('pendingSync').put({
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'review_log',
      payload: JSON.stringify(entry),
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Pending Sync ----------

export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSync', 'readonly');
    const request = tx.objectStore('pendingSync').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearSyncItems(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSync', 'readwrite');
    const store = tx.objectStore('pendingSync');
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Utility ----------

export function isWordSaved(hanzi: string, storyId: string): Promise<boolean> {
  return getWord(`${hanzi}_${storyId}`).then((w) => !!w);
}

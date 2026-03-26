/**
 * LoongLore — Notebook Store
 * Higher-level API for managing vocabulary notebooks, notes, and simplified SRS review.
 * Builds on the same IndexedDB database used by vocab-store.
 */

import type { VocabCard } from './vocab-store';

// ── Types ──────────────────────────────────────────────────────────────

export interface NotebookWord extends VocabCard {
  note?: string;
  reviewCount?: number;
}

export interface NotebookEntry {
  storyId: string;
  storyTitle: string;
  words: NotebookWord[];
}

export interface NotebookStats {
  totalWords: number;
  dueForReview: number;
  masteredCount: number;
  storiesWithWords: number;
}

// ── Constants ──────────────────────────────────────────────────────────

const DB_NAME = 'longlore';
const DB_VERSION = 1;

/** Simple SRS schedule: review after 1, 3, 7, 14, 30 days */
const SRS_INTERVALS = [1, 3, 7, 14, 30] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof indexedDB !== 'undefined';
}

function cardId(hanzi: string, storyId: string): string {
  return `${hanzi}_${storyId}`;
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

function getAllCards(): Promise<NotebookWord[]> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const tx = db.transaction('vocab', 'readonly');
      const request = tx.objectStore('vocab').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }, reject);
  });
}

function getCard(id: string): Promise<NotebookWord | undefined> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const tx = db.transaction('vocab', 'readonly');
      const request = tx.objectStore('vocab').get(id);
      request.onsuccess = () => resolve(request.result ?? undefined);
      request.onerror = () => reject(request.error);
    }, reject);
  });
}

function putCard(card: NotebookWord): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
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
    }, reject);
  });
}

/**
 * Compute the next SRS interval based on the review count.
 * Uses a fixed schedule: 1 → 3 → 7 → 14 → 30 days, then stays at 30.
 */
function nextSrsInterval(reviewCount: number): number {
  const idx = Math.min(reviewCount, SRS_INTERVALS.length - 1);
  return SRS_INTERVALS[idx];
}

// ── Word management ────────────────────────────────────────────────────

/**
 * Returns all saved words organised by story.
 * Each entry contains the story metadata and an array of words with notes.
 */
export async function getNotebook(): Promise<NotebookEntry[]> {
  if (!isBrowser()) return [];

  const cards = await getAllCards();
  const byStory = new Map<string, NotebookEntry>();

  for (const card of cards) {
    let entry = byStory.get(card.storyId);
    if (!entry) {
      entry = { storyId: card.storyId, storyTitle: card.storyTitle, words: [] };
      byStory.set(card.storyId, entry);
    }
    entry.words.push(card);
  }

  return Array.from(byStory.values());
}

/**
 * Update the user-written note for a saved word.
 * Creates the `note` field if it doesn't exist yet (backward compatible).
 */
export async function updateWordNote(
  hanzi: string,
  storyId: string,
  note: string,
): Promise<void> {
  if (!isBrowser()) return;

  const id = cardId(hanzi, storyId);
  const card = await getCard(id);
  if (!card) return;

  card.note = note;
  card.updatedAt = Date.now();
  await putCard(card);
}

/**
 * Remove a word from the notebook entirely.
 */
export async function deleteWord(hanzi: string, storyId: string): Promise<void> {
  if (!isBrowser()) return;

  const id = cardId(hanzi, storyId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['vocab', 'pendingSync'], 'readwrite');
    tx.objectStore('vocab').delete(id);
    tx.objectStore('pendingSync').put({
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'vocab_update',
      payload: JSON.stringify({ id, deleted: true }),
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all saved words for a specific story.
 */
export async function getWordsByStory(storyId: string): Promise<NotebookWord[]> {
  if (!isBrowser()) return [];

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const index = tx.objectStore('vocab').index('storyId');
    const request = index.getAll(storyId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── SRS review tracking ────────────────────────────────────────────────

/**
 * Returns words that are due for review (nextReview ≤ now).
 * Uses the existing `nextReview` timestamp from vocab-store records.
 */
export async function getReviewDue(): Promise<NotebookWord[]> {
  if (!isBrowser()) return [];

  const now = Date.now();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const index = tx.objectStore('vocab').index('nextReview');
    const range = IDBKeyRange.upperBound(now);
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a word as reviewed using a simplified SRS schedule.
 *
 * - If **correct**: advance to the next interval (1 → 3 → 7 → 14 → 30 days).
 * - If **incorrect**: reset the interval back to 1 day.
 *
 * Updates `nextReview`, `interval`, `reviewCount`, and `stage` on the record.
 */
export async function markReviewed(
  hanzi: string,
  storyId: string,
  correct: boolean,
): Promise<void> {
  if (!isBrowser()) return;

  const id = cardId(hanzi, storyId);
  const card = await getCard(id);
  if (!card) return;

  const now = Date.now();
  const currentReviewCount = card.reviewCount ?? card.repetitions ?? 0;

  if (correct) {
    const newCount = currentReviewCount + 1;
    const days = nextSrsInterval(newCount - 1);
    card.reviewCount = newCount;
    card.interval = days;
    card.nextReview = now + days * DAY_MS;
    card.repetitions = newCount;

    if (newCount >= SRS_INTERVALS.length) {
      card.stage = 'mastered';
    } else if (newCount >= 3) {
      card.stage = 'mature';
    } else {
      card.stage = 'learning';
    }
  } else {
    card.reviewCount = 0;
    card.interval = SRS_INTERVALS[0];
    card.nextReview = now + SRS_INTERVALS[0] * DAY_MS;
    card.repetitions = 0;
    card.stage = 'learning';
  }

  card.updatedAt = now;
  await putCard(card);
}

// ── Stats ──────────────────────────────────────────────────────────────

/**
 * Returns aggregated notebook statistics.
 */
export async function getNotebookStats(): Promise<NotebookStats> {
  if (!isBrowser()) {
    return { totalWords: 0, dueForReview: 0, masteredCount: 0, storiesWithWords: 0 };
  }

  const cards = await getAllCards();
  const now = Date.now();
  const storyIds = new Set<string>();
  let dueForReview = 0;
  let masteredCount = 0;

  for (const card of cards) {
    storyIds.add(card.storyId);
    if (card.nextReview <= now) dueForReview++;
    if (card.stage === 'mastered') masteredCount++;
  }

  return {
    totalWords: cards.length,
    dueForReview,
    masteredCount,
    storiesWithWords: storyIds.size,
  };
}

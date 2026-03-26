import { isLoggedIn, syncVocabulary } from './api';
import {
  clearSyncItems,
  getAllWords,
  getPendingSync,
  getWord,
  updateCard,
  type VocabCard,
} from './vocab-store';

const LAST_SYNC_KEY = 'longlore_last_sync_at';
let syncInFlight: Promise<{ pushed: number; pulled: number }> | null = null;

function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function stageFromRepetitions(repetitions: number): VocabCard['stage'] {
  if (repetitions >= 5) return 'mastered';
  if (repetitions >= 3) return 'mature';
  if (repetitions >= 1) return 'learning';
  return 'new';
}

function toIso(timestamp?: number | null) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toServerWord(word: VocabCard) {
  return {
    id: word.id,
    wordId: word.id,
    text: word.hanzi,
    pinyin: word.pinyin,
    gloss: word.gloss,
    note: word.note || '',
    easeFactor: word.easeFactor,
    interval: word.interval,
    repetitions: word.repetitions,
    nextReview: toIso(word.nextReview),
    lastReview: word.nextReview ? toIso(word.nextReview - word.interval * 24 * 60 * 60 * 1000) : null,
    savedAt: toIso(word.createdAt),
    updatedAt: toIso(word.updatedAt),
    sourceArticle: word.storyId,
    sourceTitle: word.storyTitle,
    qualityHistory: [],
    audioUrl: '',
  };
}

async function mergeServerWord(serverWord: any) {
  const existing = await getWord(serverWord.id);
  const nextReview = serverWord.nextReview ? Date.parse(serverWord.nextReview) : Date.now();
  const updatedAt = serverWord.updatedAt ? Date.parse(serverWord.updatedAt) : Date.now();
  const createdAt = serverWord.savedAt ? Date.parse(serverWord.savedAt) : updatedAt;

  const merged: VocabCard = {
    id: serverWord.id,
    hanzi: serverWord.text || existing?.hanzi || '',
    pinyin: serverWord.pinyin || existing?.pinyin || '',
    gloss: serverWord.gloss || existing?.gloss || '',
    note: serverWord.note || existing?.note || '',
    storyId: serverWord.sourceArticle || existing?.storyId || 'unknown',
    storyTitle: serverWord.sourceTitle || existing?.storyTitle || '',
    sentenceZh: existing?.sentenceZh || '',
    sentenceEn: existing?.sentenceEn || '',
    easeFactor: Number(serverWord.easeFactor ?? existing?.easeFactor ?? 2.5),
    interval: Number(serverWord.interval ?? existing?.interval ?? 0),
    repetitions: Number(serverWord.repetitions ?? existing?.repetitions ?? 0),
    nextReview,
    stage: stageFromRepetitions(Number(serverWord.repetitions ?? existing?.repetitions ?? 0)),
    createdAt,
    updatedAt,
  };

  await updateCard(merged);
}

export async function syncNotebook(force = false): Promise<{ pushed: number; pulled: number }> {
  if (!isBrowser()) return { pushed: 0, pulled: 0 };
  if (!isLoggedIn()) return { pushed: 0, pulled: 0 };
  if (!navigator.onLine && !force) return { pushed: 0, pulled: 0 };
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const [words, pendingItems] = await Promise.all([getAllWords(), getPendingSync()]);
    const since = localStorage.getItem(LAST_SYNC_KEY) || new Date(0).toISOString();
    const response = await syncVocabulary(words.map(toServerWord), [], [], since);
    const pulledWords = response.serverUpdates?.vocabulary || [];

    for (const word of pulledWords) {
      await mergeServerWord(word);
    }

    if (pendingItems.length > 0) {
      await clearSyncItems(pendingItems.map((item) => item.id));
    }

    if (response.serverUpdates?.serverTime) {
      localStorage.setItem(LAST_SYNC_KEY, response.serverUpdates.serverTime);
    }

    return { pushed: words.length, pulled: pulledWords.length };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

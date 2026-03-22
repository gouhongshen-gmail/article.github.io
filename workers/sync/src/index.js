import { randomId } from '../../shared/crypto.js';
import { errorResponse, handleOptions, jsonResponse, readJson } from '../../shared/http.js';
import { readAuth } from '../../shared/session.js';

function nowIso() {
  return new Date().toISOString();
}

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

function normalizeTimestamp(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? fallback : time.toISOString();
}

function normalizeSince(value) {
  return normalizeTimestamp(value, '1970-01-01T00:00:00.000Z');
}

function normalizeWord(word) {
  const canonicalWordId = String(word.wordId || word.id || '').trim();
  if (!canonicalWordId) {
    throw new Error('Each vocabulary entry must include a wordId or id.');
  }

  return {
    audioUrl     : word.audioUrl ? String(word.audioUrl) : '',
    cloudId      : word.cloudId ? String(word.cloudId) : '',
    deletedAt    : normalizeTimestamp(word.deletedAt),
    easeFactor   : Number.isFinite(Number(word.easeFactor)) ? Number(word.easeFactor) : 2.5,
    gloss        : word.gloss ? String(word.gloss) : '',
    id           : canonicalWordId,
    interval     : Number.isFinite(Number(word.interval)) ? Number(word.interval) : 0,
    lastReview   : normalizeTimestamp(word.lastReview),
    nextReview   : word.nextReview ? String(word.nextReview) : null,
    note         : word.note ? String(word.note) : '',
    pinyin       : word.pinyin ? String(word.pinyin) : '',
    qualityHistory: Array.isArray(word.qualityHistory) ? word.qualityHistory : [],
    repetitions  : Number.isFinite(Number(word.repetitions)) ? Number(word.repetitions) : 0,
    savedAt      : normalizeTimestamp(word.savedAt, nowIso()),
    sourceArticle: word.sourceArticle ? String(word.sourceArticle) : '',
    sourceTitle  : word.sourceTitle ? String(word.sourceTitle) : '',
    text         : word.text ? String(word.text) : '',
    updatedAt    : normalizeTimestamp(word.updatedAt, nowIso())
  };
}

function serializeWord(row) {
  return {
    audioUrl      : row.audio_url || '',
    cloudId       : row.id,
    deletedAt     : row.deleted_at || null,
    easeFactor    : row.ease_factor,
    gloss         : row.gloss || '',
    id            : row.word_id,
    interval      : row.interval_days,
    lastReview    : row.last_review || null,
    nextReview    : row.next_review || null,
    note          : row.note || '',
    pinyin        : row.pinyin || '',
    qualityHistory: safeJsonParse(row.quality_history, []),
    repetitions   : row.repetitions,
    savedAt       : row.saved_at || row.updated_at,
    sourceArticle : row.source_article || '',
    sourceTitle   : row.source_title || '',
    text          : row.text,
    updatedAt     : row.updated_at
  };
}

function normalizeReviewEntry(entry) {
  const reviewedAt = normalizeTimestamp(entry.reviewedAt || entry.timestamp, nowIso());
  const wordId = String(entry.wordId || entry.id || '').trim();

  if (!wordId) {
    throw new Error('Each review log entry must include wordId.');
  }

  return {
    quality    : Number(entry.quality),
    responseTime: Number.isFinite(Number(entry.responseTime)) ? Number(entry.responseTime) : null,
    reviewedAt,
    wordId
  };
}

function serializeReviewEntry(row) {
  return {
    quality    : row.quality,
    responseTime: row.review_time_ms,
    reviewedAt : row.reviewed_at,
    wordId     : row.word_id
  };
}

function normalizeProgressEntry(entry) {
  const articlePath = String(entry.articlePath || entry.path || '').trim();
  if (!articlePath) {
    throw new Error('Each progress entry must include articlePath.');
  }

  return {
    articlePath: articlePath,
    lastReadAt : normalizeTimestamp(entry.lastReadAt, nowIso()),
    wordsKnown : Number.isFinite(Number(entry.wordsKnown)) ? Number(entry.wordsKnown) : 0,
    wordsTotal : Number.isFinite(Number(entry.wordsTotal)) ? Number(entry.wordsTotal) : 0
  };
}

function serializeProgressEntry(row) {
  return {
    articlePath: row.article_path,
    lastReadAt : row.last_read_at,
    wordsKnown : row.words_known,
    wordsTotal : row.words_total
  };
}

async function mergeVocabulary(db, userId, clientWords) {
  for (const rawWord of clientWords) {
    const word = normalizeWord(rawWord);
    const serverWord = await db.prepare(`
      SELECT *
      FROM vocabulary
      WHERE user_id = ? AND word_id = ?
    `).bind(userId, word.id).first();

    if (!serverWord) {
      await db.prepare(`
        INSERT INTO vocabulary (
          id, user_id, word_id, text, pinyin, gloss, note, audio_url,
          ease_factor, interval_days, repetitions, next_review, last_review,
          quality_history, source_article, source_title, saved_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        word.cloudId || randomId('vocab'),
        userId,
        word.id,
        word.text,
        word.pinyin,
        word.gloss,
        word.note,
        word.audioUrl,
        word.easeFactor,
        word.interval,
        word.repetitions,
        word.nextReview,
        word.lastReview,
        JSON.stringify(word.qualityHistory || []),
        word.sourceArticle,
        word.sourceTitle,
        word.savedAt,
        word.updatedAt,
        word.deletedAt
      ).run();
      continue;
    }

    const clientUpdatedAt = new Date(word.updatedAt).getTime();
    const serverUpdatedAt = new Date(serverWord.updated_at).getTime();
    if (clientUpdatedAt <= serverUpdatedAt) {
      continue;
    }

    await db.prepare(`
      UPDATE vocabulary
      SET text = ?,
          pinyin = ?,
          gloss = ?,
          note = ?,
          audio_url = ?,
          ease_factor = ?,
          interval_days = ?,
          repetitions = ?,
          next_review = ?,
          last_review = ?,
          quality_history = ?,
          source_article = ?,
          source_title = ?,
          saved_at = ?,
          updated_at = ?,
          deleted_at = ?
      WHERE user_id = ? AND word_id = ?
    `).bind(
      word.text,
      word.pinyin,
      word.gloss,
      word.note,
      word.audioUrl,
      word.easeFactor,
      word.interval,
      word.repetitions,
      word.nextReview,
      word.lastReview,
      JSON.stringify(word.qualityHistory || []),
      word.sourceArticle,
      word.sourceTitle,
      word.savedAt,
      word.updatedAt,
      word.deletedAt,
      userId,
      word.id
    ).run();
  }
}

async function mergeReviewLog(db, userId, clientReviews) {
  for (const rawReview of clientReviews) {
    const review = normalizeReviewEntry(rawReview);
    await db.prepare(`
      INSERT OR IGNORE INTO review_log (
        user_id, word_id, quality, review_time_ms, reviewed_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      review.wordId,
      review.quality,
      review.responseTime,
      review.reviewedAt
    ).run();
  }
}

async function mergeProgress(db, userId, progressEntries) {
  for (const rawEntry of progressEntries) {
    const entry = normalizeProgressEntry(rawEntry);
    const existing = await db.prepare(`
      SELECT *
      FROM user_progress
      WHERE user_id = ? AND article_path = ?
    `).bind(userId, entry.articlePath).first();

    if (!existing) {
      await db.prepare(`
        INSERT INTO user_progress (
          user_id, article_path, words_known, words_total, last_read_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        userId,
        entry.articlePath,
        entry.wordsKnown,
        entry.wordsTotal,
        entry.lastReadAt
      ).run();
      continue;
    }

    if (new Date(entry.lastReadAt).getTime() <= new Date(existing.last_read_at).getTime()) {
      continue;
    }

    await db.prepare(`
      UPDATE user_progress
      SET words_known = ?, words_total = ?, last_read_at = ?
      WHERE user_id = ? AND article_path = ?
    `).bind(
      entry.wordsKnown,
      entry.wordsTotal,
      entry.lastReadAt,
      userId,
      entry.articlePath
    ).run();
  }
}

async function collectServerUpdates(db, userId, since) {
  const vocabularyResult = await db.prepare(`
    SELECT *
    FROM vocabulary
    WHERE user_id = ? AND updated_at > ?
    ORDER BY updated_at ASC
  `).bind(userId, since).all();
  const reviewResult = await db.prepare(`
    SELECT *
    FROM review_log
    WHERE user_id = ? AND reviewed_at > ?
    ORDER BY reviewed_at ASC
  `).bind(userId, since).all();
  const progressResult = await db.prepare(`
    SELECT *
    FROM user_progress
    WHERE user_id = ? AND last_read_at > ?
    ORDER BY last_read_at ASC
  `).bind(userId, since).all();

  return {
    progress  : (progressResult.results || []).map(serializeProgressEntry),
    reviewLog : (reviewResult.results || []).map(serializeReviewEntry),
    serverTime: nowIso(),
    vocabulary: (vocabularyResult.results || []).map(serializeWord)
  };
}

async function pushSync(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const since = normalizeSince(body.since);

    await mergeVocabulary(env.DB, auth.user.id, Array.isArray(body.vocabulary) ? body.vocabulary : []);
    await mergeReviewLog(env.DB, auth.user.id, Array.isArray(body.reviewLog) ? body.reviewLog : []);
    await mergeProgress(env.DB, auth.user.id, Array.isArray(body.progress) ? body.progress : []);

    const serverUpdates = await collectServerUpdates(env.DB, auth.user.id, since);
    return jsonResponse({ serverUpdates }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Sync push failed.', 401, request, env);
  }
}

async function pullSync(request, env) {
  try {
    const auth = await readAuth(request, env);
    const since = normalizeSince(new URL(request.url).searchParams.get('since'));
    const serverUpdates = await collectServerUpdates(env.DB, auth.user.id, since);
    return jsonResponse({ serverUpdates }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Sync pull failed.', 401, request, env);
  }
}

async function getAccessState(request, env) {
  try {
    const auth = await readAuth(request, env);
    const url = new URL(request.url);
    const articlePath = String(url.searchParams.get('articlePath') || '').trim();
    const limit = Number(env.FREE_ARTICLE_LIMIT || 3);

    if (!articlePath) {
      return errorResponse('articlePath is required.', 400, request, env);
    }

    const countRow = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM user_progress
      WHERE user_id = ?
    `).bind(auth.user.id).first();
    const existing = await env.DB.prepare(`
      SELECT article_path
      FROM user_progress
      WHERE user_id = ? AND article_path = ?
    `).bind(auth.user.id, articlePath).first();

    const readCount = Number(countRow.count || 0);
    const alreadyRead = Boolean(existing);
    const tier = auth.user.tier || 'free';
    const accessAllowed = tier === 'pro' || alreadyRead || readCount < limit;

    return jsonResponse({
      accessAllowed,
      alreadyRead,
      limit,
      readCount,
      tier
    }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Access lookup failed.', 401, request, env);
  }
}

async function recordArticleView(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const progress = normalizeProgressEntry({
      articlePath: body.articlePath,
      lastReadAt : body.lastReadAt || nowIso(),
      wordsKnown : body.wordsKnown,
      wordsTotal : body.wordsTotal
    });

    await mergeProgress(env.DB, auth.user.id, [progress]);
    return jsonResponse({ success: true }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Article progress update failed.', 401, request, env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method === 'GET' && path === '/health') {
      return jsonResponse({ ok: true, service: 'sync' }, { status: 200 }, request, env);
    }

    if (request.method === 'POST' && path === '/api/sync/push') {
      return pushSync(request, env);
    }

    if (request.method === 'GET' && path === '/api/sync/pull') {
      return pullSync(request, env);
    }

    if (request.method === 'GET' && path === '/api/sync/access') {
      return getAccessState(request, env);
    }

    if (request.method === 'POST' && path === '/api/sync/article-view') {
      return recordArticleView(request, env);
    }

    return errorResponse('Route not found.', 404, request, env);
  }
};

import { randomId } from './crypto.js';

function safeString(value) {
  return value ? String(value).trim() : '';
}

export function normalizeEmail(email) {
  return safeString(email).toLowerCase();
}

export function serializeUser(user) {
  return {
    authProvider: user.auth_provider,
    avatarUrl   : user.avatar_url || '',
    chineseLevel: user.chinese_level || 'none',
    displayName : user.display_name || '',
    email       : user.email,
    id          : user.id,
    lastLoginAt : user.last_login_at || null,
    tier        : user.tier || 'free'
  };
}

export async function getUserById(db, userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(String(userId)).first();
}

export async function getUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(normalizeEmail(email)).first();
}

export async function getUserByProvider(db, provider, providerId) {
  if (!provider || !providerId) {
    return null;
  }

  return db.prepare('SELECT * FROM users WHERE auth_provider = ? AND provider_id = ?')
    .bind(String(provider), String(providerId))
    .first();
}

export async function upsertUser(db, input) {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error('A valid email address is required.');
  }

  const provider = safeString(input.authProvider || 'magic_link');
  const providerId = safeString(input.providerId);
  const now = new Date().toISOString();
  const displayName = safeString(input.displayName) || email.split('@')[0];
  const avatarUrl = safeString(input.avatarUrl);
  const chineseLevel = safeString(input.chineseLevel || 'none') || 'none';

  const existing = await getUserByProvider(db, provider, providerId) || await getUserByEmail(db, email);

  if (existing) {
    await db.prepare(`
      UPDATE users
      SET email = ?,
          display_name = ?,
          avatar_url = ?,
          auth_provider = ?,
          provider_id = ?,
          chinese_level = ?,
          updated_at = ?,
          last_login_at = ?
      WHERE id = ?
    `).bind(
      email,
      displayName || existing.display_name,
      avatarUrl || existing.avatar_url,
      provider || existing.auth_provider,
      providerId || existing.provider_id,
      chineseLevel || existing.chinese_level || 'none',
      now,
      now,
      existing.id
    ).run();

    return getUserById(db, existing.id);
  }

  const userId = input.id ? String(input.id) : randomId('user');
  await db.prepare(`
    INSERT INTO users (
      id, email, display_name, avatar_url, auth_provider, provider_id,
      chinese_level, tier, created_at, updated_at, last_login_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    email,
    displayName,
    avatarUrl,
    provider,
    providerId || null,
    chineseLevel,
    'free',
    now,
    now,
    now
  ).run();

  return getUserById(db, userId);
}

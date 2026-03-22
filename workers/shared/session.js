import { randomId } from './crypto.js';
import { parseBearerToken, secondsFromNow, signJWT, unixTimeNow, verifyJWT } from './jwt.js';
import { getUserById, serializeUser } from './users.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function createSession(db, userId) {
  const sessionId = randomId('sess');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(sessionId, String(userId), expiresAt).run();

  return {
    expiresAt,
    sessionId
  };
}

export async function issueSession(env, user) {
  const session = await createSession(env.DB, user.id);
  const token = await signJWT({
    chineseLevel: user.chinese_level || 'none',
    email       : user.email,
    exp         : secondsFromNow(SESSION_TTL_SECONDS),
    iat         : unixTimeNow(),
    iss         : env.JWT_ISSUER || 'chronosina',
    sid         : session.sessionId,
    sub         : user.id,
    tier        : user.tier || 'free'
  }, env.JWT_SECRET);

  return {
    expiresAt: session.expiresAt,
    token,
    user     : serializeUser(user)
  };
}

export async function readAuth(request, env) {
  const token = parseBearerToken(request);
  if (!token) {
    return null;
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload.sid || !payload.sub) {
    throw new Error('JWT session payload is incomplete.');
  }

  const session = await env.DB.prepare(`
    SELECT * FROM sessions
    WHERE id = ? AND user_id = ? AND expires_at > ?
  `).bind(payload.sid, payload.sub, new Date().toISOString()).first();

  if (!session) {
    throw new Error('Session has expired.');
  }

  const user = await getUserById(env.DB, payload.sub);
  if (!user) {
    throw new Error('User no longer exists.');
  }

  return {
    payload,
    session,
    token,
    user
  };
}

export async function deleteSession(db, sessionId) {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(String(sessionId)).run();
}

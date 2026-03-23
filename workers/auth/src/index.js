import { createCodeChallenge, createCodeVerifier, createMagicCode, randomId, sha256Hex } from '../../shared/crypto.js';
import { sendMagicCodeEmail } from '../../shared/email.js';
import { errorResponse, handleOptions, jsonResponse, readJson } from '../../shared/http.js';
import { secondsFromNow, signJWT, verifyJWT } from '../../shared/jwt.js';
import { deleteSession, issueSession, readAuth } from '../../shared/session.js';
import { normalizeEmail, serializeUser, upsertUser } from '../../shared/users.js';

const MAGIC_CODE_TTL_MINUTES = 15;
const OAUTH_STATE_TTL_SECONDS = 15 * 60;
const textEncoder = new TextEncoder();

function getOrigin(request) {
  return new URL(request.url).origin;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeRedirectPath(pathname) {
  const value = String(pathname || '/').trim();
  return value.startsWith('/') ? value : '/';
}

function getFrontendUrl(env, redirectPath) {
  return new URL(normalizeRedirectPath(redirectPath), env.FRONTEND_URL);
}

function encodeHashValue(value) {
  const json = textEncoder.encode(JSON.stringify(value));
  let binary = '';

  for (let index = 0; index < json.length; index += 0x8000) {
    binary += String.fromCharCode(...json.subarray(index, index + 0x8000));
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function redirectWithHash(env, redirectPath, hashParams) {
  const url = getFrontendUrl(env, redirectPath);
  const hash = new URLSearchParams();

  Object.entries(hashParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      hash.set(key, String(value));
    }
  });

  url.hash = hash.toString();
  return Response.redirect(url.toString(), 302);
}

async function createState(env, payload) {
  return signJWT({
    ...payload,
    exp: secondsFromNow(OAUTH_STATE_TTL_SECONDS),
    iat: Math.floor(Date.now() / 1000),
    iss: env.JWT_ISSUER || 'chronosina'
  }, env.JWT_SECRET);
}

async function parseState(env, stateToken) {
  return verifyJWT(stateToken, env.JWT_SECRET);
}

function assertConfigured(env, keys) {
  keys.forEach((key) => {
    if (!env[key]) {
      throw new Error(`${key} is not configured.`);
    }
  });
}

async function exchangeGoogleCode(request, env, code) {
  assertConfigured(env, ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);

  const redirectUri = `${getOrigin(request)}/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id    : env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type   : 'authorization_code',
      redirect_uri : redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  if (!userResponse.ok) {
    throw new Error(`Google user fetch failed: ${await userResponse.text()}`);
  }

  const profile = await userResponse.json();
  return {
    avatarUrl   : profile.picture || '',
    displayName : profile.name || profile.email,
    email       : profile.email,
    providerId  : profile.id,
    authProvider: 'google'
  };
}

async function exchangeXCode(request, env, code, codeVerifier) {
  assertConfigured(env, ['X_CLIENT_ID', 'X_CLIENT_SECRET']);

  const redirectUri = `${getOrigin(request)}/auth/x/callback`;
  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id    : env.X_CLIENT_ID,
      client_secret: env.X_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      grant_type   : 'authorization_code',
      redirect_uri : redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`X token exchange failed: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,name,username', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  if (!profileResponse.ok) {
    throw new Error(`X profile fetch failed: ${await profileResponse.text()}`);
  }

  const profileData = await profileResponse.json();
  const user = profileData.data || {};
  const email = tokenData.email || '';

  if (!email) {
    throw new Error('X OAuth did not return an email. Enable email scope in the X app settings.');
  }

  return {
    avatarUrl   : user.profile_image_url || '',
    displayName : user.name || user.username || email,
    email,
    providerId  : user.id,
    authProvider: 'x'
  };
}

async function startGoogleAuth(request, env) {
  assertConfigured(env, ['GOOGLE_CLIENT_ID']);
  const body = await readJson(request);
  const redirectPath = normalizeRedirectPath(body.redirectPath);
  const state = await createState(env, {
    chineseLevel: String(body.chineseLevel || 'none'),
    provider    : 'google',
    redirectPath: redirectPath
  });
  const redirectUri = `${getOrigin(request)}/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    access_type  : 'online',
    client_id    : env.GOOGLE_CLIENT_ID,
    prompt       : 'consent',
    redirect_uri : redirectUri,
    response_type: 'code',
    scope        : 'email profile',
    state
  }).toString();

  return jsonResponse({ url: url.toString() }, { status: 200 }, request, env);
}

async function startXAuth(request, env) {
  assertConfigured(env, ['X_CLIENT_ID']);
  const body = await readJson(request);
  const redirectPath = normalizeRedirectPath(body.redirectPath);
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = await createState(env, {
    chineseLevel: String(body.chineseLevel || 'none'),
    codeVerifier,
    provider    : 'x',
    redirectPath: redirectPath
  });
  const redirectUri = `${getOrigin(request)}/auth/x/callback`;
  const url = new URL('https://twitter.com/i/oauth2/authorize');
  url.search = new URLSearchParams({
    client_id            : env.X_CLIENT_ID,
    code_challenge       : codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri         : redirectUri,
    response_type        : 'code',
    scope                : 'tweet.read users.read offline.access',
    state
  }).toString();

  return jsonResponse({ url: url.toString() }, { status: 200 }, request, env);
}

async function finishOAuth(env, request, provider, exchange) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateToken = url.searchParams.get('state');
  const fallbackPath = '/';

  try {
    if (!code || !stateToken) {
      throw new Error('Missing OAuth callback parameters.');
    }

    const state = await parseState(env, stateToken);
    if (state.provider !== provider) {
      throw new Error('OAuth provider mismatch.');
    }

    const profile = await exchange(code, state);
    const user = await upsertUser(env.DB, {
      authProvider: profile.authProvider,
      avatarUrl   : profile.avatarUrl,
      chineseLevel: state.chineseLevel || 'none',
      displayName : profile.displayName,
      email       : profile.email,
      providerId  : profile.providerId
    });
    const session = await issueSession(env, user);

    return redirectWithHash(env, state.redirectPath || fallbackPath, {
      chronosina_token: session.token,
      chronosina_user : encodeHashValue(session.user)
    });
  } catch (error) {
    return redirectWithHash(env, fallbackPath, {
      chronosina_error: error.message || 'OAuth login failed.'
    });
  }
}

async function sendMagicLink(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse('Enter a valid email address.', 400, request, env);
  }

  const code = createMagicCode();
  const codeHash = await sha256Hex(`${email}:${code}:${env.JWT_SECRET}`);
  const expiresAt = new Date(Date.now() + MAGIC_CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const chineseLevel = String(body.chineseLevel || 'none');
  const displayName = body.displayName ? String(body.displayName).trim() : '';

  await env.DB.prepare(`
    UPDATE magic_codes
    SET consumed_at = ?
    WHERE email = ? AND consumed_at IS NULL
  `).bind(nowIso(), email).run();

  await env.DB.prepare(`
    INSERT INTO magic_codes (id, email, code_hash, display_name, chinese_level, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(randomId('magic'), email, codeHash, displayName, chineseLevel, expiresAt).run();

  await sendMagicCodeEmail(env, { code, email });

  return jsonResponse({
    expiresAt,
    success: true
  }, { status: 200 }, request, env);
}

async function verifyMagicLink(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();

  if (!email || !code) {
    return errorResponse('Email and code are required.', 400, request, env);
  }

  const codeHash = await sha256Hex(`${email}:${code}:${env.JWT_SECRET}`);
  const record = await env.DB.prepare(`
    SELECT *
    FROM magic_codes
    WHERE email = ?
      AND code_hash = ?
      AND consumed_at IS NULL
      AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(email, codeHash, nowIso()).first();

  if (!record) {
    return errorResponse('The verification code is invalid or expired.', 400, request, env);
  }

  await env.DB.prepare(`
    UPDATE magic_codes
    SET consumed_at = ?, attempts = attempts + 1
    WHERE id = ?
  `).bind(nowIso(), record.id).run();

  const user = await upsertUser(env.DB, {
    authProvider: 'magic_link',
    chineseLevel: body.chineseLevel || record.chinese_level || 'none',
    displayName : body.displayName || record.display_name || '',
    email
  });
  const session = await issueSession(env, user);

  return jsonResponse({
    success: true,
    ...session
  }, { status: 200 }, request, env);
}

async function logout(request, env) {
  try {
    const auth = await readAuth(request, env);
    if (auth && auth.session) {
      await deleteSession(env.DB, auth.session.id);
    }
  } catch (error) {
    return jsonResponse({ success: true }, { status: 200 }, request, env);
  }

  return jsonResponse({ success: true }, { status: 200 }, request, env);
}

async function authMe(request, env) {
  try {
    const auth = await readAuth(request, env);
    return jsonResponse({
      user: serializeUser(auth.user)
    }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Unauthorized.', 401, request, env);
  }
}

async function updateProfile(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const displayName = body.displayName ? String(body.displayName).trim() : auth.user.display_name;
    const avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : auth.user.avatar_url;

    await env.DB.prepare(`
      UPDATE users
      SET display_name = ?, avatar_url = ?, updated_at = ?
      WHERE id = ?
    `).bind(displayName, avatarUrl, nowIso(), auth.user.id).run();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(auth.user.id).first();
    return jsonResponse({ user: serializeUser(user) }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Unauthorized.', 401, request, env);
  }
}

async function updateLevel(request, env) {
  try {
    const auth = await readAuth(request, env);
    const body = await readJson(request);
    const chineseLevel = String(body.chineseLevel || '').trim();

    if (!chineseLevel) {
      return errorResponse('chineseLevel is required.', 400, request, env);
    }

    await env.DB.prepare(`
      UPDATE users
      SET chinese_level = ?, updated_at = ?
      WHERE id = ?
    `).bind(chineseLevel, nowIso(), auth.user.id).run();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(auth.user.id).first();
    return jsonResponse({ user: serializeUser(user) }, { status: 200 }, request, env);
  } catch (error) {
    return errorResponse(error.message || 'Unauthorized.', 401, request, env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'OPTIONS') {
        return handleOptions(request, env);
      }

      if (request.method === 'GET' && path === '/health') {
        return jsonResponse({ ok: true, service: 'auth' }, { status: 200 }, request, env);
      }

      if (request.method === 'POST' && path === '/auth/google') {
        return startGoogleAuth(request, env);
      }

      if (request.method === 'GET' && path === '/auth/google/callback') {
        return finishOAuth(env, request, 'google', (code) => exchangeGoogleCode(request, env, code));
      }

      if (request.method === 'POST' && path === '/auth/x') {
        return startXAuth(request, env);
      }

      if (request.method === 'GET' && path === '/auth/x/callback') {
        return finishOAuth(env, request, 'x', (code, state) => exchangeXCode(request, env, code, state.codeVerifier));
      }

      if (request.method === 'POST' && path === '/auth/magic-link/send') {
        return sendMagicLink(request, env);
      }

      if (request.method === 'POST' && path === '/auth/magic-link/verify') {
        return verifyMagicLink(request, env);
      }

      if (request.method === 'POST' && path === '/auth/logout') {
        return logout(request, env);
      }

      if (request.method === 'GET' && path === '/auth/me') {
        return authMe(request, env);
      }

      if (request.method === 'GET' && path === '/api/user/profile') {
        return authMe(request, env);
      }

      if (request.method === 'PUT' && path === '/api/user/profile') {
        return updateProfile(request, env);
      }

      if (request.method === 'PUT' && path === '/api/user/level') {
        return updateLevel(request, env);
      }

      return errorResponse('Route not found.', 404, request, env);
    } catch (error) {
      return errorResponse(error.message || 'Auth worker failed.', 500, request, env);
    }
  }
};

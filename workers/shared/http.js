const ALLOW_HEADERS = 'Content-Type, Authorization';
const ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

export function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const configuredOrigins = [
    env.FRONTEND_URL,
    env.FRONTEND_PREVIEW_URL
  ].filter(Boolean);

  if (!origin) {
    return configuredOrigins[0] || '*';
  }

  return configuredOrigins.includes(origin)
    ? origin
    : (configuredOrigins[0] || origin);
}

export function applyCors(headers, request, env) {
  headers.set('Access-Control-Allow-Origin', getAllowedOrigin(request, env));
  headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
  headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
  headers.set('Access-Control-Allow-Credentials', 'false');
  headers.set('Vary', 'Origin');
  return headers;
}

export function jsonResponse(data, init = {}, request, env) {
  const headers = applyCors(new Headers(init.headers || {}), request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function textResponse(value, init = {}, request, env) {
  const headers = applyCors(new Headers(init.headers || {}), request, env);
  headers.set('Content-Type', 'text/plain; charset=utf-8');

  return new Response(String(value), {
    ...init,
    headers
  });
}

export function errorResponse(message, status, request, env, extra = {}) {
  return jsonResponse({
    error: message,
    ...extra
  }, { status }, request, env);
}

export function handleOptions(request, env) {
  return new Response(null, {
    status : 204,
    headers: applyCors(new Headers(), request, env)
  });
}

export async function readJson(request) {
  const raw = await request.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Invalid JSON body.');
  }
}

export function getRequestPath(request) {
  return new URL(request.url).pathname;
}

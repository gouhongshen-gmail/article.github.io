import { errorResponse, handleOptions, jsonResponse } from '../../shared/http.js';

function sanitizeObjectKey(value) {
  const key = decodeURIComponent(String(value || '')).replace(/^\/+/, '');
  if (!key || key.includes('..')) {
    throw new Error('Invalid audio key.');
  }
  return key;
}

function applyObjectHeaders(object, headers) {
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag || object.etag);

  if (typeof object.writeHttpMetadata === 'function') {
    object.writeHttpMetadata(headers);
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'audio/mpeg');
  }

  return headers;
}

async function readAudio(request, env, key, headOnly = false) {
  const object = await env.AUDIO_BUCKET.get(key);

  if (!object) {
    return errorResponse('Audio asset not found.', 404, request, env);
  }

  const headers = applyObjectHeaders(object, new Headers());
  return new Response(headOnly ? null : object.body, {
    headers,
    status: 200
  });
}

async function uploadAudio(request, env, key) {
  const uploadToken = request.headers.get('X-Upload-Token') || '';
  if (!env.MEDIA_UPLOAD_TOKEN || uploadToken !== env.MEDIA_UPLOAD_TOKEN) {
    return errorResponse('Invalid upload token.', 401, request, env);
  }

  await env.AUDIO_BUCKET.put(key, request.body, {
    httpMetadata: {
      contentType: request.headers.get('Content-Type') || 'audio/mpeg'
    }
  });

  return jsonResponse({
    key,
    success: true,
    url: `${new URL(request.url).origin}/audio/${key}`
  }, { status: 200 }, request, env);
}

async function deleteAudio(request, env, key) {
  const uploadToken = request.headers.get('X-Upload-Token') || '';
  if (!env.MEDIA_UPLOAD_TOKEN || uploadToken !== env.MEDIA_UPLOAD_TOKEN) {
    return errorResponse('Invalid upload token.', 401, request, env);
  }

  await env.AUDIO_BUCKET.delete(key);
  return jsonResponse({ key, success: true }, { status: 200 }, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method === 'GET' && path === '/health') {
      return jsonResponse({ ok: true, service: 'media' }, { status: 200 }, request, env);
    }

    if (path.startsWith('/audio/')) {
      try {
        const key = sanitizeObjectKey(path.slice('/audio/'.length));

        if (request.method === 'GET') {
          return readAudio(request, env, key, false);
        }

        if (request.method === 'HEAD') {
          return readAudio(request, env, key, true);
        }

        if (request.method === 'PUT') {
          return uploadAudio(request, env, key);
        }

        if (request.method === 'DELETE') {
          return deleteAudio(request, env, key);
        }
      } catch (error) {
        return errorResponse(error.message || 'Media request failed.', 400, request, env);
      }
    }

    return errorResponse('Route not found.', 404, request, env);
  }
};

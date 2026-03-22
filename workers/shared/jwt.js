const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : encoder.encode(String(value));
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export function unixTimeNow() {
  return Math.floor(Date.now() / 1000);
}

export function secondsFromNow(seconds) {
  return unixTimeNow() + Number(seconds || 0);
}

export async function signJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsignedToken));

  return `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyJWT(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const key = await importHmacKey(secret);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(encodedSignature),
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!isValid) {
    throw new Error('JWT signature mismatch.');
  }

  const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload)));
  if (payload.exp && unixTimeNow() >= Number(payload.exp)) {
    throw new Error('JWT has expired.');
  }

  return payload;
}

export function parseBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

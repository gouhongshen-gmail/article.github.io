const encoder = new TextEncoder();

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64Url(bytes) {
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function randomId(prefix = '') {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function createMagicCode(length = 6) {
  const digits = new Uint32Array(length);
  crypto.getRandomValues(digits);

  return Array.from(digits)
    .map((value) => String(value % 10))
    .join('');
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return toHex(digest);
}

export function createCodeVerifier(length = 48) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(verifier)));
  return toBase64Url(new Uint8Array(digest));
}

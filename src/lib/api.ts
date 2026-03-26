// Cloudflare Worker base URLs
const AUTH_BASE = import.meta.env.PUBLIC_AUTH_BASE_URL || 'https://chronosina-auth.gouhongshen.workers.dev';
const SYNC_BASE = import.meta.env.PUBLIC_SYNC_BASE_URL || 'https://chronosina-sync.gouhongshen.workers.dev';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _PAYMENT_BASE = import.meta.env.PUBLIC_PAYMENT_BASE_URL || 'https://chronosina-payment.gouhongshen.workers.dev';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MEDIA_BASE = import.meta.env.PUBLIC_MEDIA_BASE_URL || 'https://chronosina-media.gouhongshen.workers.dev';

// ============================================================================
// Auth Helpers
// ============================================================================

/**
 * Reads the authentication token from cookies
 */
export function getToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)ll_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Checks if the user is logged in
 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

// ============================================================================
// Fetch Wrapper
// ============================================================================

/**
 * Centralized fetch wrapper that adds auth headers and credentials
 */
async function apiFetch(
  base: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');
  
  return fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

// ============================================================================
// Auth API
// ============================================================================

/**
 * Gets the Google OAuth login URL
 */
export function getGoogleLoginUrl(redirect?: string): string {
  const params = new URLSearchParams();
  if (redirect) {
    params.append('redirect', redirect);
  }
  return `${AUTH_BASE}/auth/google?${params.toString()}`;
}

/**
 * Gets the X (Twitter) OAuth login URL
 */
export function getXLoginUrl(redirect?: string): string {
  const params = new URLSearchParams();
  if (redirect) {
    params.append('redirect', redirect);
  }
  return `${AUTH_BASE}/auth/x?${params.toString()}`;
}

/**
 * Logs out the current user and clears the authentication cookie
 */
export async function logout(): Promise<void> {
  await apiFetch(AUTH_BASE, '/auth/logout', {
    method: 'POST',
  });
  
  // Clear the authentication token from cookies
  document.cookie = 'll_token=; max-age=0; path=/';
}

// ============================================================================
// Sync API
// ============================================================================

/**
 * Syncs vocabulary words and review logs with the server
 */
export async function syncVocabulary(
  words: any[],
  reviewLogs: any[],
  progress: any[] = [],
  since?: string
): Promise<{
  serverUpdates: {
    vocabulary: any[];
    reviewLog: any[];
    progress: any[];
    serverTime: string;
  };
}> {
  const response = await apiFetch(SYNC_BASE, '/api/sync/push', {
    method: 'POST',
    body: JSON.stringify({
      vocabulary: words,
      reviewLog: reviewLogs,
      progress,
      since: since || new Date(0).toISOString(),
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches user statistics from the server
 */
export async function fetchUserStats(): Promise<{
  wordsLearned: number;
  wordsMastered: number;
  streak: number;
  [key: string]: any;
}> {
  const response = await apiFetch(SYNC_BASE, '/api/stats', {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`Stats fetch failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

declare const __APP_API_BASE__: string | undefined;

const trimmed = (value: string | undefined | null) => (value || '').trim().replace(/\/$/, '');

const hasConfiguredBase = Boolean(trimmed(import.meta.env.VITE_API_BASE as string | undefined) || trimmed(__APP_API_BASE__));

const resolveApiBase = () => {
  const envBase = trimmed((import.meta.env.VITE_API_BASE as string | undefined) || __APP_API_BASE__);
  if (envBase) return envBase;

  // Prefer localhost during dev if nothing is configured, otherwise fall back to site origin.
  if (import.meta.env.DEV) return 'http://localhost:3001';
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    // Helpful warning when deploying to static hosts without a backend.
    try {
      const host = new URL(origin).hostname;
      if (!hasConfiguredBase && /(?:netlify\.app|github\.io|vercel\.app)$/i.test(host)) {
        console.warn(
          `[apiClient] No VITE_API_BASE or API_BASE set; falling back to site origin (${origin}). ` +
            'Configure an API base to avoid hitting the static host.'
        );
      }
    } catch {
      // Ignore URL parse issues and just return origin.
    }
    return origin;
  }

  return 'http://localhost:3001';
};

export const API_BASE = resolveApiBase();

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('amzpulse_token', token);
  } else {
    localStorage.removeItem('amzpulse_token');
  }
};

const buildHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
};

const buildErrorMessage = (status: number, rawText: string, fallbackMsg: string) => {
  const text = (rawText || '').trim();
  const looksHtml = text.startsWith('<');
  const snippet = looksHtml ? '' : text.slice(0, 240);
  const baseHint = hasConfiguredBase ? '' : ' (API base not configured; set VITE_API_BASE or API_BASE for deployments)';
  const statusPrefix = status ? `[${status}] ` : '';
  return `${statusPrefix}${snippet || fallbackMsg}${baseHint}`;
};

const handle = async (resp: Response, fallbackMsg: string) => {
  const body = await resp.text().catch(() => '');

  if (!resp.ok) {
    throw new Error(buildErrorMessage(resp.status, body, fallbackMsg));
  }

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export async function analyzeBatch(asins: string[]) {
  const resp = await fetch(`${API_BASE}/api/batch/analyze`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ asins })
  });
  return handle(resp, 'Batch analyze failed');
}

export async function fetchProduct(asin: string) {
  const resp = await fetch(`${API_BASE}/api/products/${encodeURIComponent(asin)}`, {
    headers: buildHeaders()
  });
  return handle(resp, 'Fetch product failed');
}

export async function login(email: string, password: string) {
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handle(resp, 'Login failed');
}

export async function register(email: string, password: string, name?: string) {
  const resp = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  return handle(resp, 'Signup failed');
}

export async function me() {
  const resp = await fetch(`${API_BASE}/api/auth/me`, { headers: buildHeaders() });
  return handle(resp, 'Fetch user failed');
}

export async function getUsage() {
  const resp = await fetch(`${API_BASE}/api/billing/usage`, { headers: buildHeaders() });
  return handle(resp, 'Fetch usage failed');
}

export async function getWatchlist() {
  const resp = await fetch(`${API_BASE}/api/watchlist`, { headers: buildHeaders() });
  return handle(resp, 'Fetch watchlist failed');
}

export async function addToWatchlist(asin: string) {
  const resp = await fetch(`${API_BASE}/api/watchlist`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ asin })
  });
  return handle(resp, 'Add to watchlist failed');
}

export async function removeFromWatchlist(idOrAsin: string) {
  const resp = await fetch(`${API_BASE}/api/watchlist/${encodeURIComponent(idOrAsin)}`, {
    method: 'DELETE',
    headers: buildHeaders()
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || 'Remove from watchlist failed');
  }
}

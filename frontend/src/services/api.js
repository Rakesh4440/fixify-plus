const rawBase = import.meta.env.VITE_API_URL || '';

if (!rawBase) {
  console.warn(
    '[api] Missing VITE_API_URL. Set it in your frontend environment to avoid broken deployed requests.'
  );
}

const BASE = rawBase.replace(/\/$/, '');

export function buildApiUrl(path) {
  if (!BASE) {
    throw new Error('Missing VITE_API_URL. Configure the frontend environment with your backend /api URL.');
  }

  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  // Add auth header if present
  if (token) headers.Authorization = `Bearer ${token}`;

  // If body is FormData, DO NOT set Content-Type or stringify
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const url = buildApiUrl(path);

  console.log('[api] Request', {
    method,
    url,
    hasToken: Boolean(token)
  });

  const res = await fetch(url, {
    method,
    headers,
    body: payload
  });

  // Try to parse JSON; fall back if empty
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* no body */
  }

  if (!res.ok) {
    throw new Error((data && data.message) || 'API error');
  }
  return data;
}
